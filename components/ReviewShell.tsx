"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import PreviewTab from "./tabs/PreviewTab";
import EditTab from "./tabs/EditTab";
import SeoTab from "./tabs/SeoTab";

type Tab = "preview" | "edit" | "seo";

const TABS: { id: Tab; label: string }[] = [
    { id: "preview", label: "👁 Preview" },
    { id: "edit", label: "✏️ Edit" },
    { id: "seo", label: "🔍 SEO" },
];

interface ReviewShellProps {
    onPublish: () => void;
    onStartNew: () => void;
}

export default function ReviewShell({ onPublish, onStartNew }: ReviewShellProps) {
    const { preflight, generatedHtml, setPreflight, setGeneratedHtml } = useAppStore();
    const [tab, setTab] = useState<Tab>("preview");
    const [applying, setApplying] = useState(false);
    const docName = preflight?.docx?.name ?? "microsite";

    async function handleApply(overrides: Record<string, string>) {
        if (!preflight) return;
        setApplying(true);
        try {
            const updatedBlocks = (preflight.blocks || []).map(block => {
                const b = { ...block };
                if (overrides[`${b.index}.content`] !== undefined) {
                    b.content = overrides[`${b.index}.content`];
                }

                b.annotations = b.annotations.map(ann => {
                    const a = { ...ann, params: { ...ann.params } };

                    if (a.keyword === 'image') {
                        const bgUrl = overrides[`${b.index}.bgUrl`];
                        const imgUrl = overrides[`${b.index}.imageUrl`];
                        if (bgUrl) a.primaryValue = bgUrl;
                        if (imgUrl) a.primaryValue = imgUrl;
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
            const res = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newPreflight),
            });
            const data = await res.json();
            if (res.ok && data.html) {
                setPreflight(newPreflight);
                setGeneratedHtml(data.html);
            }
        } finally {
            setApplying(false);
        }
    }

    return (
        <div className="flex flex-col h-screen bg-ghost overflow-hidden">
            {/* Top bar */}
            <header className="w-full border-b border-ash bg-white px-6 py-3 flex items-center gap-4 flex-shrink-0 z-10">
                <span
                    className="text-base font-bold text-navy tracking-tight"
                    style={{ fontFamily: "Georgia, serif" }}
                >
                    rappler
                </span>
                <span className="w-px h-4 bg-ash" />
                <span className="text-sm text-system-gray font-sans truncate max-w-xs">{docName}</span>

                {/* Tab bar */}
                <nav className="flex items-center gap-1 ml-6">
                    {TABS.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setTab(t.id)}
                            className={[
                                "px-4 py-1.5 rounded-full text-sm font-sans font-medium transition-all",
                                tab === t.id
                                    ? "bg-navy text-white shadow-sm"
                                    : "text-system-gray hover:text-navy hover:bg-ash",
                            ].join(" ")}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onStartNew}
                        className="text-xs text-system-gray underline underline-offset-2 hover:text-navy font-sans"
                    >
                        Start new
                    </button>
                    <button
                        type="button"
                        onClick={onPublish}
                        disabled={!generatedHtml}
                        className="px-4 py-2 bg-orange-courage text-white text-sm font-sans font-semibold rounded-xl hover:bg-navy transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Download HTML →
                    </button>
                </div>
            </header>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden px-6 py-4">
                {tab === "preview" && <PreviewTab />}
                {tab === "edit" && <EditTab onApply={handleApply} applying={applying} />}
                {tab === "seo" && <SeoTab />}
            </div>
        </div>
    );
}
