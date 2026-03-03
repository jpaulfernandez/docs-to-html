"use client";

import { PreflightResult } from "@/lib/types/parser";

interface PreflightReportProps {
    result: PreflightResult;
    onGoBack: () => void;
    onGenerate: () => void;
}

function StatusIcon({ type }: { type: "success" | "warning" | "error" | "suggestion" }) {
    if (type === "success") return <span className="text-green-600" aria-label="Success">✅</span>;
    if (type === "warning") return <span className="text-amber-500" aria-label="Warning">⚠️</span>;
    if (type === "error") return <span className="text-red-600" aria-label="Error">❌</span>;
    return <span className="text-blue-500" aria-label="Suggestion">💡</span>;
}

function ReportRow({ type, message }: { type: "success" | "warning" | "error" | "suggestion"; message: string }) {
    return (
        <li className="flex items-start gap-2 text-sm py-1.5 border-b border-ash last:border-0">
            <StatusIcon type={type} />
            <span className={
                type === "error" ? "text-red-700" :
                    type === "warning" ? "text-amber-700" :
                        type === "suggestion" ? "text-blue-700" :
                            "text-navy"
            }>{message}</span>
        </li>
    );
}

export default function PreflightReport({ result, onGoBack, onGenerate }: PreflightReportProps) {
    const errors = result.validationErrors ?? [];
    const warnings = result.validationWarnings ?? [];
    const suggestions = (result.classification ?? [])
        .filter((c) => c.suggestions.length > 0)
        .map((c) => `Block ${c.blockIndex} (${c.archetype}): Consider adding ${c.suggestions.join(", ")}`);

    const themeSuggestion = result.seoData?.article_type
        ? `AI suggested article type: ${result.seoData.article_type}`
        : null;

    const blockCount = result.blocks?.length ?? 0;
    const csvCount = result.csvFiles?.length ?? 0;
    const annotationCount = result.blocks?.reduce((acc, b) => acc + b.annotations.length, 0) ?? 0;
    const hasErrors = errors.length > 0;

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
                    Review your document before generating the microsite.
                </p>
            </div>

            {/* Summary row */}
            <div className="flex gap-4 text-sm font-sans">
                <div className="flex-1 bg-white border border-ash rounded-lg px-4 py-3 text-center">
                    <div className="text-xl font-bold text-navy">{blockCount}</div>
                    <div className="text-xs text-system-gray mt-0.5">Sections</div>
                </div>
                <div className="flex-1 bg-white border border-ash rounded-lg px-4 py-3 text-center">
                    <div className="text-xl font-bold text-navy">{annotationCount}</div>
                    <div className="text-xs text-system-gray mt-0.5">Annotations</div>
                </div>
                <div className="flex-1 bg-white border border-ash rounded-lg px-4 py-3 text-center">
                    <div className="text-xl font-bold text-navy">{csvCount}</div>
                    <div className="text-xs text-system-gray mt-0.5">CSV Files</div>
                </div>
            </div>

            {/* Report items */}
            <div className="bg-white border border-ash rounded-xl overflow-hidden">
                <ul className="divide-y-0 px-4 py-2">
                    {/* Always show a parse success line */}
                    <ReportRow
                        type="success"
                        message={`Document parsed — ${blockCount} sections found${annotationCount > 0 ? `, ${annotationCount} annotation${annotationCount !== 1 ? "s" : ""} found` : ""}`}
                    />
                    {csvCount > 0 && (
                        <ReportRow
                            type="success"
                            message={`${csvCount} CSV file${csvCount !== 1 ? "s" : ""} uploaded`}
                        />
                    )}

                    {errors.map((msg, i) => (
                        <ReportRow key={`err-${i}`} type="error" message={msg} />
                    ))}
                    {warnings.map((msg, i) => (
                        <ReportRow key={`warn-${i}`} type="warning" message={msg} />
                    ))}
                    {suggestions.map((msg, i) => (
                        <ReportRow key={`sug-${i}`} type="suggestion" message={msg} />
                    ))}
                    {themeSuggestion && (
                        <ReportRow type="suggestion" message={themeSuggestion} />
                    )}

                    {errors.length === 0 && warnings.length === 0 && suggestions.length === 0 && (
                        <ReportRow type="success" message="All annotations validated — no issues found." />
                    )}
                </ul>
            </div>

            {/* Error callout */}
            {hasErrors && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                    <span className="shrink-0 mt-0.5">❌</span>
                    <p>
                        <strong>Fix required:</strong> One or more errors must be resolved before you can generate. Go back, correct your document, and re-upload.
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
                    ← Go back and fix
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
