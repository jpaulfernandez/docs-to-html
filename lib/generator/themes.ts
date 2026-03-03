export type Theme = "light" | "dark" | "orange";

interface ThemeTokens {
    bg: string;
    bgAlt: string;
    bgCard: string;
    text: string;
    textMuted: string;
    accent: string;
    accentLight: string;
    border: string;
    fontDisplay: string;
    fontBody: string;
    fontMono: string;
}

const THEME_MAP: Record<Theme, ThemeTokens> = {
    light: {
        bg: "#f5f6ff",
        bgAlt: "#ffffff",
        bgCard: "#ffffff",
        text: "#172038",
        textMuted: "#6c6f8b",
        accent: "#ff5f1b",
        accentLight: "#ff8c5a",
        border: "#ebedff",
        fontDisplay: "'PT Serif', 'Georgia', serif",
        fontBody: "'IBM Plex Sans', 'system-ui', sans-serif",
        fontMono: "'IBM Plex Mono', monospace",
    },
    dark: {
        bg: "#101626",
        bgAlt: "#18213a",
        bgCard: "#18213a",
        text: "#f5f6ff",
        textMuted: "#cbccdc",
        accent: "#ff5f1b",
        accentLight: "#ff8c5a",
        border: "#404551",
        fontDisplay: "'PT Serif', 'Georgia', serif",
        fontBody: "'IBM Plex Sans', 'system-ui', sans-serif",
        fontMono: "'IBM Plex Mono', monospace",
    },
    orange: {
        bg: "#ff5f1b",
        bgAlt: "#ff8c5a",
        bgCard: "#ff7a40",
        text: "#ffffff",
        textMuted: "#ffddd1",
        accent: "#172038",
        accentLight: "#454d60",
        border: "#ff8c5a",
        fontDisplay: "'PT Serif', 'Georgia', serif",
        fontBody: "'IBM Plex Sans', 'system-ui', sans-serif",
        fontMono: "'IBM Plex Mono', monospace",
    },
};

export function getThemeCss(theme: Theme): string {
    const t = THEME_MAP[theme];
    return `:root {
  --bg: ${t.bg};
  --bg-alt: ${t.bgAlt};
  --bg-card: ${t.bgCard};
  --text: ${t.text};
  --text-muted: ${t.textMuted};
  --accent: ${t.accent};
  --accent-light: ${t.accentLight};
  --border: ${t.border};
  --font-display: ${t.fontDisplay};
  --font-body: ${t.fontBody};
  --font-mono: ${t.fontMono};
}`;
}
