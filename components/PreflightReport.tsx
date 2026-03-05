"use client";

import { PreflightResult } from "@/lib/types/parser";

interface PreflightReportProps {
    result: PreflightResult;
    onGoBack: () => void;
    onGenerate: () => void;
}

function StatusIcon({ type }: { type: "success" | "warning" | "error" | "suggestion" | "info" }) {
    if (type === "success") return <span className="text-green-600" aria-label="Success">✅</span>;
    if (type === "warning") return <span className="text-amber-500" aria-label="Warning">⚠️</span>;
    if (type === "error") return <span className="text-red-600" aria-label="Error">❌</span>;
    if (type === "info") return <span className="text-blue-500" aria-label="Info">ℹ️</span>;
    return <span className="text-blue-500" aria-label="Suggestion">💡</span>;
}

function ReportRow({ type, message }: { type: "success" | "warning" | "error" | "suggestion" | "info"; message: string }) {
    return (
        <li className="flex items-start gap-2 text-sm py-1.5 border-b border-ash last:border-0">
            <StatusIcon type={type} />
            <span className={
                type === "error" ? "text-red-700" :
                    type === "warning" ? "text-amber-700" :
                        "text-navy"
            }>{message}</span>
        </li>
    );
}

export default function PreflightReport({ result, onGoBack, onGenerate }: PreflightReportProps) {
    const blocks = result.blocks ?? [];
    const blockCount = blocks.length;
    const hasErrors = !!result.error;

    // Tally block types for the report
    const blockTypes = blocks.reduce((acc, b) => {
        const typeStr = String(b.type);
        acc[typeStr] = (acc[typeStr] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="w-full max-w-xl space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h2
                    className="text-2xl font-bold text-navy"
                    style={{ fontFamily: "Georgia, serif" }}
                >
                    Pre-flight Analysis
                </h2>
                <p className="text-sm text-system-gray font-sans">
                    Review AI classification details before generating the microsite.
                </p>
            </div>

            {/* Summary row */}
            <div className="flex gap-4 text-sm font-sans">
                <div className="flex-1 bg-white border border-ash rounded-lg px-4 py-3 text-center">
                    <div className="text-xl font-bold text-navy">{blockCount}</div>
                    <div className="text-xs text-system-gray mt-0.5">Total Blocks</div>
                </div>
                <div className="flex-1 bg-white border border-ash rounded-lg px-4 py-3 text-center">
                    <div className="text-xl font-bold text-navy">{Object.keys(blockTypes).length}</div>
                    <div className="text-xs text-system-gray mt-0.5">Unique Schemas</div>
                </div>
            </div>

            {/* Report items */}
            <div className="bg-white border border-ash rounded-xl overflow-hidden">
                <ul className="divide-y-0 px-4 py-2">
                    {/* Always show a parse success line unless error */}
                    {!hasErrors ? (
                        <ReportRow
                            type="success"
                            message={`Document successfully parsed into ${blockCount} schema blocks.`}
                        />
                    ) : (
                        <ReportRow type="error" message={result.error!} />
                    )}

                    {Object.entries(blockTypes).map(([type, count]) => (
                        <ReportRow key={type} type="info" message={`Identified ${count} "${type}" block(s)`} />
                    ))}

                    {result.seoData?.title && (
                        <ReportRow type="suggestion" message={`SEO Title generated: ${result.seoData.title}`} />
                    )}
                </ul>
            </div>

            {/* Error callout */}
            {hasErrors && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                    <span className="shrink-0 mt-0.5">❌</span>
                    <p>
                        <strong>Fix required:</strong> One or more errors must be resolved before you can generate. Go back and re-upload.
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onGoBack}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-ash text-sm font-sans font-medium text-navy bg-white hover:bg-ghost transition-colors cursor-pointer"
                >
                    ← Go back
                </button>
                <button
                    type="button"
                    disabled={hasErrors}
                    onClick={onGenerate}
                    className={[
                        "flex-1 px-4 py-2.5 rounded-xl text-sm font-sans font-semibold transition-all",
                        hasErrors
                            ? "bg-ash text-system-gray cursor-not-allowed"
                            : "bg-orange-courage text-white hover:bg-navy shadow-sm hover:shadow-md cursor-pointer",
                    ].join(" ")}
                >
                    Looks good, Generate →
                </button>
            </div>
        </div>
    );
}
