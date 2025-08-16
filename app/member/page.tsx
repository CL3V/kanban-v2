import { redirect } from "next/navigation";

// This route is deprecated. Immediately redirect to the main dashboard.
export default function MemberPage() {
  redirect("/");
}
