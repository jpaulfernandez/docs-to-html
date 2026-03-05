"use client";

interface PreviewPaneProps {
    html: string | null;
}

export default function PreviewPane({ html }: PreviewPaneProps) {
    if (!html) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-system-gray space-y-4 bg-vanilla/5">
                <svg className="w-8 h-8 animate-spin text-orange-courage" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="font-sans text-sm font-medium animate-pulse">Generating Live Preview...</p>
            </div>
        );
    }

    return (
        <iframe
            title="Microsite Preview"
            srcDoc={html}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin"
        />
    );
}
