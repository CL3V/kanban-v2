import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3-service";
import { Column } from "@/types/kanban";
import { PermissionService } from "@/lib/PermissionService";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const body = await request.json();

    if (!body.title || !body.status) {
      return NextResponse.json(
        { error: "Title and status are required" },
        { status: 400 }
      );
    }

    // Get current user from request headers (assuming it's passed from frontend)
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

    const statusExists = existingBoard.columns.some(
      (col) => col.status === body.status
    );
    if (statusExists) {
      return NextResponse.json(
        { error: "A column with this status already exists" },
        { status: 400 }
      );
    }

    const columnId = uuidv4();
    const colors = [
      "#ef4444",
      "#f59e0b",
      "#eab308",
      "#84cc16",
      "#22c55e",
      "#10b981",
      "#06b6d4",
      "#3b82f6",
      "#6366f1",
      "#8b5cf6",
      "#a855f7",
      "#d946ef",
      "#ec4899",
      "#f43f5e",
    ];

    const usedColors = existingBoard.columns.map((col) => col.color);
    const availableColors = colors.filter(
      (color) => !usedColors.includes(color)
    );

    let selectedColor = body.color;
    if (!selectedColor) {
      selectedColor =
        availableColors.length > 0
          ? availableColors[0]
          : colors[Math.floor(Math.random() * colors.length)];
    }

    const newColumn: Column = {
      id: columnId,
      title: body.title,
      status: body.status,
      taskIds: [],
      color: selectedColor,
      wipLimit: body.wipLimit,
    };

    existingBoard.columns.push(newColumn);
    existingBoard.updatedAt = new Date().toISOString();

    await S3Service.updateBoard(existingBoard);

    return NextResponse.json(newColumn, { status: 201 });
  } catch (error) {
    console.error("Error adding column:", error);
    return NextResponse.json(
      { error: "Failed to add column" },
      { status: 500 }
    );
  }
}
