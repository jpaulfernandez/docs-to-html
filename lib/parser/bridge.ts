import { Block } from "../types/parser";
import { PoCStructuredData } from "../ai/gemini-poc";

export function convertPoCToBlocks(data: PoCStructuredData): Block[] {
    const blocks: Block[] = [];
    let index = 0;

    // 1. Hero Block
    blocks.push({
        index: index++,
        type: "heading1",
        content: data.hero.title,
        rawHtml: `<h1>${data.hero.title}</h1>`,
        archetype: "hero",
        heuristicArchetype: "hero",
        annotations: data.hero.background_image_url ? [
            {
                keyword: "image",
                primaryValue: data.hero.background_image_url,
                params: { position: "background" },
                raw: `@image: ${data.hero.background_image_url} | position=background`,
                valid: true,
                warnings: []
            }
        ] : []
    });

    // 1b. Subtitle block (hero-body)
    if (data.hero.subtitle) {
        blocks.push({
            index: index++,
            type: "paragraph",
            content: data.hero.subtitle,
            rawHtml: `<p>${data.hero.subtitle}</p>`,
            archetype: "hero-body",
            heuristicArchetype: "hero-body",
            annotations: []
        });
    }

    // 2. Summary bullets
    if (data.summary && data.summary.length > 0) {
        const listItems = data.summary.map((s: string) => `<li>${s}</li>`).join("");
        blocks.push({
            index: index++,
            type: "paragraph", // We use paragraph type for summaryBox by design
            content: data.summary.join(" "),
            rawHtml: `<ul>${listItems}</ul>`,
            archetype: "summary",
            heuristicArchetype: "summary",
            annotations: []
        });
    }

    // 3. Content Blocks
    for (const b of data.content_blocks) {
        const block: Block = {
            index: index++,
            type: "paragraph",
            content: b.text || "",
            rawHtml: "",
            archetype: "body",
            heuristicArchetype: "body",
            annotations: []
        };

        if (b.type === "subheading") {
            block.type = "heading2";
            block.archetype = "section-title";
            block.heuristicArchetype = "section-title";
            block.rawHtml = `<h2>${b.text}</h2>`;
        } else if (b.type === "pullquote") {
            block.type = "blockquote";
            block.archetype = "pull-quote";
            block.heuristicArchetype = "pull-quote";
            block.rawHtml = `<blockquote>${b.text}</blockquote>`;

            // Map style properly
            block.annotations.push({
                keyword: "pullquote",
                primaryValue: null,
                params: { style: b.style === "center" ? "center" : "right" },
                raw: `@pullquote: style=${b.style === "center" ? "center" : "right"}`,
                valid: true,
                warnings: []
            });
        } else if (b.type === "image_full_width") {
            block.type = "paragraph";
            block.archetype = "body"; // Image rendering takes over archetype
            block.heuristicArchetype = "body";
            block.rawHtml = `<img src="${b.url}" alt="${b.caption || ""}" />`;

            block.annotations.push({
                keyword: "image",
                primaryValue: b.url || "",
                params: { caption: b.caption || "" },
                raw: `@image: ${b.url} | caption=${b.caption}`,
                valid: true,
                warnings: []
            });
        } else if (b.type === "emphasis") {
            block.type = "bold-paragraph";
            block.archetype = "emphasis";
            block.heuristicArchetype = "emphasis";
            block.rawHtml = `<p><strong>${b.text}</strong></p>`;
        } else {
            // normal paragraph
            block.rawHtml = `<p>${b.text}</p>`;
        }

        blocks.push(block);
    }

    return blocks;
}
