"use client";

import { useState, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { Block } from "@/lib/types/parser";
import { useDebounce } from "use-debounce";

type FieldDef = { label: string; key: string; type: "text" | "url" | "color" | "select"; options?: string[] };

function fieldsForBlock(block: Block): FieldDef[] {
    const archetype = block.archetype ?? block.heuristicArchetype ?? "body";
    const hasChart = block.annotations.some((a) => a.keyword === "chart");
    const hasStat = block.annotations.some((a) => a.keyword === "stat");
    let hasImage = block.annotations.some((a) => a.keyword === "image");

    if (archetype === "hero") {
        hasImage = true;
    }

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

    if (archetype === "pull-quote") {
        return [
            { label: "Quote Text", key: "content", type: "text" },
            { label: "Alignment", key: "quoteAlign", type: "select", options: ["right", "center", "left"] }
        ];
    }

    if (["section-title", "subsection", "body", "emphasis"].includes(archetype))
        return [{ label: "Text", key: "content", type: "text" }];
    return [];
}

function SectionCard({
    block,
    overrides,
    onOverrideChange,
    onDelete
}: {
    block: Block;
    overrides: Record<string, string>;
    onOverrideChange: (key: string, val: string) => void;
    onDelete?: () => void;
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
                    <p className="text-sm text-navy font-sans mt-0.5 truncate max-w-xs">{previewText || "(No content)"}</p>
                </div>
                <div className="flex items-center gap-2">
                    {onDelete && (
                        <span
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-xs hover:bg-red-200 transition-colors"
                        >
                            Delete
                        </span>
                    )}
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
                </div>
            </button>

            {open && fields.length > 0 && (
                <div className="px-4 pb-4 space-y-3 border-t border-ash">
                    {fields.map((f) => {
                        const val = overrides[`${block.index}.${f.key}`] ?? "";

                        let inputEl = null;

                        if (f.type === "color") {
                            inputEl = (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={val || "#ff5f1b"}
                                        onChange={(e) => onOverrideChange(`${block.index}.${f.key}`, e.target.value)}
                                        className="w-10 h-8 rounded cursor-pointer border border-ash"
                                    />
                                    <span className="text-xs font-mono text-system-gray">{val || "#ff5f1b"}</span>
                                </div>
                            );
                        } else if (f.type === "select" && f.options) {
                            inputEl = (
                                <select
                                    className="w-full border border-ash rounded-lg px-3 py-2 text-sm font-sans text-navy focus:outline-none focus:ring-2 focus:ring-orange-courage/40"
                                    value={val}
                                    onChange={(e) => onOverrideChange(`${block.index}.${f.key}`, e.target.value)}
                                >
                                    <option value="">(Default)</option>
                                    {f.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            );
                        } else {
                            inputEl = (
                                <input
                                    type={f.type}
                                    value={val}
                                    placeholder={block.content.slice(0, 60)}
                                    onChange={(e) => onOverrideChange(`${block.index}.${f.key}`, e.target.value)}
                                    className="w-full border border-ash rounded-lg px-3 py-2 text-sm font-sans text-navy focus:outline-none focus:ring-2 focus:ring-orange-courage/40"
                                />
                            );
                        }

                        return (
                            <div key={f.key} className="space-y-1">
                                <label className="text-xs font-sans font-semibold text-navy uppercase tracking-wide">
                                    {f.label}
                                </label>
                                {inputEl}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function EditTab({ onApply, applying }: { onApply: (overrides: Record<string, string>) => void, applying?: boolean }) {
    const { preflight, generatedHtml, setPreflight } = useAppStore();
    const storeBlocks = preflight?.blocks ?? [];

    // We maintain a local copy of overrides
    const [overrides, setOverrides] = useState<Record<string, string>>({});

    // Debounce the overrides to trigger auto-apply
    const [debouncedOverrides] = useDebounce(overrides, 500);

    // Initialize block overrides from existing block details
    useEffect(() => {
        const initialOverrides: Record<string, string> = {};
        storeBlocks.forEach(b => {
            // Fill initial quote alignments
            if (b.archetype === "pull-quote") {
                const pqAnn = b.annotations.find(a => a.keyword === "pullquote" || a.keyword === "quote");
                if (pqAnn && pqAnn.params.style) {
                    initialOverrides[`${b.index}.quoteAlign`] = pqAnn.params.style;
                }
            }
            // Fill initial image urls for heroes
            if (b.archetype === "hero") {
                const imgAnn = b.annotations.find(a => a.keyword === "image");
                if (imgAnn) {
                    initialOverrides[`${b.index}.bgUrl`] = imgAnn.primaryValue ?? imgAnn.params.url ?? "";
                }
            }
        });
        setOverrides(prev => ({ ...prev, ...initialOverrides }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storeBlocks.length]);

    // Trigger auto apply whenever debounced overrides change
    useEffect(() => {
        if (!preflight) return;

        const doApply = async () => {
            const updatedBlocks = storeBlocks.map(block => {
                const b = { ...block };
                if (overrides[`${b.index}.content`] !== undefined) {
                    b.content = overrides[`${b.index}.content`];
                    b.rawHtml = `<p>${b.content}</p>`;
                }

                if (b.archetype === "hero" && overrides[`${b.index}.bgUrl`]) {
                    const hasImg = b.annotations.some(a => a.keyword === "image");
                    if (!hasImg) {
                        b.annotations.push({
                            keyword: "image",
                            primaryValue: overrides[`${b.index}.bgUrl`],
                            params: { position: "background" },
                            raw: "",
                            valid: true,
                            warnings: []
                        });
                    }
                }

                if (b.archetype === "pull-quote" && overrides[`${b.index}.quoteAlign`]) {
                    const hasPq = b.annotations.some(a => a.keyword === "pullquote" || a.keyword === "quote");
                    if (!hasPq) {
                        b.annotations.push({
                            keyword: "pullquote",
                            primaryValue: null,
                            params: { style: overrides[`${b.index}.quoteAlign`] },
                            raw: "",
                            valid: true,
                            warnings: []
                        });
                    }
                }

                b.annotations = b.annotations.map(ann => {
                    const a = { ...ann, params: { ...ann.params } };

                    if (a.keyword === 'image') {
                        const bgUrl = overrides[`${b.index}.bgUrl`];
                        const imgUrl = overrides[`${b.index}.imageUrl`];
                        if (bgUrl) a.primaryValue = bgUrl;
                        if (imgUrl) a.primaryValue = imgUrl;
                    }
                    if ((a.keyword === 'pullquote' || a.keyword === 'quote') && overrides[`${b.index}.quoteAlign`]) {
                        a.params.style = overrides[`${b.index}.quoteAlign`];
                    }
                    if (a.keyword === 'stat' && overrides[`${b.index}.statValues`]) {
                        const vals = overrides[`${b.index}.statValues`].split(',').map(s => s.trim());
                        const stats = b.annotations.filter(x => x.keyword === 'stat');
                        const idx = stats.indexOf(ann);
                        if (vals[idx]) a.primaryValue = vals[idx];
                        else a.primaryValue = vals[0];
                    }
                    if (a.keyword === 'chart') {
                        if (overrides[`${b.index}.chartTitle`]) {
                            a.params.title = overrides[`${b.index}.chartTitle`];
                        }
                        if (overrides[`${b.index}.chartColor`]) {
                            a.params.color = overrides[`${b.index}.chartColor`];
                        }
                    }
                    return a;
                });
                return b;
            });

            const newPreflight = { ...preflight, blocks: updatedBlocks };
            setPreflight(newPreflight);
        };

        doApply();
        onApply(debouncedOverrides);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedOverrides]);

    function handleOverrideChange(key: string, val: string) {
        setOverrides((prev) => ({ ...prev, [key]: val }));
    }

    function handleAddBlock(type: "paragraph" | "subheading" | "image" | "pullquote") {
        if (!preflight) return;
        const highestIndex = storeBlocks.length > 0 ? Math.max(...storeBlocks.map(b => b.index)) : 0;
        const newBlock: Block = {
            index: highestIndex + 1,
            type: type === "subheading" ? "heading2" : "paragraph",
            content: "New content...",
            rawHtml: "<p>New content...</p>",
            archetype: "body",
            heuristicArchetype: "body",
            annotations: []
        };

        if (type === "subheading") {
            newBlock.archetype = "section-title";
            newBlock.heuristicArchetype = "section-title";
        } else if (type === "image") {
            newBlock.archetype = "body";
            newBlock.content = "New Image";
            newBlock.annotations.push({
                keyword: "image",
                primaryValue: "https://placehold.co/600x400",
                params: {},
                raw: "@image: https://placehold.co/600x400",
                valid: true,
                warnings: []
            });
        } else if (type === "pullquote") {
            newBlock.archetype = "pull-quote";
            newBlock.heuristicArchetype = "pull-quote";
            newBlock.type = "blockquote";
        }

        const newPreflight = { ...preflight, blocks: [...storeBlocks, newBlock] };
        setPreflight(newPreflight);

        // Ensure new block appears with correct default override so preview doesn't stall
        setTimeout(() => {
            onApply(overrides);
        }, 50);
    }

    function handleDeleteBlock(index: number) {
        if (!preflight) return;
        const newBlocks = storeBlocks.filter(b => b.index !== index);
        const newPreflight = { ...preflight, blocks: newBlocks };
        setPreflight(newPreflight);

        setTimeout(() => {
            onApply(overrides);
        }, 50);
    }

    return (
        <div className="flex flex-col h-full gap-3">
            <p className="text-xs text-system-gray font-sans flex-shrink-0">
                Expand a section to edit its content. Your changes will auto-apply below.
                {applying && <span className="text-orange-courage ml-2 uppercase text-[10px] font-bold">Refreshing...</span>}
            </p>
            <div className="flex gap-4 flex-1 min-h-0">
                {/* Fields panel */}
                <div className="w-2/5 flex-shrink-0 flex flex-col min-h-0 relative">
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 pb-20">
                        {storeBlocks.map((block) => (
                            <SectionCard
                                key={block.index}
                                block={block}
                                overrides={overrides}
                                onOverrideChange={handleOverrideChange}
                                onDelete={() => handleDeleteBlock(block.index)}
                            />
                        ))}
                    </div>

                    {/* Add Block Bottom Bar */}
                    <div className="absolute bottom-0 left-0 right-1 border-t border-ash bg-ghost/90 backdrop-blur pb-2 pt-3 flex gap-2">
                        <select
                            onChange={(e) => {
                                if (e.target.value) {
                                    handleAddBlock(e.target.value as "paragraph" | "subheading" | "image" | "pullquote");
                                    e.target.value = "";
                                }
                            }}
                            className="w-full text-sm font-sans font-medium text-navy bg-white border border-ash rounded-xl px-4 py-2 hover:bg-ash/50 transition-colors shadow-sm outline-none cursor-pointer"
                            defaultValue=""
                        >
                            <option value="" disabled>+ Add an element below</option>
                            <option value="paragraph">Text Paragraph</option>
                            <option value="subheading">Subheading</option>
                            <option value="pullquote">Pull-Quote</option>
                            <option value="image">Image Link</option>
                        </select>
                    </div>
                </div>

                {/* Live iframe */}
                <div className="flex-1 flex flex-col min-h-0 relative">
                    <iframe
                        srcDoc={generatedHtml ?? ""}
                        title="Edit Preview"
                        className={`flex-1 w-full border border-ash rounded-xl bg-white transition-opacity duration-300 ${applying ? "opacity-60" : "opacity-100"}`}
                        sandbox="allow-scripts allow-same-origin"
                    />
                </div>
            </div>
        </div>
    );
}
