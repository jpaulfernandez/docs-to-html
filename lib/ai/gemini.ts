/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { GoogleGenAI, Type } from "@google/genai";
import { Block, BlockType, V2ParsedDocument, V2ParsedParagraph } from "../types/parser";
import { SeoContext, SeoData } from "../types/ai";

// === CONSTANTS ===

const TARGET_TOKENS = 2000;
const MAX_TOKENS = 3000;

// Timeout constants — bisect halves get progressively less time
const FIRST_CHUNK_TIMEOUT_MS = 90_000;
const FOLLOW_UP_CHUNK_TIMEOUT_MS = 60_000;
const BISECT_TIMEOUT_REDUCTION = 0.6; // Each bisect level gets 60% of parent timeout
const MIN_TIMEOUT_MS = 20_000; // Never go below 20s even after many bisects

let globalChunkIdCounter = 0;

// === PAYLOAD HELPERS ===

/**
 * Strip HTML tags for token estimation only.
 */
function stripHtml(html: string): string {
    return html.replace(/<[^>]*>?/gm, '');
}

function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

/**
 * Strip HTML attributes (class, style, id, etc.) but preserve semantic tags.
 * Reduces payload by 40-60% without losing formatting context.
 */
function stripHtmlAttributes(html: string): string {
    return html.replace(/<(\w+)[^>]*>/g, '<$1>');
}

/**
 * Build a lean paragraph object — only send what Gemini needs.
 */
function toLeadParagraph(p: V2ParsedParagraph): { index: number, text: string } {
    return { index: p.index, text: stripHtmlAttributes(p.text) };
}

// === INSTRUCTIONS ===

const BASE_INSTRUCTION = `You are a classification engine that maps document paragraphs into visual microsite blocks.

Instead of outputting paragraph text, you MUST output the 'paragraphIndices' of the paragraphs that belong to each block.
For example, if paragraphs with index 2, 3, and 4 belong to a single "text" block, output { "type": "text", "fields": { "paragraphIndices": [2, 3, 4] } }.

RULES:
- NEVER output actual paragraph text in bodyHtml or text fields unless explicitly required by an annotation.
- Only output paragraph indices in 'paragraphIndices'.
- Never output annotation strings like "BANNER PHOTO:", "TITLE:", "AUTHOR:", "SUBHEAD:", "PULLQUOTE:", "IN SUMMARY:" in any field.`;

const PRIMARY_INSTRUCTION = `${BASE_INSTRUCTION}

Available block types: "hero", "intro", "text", "pullquote", "parallax", "inline-image", "embed", "stat-block", "table", "summary-box", "footnotes".

ANNOTATION EXTRACTION (remove annotation text, use extracted values):
- "BANNER PHOTO: [URL]" → hero.imageUrl
- "TITLE: [Text]" → hero.title
- "AUTHOR: [Text]" + "[LINK: url]" → hero.byline + hero.authorLink
- "SUBHEAD: [Text]" → hero.subtitle
- "PULLQUOTE: [Text]" → pullquote.text (for this ONLY, output the text of the pullquote directly into 'text')

BLOCK RULES:
- First image → hero.imageUrl
- First paragraph after subhead → "intro" block
- Pull quote candidates → "pullquote"
- Suggest "parallax" breaks between long text sections if images are available`;

const SECONDARY_INSTRUCTION = `${BASE_INSTRUCTION}

Available block types: "text", "pullquote", "parallax", "inline-image", "embed", "stat-block", "table", "summary-box".

This is a CONTINUATION of a document. DO NOT generate "hero" or "intro" blocks.

CONTEXT: You are processing body content. The document title is provided for context only — do not create title blocks.

BLOCK RULES:
- Map paragraphs sequentially to appropriate block types
- Pull quote candidates → "pullquote"
- Suggest "parallax" breaks between long text sections if images are available`;

// === SCHEMAS ===

const PRIMARY_SCHEMA = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING },
            fields: {
                type: Type.OBJECT,
                properties: {
                    imageUrl: { type: Type.STRING },
                    title: { type: Type.STRING },
                    subtitle: { type: Type.STRING },
                    byline: { type: Type.STRING },
                    authorLink: { type: Type.STRING },
                    date: { type: Type.STRING },
                    paragraphIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                    text: { type: Type.STRING }, // Used mainly for extracted values like pullquote text
                    heading: { type: Type.STRING },
                    attribution: { type: Type.STRING },
                    caption: { type: Type.STRING },
                    height: { type: Type.STRING },
                    alignment: { type: Type.STRING },
                    size: { type: Type.STRING },
                    embedCode: { type: Type.STRING },
                    stat1Value: { type: Type.STRING },
                    stat1Label: { type: Type.STRING },
                    stat2Value: { type: Type.STRING },
                    stat2Label: { type: Type.STRING },
                    stat3Value: { type: Type.STRING },
                    stat3Label: { type: Type.STRING },
                    headers: { type: Type.STRING },
                    rows: { type: Type.ARRAY, items: { type: Type.STRING } },
                    items: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        },
        required: ["type", "fields"]
    }
};

// Minimal schema for follow-up chunks — no hero-only fields
const FOLLOW_UP_SCHEMA = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING },
            fields: {
                type: Type.OBJECT,
                properties: {
                    imageUrl: { type: Type.STRING },
                    paragraphIndices: { type: Type.ARRAY, items: { type: Type.INTEGER } },
                    text: { type: Type.STRING }, // Used mainly for extracted values like pullquote text
                    heading: { type: Type.STRING },
                    attribution: { type: Type.STRING },
                    caption: { type: Type.STRING },
                    height: { type: Type.STRING },
                    alignment: { type: Type.STRING },
                    size: { type: Type.STRING },
                    embedCode: { type: Type.STRING },
                    headers: { type: Type.STRING },
                    rows: { type: Type.ARRAY, items: { type: Type.STRING } },
                    items: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        },
        required: ["type", "fields"]
    }
};

// === MAIN ENTRY POINT ===

export async function processDocumentWithAI(parsedDoc: V2ParsedDocument): Promise<Block[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey) {
        console.warn("GEMINI_API_KEY missing. Falling back to deterministic parsing.");
        return createFallbackBlocks(parsedDoc);
    }

    const ai = new GoogleGenAI({ apiKey });

    // 1. Build token-aware chunks
    const chunks = buildTokenChunks(parsedDoc.paragraphs, TARGET_TOKENS, MAX_TOKENS);
    if (chunks.length === 0) chunks.push([]);

    // 2. Process first chunk with full document context
    const firstChunkPayload = {
        title: parsedDoc.title,
        author: parsedDoc.author,
        authorLink: parsedDoc.authorLink,
        imageUrls: parsedDoc.imageUrls,
        embedBlocks: parsedDoc.embedBlocks,
        paragraphs: chunks[0].map(toLeadParagraph)
    };

    const heroBlocks = await processWithBisect(
        ai,
        model,
        chunks[0],
        firstChunkPayload,
        parsedDoc.title, // pass title for context in follow-ups
        true,
        FIRST_CHUNK_TIMEOUT_MS
    );

    // 3. Process remaining chunks in parallel batches of 3
    const contentBlocks: Block[][] = [];
    const remainingChunks = chunks.slice(1);
    const CONCURRENCY = 3;

    for (let i = 0; i < remainingChunks.length; i += CONCURRENCY) {
        const batch = remainingChunks.slice(i, i + CONCURRENCY);
        const batchResults = await Promise.all(
            batch.map(chunk => {
                const payload = {
                    documentTitle: parsedDoc.title,
                    paragraphs: chunk.map(toLeadParagraph)
                };
                return processWithBisect(
                    ai,
                    model,
                    chunk,
                    payload,
                    parsedDoc.title,
                    false,
                    FOLLOW_UP_CHUNK_TIMEOUT_MS
                );
            })
        );
        contentBlocks.push(...batchResults);
    }

    // 4. Flatten, normalize, merge
    const allBlocks = [...heroBlocks, ...contentBlocks.flat()];
    const normalizedBlocks = normalizeBlocks(allBlocks, parsedDoc.paragraphs);
    return mergeAdjacentTextBlocks(normalizedBlocks);
}

// === CHUNKING ===

function buildTokenChunks(
    paragraphs: V2ParsedParagraph[],
    targetTokens: number,
    maxTokens: number
): V2ParsedParagraph[][] {
    const chunks: V2ParsedParagraph[][] = [];
    let currentChunk: V2ParsedParagraph[] = [];
    let currentTokens = 0;

    for (const p of paragraphs) {
        const pTokens = estimateTokens(stripHtml(p.text));

        if (currentTokens + pTokens > maxTokens && currentChunk.length > 0) {
            chunks.push(currentChunk);
            currentChunk = [p];
            currentTokens = pTokens;
        } else {
            currentChunk.push(p);
            currentTokens += pTokens;
            if (currentTokens >= targetTokens) {
                chunks.push(currentChunk);
                currentChunk = [];
                currentTokens = 0;
            }
        }
    }

    if (currentChunk.length > 0) chunks.push(currentChunk);
    return chunks;
}

// === BISECT RETRY ===

async function processWithBisect(
    ai: GoogleGenAI,
    model: string,
    originalChunk: V2ParsedParagraph[],
    payload: any,
    documentTitle: string | null,
    isFirstChunk: boolean,
    timeoutMs: number
): Promise<Block[]> {
    if (originalChunk.length === 0 && !isFirstChunk) return [];

    try {
        return await callGemini(ai, model, payload, isFirstChunk, timeoutMs);
    } catch (err: any) {
        const isTimeout = err.name === 'AbortError' || err.message?.includes('AbortError');

        if (isTimeout && originalChunk.length > 2) {
            console.warn(`Timeout on chunk (${originalChunk.length} paragraphs, ${timeoutMs}ms). Bisecting...`);

            // Reduce timeout for bisected halves so we don't compound timeouts
            const bisectTimeout = Math.max(
                Math.floor(timeoutMs * BISECT_TIMEOUT_REDUCTION),
                MIN_TIMEOUT_MS
            );

            const mid = Math.floor(originalChunk.length / 2);
            const leftChunk = originalChunk.slice(0, mid);
            const rightChunk = originalChunk.slice(mid);

            const leftPayload = isFirstChunk
                ? { ...payload, paragraphs: leftChunk.map(toLeadParagraph) }
                : { documentTitle, paragraphs: leftChunk.map(toLeadParagraph) };

            const rightPayload = {
                documentTitle,
                paragraphs: rightChunk.map(toLeadParagraph)
            };

            const leftBlocks = await processWithBisect(
                ai, model, leftChunk, leftPayload, documentTitle, isFirstChunk, bisectTimeout
            );
            const rightBlocks = await processWithBisect(
                ai, model, rightChunk, rightPayload, documentTitle, false, bisectTimeout
            );

            return [...leftBlocks, ...rightBlocks];

        } else {
            // Timeout on tiny chunk OR non-timeout error → deterministic fallback
            const reason = isTimeout ? `Timeout on chunk of ${originalChunk.length} (too small to bisect)` : `API error: ${err.message}`;
            console.warn(`Falling back deterministically. Reason: ${reason}`);
            return processFallback(originalChunk, isFirstChunk, payload);
        }
    }
}

// === GEMINI API CALL ===

async function callGemini(
    ai: GoogleGenAI,
    model: string,
    payload: any,
    isFirstChunk: boolean,
    timeoutMs: number
): Promise<Block[]> {
    const instruction = isFirstChunk ? PRIMARY_INSTRUCTION : SECONDARY_INSTRUCTION;
    const schema = isFirstChunk ? PRIMARY_SCHEMA : FOLLOW_UP_SCHEMA;

    const timeoutPromise = new Promise<never>((_, reject) => {
        const timer = setTimeout(() => {
            const err = new Error("AbortError");
            err.name = "AbortError";
            reject(err);
        }, timeoutMs);
        if (timer.unref) timer.unref();
    });

    const apiPromise = ai.models.generateContent({
        model,
        contents: [{
            role: "user",
            // KEY FIX: No pretty-printing (null, 2) — saves tokens on every call
            parts: [{ text: `Map these document paragraphs to blocks:\n${JSON.stringify(payload)}` }]
        }],
        config: {
            systemInstruction: instruction,
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    const response: any = await Promise.race([apiPromise, timeoutPromise]);

    let jsonText: string = response?.text ?? "";
    if (!jsonText) return [];

    jsonText = jsonText.trim();
    if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    try {
        const parsed = JSON.parse(jsonText);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error("Failed to parse Gemini JSON response:", jsonText.slice(0, 200));
        return [];
    }
}

// === NORMALIZATION (MAPPING INDICES BACK TO TEXT/HTML) ===

function normalizeBlocks(blocks: Block[], originalParagraphs: V2ParsedParagraph[]): Block[] {
    const pMap = new Map<number, V2ParsedParagraph>();
    for (const p of originalParagraphs) {
        pMap.set(p.index, p);
    }

    return blocks.map((b) => {
        const blockId = b.id || `chunk-block-${globalChunkIdCounter++}`;
        const fields = { ...b.fields };

        if (b.type === 'hero') {
            fields.byline = fields.byline || '';
            fields.authorLink = fields.authorLink || '';
        }

        const indices: number[] | undefined = fields.paragraphIndices;
        if (indices && Array.isArray(indices) && indices.length > 0) {
            const partsText: string[] = [];
            const partsHtml: string[] = [];

            for (const idx of indices) {
                const p = pMap.get(idx);
                if (p) {
                    partsText.push(p.text);
                    let html = p.text;
                    if (p.formatting) {
                        p.formatting.forEach(format => {
                            if (format === 'bold') html = `<strong>${html}</strong>`;
                            if (format === 'italic') html = `<em>${html}</em>`;
                        });
                    }
                    if (b.type === 'intro' || b.type === 'pullquote') {
                        partsHtml.push(html);
                    } else {
                        partsHtml.push(`<p>${html}</p>`);
                    }
                }
            }

            if (partsText.length > 0) {
                if (b.type === 'text') {
                    fields.bodyHtml = partsHtml.join('\n');
                    fields.text = partsText.join('\n');
                } else if (b.type === 'intro') {
                    fields.text = partsHtml.join('\n'); // usually want HTML-formatted for intro actually, but components.ts ignores bodyHtml for intro
                } else if (!fields.text && !fields.bodyHtml) {
                    fields.text = partsText.join('\n');
                    fields.bodyHtml = partsHtml.join('\n');
                }
            }
            delete fields.paragraphIndices;
        }

        return {
            id: blockId,
            type: b.type as BlockType,
            fields
        };
    });
}

// === FALLBACKS ===

function processFallback(
    paragraphs: V2ParsedParagraph[],
    isFirstChunk: boolean,
    payload: any
): Block[] {
    const fallbackDoc: V2ParsedDocument = {
        title: isFirstChunk ? (payload.title || "") : "",
        author: isFirstChunk ? (payload.author || "") : "",
        authorLink: isFirstChunk ? (payload.authorLink || "") : "",
        imageUrls: isFirstChunk ? (payload.imageUrls || []) : [],
        embedBlocks: isFirstChunk ? (payload.embedBlocks || []) : [],
        paragraphs,
        tables: []
    };

    const blocks = createFallbackBlocks(fallbackDoc);
    if (!isFirstChunk) {
        return blocks.filter(b => b.type === 'text' || b.type === 'inline-image');
    }
    return blocks;
}

function createFallbackBlocks(doc: V2ParsedDocument): Block[] {
    const blocks: Block[] = [];
    let idCounter = 0;

    blocks.push({
        id: `fallback-${idCounter++}`,
        type: "hero",
        fields: {
            title: doc.title || "Untitled Document",
            imageUrl: doc.imageUrls?.[0] || "https://images.unsplash.com/photo-1544716278-e513176f20b5?q=80&w=2574&auto=format&fit=crop",
            byline: doc.author || "Unknown Author",
            authorLink: doc.authorLink || "",
            subtitle: "",
            date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        }
    });

    if (doc.paragraphs.length > 0) {
        blocks.push({
            id: `fallback-${idCounter++}`,
            type: "intro",
            fields: { text: doc.paragraphs[0].text }
        });
    }

    for (let i = 1; i < doc.paragraphs.length; i++) {
        const p = doc.paragraphs[i];
        let bodyHtml = p.text;
        if (p.formatting) {
            p.formatting.forEach(format => {
                if (format === 'bold') bodyHtml = `<strong>${bodyHtml}</strong>`;
                if (format === 'italic') bodyHtml = `<em>${bodyHtml}</em>`;
            });
        }
        blocks.push({
            id: `fallback-${idCounter++}`,
            type: "text",
            fields: { bodyHtml: `<p>${bodyHtml}</p>` }
        });
    }

    for (let i = 1; i < (doc.imageUrls?.length ?? 0); i++) {
        blocks.push({
            id: `fallback-${idCounter++}`,
            type: "inline-image",
            fields: { imageUrl: doc.imageUrls[i], alignment: "Center", size: "Full" }
        });
    }

    return blocks;
}

// === MERGE ADJACENT TEXT BLOCKS ===

function mergeAdjacentTextBlocks(blocks: Block[]): Block[] {
    const merged: Block[] = [];

    for (const block of blocks) {
        if (merged.length > 0) {
            const last = merged[merged.length - 1];
            if (last.type === 'text' && block.type === 'text' && !block.fields.heading) {
                const lastHtml = last.fields.bodyHtml || last.fields.text || '';
                const newHtml = block.fields.bodyHtml || block.fields.text || '';
                const fmt = (html: string) => html.trim().startsWith('<') ? html : `<p>${html}</p>`;
                last.fields.bodyHtml = `${fmt(lastHtml)}\n${fmt(newHtml)}`;
                last.fields.text = last.fields.bodyHtml;
                continue;
            }
        }
        merged.push(block);
    }

    return merged;
}

// === SEO ===

export async function generateSEO(payload: SeoContext): Promise<SeoData> {
    return {
        title: payload.h1 || "Document",
        description: payload.intro || "Description",
        keywords: ["news", "article"],
        og_image_suggestion: "",
        article_type: "article",
        reading_time_minutes: 5
    };
}
