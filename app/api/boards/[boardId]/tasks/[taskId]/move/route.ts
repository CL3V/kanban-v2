import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; taskId: string }> }
) {
  try {
    const { boardId, taskId } = await params;
    const body = await request.json();
    const { newStatus, newPosition } = body;

    if (!newStatus) {
      return NextResponse.json(
        { error: "newStatus is required" },
        { status: 400 }
      );
    }

    await S3Service.moveTask(boardId, taskId, newStatus, newPosition);

    const updatedTask = await S3Service.getTask(boardId, taskId);

    return NextResponse.json(updatedTask);
  } catch (error) {
    return NextResponse.json({ error: "Failed to move task" }, { status: 500 });
  }
}
