"use client";

import { create } from "zustand";
import { PreflightResult } from "./types/parser";
import { SeoData } from "./types/ai";

export type Theme = "light" | "dark" | "orange";

export interface UploadedFile {
  file: File;
  type: "docx" | "csv";
  id: string;
}

interface AppStore {
  // Stage 1 — Upload
  files: UploadedFile[];
  selectedTheme: Theme | null;

  // Stage 2 — Preflight result
  preflight: PreflightResult | null;

  // Stage 3 — Generated HTML
  generatedHtml: string | null;

  // Editable SEO overrides (Stage 3 SEO tab)
  seoOverrides: Partial<SeoData>;

  // Actions
  addFiles: (incoming: File[]) => { errors: string[] };
  removeFile: (id: string) => void;
  setTheme: (theme: Theme) => void;
  setPreflight: (p: PreflightResult) => void;
  setGeneratedHtml: (html: string) => void;
  setSeoOverride: (key: keyof SeoData, value: SeoData[keyof SeoData]) => void;
  reset: () => void;
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOCX_EXT = ".docx";
const CSV_MIME = "text/csv";
const CSV_EXT = ".csv";
const DOCX_MAX_BYTES = 20 * 1024 * 1024;
const CSV_MAX_BYTES = 10 * 1024 * 1024;

function classifyFile(file: File): "docx" | "csv" | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(DOCX_EXT) || file.type === DOCX_MIME) return "docx";
  if (name.endsWith(CSV_EXT) || file.type === CSV_MIME || file.type === "application/csv") return "csv";
  return null;
}

export const useAppStore = create<AppStore>((set, get) => ({
  files: [],
  selectedTheme: null,
  preflight: null,
  generatedHtml: null,
  seoOverrides: {},

  addFiles: (incoming) => {
    const errors: string[] = [];
    const current = get().files;
    const additions: UploadedFile[] = [];
    let docxReplaced = false;

    for (const file of incoming) {
      const kind = classifyFile(file);
      if (!kind) {
        errors.push(`"${file.name}": Only .docx and .csv files are supported.`);
        continue;
      }
      if (kind === "docx") {
        if (file.size > DOCX_MAX_BYTES) {
          errors.push(`"${file.name}": Your document exceeds the 20 MB limit.`);
          continue;
        }
        docxReplaced = current.some((f) => f.type === "docx");
        additions.push({ file, type: "docx", id: makeId() });
        continue;
      }
      if (kind === "csv") {
        if (file.size > CSV_MAX_BYTES) {
          errors.push(`"${file.name}": CSV files must be under 10 MB each.`);
          continue;
        }
        additions.push({ file, type: "csv", id: makeId() });
      }
    }

    if (additions.length > 0) {
      set((state) => {
        const withoutOldDocx = docxReplaced
          ? state.files.filter((f) => f.type !== "docx")
          : state.files;
        return { files: [...withoutOldDocx, ...additions] };
      });
    }
    return { errors };
  },

  removeFile: (id) =>
    set((state) => ({ files: state.files.filter((f) => f.id !== id) })),

  setTheme: (theme) => set({ selectedTheme: theme }),
  setPreflight: (p) => set({ preflight: p, seoOverrides: {} }),
  setGeneratedHtml: (html) => set({ generatedHtml: html }),
  setSeoOverride: (key, value) =>
    set((state) => ({ seoOverrides: { ...state.seoOverrides, [key]: value } })),

  reset: () =>
    set({ files: [], selectedTheme: null, preflight: null, generatedHtml: null, seoOverrides: {} }),
}));

// Keep backwards-compat alias used in DropZone/ThemeSelector
export const useUploadStore = useAppStore;
