import { NextResponse } from 'next/server';
import { assembleHtml } from '@/lib/generator/assemble';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const html = assembleHtml({
            blocks: body.blocks || [],
            seoData: body.seoData,
            docName: body.docx?.name
        });

        return NextResponse.json({ ok: true, html });
    } catch (err: unknown) {
        console.error("HTML Generation error:", err);
        return NextResponse.json(
            { ok: false, error: err instanceof Error ? err.message : "Unknown Error" },
            { status: 500 }
        );
    }
}
