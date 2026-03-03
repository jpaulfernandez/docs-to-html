import { Block, CsvData } from "../types/parser";
import { ClassificationResult } from "../types/ai";
import { SeoData } from "../types/ai";
import { Theme, getThemeCss } from "./themes";
import {
    heroSection, sectionTitle, subsection, bodySection, boldSection,
    pullQuote, statBlock, inlineImage, chartSection, dataTable,
    dividerSection, calloutBox, videoEmbed, twoColumnSection, footerSection,
} from "./components";
import { CHART_INIT_SCRIPT } from "./charts";

export interface AssembleOptions {
    blocks: Block[];
    csvData: Record<string, CsvData>;
    classification: ClassificationResult[];
    seoData: SeoData;
    theme: Theme;
    docName?: string;
}

function getArchetype(block: Block, classification: ClassificationResult[]): string {
    const ai = classification.find((c) => c.blockIndex === block.index);
    return ai?.archetype ?? block.archetype ?? block.heuristicArchetype ?? "body";
}

const BASE_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  line-height: 1.7;
  font-size: 18px;
  -webkit-font-smoothing: antialiased;
}
article { max-width: 100%; }

/* Hero */
.ms-hero {
  min-height: 90vh;
  display: flex;
  align-items: flex-end;
  padding: 4rem 2rem 5rem;
  position: relative;
  background-color: var(--bg-alt);
}
.ms-hero.ms-fullbleed { min-height: 100vh; }
.ms-hero__inner { max-width: 860px; margin: 0 auto; width: 100%; }
.ms-hero__title {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 6vw, 5rem);
  font-weight: 700;
  line-height: 1.15;
  color: #fff;
  letter-spacing: -0.02em;
  text-shadow: 0 2px 16px rgba(0,0,0,0.4);
}

/* Body sections */
.ms-section, .ms-body, .ms-subsection, .ms-emphasis, .ms-twocol {
  max-width: 740px;
  margin: 0 auto;
  padding: 2.5rem 1.5rem;
}
.ms-section__title {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 3.5vw, 2.75rem);
  font-weight: 700;
  color: var(--text);
  margin-bottom: 1rem;
  border-left: 4px solid var(--accent);
  padding-left: 1rem;
}
.ms-subsection__title {
  font-family: var(--font-display);
  font-size: 1.375rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.5rem;
}
.ms-body__text {
  font-size: 1.1rem;
  color: var(--text);
  line-height: 1.8;
}
.ms-emphasis__text {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--accent);
  font-style: italic;
}

/* Pull quote */
.ms-pullquote {
  max-width: 860px;
  margin: 3rem auto;
  padding: 2.5rem 3rem;
  border-left: 5px solid var(--accent);
  background: var(--bg-alt);
}
.ms-pullquote__text {
  font-family: var(--font-display);
  font-size: clamp(1.5rem, 3vw, 2rem);
  line-height: 1.4;
  color: var(--text);
  font-style: italic;
}

/* Stat block */
.ms-statblock {
  display: flex;
  flex-wrap: wrap;
  gap: 2rem;
  justify-content: center;
  padding: 3rem 1.5rem;
  max-width: 900px;
  margin: 0 auto;
  background: var(--bg-alt);
  border-radius: 1rem;
}
.ms-stat__item { text-align: center; }
.ms-stat__value {
  display: block;
  font-family: var(--font-mono);
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}
.ms-stat__label {
  display: block;
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-top: 0.375rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* Charts */
.ms-chart {
  max-width: 860px;
  margin: 2.5rem auto;
  padding: 1.5rem;
  background: var(--bg-alt);
  border-radius: 0.75rem;
}
.ms-chart__title {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
}
.ms-chart__wrap { width: 100%; overflow-x: auto; }
.ms-chart__svg { display: block; width: 100%; }
.bar { transition: filter 0.2s; }
.bar:hover { filter: brightness(1.15); }

/* Images */
.ms-image { max-width: 860px; margin: 2.5rem auto; padding: 0 1.5rem; text-align: center; }
.ms-image img { width: 100%; height: auto; border-radius: 0.5rem; }
.ms-image figcaption { font-size: 0.875rem; color: var(--text-muted); margin-top: 0.5rem; font-style: italic; }

/* Table */
.ms-table { max-width: 860px; margin: 2.5rem auto; padding: 0 1.5rem; overflow-x: auto; }
.ms-table table { width: 100%; border-collapse: collapse; }
.ms-table th, .ms-table td { padding: 0.625rem 1rem; text-align: left; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
.ms-table th { font-weight: 600; color: var(--accent); background: var(--bg-alt); }

/* Callout */
.ms-callout {
  max-width: 740px;
  margin: 2rem auto;
  padding: 1.25rem 1.5rem;
  border-radius: 0.5rem;
  border: 2px solid var(--accent);
  background: var(--bg-alt);
  font-size: 1rem;
}

/* Divider */
.ms-divider { max-width: 860px; margin: 3rem auto; padding: 0 1.5rem; }
.ms-divider svg { display: block; width: 100%; height: 4px; }

/* Video */
.ms-video { max-width: 860px; margin: 2.5rem auto; padding: 0 1.5rem; }
.ms-video__wrap { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 0.5rem; }
.ms-video__wrap iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }

/* Two-col */
.ms-twocol { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
@media (max-width: 640px) { .ms-twocol { grid-template-columns: 1fr; } }

/* Footer */
.ms-footer {
  background: var(--bg-alt);
  border-top: 1px solid var(--border);
  text-align: center;
  padding: 2.5rem 1.5rem;
  margin-top: 4rem;
}
.ms-footer__text { font-size: 0.875rem; color: var(--text-muted); }

/* D3 axes */
.tick line { stroke: var(--border); }
.tick text { fill: var(--text-muted); font-size: 11px; font-family: var(--font-mono); }
.domain { stroke: var(--border); }
`;

export function assembleHtml(opts: AssembleOptions): string {
    const { blocks, csvData, classification, seoData, theme, docName } = opts;

    const themeCss = getThemeCss(theme);

    // --- Build body HTML ---
    const bodyParts: string[] = [];
    let chartIndex = 0;
    let i = 0;
    let hasHero = false;

    while (i < blocks.length) {
        const block = blocks[i];
        const archetype = getArchetype(block, classification);

        // Hero
        if (!hasHero && block.type === "heading1") {
            bodyParts.push(heroSection(block));
            hasHero = true;
            i++;
            continue;
        }

        // Collect consecutive stat annotations on the same block
        const statAnns = block.annotations.filter((a) => a.keyword === "stat" && a.valid !== false);
        if (statAnns.length > 0) {
            const stats = statAnns.map((a) => ({
                value: a.primaryValue ?? a.params.value ?? "–",
                label: a.params.label ?? "",
            }));
            bodyParts.push(statBlock(stats));
            i++;
            continue;
        }

        // Image annotation
        const imageAnn = block.annotations.find((a) => a.keyword === "image");
        if (imageAnn) {
            const pos = imageAnn.params.position ?? "inline";
            if (pos !== "background") {
                bodyParts.push(inlineImage(imageAnn));
            }
            // background images are handled inside heroSection; skip standalone
            i++;
            continue;
        }

        // Chart annotation
        const chartAnn = block.annotations.find((a) => a.keyword === "chart");
        if (chartAnn) {
            bodyParts.push(chartSection(block, chartAnn, csvData, chartIndex++));
            i++;
            continue;
        }

        // Callout
        const calloutAnn = block.annotations.find((a) => a.keyword === "callout");
        if (calloutAnn) {
            bodyParts.push(calloutBox(block, calloutAnn));
            i++;
            continue;
        }

        // Embed / video
        const embedAnn = block.annotations.find((a) => a.keyword === "embed");
        if (embedAnn) {
            bodyParts.push(videoEmbed(embedAnn));
            i++;
            continue;
        }

        // Layout: two-column
        const layoutAnn = block.annotations.find((a) => a.keyword === "layout");
        if (layoutAnn?.primaryValue === "two-column") {
            bodyParts.push(twoColumnSection(block));
            i++;
            continue;
        }

        // Fall through to archetype
        switch (archetype) {
            case "hero":
            case "section-break":
                bodyParts.push(sectionTitle(block));
                break;
            case "section-title":
                bodyParts.push(sectionTitle(block));
                break;
            case "subsection":
                bodyParts.push(subsection(block));
                break;
            case "pull-quote":
                bodyParts.push(pullQuote(block));
                break;
            case "data-table":
                bodyParts.push(dataTable(block));
                break;
            case "divider":
                bodyParts.push(dividerSection());
                break;
            case "emphasis":
                bodyParts.push(boldSection(block));
                break;
            default:
                if (block.content.trim()) {
                    bodyParts.push(bodySection(block));
                }
        }
        i++;
    }

    bodyParts.push(footerSection());

    const bodyHtml = `<article>\n${bodyParts.join("\n")}\n</article>`;

    // --- JSON-LD ---
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: seoData.title,
        description: seoData.description,
        datePublished: new Date().toISOString(),
    };

    // --- SEO head ---
    const head = `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${seoData.title}</title>
<meta name="description" content="${seoData.description.replace(/"/g, "&quot;")}">
<meta name="keywords" content="${seoData.keywords.join(", ")}">
<meta property="og:title" content="${seoData.title.replace(/"/g, "&quot;")}">
<meta property="og:description" content="${seoData.description.replace(/"/g, "&quot;")}">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${seoData.title.replace(/"/g, "&quot;")}">
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,600;1,400&family=IBM+Plex+Mono:wght@400;600&family=PT+Serif:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script>
<style>
${themeCss}
${BASE_CSS}
</style>`;

    return `<!DOCTYPE html>
<html lang="en">
<head>
${head}
</head>
<body>
${bodyHtml}
<script>
${CHART_INIT_SCRIPT}
</script>
</body>
</html>`;
}
