import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const { columnIds } = await request.json();

    if (!columnIds || !Array.isArray(columnIds)) {
      return NextResponse.json(
        { error: "Column IDs array is required" },
        { status: 400 }
      );
    }

    const board = await S3Service.getBoard(boardId);
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const existingColumnIds = board.columns.map((col) => col.id);
    const validColumnIds = columnIds.filter((id) =>
      existingColumnIds.includes(id)
    );

    if (validColumnIds.length !== board.columns.length) {
      return NextResponse.json(
        { error: "Invalid column IDs provided" },
        { status: 400 }
      );
    }

    const reorderedColumns = validColumnIds.map(
      (id) => board.columns.find((col) => col.id === id)!
    );

    const updatedBoard = {
      ...board,
      columns: reorderedColumns,
      updatedAt: new Date().toISOString(),
    };

    await S3Service.updateBoard(updatedBoard);

    return NextResponse.json({ message: "Columns reordered successfully" });
  } catch (error) {
    console.error("Error reordering columns:", error);
    return NextResponse.json(
      { error: "Failed to reorder columns" },
      { status: 500 }
    );
  }
}
