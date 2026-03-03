import { NextRequest, NextResponse } from "next/server";
import {
  parseDocxBlocks,
  extractAnnotations,
  mapHeuristicArchetypes,
  parseCsvData,
  validateAnnotations,
} from "../../../lib/parser/docx";
import { classifyBlocks, generateSEO } from "../../../lib/ai/gemini";
import { extractStructuredContent } from "../../../lib/ai/gemini-poc";
import { convertPoCToBlocks } from "../../../lib/parser/bridge";
import { ClassificationContext } from "../../../lib/types/ai";
import { SeoContext } from "../../../lib/types/ai";
import mammoth from "mammoth";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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
    return NextResponse.json(
      { error: "Could not parse the upload. Please try again." },
      { status: 400 }
    );
  }

  const theme = formData.get("theme");
  const validThemes = ["light", "dark", "orange"];
  if (!theme || !validThemes.includes(theme as string)) {
    return NextResponse.json(
      { error: "A valid theme (light, dark, or orange) is required." },
      { status: 400 }
    );
  }

  // Collect all file entries
  const docxFiles: File[] = [];
  const csvFiles: File[] = [];
  const unknownFiles: string[] = [];

  for (const [, value] of Array.from(formData.entries())) {
    if (!(value instanceof File)) continue;
    const name = value.name.toLowerCase();
    const mime = value.type;

    if (name.endsWith(".docx") || mime === DOCX_MIME) {
      docxFiles.push(value);
    } else if (
      name.endsWith(".csv") ||
      mime === "text/csv" ||
      mime === "application/csv"
    ) {
      csvFiles.push(value);
    } else {
      unknownFiles.push(value.name);
    }
  }

  if (unknownFiles.length > 0) {
    return NextResponse.json(
      {
        error: `Unsupported file type(s): ${unknownFiles.join(", ")}. Only .docx and .csv files are accepted.`,
      },
      { status: 400 }
    );
  }

  if (docxFiles.length === 0) {
    return NextResponse.json(
      { error: "A .docx file is required." },
      { status: 400 }
    );
  }

  if (docxFiles.length > 1) {
    return NextResponse.json(
      { error: "Only one .docx file is allowed per session." },
      { status: 400 }
    );
  }

  // Server-side MIME verification (magic bytes)
  const docxBuffer = await docxFiles[0].arrayBuffer();
  const validDocx = await isValidDocx(docxBuffer);
  if (!validDocx) {
    return NextResponse.json(
      {
        error:
          "This file doesn't appear to be a valid .docx document. Please export your Google Doc as a .docx and try again.",
      },
      { status: 400 }
    );
  }

  // All checks passed — hand off to the parsing pipeline (Epic 02).
  try {
    let blocks = await parseDocxBlocks(docxBuffer);
    await extractAnnotations(docxBuffer, blocks);
    mapHeuristicArchetypes(blocks);

    const hasAnnotations = blocks.some(b => b.annotations.length > 0);

    // AI MAGIC FALLBACK: If the user didn't write any annotations, use the new unstructured Gemini PoC
    if (!hasAnnotations) {
      console.log("No annotations detected. Using Gemini AI structure extraction...");
      const { value: rawText } = await mammoth.extractRawText({ buffer: Buffer.from(docxBuffer) });
      console.log(`Extracted raw text from DOCX: ${rawText.length} characters.`);
      console.time("Gemini API structure extraction");
      const structuredData = await extractStructuredContent(rawText);
      console.timeEnd("Gemini API structure extraction");
      blocks = convertPoCToBlocks(structuredData);
      console.log(`Converted PoC structured data to ${blocks.length} blocks.`);
    }

    const csvData = await parseCsvData(csvFiles);

    // Epic 04: Validation (async — HEAD-checks image URLs, validates CSV refs)
    console.log("Validating annotations...");
    const { warnings: validationWarnings, errors: validationErrors } =
      await validateAnnotations(blocks, csvData);

    // Epic 03: AI classification & SEO (run in parallel)
    const classificationPayload: ClassificationContext[] = blocks.map((b) => ({
      blockIndex: b.index,
      type: b.type,
      content: b.content.slice(0, 200),
      hasAnnotations: b.annotations.length > 0,
    }));

    const h1Block = blocks.find((b) => b.type === "heading1");
    const h2Blocks = blocks.filter((b) => b.type === "heading2");
    const introParagraph = blocks.find(
      (b) => b.type === "paragraph" && b.content.trim().length > 0
    );
    const seoPayload: SeoContext = {
      h1: h1Block?.content ?? "",
      h2s: h2Blocks.map((b) => b.content),
      intro: introParagraph?.content.slice(0, 400) ?? "",
      documentLengthBlocks: blocks.length,
    };

    console.log("Starting classification and SEO generation...");
    console.time("Gemini layout classification & SEO");
    const [classification, seoData] = await Promise.all([
      classifyBlocks(classificationPayload),
      generateSEO(seoPayload),
    ]);
    console.timeEnd("Gemini layout classification & SEO");

    return NextResponse.json({
      ok: true,
      theme,
      docx: {
        name: docxFiles[0].name,
        size: docxFiles[0].size,
      },
      csvFiles: csvFiles.map((f) => ({ name: f.name, size: f.size })),
      blocks,
      csvData,
      validationWarnings,
      validationErrors,
      classification,
      seoData,
      next: "preflight",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        error:
          "Failed to parse document: " +
          (err instanceof Error ? err.message : String(err)),
      },
      { status: 500 }
    );
  }
}
