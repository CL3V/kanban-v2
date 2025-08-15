import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3-service";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string; memberId: string }> }
) {
  try {
    const { boardId, memberId } = await params;

    // Verify board exists
    const existingBoard = await S3Service.getBoard(boardId);
    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Check if member exists
    if (!existingBoard.members || !existingBoard.members[memberId]) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Remove member from board
    delete existingBoard.members[memberId];

    // Remove member from all tasks
    Object.values(existingBoard.tasks).forEach((task) => {
      if (task.assignee === memberId) {
        task.assignee = undefined;
      }
    });

    existingBoard.updatedAt = new Date().toISOString();

    await S3Service.updateBoard(existingBoard);

    return NextResponse.json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member:", error);
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

    // Verify board exists
    const existingBoard = await S3Service.getBoard(boardId);
    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Check if member exists
    if (!existingBoard.members || !existingBoard.members[memberId]) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Update member
    const updatedMember = {
      ...existingBoard.members[memberId],
      ...body,
      id: memberId, // Ensure ID doesn't change
    };

    existingBoard.members[memberId] = updatedMember;
    existingBoard.updatedAt = new Date().toISOString();

    await S3Service.updateBoard(existingBoard);

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error updating member:", error);
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}
