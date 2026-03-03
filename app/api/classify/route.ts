import { NextRequest, NextResponse } from "next/server";
import { classifyBlocks } from "../../../lib/ai/gemini";
import { ClassificationContext } from "../../../lib/types/ai";

export async function POST(req: NextRequest) {
    try {
        const blocks: ClassificationContext[] = await req.json();

        if (!Array.isArray(blocks) || blocks.length === 0) {
            return NextResponse.json(
                { error: "Invalid input: expected an array of blocks." },
                { status: 400 }
            );
        }

        const classification = await classifyBlocks(blocks);

        return NextResponse.json({ classification });
    } catch (err: unknown) {
        console.error("Error in /api/classify:", err);
        return NextResponse.json(
            { error: "Failed to classify blocks." },
            { status: 500 }
        );
    }
}
