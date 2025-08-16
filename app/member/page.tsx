"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Users,
  ArrowLeft,
  Clock,
  MessageCircle,
  Coffee,
  BookOpen,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { Member } from "@/types/kanban";

export default function MemberDashboard() {
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

  // Redirect non-members back to homepage
  useEffect(() => {
    if (!loading && currentUser && currentUser.role !== "member") {
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

  if (!currentUser || currentUser.role !== "member") {
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
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Member Dashboard
                  </h1>
                  <p className="text-xs text-gray-500">
                    Welcome {currentUser.name}
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="relative mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
              <Users className="h-16 w-16 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>

          <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Waiting for Assignment
          </h2>

          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Your project manager will assign you to projects when ready. In the
            meantime, here's what you can expect and how to prepare.
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {/* Current Status */}
          <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-blue-900 mb-3">
                Current Status
              </h3>
              <p className="text-blue-700 leading-relaxed">
                You're not currently assigned to any projects. Your project
                manager is reviewing upcoming projects and team capacity.
              </p>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-green-900 mb-3">
                What's Next
              </h3>
              <p className="text-green-700 leading-relaxed">
                You'll be notified via email and see projects appear on your
                dashboard once assignments are made.
              </p>
            </div>
          </div>
        </div>

        {/* Information Cards */}
        <div className="space-y-8">
          {/* Helpful Tips */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <MessageCircle className="h-6 w-6 text-blue-500 mr-3" />
              Helpful Tips
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p className="text-gray-700">
                    <strong>Stay Updated:</strong> Check your email regularly
                    for project assignment notifications
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p className="text-gray-700">
                    <strong>Be Proactive:</strong> Reach out to your project
                    manager if you have questions
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p className="text-gray-700">
                    <strong>Prepare:</strong> Review your skills and be ready to
                    contribute when assigned
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p className="text-gray-700">
                    <strong>Stay Engaged:</strong> Participate in team meetings
                    and discussions
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Team Information */}
          {members.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Users className="h-6 w-6 text-green-500 mr-3" />
                Your Team
              </h3>
              <p className="text-gray-600 mb-6">
                You're part of a team of {members.length} professionals. Here's
                who you'll be working with:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {members.slice(0, 12).map((member) => (
                  <div key={member.id} className="text-center group">
                    <UserAvatar
                      member={member}
                      size="lg"
                      showName={false}
                      showRole={false}
                      className="ring-2 ring-gray-200 group-hover:ring-blue-300 transition-all duration-300 mx-auto mb-2"
                    />
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {member.role.replace("_", " ")}
                    </p>
                  </div>
                ))}
              </div>
              {members.length > 12 && (
                <p className="text-center text-gray-500 mt-4">
                  And {members.length - 12} more team members...
                </p>
              )}
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <MessageCircle className="h-6 w-6 text-purple-500 mr-3" />
              Need Help?
            </h3>
            <p className="text-gray-700 mb-6">
              If you have any questions about your assignment status or need
              immediate access to projects, don't hesitate to reach out to your
              project manager.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Project Manager
              </Button>
              <Button variant="outline" className="flex-1">
                <BookOpen className="h-4 w-4 mr-2" />
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-8 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <h3 className="text-lg font-bold text-white">Core Kanban</h3>
          </div>
          <p className="text-gray-400 text-sm">
            &copy; 2025 Core Kanban. Member Dashboard - Stay Connected, Stay
            Ready.
          </p>
        </div>
      </footer>
    </div>
  );
}
