import { NextRequest, NextResponse } from "next/server";
import { MemberService } from "@/lib/member-service";
import {
  memberSchema,
  validateRequestSize,
  sanitizeHtml,
} from "@/lib/validation";
import { z } from "zod";

export async function GET() {
  try {
    const members = await MemberService.getAllMembers();
    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching members" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    validateRequestSize(body, 64);

    const validationResult = memberSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;

    const sanitizedData = {
      ...validatedData,
      name: sanitizeHtml(validatedData.name),
      email: validatedData.email.toLowerCase().trim(), // Normalize email
    };

    const newMember = await MemberService.addMember(sanitizedData);

    return NextResponse.json(
      { member: newMember, message: "Member added successfully" },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "Member with this email already exists") {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 }
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
      { error: "An error occurred while adding the member" },
      { status: 500 }
    );
  }
}
