/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

function esc(s: string | undefined | null): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function generateHero(fields: any): string {
  const subtitle = fields.subtitle ? `<span class="block font-opensans font-bold tracking-[0.2em] text-orange uppercase mb-4 text-sm md:text-base">${esc(fields.subtitle)}</span>` : '';
  const dateStr = fields.date ? `<span class="ml-2 pl-2 border-l border-ghost/30">${esc(fields.date)}</span>` : '';

  return `<header data-block-id="${esc(fields._id)}" class="relative w-full h-[85vh] min-h-[600px] flex items-end justify-center overflow-hidden parallax-container bg-navy cursor-pointer hover:ring-2 hover:ring-orange/50 transition-shadow">
        <div class="parallax-bg absolute left-0 -top-[10%] w-full h-[120%] bg-cover bg-center" style="background-image: url('${esc(fields.imageUrl)}');"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-[#17203833] to-[#172038E6]"></div>
        <div class="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-navy to-transparent pointer-events-none z-[5]"></div>
        <div class="relative z-10 w-full max-w-3xl px-6 py-16 mx-auto">
            ${subtitle}
            <h1 class="font-plex font-bold text-4xl md:text-5xl lg:text-6xl text-ghost leading-tight mb-6 drop-shadow-lg">${esc(fields.title)}</h1>
            <p class="font-ptserif text-xl md:text-2xl text-ghost/90 mb-8 max-w-2xl drop-shadow-md">${fields.text ? esc(fields.text) : ''}</p>
            <div class="font-opensans font-bold tracking-[0.15em] text-orange uppercase text-sm flex items-center gap-2">
                <span>BY</span>
                ${fields.authorLink ? `<a href="${esc(fields.authorLink)}" target="_blank" rel="noopener noreferrer" class="text-ghost hover:text-orange underline decoration-orange/50 underline-offset-4 transition-colors">${esc(fields.byline)}</a>` : `<span class="text-ghost">${esc(fields.byline)}</span>`}
                ${dateStr}
            </div>
        </div>
    </header>`;
}

export function generateIntro(fields: any): string {
  const text = fields.text || "";
  // Extract first letter for dropcap if text exists
  const match = text.match(/^([\s\S])([\s\S]*)$/);
  if (!match) return '';
  const firstChar = match[1];
  const rest = match[2];

  return `<p data-block-id="${esc(fields._id)}" class="mb-8 cursor-pointer hover:bg-white/5 transition-colors p-2 rounded -mx-2"><span class="drop-cap">${esc(firstChar)}</span>${esc(rest)}</p>`;
}

export function generateText(fields: any): string {
  let out = "";
  if (fields.heading) {
    out += `<h2 class="font-plex font-bold text-3xl md:text-4xl text-ghost mb-8 mt-16 tracking-tight">${esc(fields.heading)}</h2>\n`;
  }
  // Expected bodyHtml or raw text
  let html = fields.bodyHtml || fields.text || "";
  if (!html.startsWith("<")) {
    html = `<p class="mb-8">${html}</p>`;
  }
  out += `<div data-block-id="${esc(fields._id)}" class="prose prose-invert prose-lg max-w-none prose-p:mb-8 text-ghost cursor-pointer hover:bg-white/5 transition-colors p-4 rounded -mx-4">${html}</div>`;
  return out;
}

export function generatePullquote(fields: any): string {
  const alignment = fields.alignment?.toLowerCase() || 'center';

  if (alignment === 'center') {
    return `<div data-block-id="${esc(fields._id)}" class="my-16 py-10 border-y-2 border-orange border-opacity-60 clear-both text-center max-w-2xl mx-auto px-4 relative cursor-pointer hover:bg-white/5 transition-colors rounded -mx-4">
    <span class="absolute -top-6 left-1/2 transform -translate-x-1/2 text-orange font-plex text-6xl leading-none">"</span>
    <p class="font-ptserif italic text-3xl md:text-4xl text-ghost leading-snug">
        ${esc(fields.text)}
    </p>
    ${fields.attribution ? `<footer class="mt-6 font-opensans text-orange tracking-[0.1em] text-sm uppercase font-bold">— ${esc(fields.attribution)}</footer>` : ''}
</div>`;
  } else if (alignment === 'left') {
    return `<aside data-block-id="${esc(fields._id)}" class="w-full md:w-1/2 md:float-left md:mr-8 mb-8 mt-4 border-l-4 border-orange pl-6 py-2 clear-left cursor-pointer hover:bg-white/5 transition-colors rounded -ml-4">
    <p class="font-ptserif italic text-2xl md:text-[1.75rem] text-ghost leading-tight mb-4">
        "${esc(fields.text)}"
    </p>
    ${fields.attribution ? `<footer class="font-opensans text-orange tracking-[0.1em] text-sm uppercase font-bold">— ${esc(fields.attribution)}</footer>` : ''}
</aside>`;
  } else {
    // Right alignment (default for non-center/left)
    return `<aside data-block-id="${esc(fields._id)}" class="w-full md:w-1/2 md:float-right md:ml-8 mb-8 mt-4 border-l-4 border-orange pl-6 py-2 clear-right cursor-pointer hover:bg-white/5 transition-colors rounded -mr-4">
    <p class="font-ptserif italic text-2xl md:text-[1.75rem] text-ghost leading-tight mb-4">
        "${esc(fields.text)}"
    </p>
    ${fields.attribution ? `<footer class="font-opensans text-orange tracking-[0.1em] text-sm uppercase font-bold">— ${esc(fields.attribution)}</footer>` : ''}
</aside>`;
  }
}

export function generateParallaxBreak(fields: any): string {
  // Requires closing the main inner column, inserting full width, re-opening inner column
  return `</div>
<div data-block-id="${esc(fields._id)}" class="relative w-full h-[60vh] min-h-[400px] my-8 overflow-hidden parallax-container border-y border-navy shadow-xl bg-navy clear-both cursor-pointer hover:ring-2 hover:ring-orange/50 transition-shadow">
    <div class="parallax-bg absolute left-0 -top-[10%] w-full h-[120%] bg-cover bg-center" style="background-image: url('${esc(fields.imageUrl)}');"></div>
    <div class="absolute inset-0 bg-[#172038] bg-opacity-40"></div>
</div>
${fields.caption ? `<div class="w-full max-w-3xl mx-auto px-6 mb-16">
    <figcaption class="font-opensans tracking-[0.1em] text-sm text-ghost/70 uppercase border-l border-orange pl-3">${esc(fields.caption)}</figcaption>
</div>` : ''}
<div class="w-full max-w-3xl mx-auto px-6">`;
}

export function generateInlineImage(fields: any): string {
  if (fields.size === 'Full') {
    return `</div>
<div data-block-id="${esc(fields._id)}" class="w-full my-16 clear-both cursor-pointer hover:ring-2 hover:ring-orange/50 transition-shadow">
    <figure class="relative w-full">
        <img src="${esc(fields.imageUrl)}" alt="${esc(fields.caption || 'Image')}" class="w-full h-auto object-cover" loading="lazy" />
        ${fields.caption ? `<figcaption class="mt-4 font-opensans tracking-[0.1em] text-sm text-ghost/70 uppercase border-l border-orange pl-3 px-6 max-w-3xl mx-auto">${esc(fields.caption)}</figcaption>` : ''}
    </figure>
</div>
<div class="w-full max-w-3xl mx-auto px-6">`;
  }
  return `</div>
<div data-block-id="${esc(fields._id)}" class="w-full max-w-4xl mx-auto px-6 my-16 clear-both cursor-pointer hover:ring-2 hover:ring-orange/50 transition-shadow">
    <figure class="relative">
        <div class="p-2 bg-navylight shadow-2xl">
            <img src="${esc(fields.imageUrl)}" alt="${esc(fields.caption || 'Image')}" class="w-full h-auto object-cover border border-navy shadow-inner" loading="lazy" />
        </div>
        ${fields.caption ? `<figcaption class="mt-4 font-opensans tracking-[0.1em] text-sm text-ghost/70 uppercase max-w-3xl mx-auto border-l border-orange pl-3">${esc(fields.caption)}</figcaption>` : ''}
    </figure>
</div>
<div class="w-full max-w-3xl mx-auto px-6">`;
}

export function generateStatBlock(fields: any): string {
  // Collect up to 3 stats
  const stats = [];
  if (fields.stat1Value) stats.push({ val: fields.stat1Value, label: fields.stat1Label });
  if (fields.stat2Value) stats.push({ val: fields.stat2Value, label: fields.stat2Label });
  if (fields.stat3Value) stats.push({ val: fields.stat3Value, label: fields.stat3Label });

  if (stats.length === 0) return '';
  return `<div data-block-id="${esc(fields._id)}" class="bg-navylight border-t-4 border-orange p-6 md:p-8 mb-16 shadow-lg flex flex-wrap justify-center gap-8 text-center cursor-pointer hover:ring-2 hover:ring-orange/50 transition-shadow">
        ${stats.map(s => `
        <div class="flex-1 min-w-[120px]">
            <span class="block font-plex font-bold text-4xl text-orange mb-2">${esc(s.val)}</span>
            <span class="block font-opensans tracking-[0.1em] text-sm text-ghost uppercase">${esc(s.label)}</span>
        </div>`).join('')}
    </div>`;
}

export function generateSummaryBox(fields: any): string {
  let itemsHtml = '';
  if (Array.isArray(fields.items)) {
    itemsHtml = fields.items.map((i: string) => `<li class="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-2 before:h-2 before:bg-orange before:rounded-full">${esc(i)}</li>`).join('');
  } else if (fields.text) {
    itemsHtml = `<li class="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-2 before:h-2 before:bg-orange before:rounded-full">${esc(fields.text)}</li>`;
  }

  return `<div data-block-id="${esc(fields._id)}" class="bg-navylight border-t-4 border-orange p-6 md:p-8 mb-16 shadow-lg cursor-pointer hover:ring-2 hover:ring-orange/50 transition-shadow">
    <h2 class="font-opensans font-bold tracking-[0.15em] text-orange uppercase mb-6 text-lg">${fields.title || 'IN SUMMARY'}</h2>
    <ul class="list-none space-y-4 font-ptserif text-ghost text-base md:text-lg">
        ${itemsHtml}
    </ul>
</div>`;
}

export function generateEmbed(fields: any): string {
  return `<div data-block-id="${esc(fields._id)}" class="my-16 cursor-pointer hover:ring-2 hover:ring-orange/50 transition-shadow p-2 rounded -mx-2">
        ${fields.heading ? `<h3 class="font-plex font-bold text-2xl text-ghost mb-6">${esc(fields.heading)}</h3>` : ''}
        <div class="bg-navylight p-2 shadow-lg mb-4">
            ${fields.embedCode}
        </div>
        ${fields.caption ? `<figcaption class="font-opensans tracking-[0.1em] text-sm text-ghost/70 uppercase border-l border-orange pl-3">${esc(fields.caption)}</figcaption>` : ''}
    </div>`;
}
