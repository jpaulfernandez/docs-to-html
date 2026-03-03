import { NextRequest, NextResponse } from "next/server";
import { generateSEO } from "../../../lib/ai/gemini";
import { SeoContext } from "../../../lib/types/ai";

export async function POST(req: NextRequest) {
    try {
        const context: SeoContext = await req.json();

        if (!context || typeof context.h1 !== "string" || !Array.isArray(context.h2s) || typeof context.intro !== "string" || typeof context.documentLengthBlocks !== "number") {
            return NextResponse.json(
                { error: "Invalid input: expected a valid SeoContext object." },
                { status: 400 }
            );
        }

        const seoData = await generateSEO(context);

        return NextResponse.json({ seoData });
    } catch (err: unknown) {
        console.error("Error in /api/seo:", err);
        return NextResponse.json(
            { error: "Failed to generate SEO data." },
            { status: 500 }
        );
    }
}
