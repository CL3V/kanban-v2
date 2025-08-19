import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3-service";
import { UpdateBoardRequest } from "@/types/kanban";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const board = await S3Service.getBoard(boardId);

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error("Error fetching board:", error);
    return NextResponse.json(
      { error: "Failed to fetch board" },
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
    console.log("Updating board:", boardId);

    const body: UpdateBoardRequest = await request.json();
    console.log("Update request body:", body);

    const existingBoard = await S3Service.getBoard(boardId);
    console.log("Existing board found:", !!existingBoard);

    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Validate that the board has required fields
    if (!existingBoard.id) {
      console.error("Existing board missing ID");
      return NextResponse.json(
        { error: "Board data corrupted - missing ID" },
        { status: 500 }
      );
    }

    const updatedBoard = {
      ...existingBoard,
      ...body,
      id: existingBoard.id, // Ensure ID is preserved
      updatedAt: new Date().toISOString(),
    };

    console.log("Prepared updated board:", {
      id: updatedBoard.id,
      title: updatedBoard.title,
      description: updatedBoard.description,
      keys: Object.keys(updatedBoard),
    });

    // Test serialization before sending to S3
    try {
      JSON.stringify(updatedBoard);
      console.log("Board serialization test passed");
    } catch (serError) {
      console.error("Board serialization failed:", serError);
      return NextResponse.json(
        { error: "Board data contains non-serializable content" },
        { status: 400 }
      );
    }

    await S3Service.updateBoard(updatedBoard);
    console.log("Board updated successfully");

    return NextResponse.json(updatedBoard);
  } catch (error) {
    console.error("Error updating board - detailed:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to update board",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    console.log("Updating board:", boardId);

    const body: UpdateBoardRequest = await request.json();
    console.log("Update request body:", body);

    const existingBoard = await S3Service.getBoard(boardId);
    console.log("Existing board found:", !!existingBoard);

    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Validate that the board has required fields
    if (!existingBoard.id) {
      console.error("Existing board missing ID");
      return NextResponse.json(
        { error: "Board data corrupted - missing ID" },
        { status: 500 }
      );
    }

    const updatedBoard = {
      ...existingBoard,
      ...body,
      id: existingBoard.id, // Ensure ID is preserved
      updatedAt: new Date().toISOString(),
    };

    console.log("Prepared updated board:", {
      id: updatedBoard.id,
      title: updatedBoard.title,
      description: updatedBoard.description,
      keys: Object.keys(updatedBoard),
    });

    // Test serialization before sending to S3
    try {
      JSON.stringify(updatedBoard);
      console.log("Board serialization test passed");
    } catch (serError) {
      console.error("Board serialization failed:", serError);
      return NextResponse.json(
        { error: "Board data contains non-serializable content" },
        { status: 400 }
      );
    }

    await S3Service.updateBoard(updatedBoard);
    console.log("Board updated successfully");

    return NextResponse.json(updatedBoard);
  } catch (error) {
    console.error("Error updating board - detailed:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to update board",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const body = await request.json();
    const { boardName } = body;

    // Validate that board name is provided
    if (!boardName || typeof boardName !== "string") {
      return NextResponse.json(
        { error: "Board name is required for deletion confirmation" },
        { status: 400 }
      );
    }

    const existingBoard = await S3Service.getBoard(boardId);

    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Validate that the provided board name matches the actual board title
    if (boardName !== existingBoard.title) {
      return NextResponse.json(
        { error: "Board name does not match. Deletion cancelled." },
        { status: 400 }
      );
    }

    await S3Service.deleteBoard(boardId);

    return NextResponse.json({ message: "Board deleted successfully" });
  } catch (error) {
    console.error("Error deleting board:", error);
    return NextResponse.json(
      { error: "Failed to delete board" },
      { status: 500 }
    );
  }
}
