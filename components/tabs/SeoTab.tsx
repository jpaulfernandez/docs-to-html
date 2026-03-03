"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { SeoData } from "@/lib/types/ai";

function CharCounter({ value, max }: { value: string; max: number }) {
    const len = value.length;
    const over = len > max;
    return (
        <span className={`text-xs font-mono ${over ? "text-red-500" : "text-system-gray"}`}>
            {len}/{max}
        </span>
    );
}

function FieldRow({
    label,
    note,
    children,
}: {
    label: string;
    note?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1">
            <div className="flex items-baseline justify-between">
                <label className="text-xs font-sans font-semibold text-navy uppercase tracking-wide">
                    {label}
                </label>
                {note && <span className="text-xs text-system-gray">{note}</span>}
            </div>
            {children}
        </div>
    );
}

export default function SeoTab() {
    const { preflight, seoOverrides, setSeoOverride } = useAppStore();
    const [regenerating, setRegenerating] = useState(false);
    const [jsonLdOpen, setJsonLdOpen] = useState(false);

    const base = preflight?.seoData;
    const get = <K extends keyof SeoData>(key: K): string => {
        const override = seoOverrides[key];
        if (override !== undefined) return String(override);
        const baseVal = base?.[key];
        if (Array.isArray(baseVal)) return baseVal.join(", ");
        return String(baseVal ?? "");
    };

    const titleVal = get("title");
    const descVal = get("description");
    const kwVal = get("keywords");
    const ogVal = seoOverrides.og_image_suggestion ?? base?.og_image_suggestion ?? "";
    const [twitterCard, setTwitterCard] = useState<"summary" | "summary_large_image">(
        "summary_large_image"
    );

    async function handleRegenerate() {
        if (!preflight) return;
        setRegenerating(true);
        try {
            const res = await fetch("/api/seo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    h1: preflight.blocks?.find((b) => b.type === "heading1")?.content ?? "",
                    h2s: preflight.blocks?.filter((b) => b.type === "heading2").map((b) => b.content) ?? [],
                    intro:
                        preflight.blocks?.find((b) => b.type === "paragraph")?.content.slice(0, 400) ?? "",
                    documentLengthBlocks: preflight.blocks?.length ?? 0,
                }),
            });
            const data = await res.json();
            if (data.seoData) {
                const s: SeoData = data.seoData;
                setSeoOverride("title", s.title);
                setSeoOverride("description", s.description);
                setSeoOverride("keywords", s.keywords);
                setSeoOverride("article_type", s.article_type);
                setSeoOverride("reading_time_minutes", s.reading_time_minutes);
            }
        } finally {
            setRegenerating(false);
        }
    }

    const jsonLd = JSON.stringify(
        {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: titleVal,
            description: descVal,
            datePublished: new Date().toISOString(),
        },
        null,
        2
    );

    return (
        <div className="space-y-5 max-w-2xl mx-auto">
            <FieldRow label="Meta Title" note="55 chars max">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={titleVal}
                        onChange={(e) => setSeoOverride("title", e.target.value)}
                        className="flex-1 border border-ash rounded-lg px-3 py-2 text-sm font-sans text-navy focus:outline-none focus:ring-2 focus:ring-orange-courage/40 bg-white"
                        maxLength={80}
                    />
                    <CharCounter value={titleVal} max={55} />
                </div>
            </FieldRow>

            <FieldRow label="Meta Description" note="155 chars max">
                <div className="flex flex-col gap-1">
                    <textarea
                        value={descVal}
                        onChange={(e) => setSeoOverride("description", e.target.value)}
                        rows={3}
                        className="w-full border border-ash rounded-lg px-3 py-2 text-sm font-sans text-navy focus:outline-none focus:ring-2 focus:ring-orange-courage/40 bg-white resize-none"
                        maxLength={200}
                    />
                    <div className="flex justify-end">
                        <CharCounter value={descVal} max={155} />
                    </div>
                </div>
            </FieldRow>

            <FieldRow label="Keywords" note="comma-separated">
                <input
                    type="text"
                    value={kwVal}
                    onChange={(e) => setSeoOverride("keywords", e.target.value.split(",").map((s) => s.trim()))}
                    className="w-full border border-ash rounded-lg px-3 py-2 text-sm font-sans text-navy focus:outline-none focus:ring-2 focus:ring-orange-courage/40 bg-white"
                />
            </FieldRow>

            <FieldRow label="OG Image URL">
                <input
                    type="url"
                    value={String(ogVal)}
                    onChange={(e) => setSeoOverride("og_image_suggestion", e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-ash rounded-lg px-3 py-2 text-sm font-sans text-navy focus:outline-none focus:ring-2 focus:ring-orange-courage/40 bg-white"
                />
            </FieldRow>

            <FieldRow label="Twitter Card">
                <div className="flex gap-4 text-sm">
                    {(["summary", "summary_large_image"] as const).map((v) => (
                        <label key={v} className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="twitterCard"
                                value={v}
                                checked={twitterCard === v}
                                onChange={() => setTwitterCard(v)}
                                className="accent-orange-courage"
                            />
                            <span className="font-sans text-navy">
                                {v === "summary" ? "Summary" : "Summary with Large Image"}
                            </span>
                        </label>
                    ))}
                </div>
            </FieldRow>

            {/* JSON-LD */}
            <div className="border border-ash rounded-lg overflow-hidden">
                <button
                    type="button"
                    onClick={() => setJsonLdOpen((v) => !v)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-ash/40 text-xs font-sans font-semibold text-navy hover:bg-ash transition-colors"
                >
                    JSON-LD Structured Data (auto-generated)
                    <svg
                        className={`w-4 h-4 transition-transform ${jsonLdOpen ? "rotate-180" : ""}`}
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
                {jsonLdOpen && (
                    <pre className="p-4 text-xs font-mono text-system-gray bg-white overflow-x-auto whitespace-pre-wrap">
                        {jsonLd}
                    </pre>
                )}
            </div>

            {/* Regenerate */}
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className={[
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-sans font-semibold transition-all",
                        regenerating
                            ? "bg-ash text-system-gray cursor-not-allowed"
                            : "bg-orange-courage text-white hover:bg-navy cursor-pointer",
                    ].join(" ")}
                >
                    {regenerating ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Regenerating…
                        </>
                    ) : (
                        "✨ Regenerate with AI"
                    )}
                </button>
            </div>
        </div>
    );
}
