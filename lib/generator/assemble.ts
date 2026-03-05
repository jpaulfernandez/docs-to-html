import { Block } from "../types/parser";
import { SeoData } from "../types/ai";
import * as comps from "./components";

export interface AssembleOptions {
  blocks: Block[];
  seoData?: SeoData;
  docName?: string;
}

export function assembleHtml(opts: AssembleOptions): string {
  const { blocks, seoData = { title: 'Rappler Story', description: '', keywords: [], og_image_suggestion: '', article_type: '', reading_time_minutes: 0 } as SeoData } = opts;

  const bodyParts: string[] = [];
  let hasHero = false;

  // Output wrapper open
  const openMain = `\n<main class="w-full pb-20">\n<div class="w-full max-w-3xl mx-auto px-6 pt-16">\n`;

  for (const block of blocks) {
    if (block.type === 'hero') {
      bodyParts.push(comps.generateHero(block.fields));
      hasHero = true;
      bodyParts.push(openMain);
      continue;
    }

    // If a non-hero block appears but we haven't opened main
    if (!hasHero) {
      bodyParts.push(openMain);
      hasHero = true;
    }

    const compFields = { ...block.fields, _id: block.id };

    switch (block.type) {
      case 'intro':
        bodyParts.push(comps.generateIntro(compFields));
        break;
      case 'text':
        bodyParts.push(comps.generateText(compFields));
        break;
      case 'pullquote':
        bodyParts.push(comps.generatePullquote(compFields));
        break;
      case 'parallax':
      case 'inline-image':
        if (block.fields.size === 'Parallax') {
          bodyParts.push(comps.generateParallaxBreak(compFields));
        } else {
          bodyParts.push(comps.generateInlineImage(compFields));
        }
        break;
      case 'stat-block':
        bodyParts.push(comps.generateStatBlock(compFields));
        break;
      case 'summary-box':
      case 'summary':
        bodyParts.push(comps.generateSummaryBox(compFields));
        break;
      case 'embed':
        bodyParts.push(comps.generateEmbed(compFields));
        break;
      default:
        if (block.fields && (block.fields.text || block.fields.bodyHtml)) {
          bodyParts.push(comps.generateText(compFields));
        }
    }
  }

  if (hasHero) {
    bodyParts.push(`</div>\n</main>`);
  } else if (bodyParts.length > 0) {
    bodyParts.push(`</div>\n</main>`);
  }

  const bodyContent = bodyParts.join('\n\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${seoData.title}</title>
    <meta name="description" content="${seoData.description.replace(/"/g, "&quot;")}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@600;700&family=Open+Sans:wght@700&family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        navy: '#172038',
                        orange: '#FF5F1B',
                        ghost: '#F5F6FF',
                        navylight: '#1a2440'
                    },
                    fontFamily: {
                        plex: ['"IBM Plex Sans"', 'sans-serif'],
                        ptserif: ['"PT Serif"', 'serif'],
                        opensans: ['"Open Sans"', 'sans-serif'],
                    }
                }
            }
        }
    </script>
    <style>
        html { scroll-behavior: smooth; }
        body { background-color: #172038; }
        .drop-cap { float: left; font-family: 'IBM Plex Sans', sans-serif; font-weight: 700; color: #FF5F1B; font-size: 5rem; line-height: 0.8; padding-right: 0.75rem; padding-top: 0.5rem; }
        .parallax-container { clip-path: inset(0); }
        .prose p { margin-bottom: 2rem; }
        .prose a { color: #FF5F1B; text-decoration: underline; text-underline-offset: 4px; font-weight: 700; transition: color 0.3s; }
        .prose a:hover { color: #F5F6FF; }
    </style>
</head>
<body class="bg-navy text-ghost font-ptserif text-lg md:text-[1.125rem] leading-relaxed antialiased overflow-x-hidden">
    ${bodyContent}

    <!-- FOOTER -->
    <footer class="bg-navylight py-20 border-t-4 border-navy clear-both mt-12 relative z-20">
        <div class="max-w-3xl mx-auto px-6 flex flex-col items-center text-center">
            <a href="https://www.rappler.com" target="_blank" class="block mb-8">
                <img src="https://support.rappler.com/assets/logo.16f23012.svg" alt="Rappler" class="h-10 md:h-12 w-auto filter brightness-0 invert" style="filter: brightness(0) invert(1);" />
            </a>
            <p class="font-opensans font-bold tracking-[0.2em] text-orange uppercase text-xl md:text-2xl mb-8">
                FEARLESS REPORTING DELIVERED TO YOU
            </p>
            <a href="https://www.rappler.com/newsletters/" target="_blank" class="font-opensans font-bold uppercase tracking-[0.15em] text-ghost border-2 border-ghost py-3 px-8 hover:bg-ghost hover:text-navy transition-all duration-300 text-sm md:text-base">
                Subscribe to our Newsletters
            </a>
        </div>
    </footer>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
             const parallaxElements = document.querySelectorAll('.parallax-bg');
             const handleScroll = () => {
                 const scrolled = window.scrollY;
                 parallaxElements.forEach(el => {
                     const parent = el.closest('.parallax-container');
                     const parentTop = parent ? parent.offsetTop : 0;
                     const relativeScroll = scrolled - parentTop;
                     el.style.transform = \`translate3d(0, \${relativeScroll * 0.15}px, 0)\`;
                 });
             };
             let ticking = false;
             window.addEventListener('scroll', () => {
                 if (!ticking) {
                     window.requestAnimationFrame(() => {
                         handleScroll();
                         ticking = false;
                     });
                     ticking = true;
                 }
             });
             handleScroll();
        });

        document.addEventListener('click', (e) => {
             const blockEl = e.target.closest('[data-block-id]');
             if (blockEl) {
                 e.preventDefault();
                 const id = blockEl.getAttribute('data-block-id');
                 window.parent.postMessage({ type: 'BLOCK_CLICKED', id }, '*');
             }
        });
    </script>
</body>
</html>`;
}
