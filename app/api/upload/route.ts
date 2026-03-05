import { NextRequest, NextResponse } from "next/server";
import { extractDocxStructure } from "../../../lib/parser/docx";
import { processDocumentWithAI, generateSEO } from "../../../lib/ai/gemini";
import { SeoContext } from "../../../lib/types/ai";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const maxDuration = 300; // Allow up to 5 minutes for generation of massive documents

async function isValidDocx(buffer: ArrayBuffer): Promise<boolean> {
  if (buffer.byteLength < 2) return false;
  const bytes = new Uint8Array(buffer.slice(0, 2));
  return bytes[0] === 0x50 && bytes[1] === 0x4b; // "PK"
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Could not parse the upload. Please try again." }, { status: 400 });
  }

  const theme = formData.get("theme");

  const docxFile = Array.from(formData.values()).find(
    (v): v is File => v instanceof File && (v.name.toLowerCase().endsWith(".docx") || v.type === DOCX_MIME)
  );

  if (!docxFile) {
    return NextResponse.json({ error: "A .docx file is required." }, { status: 400 });
  }

  const docxBuffer = await docxFile.arrayBuffer();
  if (!(await isValidDocx(docxBuffer))) {
    return NextResponse.json({ error: "Invalid .docx document." }, { status: 400 });
  }

  try {
    console.log("Extracting structure...");
    const parsedDoc = await extractDocxStructure(docxBuffer);

    console.log("Processing with AI...");
    const blocks = await processDocumentWithAI(parsedDoc);

    const seoPayload: SeoContext = {
      h1: parsedDoc.title ?? "Untitled Document",
      h2s: [],
      intro: parsedDoc.paragraphs[0]?.text ?? "",
      documentLengthBlocks: blocks.length,
    };

    console.log("Generating SEO...");
    const seoData = await generateSEO(seoPayload);

    return NextResponse.json({
      ok: true,
      theme: theme as string,
      docx: { name: docxFile.name, size: docxFile.size },
      blocks,
      seoData,
      next: "preflight",
    });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: "Failed to parse document" }, { status: 500 });
  }
}

