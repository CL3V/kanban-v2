import { NextResponse } from "next/server";
import { generateCSRFToken } from "@/lib/csrf";

export async function GET() {
  try {
    const token = await generateCSRFToken();

    return NextResponse.json({
      token,
      message:
        "Include this token in the X-CSRF-Token header for all state-changing requests",
    });
  } catch (error) {
    console.error("Error generating CSRF token:", error);
    return NextResponse.json(
      { error: "An error occurred while generating CSRF token" },
      { status: 500 }
    );
  }
}
