/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import mammoth from "mammoth";
import { V2ParsedDocument } from "../types/parser";
import * as cheerio from "cheerio";

export async function extractDocxStructure(buffer: ArrayBuffer): Promise<V2ParsedDocument> {
    const result = await mammoth.convertToHtml({ buffer: Buffer.from(buffer) });
    const html = result.value;

    const $ = cheerio.load(html);
    const doc: V2ParsedDocument = {
        title: null,
        author: null,
        paragraphs: [],
        imageUrls: [],
        embedBlocks: [],
        tables: []
    };

    let pIndex = 0;

    $('body').children().each((_: any, el: any) => {
        const tagName = el.tagName.toLowerCase();

        // Handle Headings and Paragraphs
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'li'].includes(tagName)) {
            const $el = $(el);
            let text = $el.text().trim();
            if (text.length === 0) return; // Skip empty tags

            // Aggressive Pre-processor: Capture metadata natively before it hits paragraphs
            const upperText = text.toUpperCase();

            if (upperText.startsWith('BANNER PHOTO:')) {
                const urlMatch = text.match(/https?:\/\/[^\s]+/i);
                if (urlMatch) doc.imageUrls.unshift(urlMatch[0]); // Force hero image to front
                return;
            }
            if (upperText.startsWith('TITLE:')) {
                doc.title = text.replace(/^TITLE:\s*/i, '').trim();
                return;
            }
            if (upperText.startsWith('AUTHOR:')) {
                const linkMatch = text.match(/\[LINK:\s*(.*?)\]/i);
                if (linkMatch) {
                    doc.authorLink = linkMatch[1].trim();
                }
                // Remove the 'AUTHOR:' prefix and any trailing [LINK: ...] brackets
                doc.author = text.replace(/^AUTHOR:\s*/i, '').replace(/\s*\[LINK:.*?\]/i, '').trim();
                return;
            }
            if (upperText.startsWith('SUBHEAD:')) {
                // We'll pass subhead as the first paragraph so Gemini maps it to Intro or Hero subtitle
                text = text.replace(/^SUBHEAD:\s*/i, '').trim();
            } else if (upperText.startsWith('PULLQUOTE:')) {
                text = text.replace(/^PULLQUOTE:\s*/i, '').trim();
            } else if (upperText.startsWith('IN SUMMARY:')) {
                text = text.replace(/^IN SUMMARY:\s*/i, '').trim();
            }

            // Fallback Heuristics for Title/Author if no strict annotations were found
            if (pIndex === 0 && !doc.title && !upperText.startsWith('SUBHEAD:')) {
                doc.title = text;
            } else if (pIndex === 1 && !doc.author && (text.toLowerCase().startsWith('by ') || text.length < 50)) {
                doc.author = text.replace(/^by\s+/i, '');
            }

            const formatting: string[] = [];
            if ($el.find('strong, b').length > 0) formatting.push('bold');
            if ($el.find('em, i').length > 0) formatting.push('italic');
            if (tagName.startsWith('h')) formatting.push('heading');
            if (tagName === 'blockquote') formatting.push('quote');

            // Check if it's actually an embed masquerading as a paragraph
            if (text.startsWith('<iframe') || text.includes('youtube.com/') || text.includes('twitter.com/')) {
                doc.embedBlocks.push(text);
                return; // Treat as embed completely, don't add to paragraphs
            }

            // Check if it's an image URL masquerading as text
            if (text.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i)) {
                doc.imageUrls.push(text);
                return;
            }

            doc.paragraphs.push({
                index: pIndex++,
                text,
                formatting
            });
        }

        // Handle existing inline images from Mammoth (if base64 or linked)
        if (tagName === 'img') {
            const src = $(el).attr('src');
            if (src) doc.imageUrls.push(src);
        }

        // Handle tables
        if (tagName === 'table') {
            const tableData: any = { headers: [], rows: [] };
            $(el).find('tr').each((rowIndex: any, tr: any) => {
                const rowContent: string[] = [];
                $(tr).find('td, th').each((_: any, cell: any) => {
                    rowContent.push($(cell).text().trim());
                });

                if (rowIndex === 0) {
                    tableData.headers = rowContent;
                } else {
                    tableData.rows.push(rowContent);
                }
            });
            doc.tables.push(tableData);
        }
    });

    return doc;
}
