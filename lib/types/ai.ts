import { Archetype } from "./parser";

export interface ClassificationContext {
    blockIndex: number;
    type: string;
    content: string;
    hasAnnotations: boolean;
}

export interface ClassificationResult {
    blockIndex: number;
    archetype: Archetype | string;
    confidence: number;
    suggestions: string[];
}

export interface SeoContext {
    h1: string;
    h2s: string[];
    intro: string;
    documentLengthBlocks: number;
}

export interface SeoData {
    title: string;
    description: string;
    keywords: string[];
    og_image_suggestion: string;
    article_type: string;
    reading_time_minutes: number;
}
