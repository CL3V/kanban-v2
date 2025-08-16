"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import MemberManagementHome from "@/components/MemberManagementHome";
import { UserAvatar } from "@/components/UserAvatar";
import { ArrowLeft, Users, Settings, Plus, UserPlus } from "lucide-react";
import { Member } from "@/types/kanban";

export default function MembersManagementPage() {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkCurrentUser();
    fetchMembers();
  }, []);

  const checkCurrentUser = () => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  };

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

  // Redirect members to homepage
  useEffect(() => {
    if (!loading && currentUser && currentUser.role === "member") {
      window.location.href = "/";
    }
  }, [currentUser, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser || currentUser.role === "member") {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/">
                <Button variant="outline" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Projects
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Team Management
                  </h1>
                  <p className="text-xs text-gray-500">
                    Manage team members and roles
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UserAvatar
                member={currentUser}
                size="sm"
                showName={false}
                showRole={false}
                className="ring-2 ring-blue-100"
              />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {currentUser.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {currentUser.role.replace("_", " ")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {members.length}
            </div>
            <div className="text-sm text-gray-500">Total Members</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {members.filter((m) => m.role === "member").length}
            </div>
            <div className="text-sm text-gray-500">Team Members</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                <Settings className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {members.filter((m) => m.role === "project_manager").length}
            </div>
            <div className="text-sm text-gray-500">Project Managers</div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                <Plus className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {members.filter((m) => m.role === "admin").length}
            </div>
            <div className="text-sm text-gray-500">Administrators</div>
          </div>
        </div>

        {/* Member Management Component */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Team Member Management
            </h3>
            <p className="text-gray-600">
              Add new team members, update roles, or manage existing member
              configurations.
            </p>
          </div>

          <MemberManagementHome
            onMemberSelect={handleUserSelect}
            currentUser={currentUser}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-8 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <h3 className="text-lg font-bold text-white">Core Kanban</h3>
          </div>
          <p className="text-gray-400 text-sm">
            &copy; 2025 Core Kanban. Team Management Portal.
          </p>
        </div>
      </footer>
    </div>
  );
}
