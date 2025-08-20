import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3-service";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; memberId: string }> }
) {
  try {
    const { boardId, memberId } = await params;

    const existingBoard = await S3Service.getBoard(boardId);
    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    if (!existingBoard.members || !existingBoard.members[memberId]) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    delete existingBoard.members[memberId];

    Object.values(existingBoard.tasks).forEach((task) => {
      if (task.assignee === memberId) {
        task.assignee = undefined;
      }
    });

    existingBoard.updatedAt = new Date().toISOString();

    await S3Service.updateBoard(existingBoard);

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; memberId: string }> }
) {
  try {
    const { boardId, memberId } = await params;
    const body = await request.json();

    const existingBoard = await S3Service.getBoard(boardId);
    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    if (!existingBoard.members || !existingBoard.members[memberId]) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    const updatedMember = {
      ...existingBoard.members[memberId],
      ...body,
      id: memberId,
    };

    existingBoard.members[memberId] = updatedMember;
    existingBoard.updatedAt = new Date().toISOString();

    await S3Service.updateBoard(existingBoard);

    return NextResponse.json(updatedMember);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}
