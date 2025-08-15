import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3-service";
import { Task, CreateTaskRequest } from "@/types/kanban";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const body: CreateTaskRequest = await request.json();

    if (!body.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Verify board exists
    const existingBoard = await S3Service.getBoard(boardId);
    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const taskId = uuidv4();
    const now = new Date().toISOString();

    const newTask: Task = {
      id: taskId,
      title: body.title,
      description: body.description,
      status: "backlog", // Use default first column status
      priority: body.priority,
      assignee: body.assignee,
      reporter: "Current User", // In a real app, this would come from authentication
      createdAt: now,
      updatedAt: now,
      dueDate: body.dueDate,
      tags: body.tags || [],
      attachments: [],
      comments: [],
      estimatedHours: body.estimatedHours,
    };

    await S3Service.createTask(boardId, newTask);

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
