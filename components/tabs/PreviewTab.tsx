"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";

type DeviceWidth = "desktop" | "tablet" | "mobile";
const DEVICES: { id: DeviceWidth; label: string; px: number }[] = [
    { id: "desktop", label: "Desktop", px: 1280 },
    { id: "tablet", label: "Tablet", px: 768 },
    { id: "mobile", label: "Mobile", px: 390 },
];

export default function PreviewTab() {
    const html = useAppStore((s) => s.generatedHtml) ?? "";
    const [device, setDevice] = useState<DeviceWidth>("desktop");
    const current = DEVICES.find((d) => d.id === device)!;

    return (
        <div className="flex flex-col h-full gap-3">
            {/* Device toggle */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-system-gray font-sans mr-2">Preview as:</span>
                {DEVICES.map((d) => (
                    <button
                        key={d.id}
                        type="button"
                        onClick={() => setDevice(d.id)}
                        className={[
                            "px-3 py-1 rounded-full text-xs font-sans font-medium transition-all",
                            device === d.id
                                ? "bg-navy text-white"
                                : "bg-ash text-navy hover:bg-vanilla-dark",
                        ].join(" ")}
                    >
                        {d.label}
                    </button>
                ))}
                <span className="ml-auto text-xs text-system-gray">{current.px}px</span>
            </div>

            {/* Iframe wrapper */}
            <div className="flex-1 overflow-auto bg-gray-100 rounded-xl flex justify-center p-4">
                <div
                    className="relative transition-all duration-300"
                    style={{ width: current.px, maxWidth: "100%" }}
                >
                    {/* Browser chrome mock */}
                    <div className="bg-white rounded-t-lg border border-ash border-b-0 px-3 py-2 flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                        </div>
                        <div className="flex-1 bg-ash rounded px-3 py-0.5 text-xs text-system-gray font-mono truncate">
                            preview — your microsite
                        </div>
                    </div>
                    <iframe
                        srcDoc={html}
                        title="Microsite Preview"
                        className="w-full border border-ash rounded-b-lg bg-white"
                        style={{ height: "75vh" }}
                        sandbox="allow-scripts allow-same-origin"
                    />
                </div>
            </div>
        </div>
    );
}
