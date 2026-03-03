"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";

interface PublishScreenProps {
    onBackToEdit: () => void;
    onStartNew: () => void;
}

export default function PublishScreen({ onBackToEdit, onStartNew }: PublishScreenProps) {
    const { generatedHtml, preflight } = useAppStore();
    const docName = preflight?.docx?.name?.replace(".docx", "") ?? "microsite";
    const downloadedRef = useRef(false);

    useEffect(() => {
        // Trigger download automatically when reaching this screen
        if (generatedHtml && !downloadedRef.current) {
            downloadedRef.current = true;
            triggerDownload();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function triggerDownload() {
        if (!generatedHtml) return;
        const blob = new Blob([generatedHtml], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${docName}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    return (
        <div className="min-h-screen bg-ghost flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-lg space-y-8 text-center">
                {/* Success icon */}
                <div className="text-6xl animate-bounce">🎉</div>

                <div className="space-y-2">
                    <h1
                        className="text-3xl font-bold text-navy"
                        style={{ fontFamily: "Georgia, serif" }}
                    >
                        Your microsite is ready
                    </h1>
                    <p className="text-sm text-system-gray font-sans">
                        Your download started automatically. If it didn&apos;t,{" "}
                        <button
                            type="button"
                            onClick={triggerDownload}
                            className="text-orange-courage underline underline-offset-2 hover:text-navy"
                        >
                            click here to download
                        </button>
                        .
                    </p>
                </div>

                {/* Download card */}
                <div className="bg-white border border-ash rounded-2xl p-6 space-y-4 shadow-sm text-left">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-courage/10 rounded-lg flex items-center justify-center text-orange-courage text-lg">
                            📄
                        </div>
                        <div>
                            <p className="text-sm font-sans font-semibold text-navy">{docName}.html</p>
                            <p className="text-xs text-system-gray">
                                Self-contained · Works offline · No server required
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={triggerDownload}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-orange-courage text-white rounded-xl font-sans font-semibold text-sm hover:bg-navy transition-all shadow-sm cursor-pointer"
                    >
                        ⬇ Download HTML
                    </button>
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-center">
                    <button
                        type="button"
                        onClick={onBackToEdit}
                        className="px-5 py-2.5 border border-ash rounded-xl text-sm font-sans font-medium text-navy bg-white hover:bg-ghost transition-colors cursor-pointer"
                    >
                        ← Back to Edit
                    </button>
                    <button
                        type="button"
                        onClick={onStartNew}
                        className="px-5 py-2.5 bg-navy text-white rounded-xl text-sm font-sans font-medium hover:bg-orange-courage transition-colors cursor-pointer"
                    >
                        Start New →
                    </button>
                </div>

                <p className="text-xs text-system-gray font-sans">
                    No account needed. Your file is processed locally and not stored on our servers.
                </p>
            </div>
        </div>
    );
}
