import { GoogleGenAI, Type } from "@google/genai";

export interface PoCHero {
    title: string;
    subtitle: string;
    author: string;
    background_image_url: string;
}

export interface PoCContentBlock {
    type: "paragraph" | "pullquote" | "subheading" | "image_full_width" | "emphasis";
    text?: string;
    url?: string;
    caption?: string;
    style?: "float-right" | "center";
}

export interface PoCStructuredData {
    hero: PoCHero;
    summary: string[];
    content_blocks: PoCContentBlock[];
}

export async function extractStructuredContent(rawText: string): Promise<PoCStructuredData> {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not set.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are an expert AI parser. The user is providing the raw text extracted from a Word Document. 
This document contains an editorial story, potentially with headings, paragraphs, and standalone image URLs.
Your job is to parse this raw text and restructure it into a strict JSON format representing the layout of the story.

The output must contain:
1. "hero": Extracted title, subtitle, author, and a background_image_url (if provided early in the text, otherwise use a placeholder).
2. "summary": An array of bullet points summarizing the article (usually found near the beginning of the text).
3. "content_blocks": An array of blocks making up the main body of the article.

For "content_blocks", you must map the text into these specific types:
- "paragraph": A standard block of text.
- "subheading": A section title.
- "pullquote": A highly dramatic or important sentence that should be highlighted. You can extract this from the text itself if it feels like a strong quote. Set "style" to "float-right" or "center".
- "image_full_width": If you see a raw URL starting with http/https on its own line, assume it is an image that should be embedded. Set the "url" field to this URL, and generate a very brief placeholder "caption" if one isn't obvious.
- "emphasis": A paragraph that should be bolded.

Output valid, well-structured JSON only. Do not invent facts, only extract and structure what is in the document.`;

    // Add a 30-second timeout so we never hang indefinitely on API retries
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [
                {
                    role: "user",
                    parts: [{ text: `Here is the raw document text. Please parse it:\n\n${rawText}` }]
                }
            ],
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        hero: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                subtitle: { type: Type.STRING },
                                author: { type: Type.STRING },
                                background_image_url: { type: Type.STRING }
                            },
                            required: ["title", "subtitle", "author", "background_image_url"]
                        },
                        summary: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        content_blocks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING, description: "paragraph, pullquote, subheading, image_full_width, or emphasis" },
                                    text: { type: Type.STRING },
                                    url: { type: Type.STRING },
                                    caption: { type: Type.STRING },
                                    style: { type: Type.STRING, description: "float-right or center (for pullquotes)" }
                                },
                                required: ["type"]
                            }
                        }
                    },
                    required: ["hero", "summary", "content_blocks"]
                }
            }
        });

        const jsonText = response.text;
        if (!jsonText) {
            throw new Error("Empty response from AI");
        }

        return JSON.parse(jsonText) as PoCStructuredData;
    } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
            console.error("Gemini extraction timed out after 30 seconds.");
            throw new Error("AI structure extraction timed out. Please try again.");
        }
        console.error("Gemini extraction error:", err);
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }
}
