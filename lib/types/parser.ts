import type { ClassificationResult, SeoData } from "./ai";

export type BlockType =
  | "heading1"
  | "heading2"
  | "heading3"
  | "paragraph"
  | "bold-paragraph"
  | "blockquote"
  | "table"
  | "divider";


export type Archetype =
  | "hero"
  | "section-break"
  | "section-title"
  | "subsection"
  | "hero-body"
  | "body"
  | "emphasis"
  | "pull-quote"
  | "data-table"
  | "divider"
  | string; // AI might assign others

export interface Annotation {
  keyword: string;
  primaryValue: string | null;
  params: Record<string, string>;
  raw: string;
  valid: boolean;
  warnings: string[];
}

export interface Block {
  index: number;
  type: BlockType;
  content: string;
  rawHtml: string;
  heuristicArchetype?: Archetype;
  archetype?: Archetype;
  annotations: Annotation[];
}

export interface CsvData {
  headers: string[];
  rows: Record<string, string>[];
}

export interface PreflightResult {
  ok: boolean;
  theme?: string;
  docx?: {
    name: string;
    size: number;
  };
  csvFiles?: {
    name: string;
    size: number;
  }[];
  blocks?: Block[];
  csvData?: Record<string, CsvData>;
  validationWarnings?: string[];
  validationErrors?: string[];
  classification?: ClassificationResult[];
  seoData?: SeoData;
  error?: string;
  next?: string;
}
