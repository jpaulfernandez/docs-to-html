import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { extractStructuredContent } from "../../../lib/ai/gemini-poc";
import { renderPoCHtml } from "../../../lib/generator/poc-html";

export async function POST(req: NextRequest) {
    let formData: FormData;
    try {
        formData = await req.formData();
    } catch {
        return NextResponse.json({ error: "Could not parse form data." }, { status: 400 });
    }

    const docxFile = formData.get("file") as File | null;
    if (!docxFile) {
        return NextResponse.json({ error: "Missing .docx file." }, { status: 400 });
    }

    if (!docxFile.name.endsWith(".docx")) {
        return NextResponse.json({ error: "Uploaded file is not a .docx file." }, { status: 400 });
    }

    try {
        // Extract raw text from docx
        const arrayBuffer = await docxFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const { value: rawText } = await mammoth.extractRawText({ buffer });

        if (!rawText || rawText.trim() === "") {
            return NextResponse.json({ error: "Could not extract any text from the document." }, { status: 400 });
        }

        // Structure text using AI
        const structuredData = await extractStructuredContent(rawText);

        // Generate HTML
        const html = renderPoCHtml(structuredData);

        return new NextResponse(html, {
            status: 200,
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-store, max-age=0"
            }
        });

    } catch (err: unknown) {
        console.error("Error generating PoC HTML:", err);
        return NextResponse.json({
            error: "Failed to process document: " + (err instanceof Error ? err.message : String(err))
        }, { status: 500 });
    }
}
