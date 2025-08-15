import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3-service";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; columnId: string }> }
) {
  try {
    const { boardId, columnId } = await params;
    const body = await request.json();

    // Verify board exists
    const existingBoard = await S3Service.getBoard(boardId);
    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Find column
    const columnIndex = existingBoard.columns.findIndex(
      (col) => col.id === columnId
    );
    if (columnIndex === -1) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    // Update column
    const updatedColumn = {
      ...existingBoard.columns[columnIndex],
      ...body,
      id: columnId, // Ensure ID doesn't change
    };

    existingBoard.columns[columnIndex] = updatedColumn;
    existingBoard.updatedAt = new Date().toISOString();

    await S3Service.updateBoard(existingBoard);

    return NextResponse.json(updatedColumn);
  } catch (error) {
    console.error("Error updating column:", error);
    return NextResponse.json(
      { error: "Failed to update column" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; columnId: string }> }
) {
  try {
    const { boardId, columnId } = await params;

    // Verify board exists
    const existingBoard = await S3Service.getBoard(boardId);
    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Find column
    const columnIndex = existingBoard.columns.findIndex(
      (col) => col.id === columnId
    );
    if (columnIndex === -1) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const column = existingBoard.columns[columnIndex];

    // Check if column has tasks
    if (column.taskIds.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete column with tasks. Move or delete tasks first.",
        },
        { status: 400 }
      );
    }

    // Remove column
    existingBoard.columns.splice(columnIndex, 1);
    existingBoard.updatedAt = new Date().toISOString();

    await S3Service.updateBoard(existingBoard);

    return NextResponse.json({ message: "Column deleted successfully" });
  } catch (error) {
    console.error("Error deleting column:", error);
    return NextResponse.json(
      { error: "Failed to delete column" },
      { status: 500 }
    );
  }
}
