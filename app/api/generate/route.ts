import { NextRequest, NextResponse } from "next/server";
import { assembleHtml } from "../../../lib/generator/assemble";
import { PreflightResult } from "../../../lib/types/parser";
import { Theme } from "../../../lib/generator/themes";

export async function POST(req: NextRequest) {
    try {
        const body: PreflightResult = await req.json();

        if (!body.blocks || !body.seoData || !body.theme) {
            return NextResponse.json(
                { error: "Missing required fields: blocks, seoData, theme." },
                { status: 400 }
            );
        }

        const html = assembleHtml({
            blocks: body.blocks,
            csvData: body.csvData ?? {},
            classification: body.classification ?? [],
            seoData: body.seoData,
            theme: body.theme as Theme,
            docName: body.docx?.name,
        });

        return NextResponse.json({ ok: true, html });
    } catch (err: unknown) {
        console.error("Error in /api/generate:", err);
        return NextResponse.json(
            { error: "Failed to generate microsite: " + (err instanceof Error ? err.message : String(err)) },
            { status: 500 }
        );
    }
}
