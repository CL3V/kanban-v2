"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/Button";
import MemberManagementHome from "@/components/MemberManagementHome";
import { UserAvatar } from "@/components/UserAvatar";
import { Member } from "@/types/kanban";
import { SkeletonHeader, SkeletonButton } from "@/components/ui/Skeleton";

export default function MembersManagementPage() {
  const [currentUser, setCurrentUser] = React.useState<Member | null>(null);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [membersLoading, setMembersLoading] = React.useState(true);

  React.useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
    setLoading(false);
    fetchMembers();

    document.title = "Members | Juke";
  }, []);

  const fetchMembers = async () => {
    try {
      setMembersLoading(true);
      const response = await fetch("/api/members");
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleUserSelect = (user: Member) => {
    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
  };

  React.useEffect(() => {
    if (!loading && currentUser?.role === "member") {
      window.location.href = "/";
    }
  }, [loading, currentUser]);

  if (!currentUser || currentUser.role === "member") return null;

  if (membersLoading) {
    return (
      <div className="min-h-screen bg-white">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/images/juke-logo.svg"
                alt="Juke Logo"
                width={28}
                height={28}
                className="rounded-sm"
                priority
              />
              <h1 className="text-sm sm:text-base font-semibold text-gray-900">
                Members
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <UserAvatar
                member={currentUser}
                size="sm"
                showName={false}
                showRole={false}
              />
              <div className="text-sm">
                <div className="font-medium text-gray-900 leading-4">
                  {currentUser.name}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {currentUser.role.replace("_", " ")}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="border-gray-200 hover:border-gray-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <SkeletonHeader className="w-40 mb-2" />
                <div className="w-48 h-4 bg-gray-200 rounded animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
              </div>
              <div className="w-16 h-4 bg-gray-200 rounded animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
            </div>

            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
                    <div>
                      <div className="w-24 h-4 bg-gray-200 rounded mb-1 animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
                      <div className="w-16 h-3 bg-gray-200 rounded animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <SkeletonButton className="w-16" />
                    <SkeletonButton className="w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/images/juke-logo.svg"
              alt="Juke Logo"
              width={28}
              height={28}
              className="rounded-sm"
              priority
            />
            <h1 className="text-lg font-medium text-gray-900">Members</h1>
          </div>
          <div className="flex items-center gap-2">
            <UserAvatar
              member={currentUser}
              size="sm"
              showName={false}
              showRole={false}
            />
            <div className="text-sm">
              <div className="font-medium text-gray-900 leading-4">
                {currentUser.name}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {currentUser.role.replace("_", " ")}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-200 hover:border-gray-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                Team Management
              </h3>
              <p className="text-gray-600 mt-1">Add users and manage roles.</p>
            </div>
            <div className="text-sm font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
              {members.length} {members.length === 1 ? "member" : "members"}
            </div>
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
