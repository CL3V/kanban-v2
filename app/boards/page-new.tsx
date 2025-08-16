// This page has been removed - redirecting to home
"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function BoardsPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/");
  }, [router]);

  return null;
}
