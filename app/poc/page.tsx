"use client";

import { useState } from "react";

export default function PoCPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedHtmlUrl, setGeneratedHtmlUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setError(null);
            if (generatedHtmlUrl) {
                URL.revokeObjectURL(generatedHtmlUrl);
                setGeneratedHtmlUrl(null);
            }
        }
    };

    const handleGenerate = async () => {
        if (!file) {
            setError("Please select a .docx file first.");
            return;
        }

        setIsLoading(true);
        setError(null);
        if (generatedHtmlUrl) {
            URL.revokeObjectURL(generatedHtmlUrl);
            setGeneratedHtmlUrl(null);
        }

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/poc-generate", {
                method: "POST",
                body: formData
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({ error: "Unknown error occurred." }));
                throw new Error(data.error || "Failed to generate HTML.");
            }

            const htmlContent = await res.text();

            // Create a blob URL to render the iframe easily
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            setGeneratedHtmlUrl(url);

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-ghost p-8 font-sans">
            <div className="max-w-7xl mx-auto flex flex-col gap-6 h-[calc(100vh-4rem)]">

                {/* Header Controls */}
                <div className="bg-white p-6 rounded-xl border border-ash shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-navy mb-1">Doc-to-Microsite Generator (PoC)</h1>
                        <p className="text-midblue text-sm">Upload a .docx to automatically extract structure using Gemini and render as a micro-site.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <input
                            type="file"
                            accept=".docx"
                            onChange={handleFileChange}
                            className="text-sm text-navy file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-ash file:text-navy hover:file:bg-gray-200"
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={!file || isLoading}
                            className="bg-orange text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90 transition-all flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Building...
                                </>
                            ) : "Generate Magic"}
                        </button>
                    </div>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded-lg">
                        <p className="font-bold">Generation Failed</p>
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                {/* Main Preview Area */}
                <div className="flex-1 bg-gray-100 rounded-xl border border-ash overflow-hidden relative shadow-inner">
                    {!generatedHtmlUrl ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-system-gray h-full">
                            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="font-semibold text-lg">No Output Generated</p>
                            <p className="text-sm max-w-sm text-center mt-2">Upload a .docx and click Generate to preview the extracted and formatted output here.</p>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col">
                            <div className="bg-white border-b border-ash p-2 flex justify-between items-center text-xs text-midblue">
                                <span className="font-mono">Preview rendering...</span>
                                <a
                                    href={generatedHtmlUrl}
                                    download="generated_poc.html"
                                    className="text-orange hover:underline font-bold"
                                >
                                    Force Download HTML
                                </a>
                            </div>
                            <iframe
                                src={generatedHtmlUrl}
                                className="w-full flex-1 border-none bg-white"
                                title="Generated Output"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
