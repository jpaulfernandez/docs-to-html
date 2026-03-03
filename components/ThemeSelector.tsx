"use client";

import { useUploadStore, Theme } from "@/lib/store";

interface ThemeOption {
  id: Theme;
  label: string;
  tagline: string;
  bg: string;
  bgAlt: string;
  text: string;
  accent: string;
  swatches: string[];
}

const THEMES: ThemeOption[] = [
  {
    id: "light",
    label: "Light",
    tagline: "Clean & Editorial",
    bg: "#f5f6ff",
    bgAlt: "#ffffff",
    text: "#172038",
    accent: "#ff5f1b",
    swatches: ["#f5f6ff", "#ffffff", "#172038", "#ff5f1b", "#ebedff"],
  },
  {
    id: "dark",
    label: "Dark",
    tagline: "Immersive & Narrative",
    bg: "#101626",
    bgAlt: "#18213a",
    text: "#ffffff",
    accent: "#ff5f1b",
    swatches: ["#101626", "#18213a", "#ffffff", "#ff5f1b", "#404551"],
  },
  {
    id: "orange",
    label: "Orange",
    tagline: "Bold & Energetic",
    bg: "#ff5f1b",
    bgAlt: "#ff8c5a",
    text: "#ffffff",
    accent: "#172038",
    swatches: ["#ff5f1b", "#ff8c5a", "#ffffff", "#172038", "#ffddd1"],
  },
];

function ThemeCard({ theme, selected, onSelect }: { theme: ThemeOption; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "relative flex flex-col rounded-xl border-2 overflow-hidden transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-orange-courage",
        selected
          ? "border-orange-courage shadow-md scale-[1.02]"
          : "border-ash hover:border-midblue/40",
      ].join(" ")}
      aria-pressed={selected}
      aria-label={`Select ${theme.label} theme — ${theme.tagline}`}
    >
      {/* Preview card */}
      <div
        className="h-24 w-full flex flex-col justify-between p-3"
        style={{ background: theme.bg }}
      >
        {/* Mini headline */}
        <div
          className="text-xs font-serif font-semibold leading-tight"
          style={{ color: theme.text, fontFamily: "Georgia, serif" }}
        >
          Headline
        </div>

        {/* Mini content row */}
        <div className="space-y-1">
          <div
            className="h-1.5 rounded-full w-full"
            style={{ background: `${theme.text}33` }}
          />
          <div
            className="h-1.5 rounded-full w-4/5"
            style={{ background: `${theme.text}22` }}
          />
        </div>

        {/* Mini accent tag */}
        <div
          className="self-start px-1.5 py-0.5 rounded text-[9px] font-sans font-semibold"
          style={{ background: theme.accent, color: theme.id === "orange" ? "#ffffff" : "#ffffff" }}
        >
          Label
        </div>
      </div>

      {/* Swatch strip */}
      <div className="flex h-2">
        {theme.swatches.map((color, i) => (
          <div key={i} className="flex-1" style={{ background: color }} />
        ))}
      </div>

      {/* Label area */}
      <div className="px-3 py-2.5 bg-white text-left">
        <div className="flex items-center justify-between">
          <span className="text-sm font-sans font-semibold text-navy">{theme.label}</span>
          {selected && (
            <svg className="w-4 h-4 text-orange-courage shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <p className="text-xs text-system-gray mt-0.5">{theme.tagline}</p>
      </div>
    </button>
  );
}

export default function ThemeSelector() {
  const { selectedTheme, setTheme } = useUploadStore();

  return (
    <div className="space-y-3">
      <label className="block text-sm font-sans font-semibold text-navy">
        Select Theme
      </label>
      <div className="grid grid-cols-3 gap-3">
        {THEMES.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            selected={selectedTheme === theme.id}
            onSelect={() => setTheme(theme.id)}
          />
        ))}
      </div>
      {!selectedTheme && (
        <p className="text-xs text-system-gray">Choose a theme to enable upload.</p>
      )}
    </div>
  );
}
