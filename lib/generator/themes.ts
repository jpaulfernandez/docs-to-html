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
    fontCondensed: string;
}

const THEME_MAP: Record<Theme, ThemeTokens> = {
    light: {
        bg: "#f5f6ff", /* Ghost White */
        bgAlt: "#ffffff",
        bgCard: "#ffffff",
        text: "#172038", /* Navy */
        textMuted: "#6c6f8b",
        accent: "#ff5f1b", /* Orange Courage */
        accentLight: "#ff8c5a",
        border: "#ebedff",
        fontDisplay: "'IBM Plex Sans', 'system-ui', sans-serif",
        fontBody: "'PT Serif', 'Georgia', serif",
        fontMono: "'IBM Plex Mono', monospace",
        fontCondensed: "'Open Sans Condensed', sans-serif",
    },
    dark: {
        bg: "#101626", /* Navy */
        bgAlt: "#18213a",
        bgCard: "#1a2440",
        text: "#f5f6ff", /* Ghost White */
        textMuted: "#cbccdc",
        accent: "#ff5f1b", /* Orange Courage */
        accentLight: "#ff8c5a",
        border: "#404551",
        fontDisplay: "'IBM Plex Sans', 'system-ui', sans-serif",
        fontBody: "'PT Serif', 'Georgia', serif",
        fontMono: "'IBM Plex Mono', monospace",
        fontCondensed: "'Open Sans Condensed', sans-serif",
    },
    orange: {
        bg: "#ff5f1b", /* Orange Courage */
        bgAlt: "#ff8c5a",
        bgCard: "#ff7a40",
        text: "#172038", /* Navy */
        textMuted: "#ffffff",
        accent: "#172038", /* Navy */
        accentLight: "#454d60",
        border: "#ff8c5a",
        fontDisplay: "'IBM Plex Sans', 'system-ui', sans-serif",
        fontBody: "'PT Serif', 'Georgia', serif",
        fontMono: "'IBM Plex Mono', monospace",
        fontCondensed: "'Open Sans Condensed', sans-serif",
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
  --font-condensed: ${t.fontCondensed};
}`;
}
