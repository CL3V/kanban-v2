import { NextRequest, NextResponse } from "next/server";
import { MemberService } from "@/lib/member-service";

// GET /api/members/[memberId] - Get a specific member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const member = await MemberService.getMemberById(memberId);

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error("Error fetching member:", error);
    return NextResponse.json(
      { error: "Failed to fetch member" },
      { status: 500 }
    );
  }
}

// PUT /api/members/[memberId] - Update a member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    const updates = await request.json();

    const updatedMember = await MemberService.updateMember(
      memberId,
      updates
    );

    return NextResponse.json({
      member: updatedMember,
      message: "Member updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating member:", error);

    if (error.message === "Member not found") {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

// DELETE /api/members/[memberId] - Delete a member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    const { memberId } = await params;
    await MemberService.deleteMember(memberId);

    return NextResponse.json({
      message: "Member deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting member:", error);
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 }
    );
  }
}
