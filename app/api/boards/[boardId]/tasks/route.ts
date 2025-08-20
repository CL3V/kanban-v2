import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { S3Service } from "@/lib/s3-service";

import {
  validateBoardId,
  createTaskSchema,
  validateRequestSize,
  sanitizeHtml,
} from "@/lib/validation";
import { Task } from "@/types/kanban";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;

    const validatedBoardId = validateBoardId(boardId);

    const body = await request.json();

    validateRequestSize(body, 256);

    const validationResult = createTaskSchema.safeParse(body);
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

    const taskId = uuidv4();
    const now = new Date().toISOString();

    const requestedStatus = validatedData.status;
    const hasRequestedColumn = requestedStatus
      ? existingBoard.columns?.some((c) => c.status === requestedStatus)
      : false;

    const defaultStatus = existingBoard.columns?.[0]?.status || "todo";

    const newTask: Task = {
      id: taskId,
      title: sanitizeHtml(validatedData.title),
      description: validatedData.description
        ? sanitizeHtml(validatedData.description)
        : undefined,
      status: hasRequestedColumn
        ? (requestedStatus as any)
        : (defaultStatus as any),
      priority: validatedData.priority ?? "low",
      assignee: validatedData.assignee,
      reporter: "Current User",
      createdAt: now,
      updatedAt: now,
      dueDate: validatedData.dueDate,
      tags: validatedData.tags?.map((tag) => sanitizeHtml(tag)) || [],
      attachments: [],
      comments: [],
      estimatedHours: validatedData.estimatedHours,
    };

    await S3Service.createTask(validatedBoardId, newTask);

    return NextResponse.json(newTask, { status: 201 });
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
      { error: "An error occurred while creating the task" },
      { status: 500 }
    );
  }
}
