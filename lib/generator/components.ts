import { Block, Annotation } from "../types/parser";
import { CsvData } from "../types/parser";

function esc(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function getParam(ann: Annotation, key: string, fallback = ""): string {
    return ann.params[key] ?? fallback;
}

export function heroSection(block: Block): string {
    const imageAnn = block.annotations.find((a) => a.keyword === "image");
    const bgUrl = imageAnn?.primaryValue ?? imageAnn?.params.url ?? "";
    const opacity = imageAnn ? parseFloat(getParam(imageAnn, "opacity", "0.45")) : 0.45;
    const isFullbleed = block.annotations.some(
        (a) => a.keyword === "layout" && a.primaryValue === "fullbleed"
    );
    const bgStyle = bgUrl
        ? `background-image: linear-gradient(rgba(0,0,0,${opacity}), rgba(0,0,0,${opacity + 0.2})), url('${esc(bgUrl)}'); background-size: cover; background-position: center;`
        : "background: var(--bg-alt);";

    return `<header class="ms-hero${isFullbleed ? " ms-fullbleed" : ""}" style="${bgStyle}" data-anim="hero">
  <div class="ms-hero__inner">
    <h1 class="ms-hero__title" data-anim="fade-up">${esc(block.content)}</h1>
  </div>
</header>`;
}

export function sectionTitle(block: Block): string {
    return `<section class="ms-section" data-anim="fade-up">
  <h2 class="ms-section__title">${esc(block.content)}</h2>
</section>`;
}

export function subsection(block: Block): string {
    return `<div class="ms-subsection" data-anim="fade-up">
  <h3 class="ms-subsection__title">${esc(block.content)}</h3>
</div>`;
}

export function bodySection(block: Block): string {
    return `<section class="ms-body" data-anim="fade-up">
  <p class="ms-body__text">${esc(block.content)}</p>
</section>`;
}

export function boldSection(block: Block): string {
    return `<section class="ms-emphasis" data-anim="fade-up">
  <p class="ms-emphasis__text">${esc(block.content)}</p>
</section>`;
}

export function pullQuote(block: Block): string {
    return `<section class="ms-pullquote" data-anim="slide-left">
  <blockquote class="ms-pullquote__text">${esc(block.content)}</blockquote>
</section>`;
}

export function statBlock(stats: Array<{ value: string; label: string }>): string {
    const items = stats
        .map(
            (s) =>
                `<div class="ms-stat__item">
      <span class="ms-stat__value" data-target="${esc(s.value)}">${esc(s.value)}</span>
      <span class="ms-stat__label">${esc(s.label)}</span>
    </div>`
        )
        .join("\n");
    return `<section class="ms-statblock" data-anim="stats">
  ${items}
</section>`;
}

export function inlineImage(ann: Annotation): string {
    const url = ann.primaryValue ?? ann.params.url ?? "";
    const caption = getParam(ann, "caption", "");
    const alt = getParam(ann, "alt", caption || "Image");
    const align = getParam(ann, "align", "center");
    return `<section class="ms-image ms-image--${esc(align)}" data-anim="fade-up">
  <figure>
    <img src="${esc(url)}" alt="${esc(alt)}" loading="lazy" />
    ${caption ? `<figcaption>${esc(caption)}</figcaption>` : ""}
  </figure>
</section>`;
}

export function chartSection(
    block: Block,
    ann: Annotation,
    csvData: Record<string, CsvData>,
    chartIndex: number
): string {
    const chartType = ann.params.type ?? "bar";
    const title = getParam(ann, "title", block.content);
    const source = ann.params.source ?? "";
    const xKey = ann.params.x ?? "";
    const yKey = ann.params.y ?? "";
    const color = ann.params.color ?? "var(--accent)";
    const id = `chart-${chartIndex}`;

    const csv = source ? csvData[source] : null;
    const rows = csv?.rows ?? [];
    const dataJson = JSON.stringify(rows);

    return `<section class="ms-chart" data-anim="fade-up">
  ${title ? `<h3 class="ms-chart__title">${esc(title)}</h3>` : ""}
  <div class="ms-chart__wrap">
    <svg id="${id}" class="ms-chart__svg"></svg>
  </div>
  <script type="application/json" id="${id}-data">${dataJson}</script>
  <script>window.__charts = window.__charts || []; window.__charts.push({id:"${id}",type:"${chartType}",xKey:${JSON.stringify(xKey)},yKey:${JSON.stringify(yKey)},color:${JSON.stringify(color)}});</script>
</section>`;
}

export function dataTable(block: Block): string {
    // Re-use the rawHtml for tables since mammoth already parsed it
    return `<section class="ms-table" data-anim="fade-up">
  <div class="ms-table__wrap">${block.rawHtml}</div>
</section>`;
}

export function dividerSection(): string {
    return `<div class="ms-divider" data-anim="line-draw">
  <svg viewBox="0 0 800 4" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="2" x2="800" y2="2" stroke="var(--accent)" stroke-width="2" stroke-dasharray="800" stroke-dashoffset="800" class="ms-divider__line"/></svg>
</div>`;
}

export function calloutBox(block: Block, ann: Annotation): string {
    const style = getParam(ann, "style", "default");
    return `<section class="ms-callout ms-callout--${esc(style)}" data-anim="fade-up">
  <p>${esc(block.content)}</p>
</section>`;
}

export function videoEmbed(ann: Annotation): string {
    const url = ann.primaryValue ?? ann.params.url ?? "";
    // Convert YouTube watch URL to embed
    const embedUrl = url
        .replace("youtube.com/watch?v=", "youtube.com/embed/")
        .replace("youtu.be/", "youtube.com/embed/");
    return `<section class="ms-video" data-anim="fade-up">
  <div class="ms-video__wrap">
    <iframe src="${esc(embedUrl)}" loading="lazy" allowfullscreen title="Embedded video"></iframe>
  </div>
</section>`;
}

export function twoColumnSection(block: Block): string {
    return `<section class="ms-twocol" data-anim="fade-up">
  <div class="ms-twocol__col"><p>${esc(block.content)}</p></div>
  <div class="ms-twocol__col"></div>
</section>`;
}

export function footerSection(): string {
    return `<footer class="ms-footer" data-anim="fade-up">
  <p class="ms-footer__text">Published with Rappler Doc to Microsite · ${new Date().getFullYear()}</p>
</footer>`;
}
