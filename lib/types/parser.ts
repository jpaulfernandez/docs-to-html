/* eslint-disable @typescript-eslint/no-explicit-any */
export type BlockType =
  | "hero"
  | "intro"
  | "text"
  | "pullquote"
  | "parallax"
  | "inline-image"
  | "embed"
  | "stat-block"
  | "footnotes"
  | "table";

export interface V2ParsedParagraph {
  index: number;
  text: string;
  formatting: string[];
}

export interface V2ParsedDocument {
  title: string | null;
  author: string | null;
  authorLink?: string | null;
  paragraphs: V2ParsedParagraph[];
  imageUrls: string[];
  embedBlocks: string[];
  tables: any[];
}

export interface BlockFieldData {
  [key: string]: any;
}

export interface Block {
  id: string; // unique string ID for drag and drop
  type: BlockType | string;
  fields: BlockFieldData;
  content?: any;
  rawHtml?: any;
  archetype?: any;
  heuristicArchetype?: any;
  annotations?: any[];
  index?: any;
}

export type CsvData = any;
export type Annotation = any;

export interface PreflightResult {
  ok: boolean;
  theme?: string;
  docx?: {
    name: string;
    size: number;
  };
  blocks?: Block[];
  seoData?: any;
  error?: string;
  next?: string;
}

