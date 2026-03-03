import mammoth from "mammoth";
import JSZip from "jszip";
import Papa from "papaparse";
import { Block, BlockType, Annotation, CsvData, Archetype } from "../types/parser";

const VALID_KEYWORDS = new Set([
    "image",
    "chart",
    "stat",
    "layout",
    "divider",
    "embed",
    "callout",
    "quote",
]);

export async function parseDocxBlocks(buffer: ArrayBuffer): Promise<Block[]> {
    const result = await mammoth.convertToHtml({ buffer: Buffer.from(buffer) });
    const html = result.value;

    const blockRegex =
        /<(h[1-6]|p|blockquote|table|hr|li)\b[^>]*>([\s\S]*?)<\/\1>|<hr\b[^>]*\/?>/gi;
    let match;
    const blocks: Block[] = [];
    let index = 0;

    while ((match = blockRegex.exec(html)) !== null) {
        const rawHtml = match[0];
        const tag = match[1] ? match[1].toLowerCase() : "hr";
        let content = match[2] || "";

        content = content.replace(/<[^>]+>/g, "").trim();

        if (tag === "p" && !content && rawHtml.indexOf("<img") === -1) {
            continue;
        }

        let type: BlockType = "paragraph";
        if (tag === "h1") type = "heading1";
        else if (tag === "h2") type = "heading2";
        else if (tag === "h3") type = "heading3";
        else if (tag === "blockquote") type = "blockquote";
        else if (tag === "table") type = "table";
        else if (tag === "hr") type = "divider";
        else if (tag === "p" || tag === "li") {
            if (match[2] && !!match[2].match(/^<strong\b[^>]*>[\s\S]*<\/strong>$/i)) {
                type = "bold-paragraph";
            } else {
                type = "paragraph";
            }
        }

        blocks.push({
            index: index++,
            type,
            content,
            rawHtml,
            annotations: [],
        });
    }

    return blocks;
}

export async function extractAnnotations(
    docxBuffer: ArrayBuffer,
    blocks: Block[]
): Promise<void> {
    const zip = await JSZip.loadAsync(docxBuffer);

    const commentsXmlFile = zip.file("word/comments.xml");
    const documentXmlFile = zip.file("word/document.xml");

    if (!commentsXmlFile || !documentXmlFile) return;

    const commentsXml = await commentsXmlFile.async("string");
    const documentXml = await documentXmlFile.async("string");

    const commentRegex =
        /<w:comment\b[^>]*w:id="([^"]+)"[^>]*>([\s\S]*?)<\/w:comment>/g;
    const textRegex = /<w:t(?:\s[^>]*>|>)([\s\S]*?)<\/w:t>/g;

    const commentMap = new Map<string, string>();

    let match;
    while ((match = commentRegex.exec(commentsXml)) !== null) {
        const id = match[1];
        const innerXml = match[2];

        let commentText = "";
        let tMatch;
        textRegex.lastIndex = 0;
        while ((tMatch = textRegex.exec(innerXml)) !== null) {
            commentText += tMatch[1];
        }

        commentText = unescapeXml(commentText).trim();

        if (commentText.startsWith("@")) {
            commentMap.set(id, commentText);
        }
    }

    const pRegex = /<w:p(?:\s[^>]*>|>)([\s\S]*?)<\/w:p>/g;
    const pCommentMap = new Map<string, { id: string; text: string }[]>();

    let pMatch;
    while ((pMatch = pRegex.exec(documentXml)) !== null) {
        const pInner = pMatch[1];

        const rangeStartRegex = /<w:commentRangeStart\b[^>]*w:id="([^"]+)"/g;
        let rMatch;
        const idsInPara: string[] = [];
        while ((rMatch = rangeStartRegex.exec(pInner)) !== null) {
            if (commentMap.has(rMatch[1])) {
                idsInPara.push(rMatch[1]);
            }
        }

        if (idsInPara.length > 0) {
            let paraText = "";
            textRegex.lastIndex = 0;
            let tMatch;
            while ((tMatch = textRegex.exec(pInner)) !== null) {
                paraText += tMatch[1];
            }
            paraText = unescapeXml(paraText).trim();

            const annotationsToPush = idsInPara.map((id) => ({
                id,
                text: commentMap.get(id)!,
            }));

            if (pCommentMap.has(paraText)) {
                pCommentMap.get(paraText)!.push(...annotationsToPush);
            } else {
                pCommentMap.set(paraText, annotationsToPush);
            }
        }
    }

    for (const block of blocks) {
        const matchText = block.content;
        const commentsForBlock = pCommentMap.get(matchText);

        if (commentsForBlock) {
            for (const { text } of commentsForBlock) {
                block.annotations.push(parseAnnotation(text));
            }
            pCommentMap.delete(matchText);
        }
    }
}

function unescapeXml(str: string): string {
    return str
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
}

function parseAnnotation(raw: string): Annotation {
    const regex = /^@([a-zA-Z0-9_-]+):?(.*?)$/;
    const match = raw.match(regex);

    if (!match) {
        return {
            keyword: "unknown",
            primaryValue: null,
            params: {},
            raw,
            valid: false,
            warnings: ["Invalid annotation syntax"],
        };
    }

    let keyword = match[1].toLowerCase();
    const rest = match[2];

    const segments = rest.split("|").map((s) => s.trim());
    let primaryValue: string | null = null;
    const params: Record<string, string> = {};
    const warnings: string[] = [];

    if (segments.length > 0 && segments[0] !== "") {
        const first = segments[0];
        if (first.includes("=")) {
            const parts = first.split("=");
            params[parts[0].trim()] = parts.slice(1).join("=").trim();
        } else {
            primaryValue = first;
        }
    }

    for (let i = 1; i < segments.length; i++) {
        const seg = segments[i];
        if (!seg) continue;
        const eqIdx = seg.indexOf("=");
        if (eqIdx === -1) {
            warnings.push(`Malformed parameter (missing '='): "${seg}"`);
            continue;
        }
        const key = seg.substring(0, eqIdx).trim();
        const val = seg.substring(eqIdx + 1).trim();
        params[key] = val;
    }

    if (!VALID_KEYWORDS.has(keyword)) {
        warnings.push(`Unknown keyword: ${keyword}`);
        keyword = "unknown";
    }

    return {
        keyword,
        primaryValue,
        params,
        raw,
        valid: warnings.length === 0,
        warnings,
    };
}

export function mapHeuristicArchetypes(blocks: Block[]) {
    let hasSeenH1 = false;

    for (const block of blocks) {
        let archetype: Archetype = "body";

        if (block.type === "heading1") {
            if (!hasSeenH1) {
                archetype = "hero";
                hasSeenH1 = true;
            } else {
                archetype = "section-break";
            }
        } else if (block.type === "heading2") {
            archetype = "section-title";
        } else if (block.type === "heading3") {
            archetype = "subsection";
        } else if (block.type === "blockquote") {
            archetype = "pull-quote";
        } else if (block.type === "table") {
            archetype = "data-table";
        } else if (block.type === "divider") {
            archetype = "divider";
        } else if (block.type === "paragraph") {
            const prevArray = blocks.filter(
                (b) => b.index < block.index && b.content.trim().length > 0
            );
            const prev = prevArray[prevArray.length - 1];
            if (prev && prev.heuristicArchetype === "hero") {
                archetype = "hero-body";
            } else {
                archetype = "body";
            }
        } else if (block.type === "bold-paragraph") {
            archetype = "emphasis";
        }

        block.heuristicArchetype = archetype;

        const layoutAnn = block.annotations.find((a) => a.keyword === "layout");
        if (layoutAnn && layoutAnn.primaryValue) {
            block.archetype = layoutAnn.primaryValue as Archetype;
        } else {
            block.archetype = archetype;
        }
    }
}

export async function parseCsvData(
    csvFiles: File[]
): Promise<Record<string, CsvData>> {
    const result: Record<string, CsvData> = {};

    for (const file of csvFiles) {
        const text = await file.text();
        const parsed = Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (h) => h.trim(),
            transform: (v) => (typeof v === "string" ? v.trim() : v),
        });

        result[file.name] = {
            headers: parsed.meta.fields || [],
            rows: (parsed.data as Record<string, string>[]) || [],
        };
    }

    return result;
}

export interface ValidationResult {
    warnings: string[];
    errors: string[];
}

async function checkImageUrl(url: string): Promise<"ok" | "not_found" | "error"> {
    try {
        const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
        if (res.status === 404) return "not_found";
        if (!res.ok) return "error";
        return "ok";
    } catch {
        return "error";
    }
}

export async function validateAnnotations(
    blocks: Block[],
    csvData: Record<string, CsvData>
): Promise<ValidationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    for (const block of blocks) {
        for (const ann of block.annotations) {
            if (ann.keyword === "chart") {
                const source = ann.params.source;
                if (source && source.endsWith(".csv")) {
                    if (!csvData[source]) {
                        ann.valid = false;
                        ann.warnings.push(`Missing CSV file: ${source}`);
                        errors.push(
                            `Block ${block.index}: Missing CSV file "${source}" — upload this file to proceed.`
                        );
                    } else {
                        const data = csvData[source];
                        if (data.rows.length === 0) {
                            ann.warnings.push(`CSV file is empty: ${source}`);
                            warnings.push(
                                `Block ${block.index}: CSV file "${source}" is empty.`
                            );
                        }
                    }
                }
            }

            if (ann.keyword === "image") {
                const url = ann.primaryValue || ann.params.url;
                if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
                    const status = await checkImageUrl(url);
                    if (status === "not_found") {
                        warnings.push(
                            `Block ${block.index} [@image]: URL returned 404 — a placeholder image will be used. (${url})`
                        );
                    } else if (status === "error") {
                        warnings.push(
                            `Block ${block.index} [@image]: URL could not be reached — a placeholder image will be used. (${url})`
                        );
                    }
                }
            }

            for (const w of ann.warnings) {
                if (!w.startsWith("Missing")) {
                    warnings.push(`Block ${block.index} [${ann.keyword}]: ${w}`);
                }
            }
        }
    }

    return { warnings, errors };
}
