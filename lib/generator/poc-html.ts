import { PoCStructuredData } from "../ai/gemini-poc";

export function renderPoCHtml(data: PoCStructuredData): string {
    const defaultHeroImg = "https://www.rappler.com/tachyon/2023/08/Spy-vs-Spy.jpg";
    const defaultPlImg = "https://www.rappler.com/tachyon/2024/08/CHINESE-SPY.jpg?resize=1280%2C720&zoom=1";

    const summaryHtml = data.summary.map(item => `
                    <li class="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2.5 before:w-2 before:h-2 before:bg-orange before:rounded-full">
                        ${item}
                    </li>
    `).join("");

    let contentHtml = "";
    let isFirstParagraph = true;

    for (const block of data.content_blocks) {
        if (block.type === "paragraph") {
            if (isFirstParagraph && block.text) {
                const firstLetter = block.text.charAt(0);
                const rest = block.text.slice(1);
                contentHtml += `
            <p class="mb-8">
                <span class="drop-cap">${firstLetter}</span>${rest}
            </p>`;
                isFirstParagraph = false;
            } else {
                contentHtml += `
            <p class="mb-8">
                ${block.text}
            </p>`;
            }
        } else if (block.type === "subheading") {
            contentHtml += `
            <h2 class="font-plex font-bold text-3xl md:text-4xl text-ghost mb-8 mt-16 tracking-tight">
                ${block.text}
            </h2>`;
        } else if (block.type === "pullquote") {
            if (block.style === "center") {
                contentHtml += `
            <div class="my-16 py-10 border-y-2 border-orange border-opacity-60 clear-both text-center max-w-2xl mx-auto px-4 relative">
                <span class="absolute -top-6 left-1/2 transform -translate-x-1/2 text-orange font-plex text-6xl leading-none">"</span>
                <p class="font-ptserif italic text-3xl md:text-4xl text-ghost leading-snug">
                    ${block.text}
                </p>
            </div>`;
            } else {
                contentHtml += `
            <aside class="w-full md:w-1/2 md:float-right md:ml-8 mb-8 mt-4 border-l-4 border-orange pl-6 py-2 clear-right">
                <p class="font-ptserif italic text-2xl md:text-[1.75rem] text-ghost leading-tight">
                    "${block.text}"
                </p>
            </aside>`;
            }
        } else if (block.type === "image_full_width") {
            const imgUrl = block.url || defaultPlImg;
            const caption = block.caption || "";

            contentHtml += `
        </div> <!-- End text column -->

        <div class="relative w-full h-[60vh] min-h-[400px] my-8 overflow-hidden parallax-container border-y border-navy shadow-xl bg-navy clear-both">
            <div class="parallax-bg absolute left-0 -top-[10%] w-full h-[120%] bg-cover bg-center"
                style="background-image: url('${imgUrl}');">
            </div>
            <div class="absolute inset-0 bg-[#172038] bg-opacity-40"></div>
        </div>

        <div class="w-full max-w-3xl mx-auto px-6 mb-16 clear-both">
            <figcaption class="font-opensans tracking-[0.1em] text-sm text-ghost/70 uppercase border-l border-orange pl-3">
                ${caption}
            </figcaption>
        </div>

        <!-- RE-OPEN TEXT COLUMN -->
        <div class="w-full max-w-3xl mx-auto px-6">`;
        } else if (block.type === "emphasis") {
            contentHtml += `
            <p class="mb-8 font-bold">
                ${block.text}
            </p>`;
        }
    }


    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.hero.title} | Generated PoC</title>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@600;700&family=Open+Sans:wght@700&family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">

    <!-- Tailwind CSS -->
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
        .drop-cap {
            float: left;
            font-family: 'IBM Plex Sans', sans-serif;
            font-weight: 700;
            color: #FF5F1B;
            font-size: 5rem;
            line-height: 0.8;
            padding-right: 0.75rem;
            padding-top: 0.5rem;
        }
        .parallax-container { clip-path: inset(0); }
    </style>
</head>

<body class="bg-navy text-ghost font-ptserif text-lg md:text-[1.125rem] leading-relaxed antialiased overflow-x-hidden">

    <!-- HERO BANNER / PARALLAX HEADER -->
    <header class="relative w-full h-[85vh] min-h-[600px] flex items-end justify-center overflow-hidden parallax-container bg-navy">
        <div class="parallax-bg absolute left-0 -top-[10%] w-full h-[120%] bg-cover bg-center"
            style="background-image: url('${data.hero.background_image_url || defaultHeroImg}');"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-[#17203833] to-[#172038E6]"></div>
        <div class="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-navy to-transparent pointer-events-none z-[5]"></div>

        <div class="relative z-10 w-full max-w-3xl px-6 py-16 mx-auto">
            <span class="block font-opensans font-bold tracking-[0.2em] text-orange uppercase mb-4 text-sm md:text-base">
                EXCLUSIVE
            </span>
            <h1 class="font-plex font-bold text-4xl md:text-5xl lg:text-6xl text-ghost leading-tight mb-6 drop-shadow-lg">
                ${data.hero.title}
            </h1>
            <p class="font-ptserif text-xl md:text-2xl text-ghost/90 mb-8 max-w-2xl drop-shadow-md">
                ${data.hero.subtitle}
            </p>
            <div class="font-opensans font-bold tracking-[0.15em] text-orange uppercase text-sm flex items-center gap-2">
                <span>BY</span>
                <span class="text-ghost">${data.hero.author || "Guest Author"}</span>
            </div>
        </div>
    </header>

    <main class="w-full pb-20">
        <div class="w-full max-w-3xl mx-auto px-6 pt-16">
            
            ${data.summary && data.summary.length > 0 ? `
            <!-- SUMMARY BOX -->
            <div class="bg-navylight border-t-4 border-orange p-6 md:p-8 mb-16 shadow-lg clear-both">
                <h2 class="font-opensans font-bold tracking-[0.15em] text-orange uppercase mb-6 text-lg">IN SUMMARY</h2>
                <ul class="list-none space-y-4 font-ptserif text-ghost text-base md:text-lg">
                    ${summaryHtml}
                </ul>
            </div>` : ""}

            ${contentHtml}

        </div> <!-- End Max-w-3xl block -->
    </main>

    <footer class="bg-navylight py-20 border-t-4 border-navy clear-both mt-12 relative z-20">
        <div class="max-w-3xl mx-auto px-6 flex flex-col items-center text-center">
            <p class="font-opensans font-bold tracking-[0.2em] text-orange uppercase text-xl md:text-2xl mb-8">
                GENERATED MICRO-SITE POC
            </p>
        </div>
    </footer>

    <!-- Parallax Script -->
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
    </script>
</body>
</html>`;
}
