"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import PreviewPane from "./panes/PreviewPane";
import EditorPane from "./panes/EditorPane";

interface ReviewShellProps {
    onPublish: () => void;
    onStartNew: () => void;
}

export default function ReviewShell({ onPublish, onStartNew }: ReviewShellProps) {
    const { preflight, generatedHtml, setGeneratedHtml } = useAppStore();
    const docName = preflight?.docx?.name ?? "Untitled Document";
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [viewMode, setViewMode] = useState<"split" | "preview">("split");
    const [deviceSize, setDeviceSize] = useState<"desktop" | "tablet" | "mobile">("desktop");

    // Auto-save and regenerate preview when blocks change
    useEffect(() => {
        if (!preflight) return;

        const timer = setTimeout(async () => {
            setIsRegenerating(true);
            try {
                const res = await fetch("/api/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(preflight),
                });
                const data = await res.json();
                if (res.ok && data.html) {
                    setGeneratedHtml(data.html);
                }
            } catch (err) {
                console.error("Preview regeneration failed", err);
            } finally {
                setIsRegenerating(false);
            }
        }, 1000); // 1 second debounce

        return () => clearTimeout(timer);
    }, [preflight, setGeneratedHtml]);

    return (
        <div className="flex flex-col h-screen bg-ghost overflow-hidden">
            {/* Top Navigation Bar */}
            <header className="w-full h-16 border-b border-ash bg-white px-6 flex items-center gap-4 flex-shrink-0 z-50 shadow-sm relative">
                <div className="flex items-center gap-3">
                    <span
                        className="text-xl font-bold text-navy tracking-tight"
                        style={{ fontFamily: "Georgia, serif" }}
                    >
                        rappler
                    </span>
                    <span className="w-px h-6 bg-ash" />
                    <span className="text-sm font-medium text-system-gray font-sans truncate max-w-sm" title={docName}>
                        {docName}
                    </span>
                    {isRegenerating && (
                        <span className="text-xs text-orange-courage animate-pulse font-sans font-medium flex items-center gap-1.5 ml-2">
                            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Syncing Preview...
                        </span>
                    )}
                </div>

                <div className="flex-1 flex justify-center items-center gap-1 opacity-0 md:opacity-100 transition-opacity">
                    <div className="bg-ash/50 p-1 rounded-lg flex items-center gap-1 border border-ash">
                        <button
                            onClick={() => { setViewMode("preview"); setDeviceSize("desktop"); }}
                            className={`px-3 py-1.5 text-xs font-sans font-medium rounded-md transition-all ${viewMode === "preview" && deviceSize === "desktop" ? "bg-white shadow-sm text-navy" : "text-system-gray hover:text-navy"}`}
                        >
                            <svg className="w-4 h-4 inline-block mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            Desktop
                        </button>
                        <button
                            onClick={() => { setViewMode("preview"); setDeviceSize("tablet"); }}
                            className={`px-3 py-1.5 text-xs font-sans font-medium rounded-md transition-all ${viewMode === "preview" && deviceSize === "tablet" ? "bg-white shadow-sm text-navy" : "text-system-gray hover:text-navy"}`}
                        >
                            <svg className="w-4 h-4 inline-block mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            Tablet
                        </button>
                        <button
                            onClick={() => { setViewMode("preview"); setDeviceSize("mobile"); }}
                            className={`px-3 py-1.5 text-xs font-sans font-medium rounded-md transition-all ${viewMode === "preview" && deviceSize === "mobile" ? "bg-white shadow-sm text-navy" : "text-system-gray hover:text-navy"}`}
                        >
                            <svg className="w-4 h-4 inline-block mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            Mobile
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 ml-auto">
                    <button
                        type="button"
                        onClick={() => setViewMode(v => v === "split" ? "preview" : "split")}
                        className="text-sm font-medium text-navy bg-ash/50 hover:bg-ash px-4 py-2 rounded-full transition-colors font-sans mr-2"
                    >
                        {viewMode === "split" ? "Hide Editor" : "Show Editor"}
                    </button>
                    <button
                        type="button"
                        onClick={onStartNew}
                        className="text-sm font-medium text-system-gray underline underline-offset-4 hover:text-navy transition-colors font-sans"
                    >
                        Start new
                    </button>
                    <button
                        type="button"
                        onClick={onPublish}
                        disabled={!generatedHtml}
                        className="px-6 py-2.5 cursor-pointer bg-gradient-to-r from-orange-courage to-[#E04B14] text-white text-sm font-sans font-bold rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                    >
                        Export HTML &rarr;
                    </button>
                </div>
            </header>

            {/* Body Layout Container */}
            <main className="flex-1 flex overflow-hidden bg-ghost/50">
                {/* Left Side: Live HTML Preview */}
                <section className={`
                    h-full relative shrink-0 z-10 transition-all duration-300 ease-in-out flex justify-center
                    ${viewMode === "split" ? "w-[55%] border-r border-ash/80 bg-white shadow-xl shadow-ash/10" : "w-full py-8"}
                `}>
                    <div className={`
                        h-full bg-white transition-all duration-300 shadow-2xl relative overflow-hidden
                        ${viewMode === "split" ? "w-full" :
                            deviceSize === "desktop" ? "w-full max-w-6xl rounded-none md:rounded-xl border border-ash" :
                                deviceSize === "tablet" ? "w-[768px] rounded-2xl border-8 border-navy/10" :
                                    "w-[375px] rounded-[3rem] border-[12px] border-navy/90"}
                    `}>
                        {viewMode === "preview" && deviceSize === "mobile" && (
                            <div className="absolute top-0 inset-x-0 h-6 bg-navy/90 z-50 rounded-b-2xl mx-auto w-1/2 flex justify-center items-end pb-1">
                                <div className="w-12 h-1.5 bg-black rounded-full/20"></div>
                            </div>
                        )}
                        <PreviewPane html={generatedHtml} />
                    </div>
                </section>

                {/* Right Side: Block Editor */}
                {viewMode === "split" && (
                    <section className="flex-1 h-full bg-ghost overflow-y-auto custom-scrollbar relative border-l border-white/50">
                        <EditorPane />
                    </section>
                )}
            </main>

            {/* Custom global simple scrollbar styles for EditorPane */}
            <style jsx global>{`
              .custom-scrollbar::-webkit-scrollbar {
                width: 8px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background-color: #CBD5E1;
                border-radius: 20px;
                border: 2px solid #F8FAFC; 
              }
            `}</style>
        </div>
    );
}
