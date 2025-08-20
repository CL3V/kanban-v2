import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3-service";
import {
  validateBoardId,
  updateBoardSchema,
  validateRequestSize,
  sanitizeHtml,
} from "@/lib/validation";
import { z } from "zod";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;

    const validatedBoardId = validateBoardId(boardId);

    const board = await S3Service.getBoard(validatedBoardId);

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json(board);
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid board ID") {
      return NextResponse.json(
        { error: "Invalid board ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "An error occurred while fetching the board" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const validatedBoardId = validateBoardId(boardId);
    const body = await request.json();

    validateRequestSize(body, 2048);

    const validationResult = updateBoardSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    const existingBoard = await S3Service.getBoard(validatedBoardId);

    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    if (!existingBoard.id) {
      return NextResponse.json(
        { error: "Board data corrupted" },
        { status: 500 }
      );
    }

    const sanitizedData = {
      ...validatedData,
      title: validatedData.title
        ? sanitizeHtml(validatedData.title)
        : undefined,
      description: validatedData.description
        ? sanitizeHtml(validatedData.description)
        : undefined,
    };

    const updatedBoard = {
      ...existingBoard,
      ...sanitizedData,
      id: existingBoard.id,
      updatedAt: new Date().toISOString(),
    };

    try {
      JSON.stringify(updatedBoard);
    } catch (serError) {
      return NextResponse.json(
        { error: "Board data contains invalid content" },
        { status: 400 }
      );
    }

    await S3Service.updateBoard(updatedBoard);

    return NextResponse.json(updatedBoard);
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid board ID") {
      return NextResponse.json(
        { error: "Invalid board ID format" },
        { status: 400 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message.includes("Request body too large")
    ) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }

    return NextResponse.json(
      { error: "An error occurred while updating the board" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  return PUT(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;

    const validatedBoardId = validateBoardId(boardId);

    const body = await request.json();

    const deleteSchema = z.object({
      boardName: z.string().min(1, "Board name is required"),
    });

    const validationResult = deleteSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Board name is required for deletion confirmation" },
        { status: 400 }
      );
    }

    const existingBoard = await S3Service.getBoard(validatedBoardId);

    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    if (validationResult.data.boardName !== existingBoard.title) {
      return NextResponse.json(
        { error: "Board name does not match. Deletion cancelled." },
        { status: 400 }
      );
    }

    await S3Service.deleteBoard(validatedBoardId);

    return NextResponse.json({ message: "Board deleted successfully" });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid board ID") {
      return NextResponse.json(
        { error: "Invalid board ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "An error occurred while deleting the board" },
      { status: 500 }
    );
  }
}
