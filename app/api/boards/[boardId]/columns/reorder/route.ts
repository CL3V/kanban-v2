import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3-service";
import { PermissionService } from "@/lib/PermissionService";

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

    // Get current user from request headers
    const currentUserHeader = request.headers.get("x-current-user");
    if (!currentUserHeader) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    let currentUser;
    try {
      currentUser = JSON.parse(currentUserHeader);
    } catch (error) {
      return NextResponse.json({ error: "Invalid user data" }, { status: 400 });
    }

    if (!currentUser || !currentUser.id) {
      return NextResponse.json(
        { error: "Valid user required" },
        { status: 401 }
      );
    }

    const board = await S3Service.getBoard(boardId);
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Check if user is a member of the board
    const boardMembers = Object.values(board.members || {});
    const userIsMember = boardMembers.some(
      (member) => member.id === currentUser.id
    );

    if (!userIsMember) {
      return NextResponse.json(
        { error: "You don't have access to this board" },
        { status: 403 }
      );
    }

    // Check if user has permission to manage columns
    if (!PermissionService.canManageColumns(currentUser)) {
      return NextResponse.json(
        { error: "You don't have permission to manage columns" },
        { status: 403 }
      );
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
