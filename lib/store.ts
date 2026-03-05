import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PreflightResult } from "./types/parser";
import { SeoData } from "./types/ai";

export interface UploadedFile {
  id: string;
  file: File;
  type: "docx" | "csv";
}

export type Theme = string;

export interface AppState {
  files: UploadedFile[];
  selectedTheme: string | null;
  preflight: PreflightResult | null;
  generatedHtml: string | null;
  seoOverrides: Partial<SeoData>;

  setFiles: (files: UploadedFile[]) => void;
  addFiles: (newFiles: File[]) => { errors: string[] };
  removeFile: (id: string) => void;
  setTheme: (theme: string | null) => void;
  setSelectedTheme: (theme: string | null) => void;
  setPreflight: (p: PreflightResult) => void;
  setGeneratedHtml: (html: string) => void;
  setSeoOverride: (key: keyof SeoData, value: SeoData[keyof SeoData]) => void;
  reorderBlocks: (fromIndex: number, toIndex: number) => void;
  updateBlock: (blockId: string, partialFields: Record<string, unknown>) => void;
  updateBlockType: (blockId: string, newType: string) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      files: [],
      selectedTheme: null,
      preflight: null,
      generatedHtml: null,
      seoOverrides: {},

      setFiles: (files) => set({ files }),
      addFiles: (newFiles) => {
        const errors: string[] = [];
        set((state) => {
          const added = newFiles.map((f) => ({
            id: Math.random().toString(36).substring(7),
            file: f,
            type: (f.name.endsWith(".csv") ? "csv" : "docx") as "csv" | "docx",
          }));
          return { files: [...state.files, ...added] };
        });
        return { errors };
      },
      removeFile: (id) =>
        set((state) => ({
          files: state.files.filter((f) => f.id !== id),
        })),
      setTheme: (theme) => set({ selectedTheme: theme }),
      setSelectedTheme: (theme) => set({ selectedTheme: theme }),
      setPreflight: (p) => set({ preflight: p }),
      setGeneratedHtml: (html) => set({ generatedHtml: html }),

      setSeoOverride: (key, value) =>
        set((state) => ({ seoOverrides: { ...state.seoOverrides, [key]: value } })),

      reorderBlocks: (fromIndex, toIndex) => set((state) => {
        if (!state.preflight || !state.preflight.blocks) return state;
        const newBlocks = [...state.preflight.blocks];
        const [moved] = newBlocks.splice(fromIndex, 1);
        newBlocks.splice(toIndex, 0, moved);
        return { preflight: { ...state.preflight, blocks: newBlocks } };
      }),

      updateBlock: (blockId, partialFields) => set((state) => {
        if (!state.preflight || !state.preflight.blocks) return state;
        const newBlocks = state.preflight.blocks.map(b =>
          b.id === blockId ? { ...b, fields: { ...b.fields, ...partialFields } } : b
        );
        return { preflight: { ...state.preflight, blocks: newBlocks } };
      }),

      updateBlockType: (blockId, newType) => set((state) => {
        if (!state.preflight || !state.preflight.blocks) return state;
        const newBlocks = state.preflight.blocks.map(b =>
          b.id === blockId ? { ...b, type: newType } : b
        );
        return { preflight: { ...state.preflight, blocks: newBlocks } };
      }),

      reset: () =>
        set({ files: [], selectedTheme: null, preflight: null, generatedHtml: null, seoOverrides: {} }),
    }),
    {
      name: "rappler-doc-store",
      partialize: (state) => ({
        selectedTheme: state.selectedTheme,
        preflight: state.preflight,
        generatedHtml: state.generatedHtml,
        seoOverrides: state.seoOverrides,
      }),
    }
  )
);

export const useUploadStore = useAppStore;
