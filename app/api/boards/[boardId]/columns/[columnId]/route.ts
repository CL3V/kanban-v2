import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3-service";
import { PermissionService } from "@/lib/PermissionService";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; columnId: string }> }
) {
  try {
    const { boardId, columnId } = await params;
    const body = await request.json();

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

    const existingBoard = await S3Service.getBoard(boardId);
    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Check if user is a member of the board
    const boardMembers = Object.values(existingBoard.members || {});
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

    const columnIndex = existingBoard.columns.findIndex(
      (col) => col.id === columnId
    );
    if (columnIndex === -1) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const updatedColumn = {
      ...existingBoard.columns[columnIndex],
      ...body,
      id: columnId,
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

    const existingBoard = await S3Service.getBoard(boardId);
    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Check if user is a member of the board
    const boardMembers = Object.values(existingBoard.members || {});
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

    const columnIndex = existingBoard.columns.findIndex(
      (col) => col.id === columnId
    );
    if (columnIndex === -1) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const column = existingBoard.columns[columnIndex];

    if (column.taskIds.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete column with tasks. Move or delete tasks first.",
        },
        { status: 400 }
      );
    }

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
