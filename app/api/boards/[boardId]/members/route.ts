import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3-service";
import { MemberService } from "@/lib/member-service";
import { Member } from "@/types/kanban";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ boardId: string }> }
) {
  try {
    const { boardId } = await params;
    const body = await request.json();

    const existingBoard = await S3Service.getBoard(boardId);
    if (!existingBoard) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    if (body.memberId) {
      const globalMembers = await MemberService.getAllMembers();
      const member = globalMembers.find((m: Member) => m.id === body.memberId);

      if (!member) {
        return NextResponse.json(
          { error: "Member not found" },
          { status: 404 }
        );
      }

      if (existingBoard.members && existingBoard.members[body.memberId]) {
        return NextResponse.json(
          { error: "Member is already in this board" },
          { status: 400 }
        );
      }

      if (!existingBoard.members) {
        existingBoard.members = {};
      }
      existingBoard.members[body.memberId] = member;
      existingBoard.updatedAt = new Date().toISOString();

      await S3Service.updateBoard(existingBoard);

      return NextResponse.json(member, { status: 201 });
    }

    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const memberId = uuidv4();
    const colors = [
      "#8B5CF6",
      "#EC4899",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#3B82F6",
      "#6366F1",
      "#8B5A2B",
      "#06B6D4",
      "#84CC16",
    ];

    const usedColors = Object.values(existingBoard.members || {}).map(
      (m) => m.color
    );
    const availableColors = colors.filter(
      (color) => !usedColors.includes(color)
    );
    const selectedColor =
      availableColors.length > 0
        ? availableColors[0]
        : colors[Math.floor(Math.random() * colors.length)];

    const newMember: Member = {
      id: memberId,
      name: body.name,
      email: body.email,
      role: body.role || "member",
      color: selectedColor,
    };

    if (!existingBoard.members) {
      existingBoard.members = {};
    }
    existingBoard.members[memberId] = newMember;
    existingBoard.updatedAt = new Date().toISOString();

    await S3Service.updateBoard(existingBoard);

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}
