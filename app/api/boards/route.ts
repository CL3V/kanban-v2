import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3-service";
import { Board, CreateBoardRequest, TaskStatus } from "@/types/kanban";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const boards = await S3Service.getAllBoards();
    return NextResponse.json(boards);
  } catch (error) {
    console.error("Error fetching boards:", error);
    return NextResponse.json(
      { error: "Failed to fetch boards" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateBoardRequest = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const boardId = uuidv4();
    const now = new Date().toISOString();

    const defaultColumns = [
      {
        id: uuidv4(),
        title: "TO DO",
        status: "todo" as TaskStatus,
        taskIds: [],
        color: "#6b7280",
      },
      {
        id: uuidv4(),
        title: "IN PROGRESS",
        status: "in-progress" as TaskStatus,
        taskIds: [],
        color: "#3b82f6",
      },
      {
        id: uuidv4(),
        title: "IN REVIEW",
        status: "in-review" as TaskStatus,
        taskIds: [],
        color: "#f59e0b",
      },
      {
        id: uuidv4(),
        title: "DONE",
        status: "done" as TaskStatus,
        taskIds: [],
        color: "#10b981",
      },
    ];

    // Start with empty members - users will add them manually
    const defaultMembers = {};

    const newBoard: Board = {
      id: boardId,
      title: body.title,
      description: body.description,
      columns: defaultColumns,
      tasks: {},
      members: defaultMembers,
      createdAt: now,
      updatedAt: now,
      settings: {
        allowPriorityChange: true,
        allowStatusChange: true,
        enableWipLimits: false,
        enableTimeTracking: true,
        ...body.settings,
      },
    };

    await S3Service.createBoard(newBoard);

    return NextResponse.json(newBoard, { status: 201 });
  } catch (error) {
    console.error("Error creating board:", error);
    return NextResponse.json(
      { error: "Failed to create board" },
      { status: 500 }
    );
  }
}
