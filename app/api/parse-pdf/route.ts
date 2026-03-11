import { PDFParse } from "pdf-parse";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return Response.json(
        { error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    const parser = new PDFParse({ data });
    const result = await parser.getText();

    if (!result.text || result.text.trim().length === 0) {
      return Response.json(
        {
          error:
            "Could not extract text from the PDF. It may be image-based or empty.",
        },
        { status: 422 }
      );
    }

    return Response.json({
      text: result.text,
      pages: result.total,
    });
  } catch (error: unknown) {
    console.error("PDF parse error:", error);
    return Response.json(
      {
        error:
          "Failed to parse PDF. The file may be corrupted or password-protected.",
      },
      { status: 500 }
    );
  }
}
