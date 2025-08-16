import { NextRequest, NextResponse } from "next/server";
import { MemberService } from "@/lib/member-service";
import { Member } from "@/types/kanban";

// GET /api/members - Get all global members
export async function GET() {
  try {
    const members = await MemberService.getAllMembers();
    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

// POST /api/members - Add a new member
export async function POST(request: NextRequest) {
  try {
    const memberData = await request.json();

    // Validate required fields
    if (!memberData.name || !memberData.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const newMember = await MemberService.addMember(memberData);

    return NextResponse.json(
      { member: newMember, message: "Member added successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding member:", error);

    if (error.message === "Member with this email already exists") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Failed to add member" },
      { status: 500 }
    );
  }
}
