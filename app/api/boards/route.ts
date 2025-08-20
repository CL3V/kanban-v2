import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3-service";
import { Board, TaskStatus } from "@/types/kanban";
import { v4 as uuidv4 } from "uuid";
import {
  createBoardSchema,
  validateRequestSize,
  sanitizeHtml,
} from "@/lib/validation";
import { z } from "zod";

export async function GET() {
  try {
    const boards = await S3Service.getAllBoards();
    return NextResponse.json(boards);
  } catch (error) {
    return NextResponse.json(
      { error: "An error occurred while fetching boards" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    validateRequestSize(body, 512);

    const validationResult = createBoardSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

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

    const defaultMembers = {};

    const newBoard: Board = {
      id: boardId,
      title: sanitizeHtml(validatedData.title),
      description: validatedData.description
        ? sanitizeHtml(validatedData.description)
        : undefined,
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
        ...validatedData.settings,
      },
    };

    await S3Service.createBoard(newBoard);

    return NextResponse.json(newBoard, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "An error occurred while creating the board" },
      { status: 500 }
    );
  }
}
