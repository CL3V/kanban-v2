"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import MemberManagementHome from "@/components/MemberManagementHome";
import { UserAvatar } from "@/components/UserAvatar";
import { ArrowLeft } from "lucide-react";
import { Member } from "@/types/kanban";

export default function MembersManagementPage() {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    setLoading(false);
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const response = await fetch("/api/members");
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const handleUserSelect = (user: Member) => {
    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
  };

  // Redirect basic members back to home
  useEffect(() => {
    if (!loading && currentUser?.role === "member") {
      window.location.href = "/";
    }
  }, [loading, currentUser]);

  if (loading || !currentUser || currentUser.role === "member") return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-base font-semibold text-gray-900">Members</h1>
          </div>
          <div className="flex items-center gap-2">
            <UserAvatar
              member={currentUser}
              size="sm"
              showName={false}
              showRole={false}
            />
            <span className="hidden sm:block text-sm text-gray-600">
              {currentUser.name}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Team Management
              </h2>
              <p className="text-sm text-gray-500">
                Add users and manage roles.
              </p>
            </div>
            <div className="text-sm text-gray-500">Total: {members.length}</div>
          </div>

          <MemberManagementHome
            onMemberSelect={handleUserSelect}
            currentUser={currentUser}
          />
        </div>
      </main>
    </div>
  );
}
