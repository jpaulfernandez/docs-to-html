"use client";

import { useRef, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Block } from "@/lib/types/parser";

type FieldDef = { label: string; key: string; type: "text" | "url" | "color" };

function fieldsForBlock(block: Block): FieldDef[] {
    const archetype = block.archetype ?? block.heuristicArchetype ?? "body";
    const hasChart = block.annotations.some((a) => a.keyword === "chart");
    const hasStat = block.annotations.some((a) => a.keyword === "stat");
    const hasImage = block.annotations.some((a) => a.keyword === "image");

    if (archetype === "hero") {
        const fields: FieldDef[] = [{ label: "Heading", key: "content", type: "text" }];
        if (hasImage) fields.push({ label: "Background Image URL", key: "bgUrl", type: "url" });
        return fields;
    }
    if (hasStat) return [{ label: "Stat Values (comma-separated)", key: "statValues", type: "text" }];
    if (hasChart)
        return [
            { label: "Chart Title", key: "chartTitle", type: "text" },
            { label: "Chart Color", key: "chartColor", type: "color" },
        ];
    if (hasImage) return [{ label: "Image URL", key: "imageUrl", type: "url" }];
    if (["section-title", "subsection", "pull-quote", "body", "emphasis"].includes(archetype))
        return [{ label: "Text", key: "content", type: "text" }];
    return [];
}

function SectionCard({
    block,
    overrides,
    onChange,
}: {
    block: Block;
    overrides: Record<string, string>;
    onChange: (key: string, val: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const archetype = block.archetype ?? block.heuristicArchetype ?? "body";
    const fields = fieldsForBlock(block);
    if (fields.length === 0 && block.content.trim() === "") return null;

    const previewText = block.content.slice(0, 50) + (block.content.length > 50 ? "…" : "");

    return (
        <div className="border border-ash rounded-xl overflow-hidden bg-white">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-start justify-between px-4 py-3 hover:bg-ghost transition-colors text-left"
            >
                <div>
                    <span className="text-xs font-sans font-bold text-orange-courage uppercase tracking-wider">
                        {archetype}
                    </span>
                    <p className="text-sm text-navy font-sans mt-0.5 truncate max-w-xs">{previewText}</p>
                </div>
                <svg
                    className={`w-4 h-4 text-system-gray mt-1 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            {open && fields.length > 0 && (
                <div className="px-4 pb-4 space-y-3 border-t border-ash">
                    {fields.map((f) => {
                        const val = overrides[`${block.index}.${f.key}`] ?? "";
                        return (
                            <div key={f.key} className="space-y-1">
                                <label className="text-xs font-sans font-semibold text-navy uppercase tracking-wide">
                                    {f.label}
                                </label>
                                {f.type === "color" ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={val || "#ff5f1b"}
                                            onChange={(e) => onChange(`${block.index}.${f.key}`, e.target.value)}
                                            className="w-10 h-8 rounded cursor-pointer border border-ash"
                                        />
                                        <span className="text-xs font-mono text-system-gray">{val || "#ff5f1b"}</span>
                                    </div>
                                ) : (
                                    <input
                                        type={f.type}
                                        value={val}
                                        placeholder={block.content.slice(0, 60)}
                                        onChange={(e) => onChange(`${block.index}.${f.key}`, e.target.value)}
                                        className="w-full border border-ash rounded-lg px-3 py-2 text-sm font-sans text-navy focus:outline-none focus:ring-2 focus:ring-orange-courage/40"
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function EditTab({ onApply, applying }: { onApply: (overrides: Record<string, string>) => void, applying?: boolean }) {
    const { preflight, generatedHtml } = useAppStore();
    const blocks = preflight?.blocks ?? [];
    const [overrides, setOverrides] = useState<Record<string, string>>({});

    function handleChange(key: string, val: string) {
        setOverrides((prev) => ({ ...prev, [key]: val }));
    }

    return (
        <div className="flex flex-col h-full gap-3">
            <p className="text-xs text-system-gray font-sans flex-shrink-0">
                Expand a section to edit its content. Click Apply to refresh the preview.
            </p>
            <div className="flex gap-4 flex-1 min-h-0">
                {/* Fields panel */}
                <div className="w-2/5 flex-shrink-0 overflow-y-auto space-y-2 pr-1">
                    {blocks.map((block) => (
                        <SectionCard
                            key={block.index}
                            block={block}
                            overrides={overrides}
                            onChange={handleChange}
                        />
                    ))}
                </div>

                {/* Live iframe */}
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-shrink-0 flex justify-end mb-2">
                        <button
                            type="button"
                            onClick={() => onApply(overrides)}
                            disabled={applying}
                            className={[
                                "px-4 py-1.5 text-white text-sm font-sans font-semibold rounded-lg transition-colors",
                                applying ? "bg-system-gray cursor-not-allowed" : "bg-orange-courage hover:bg-navy cursor-pointer"
                            ].join(" ")}
                        >
                            {applying ? "Applying..." : "Apply Changes →"}
                        </button>
                    </div>
                    <iframe
                        srcDoc={generatedHtml ?? ""}
                        title="Edit Preview"
                        className="flex-1 w-full border border-ash rounded-xl bg-white"
                        sandbox="allow-scripts allow-same-origin"
                    />
                </div>
            </div>
        </div>
    );
}
