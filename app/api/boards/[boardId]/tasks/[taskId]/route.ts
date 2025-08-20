import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3-service";
import { UpdateTaskRequest } from "@/types/kanban";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; taskId: string }> }
) {
  try {
    const { boardId, taskId } = await params;
    const task = await S3Service.getTask(boardId, taskId);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; taskId: string }> }
) {
  try {
    const { boardId, taskId } = await params;
    const body: UpdateTaskRequest = await request.json();

    await S3Service.updateTask(boardId, taskId, body);

    const updatedTask = await S3Service.getTask(boardId, taskId);

    return NextResponse.json(updatedTask);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; taskId: string }> }
) {
  try {
    const { boardId, taskId } = await params;
    const existingTask = await S3Service.getTask(boardId, taskId);

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await S3Service.deleteTask(boardId, taskId);

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
