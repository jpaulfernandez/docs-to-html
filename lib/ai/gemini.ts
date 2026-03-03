import { GoogleGenAI, Type } from "@google/genai";
import { ClassificationContext, ClassificationResult, SeoContext, SeoData } from "../types/ai";

export async function classifyBlocks(blocks: ClassificationContext[]): Promise<ClassificationResult[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

    if (!apiKey) {
        console.warn("GEMINI_API_KEY missing. Falling back to empty classification.");
        return blocks.map(b => ({
            blockIndex: b.blockIndex,
            archetype: "body",
            confidence: 0,
            suggestions: []
        }));
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are an AI tasked with classifying document blocks to determine layout archetypes and making annotation suggestions.
Your output must be structured JSON. Never modify user content.

Roles:
Assign layout archetypes based on a predefined set or create a new logical one.
Predefined archetypes: hero, section-break, section-title, subsection, hero-body, body, emphasis, pull-quote, data-table, divider.
Suggest annotations (like @stat) if content patterns imply them (e.g., paragraph with many numbers).`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [
                {
                    role: "user",
                    parts: [{ text: `Classify these blocks:\n${JSON.stringify(blocks, null, 2)}` }]
                }
            ],
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            blockIndex: { type: Type.INTEGER },
                            archetype: { type: Type.STRING },
                            confidence: { type: Type.NUMBER },
                            suggestions: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        },
                        required: ["blockIndex", "archetype", "confidence", "suggestions"]
                    },
                }
            }
        });

        const jsonText = response.text;
        if (jsonText) {
            return JSON.parse(jsonText) as ClassificationResult[];
        }
        throw new Error("Empty response from AI");
    } catch (err: unknown) {
        console.error("Gemini classification error:", err);
        return blocks.map(b => ({
            blockIndex: b.blockIndex,
            archetype: "body",
            confidence: 0,
            suggestions: []
        }));
    }
}

export async function generateSEO(context: SeoContext): Promise<SeoData> {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";

    const fallback: SeoData = {
        title: context.h1 || "Document",
        description: context.intro.substring(0, 150),
        keywords: [],
        og_image_suggestion: "first_background_image",
        article_type: "article",
        reading_time_minutes: Math.max(1, Math.ceil(context.documentLengthBlocks / 5))
    };

    if (!apiKey) {
        console.warn("GEMINI_API_KEY missing. Falling back to heuristic SEO.");
        return fallback;
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are an SEO expert AI. Given parsed document context, generate SEO metadata.
Output strictly JSON.`;

    try {
        const response = await ai.models.generateContent({
            model,
            contents: [
                {
                    role: "user",
                    parts: [{ text: `Generate SEO for this document:\n${JSON.stringify(context, null, 2)}` }]
                }
            ],
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "Max 55 characters" },
                        description: { type: Type.STRING, description: "Max 155 characters" },
                        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                        og_image_suggestion: { type: Type.STRING, description: "e.g., 'first_background_image'" },
                        article_type: { type: Type.STRING, description: "e.g., investigative, report, story, data" },
                        reading_time_minutes: { type: Type.INTEGER, description: "Estimated reading time" }
                    },
                    required: ["title", "description", "keywords", "og_image_suggestion", "article_type", "reading_time_minutes"]
                }
            }
        });

        const jsonText = response.text;
        if (jsonText) {
            return JSON.parse(jsonText) as SeoData;
        }
        return fallback;
    } catch (err: unknown) {
        console.error("Gemini SEO generation error:", err);
        return fallback;
    }
}
