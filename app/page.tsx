"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { UserSelector } from "@/components/UserSelector";
import { UserAvatar } from "@/components/UserAvatar";
import {
  Plus,
  Folder,
  Calendar,
  Users,
  Trash2,
  MessageCircle,
  Coffee,
  BookOpen,
} from "lucide-react";
import { Board, Member } from "@/types/kanban";

export default function HomePage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [hoveredBoard, setHoveredBoard] = useState<string | null>(null);

  useEffect(() => {
    fetchBoards();
    fetchMembers();
    checkCurrentUser();
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

  const checkCurrentUser = () => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    } else {
      setShowUserSelector(true);
    }
  };

  const handleUserSelect = (user: Member) => {
    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
    setShowUserSelector(false);
  };

  const handleUserChange = () => {
    setShowUserSelector(true);
  };

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/boards");
      if (response.ok) {
        const boardsData = await response.json();
        setBoards(boardsData);
      }
    } catch (err) {
      console.error("Error fetching boards:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBoard = async (boardId: string, boardTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${boardTitle}"?`)) return;

    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete board");
      }

      await fetchBoards();
    } catch (err) {
      console.error("Error deleting board:", err);
      alert("Failed to delete board");
    }
  };

  // Calculate filtered boards for the current user
  const getFilteredBoards = () => {
    return boards.filter((board) => {
      if (!currentUser) return false;
      if (currentUser.role !== "member") return true;
      const projectMembers = Object.values(board.members || {});
      return projectMembers.some((member) => member.id === currentUser.id);
    });
  };

  const filteredBoards = getFilteredBoards();

  // Redirect members to their dashboard if they have no projects
  useEffect(() => {
    if (
      !loading &&
      currentUser &&
      currentUser.role === "member" &&
      filteredBoards.length === 0
    ) {
      window.location.href = "/member";
    }
  }, [loading, currentUser, filteredBoards]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Core Kanban
                  </h1>
                  <p className="text-xs text-gray-500">
                    Exclusive Project Management
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex items-center space-x-3">
              {currentUser && (
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
                  <Button
                    onClick={handleUserChange}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Switch
                  </Button>
                </div>
              )}

              {currentUser && currentUser.role !== "member" && (
                <Link href="/members">
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Members</span>
                  </Button>
                </Link>
              )}

              {currentUser && currentUser.role !== "member" && (
                <Link href="/boards/new">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">New Project</span>
                  </Button>
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 leading-tight">
              Your Projects,
              <br />
              <span className="text-4xl md:text-5xl">Perfectly Organized</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Streamline your development workflow with our intuitive Kanban
              boards. Track progress, collaborate seamlessly, and deliver
              projects on time.
            </p>

            {currentUser && currentUser.role !== "member" && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/boards/new">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create New Project
                  </Button>
                </Link>
                <div className="flex items-center text-sm text-gray-500">
                  <div className="flex -space-x-2 mr-3">
                    {members.slice(0, 3).map((member, index) => (
                      <UserAvatar
                        key={member.id}
                        member={member}
                        size="sm"
                        showName={false}
                        showRole={false}
                        className="ring-2 ring-white"
                      />
                    ))}
                  </div>
                  <span>Join {members.length} team members</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">
                {currentUser?.role === "member"
                  ? "Your Projects"
                  : "All Projects"}
              </h3>
              {currentUser && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-gray-600">
                      {currentUser.role === "member"
                        ? `Active in ${
                            boards.filter((board) => {
                              const projectMembers = Object.values(
                                board.members || {}
                              );
                              return projectMembers.some(
                                (member) => member.id === currentUser.id
                              );
                            }).length
                          } ${
                            boards.filter((board) => {
                              const projectMembers = Object.values(
                                board.members || {}
                              );
                              return projectMembers.some(
                                (member) => member.id === currentUser.id
                              );
                            }).length === 1
                              ? "project"
                              : "projects"
                          }`
                        : `Managing ${boards.length} ${
                            boards.length === 1 ? "project" : "projects"
                          }`}
                    </p>
                  </div>
                  <span className="text-gray-400">•</span>
                  <p className="text-gray-500 text-sm">
                    Last updated {new Date().toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            {currentUser && boards.length > 0 && (
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {boards.reduce(
                      (acc, board) => acc + Object.keys(board.tasks).length,
                      0
                    )}
                  </div>
                  <div className="text-sm text-gray-500">Total Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {boards.length}
                  </div>
                  <div className="text-sm text-gray-500">Active Projects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {
                      new Set(
                        boards.flatMap((board) =>
                          Object.keys(board.members || {})
                        )
                      ).size
                    }
                  </div>
                  <div className="text-sm text-gray-500">Team Members</div>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse shadow-sm flex flex-col h-full"
                >
                  {/* Header Section */}
                  <div className="pb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    </div>
                    <div className="h-4 bg-gray-100 rounded mb-2 w-full"></div>
                    <div className="h-4 bg-gray-100 rounded mb-4 w-2/3"></div>
                  </div>

                  {/* Enhanced Stats Section */}
                  <div className="pb-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 bg-gray-100 rounded"></div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 bg-gray-100 rounded"></div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded mb-1"></div>
                        <div className="h-3 bg-gray-100 rounded"></div>
                      </div>
                    </div>
                  </div>

                  {/* Team Section */}
                  <div className="pb-4 flex-1">
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-4 bg-gray-100 rounded w-16"></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center -space-x-3">
                          <div className="w-8 h-8 bg-gray-200 rounded-full ring-3 ring-white"></div>
                          <div className="w-8 h-8 bg-gray-200 rounded-full ring-3 ring-white"></div>
                          <div className="w-8 h-8 bg-gray-200 rounded-full ring-3 ring-white"></div>
                          <div className="w-8 h-8 bg-gray-100 rounded-full ring-3 ring-white"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Section */}
                  <div className="mt-auto">
                    <div className="border-t border-gray-100 pt-4">
                      <div className="flex gap-3">
                        <div className="flex-1 h-12 bg-gray-200 rounded-lg"></div>
                        <div className="h-12 w-12 bg-gray-100 rounded-lg"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBoards.length === 0 ? (
            <div className="text-center py-2">
              <div className="max-w-lg mx-auto">
                {currentUser && currentUser.role !== "member" && (
                  <>
                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                      Ready to Start Your First Project?
                    </h3>
                    <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                      Transform your ideas into organized, trackable projects.
                      Create your first Kanban board and start managing tasks
                      like a pro.
                    </p>
                  </>
                )}

                {currentUser && currentUser.role !== "member" ? (
                  <div className="space-y-6">
                    <Link href="/boards/new">
                      <Button
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Create Your First Project
                      </Button>
                    </Link>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                      <div className="text-center p-6 bg-blue-50 rounded-xl">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <Folder className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Organize Tasks
                        </h4>
                        <p className="text-sm text-gray-600">
                          Create boards, columns, and tasks to structure your
                          workflow
                        </p>
                      </div>
                      <div className="text-center p-6 bg-green-50 rounded-xl">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Team Collaboration
                        </h4>
                        <p className="text-sm text-gray-600">
                          Invite team members and assign tasks for seamless
                          collaboration
                        </p>
                      </div>
                      <div className="text-center p-6 bg-purple-50 rounded-xl">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                          <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Track Progress
                        </h4>
                        <p className="text-sm text-gray-600">
                          Monitor project status and keep everyone aligned on
                          goals
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredBoards.map((board) => {
                const canDeleteProject = currentUser
                  ? currentUser.role !== "member"
                  : false;

                const isProjectMember =
                  currentUser && board.members
                    ? Object.values(board.members).some(
                        (member) => member.id === currentUser.id
                      )
                    : false;

                const userRole =
                  currentUser && board.members && isProjectMember
                    ? Object.values(board.members).find(
                        (member) => member.id === currentUser.id
                      )?.role
                    : currentUser?.role;

                return (
                  <div
                    key={board.id}
                    className="bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-2xl transition-all duration-500 flex flex-col h-full group relative overflow-hidden"
                    onMouseEnter={() => setHoveredBoard(board.id)}
                    onMouseLeave={() => setHoveredBoard(null)}
                  >
                    {/* Background Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-transparent to-indigo-50/0 group-hover:from-blue-50/50 group-hover:to-indigo-50/30 transition-all duration-500"></div>

                    {/* Header Section */}
                    <div className="relative p-6 pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-lg"></div>
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                              {board.title}
                            </h3>
                          </div>
                          {board.description && (
                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-4">
                              {board.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Stats Section */}
                    <div className="relative px-6 pb-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100 group-hover:bg-blue-100 transition-colors">
                          <div className="flex items-center justify-center mb-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
                              <Folder className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="text-xl font-bold text-blue-600">
                            {Object.keys(board.tasks).length}
                          </div>
                          <div className="text-xs text-blue-600 font-medium">
                            Tasks
                          </div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-xl border border-green-100 group-hover:bg-green-100 transition-colors">
                          <div className="flex items-center justify-center mb-2">
                            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-sm">
                              <Users className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="text-xl font-bold text-green-600">
                            {Object.keys(board.members || {}).length}
                          </div>
                          <div className="text-xs text-green-600 font-medium">
                            Members
                          </div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-xl border border-purple-100 group-hover:bg-purple-100 transition-colors">
                          <div className="flex items-center justify-center mb-2">
                            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center shadow-sm">
                              <Calendar className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="text-sm font-bold text-purple-600">
                            {new Date(board.updatedAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </div>
                          <div className="text-xs text-purple-600 font-medium">
                            Updated
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Team Section */}
                    {board.members && Object.keys(board.members).length > 0 && (
                      <div className="relative px-6 pb-4 flex-1">
                        <div className="border-t border-gray-100 pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-700">
                              Team Members
                            </h4>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {Object.keys(board.members).length} active
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center -space-x-3">
                              {Object.values(board.members)
                                .slice(0, hoveredBoard === board.id ? 6 : 4)
                                .map((member, index) => (
                                  <div
                                    key={member.id}
                                    className="group/avatar relative"
                                    style={{
                                      zIndex:
                                        Object.values(board.members).length -
                                        index,
                                    }}
                                  >
                                    <UserAvatar
                                      member={member}
                                      size="sm"
                                      showName={false}
                                      showRole={false}
                                      className="ring-3 ring-white hover:ring-blue-300 transition-all cursor-pointer transform hover:scale-110 hover:z-50 shadow-lg"
                                    />
                                    {/* Enhanced Tooltip */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 whitespace-nowrap z-50 shadow-xl">
                                      <div className="font-semibold">
                                        {member.name}
                                      </div>
                                      <div className="text-gray-300 text-xs capitalize">
                                        {member.role.replace("_", " ")}
                                      </div>
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                  </div>
                                ))}
                              {Object.keys(board.members).length >
                                (hoveredBoard === board.id ? 6 : 4) && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-3 border-white flex items-center justify-center text-xs text-gray-600 font-bold hover:bg-gray-300 transition-colors cursor-pointer shadow-lg">
                                  +
                                  {Object.keys(board.members).length -
                                    (hoveredBoard === board.id ? 6 : 4)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Enhanced Action Section */}
                    <div className="relative p-6 pt-0 mt-auto">
                      <div className="border-t border-gray-100 pt-4">
                        <div className="flex gap-3">
                          <Link href={`/boards/${board.id}`} className="flex-1">
                            <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                              Open Project
                              <div className="ml-2 opacity-70 group-hover:opacity-100 transition-opacity">
                                →
                              </div>
                            </Button>
                          </Link>
                          {canDeleteProject && (
                            <Button
                              variant="outline"
                              onClick={() =>
                                handleDeleteBoard(board.id, board.title)
                              }
                              className="h-12 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 transition-all duration-300 px-4 shadow-sm hover:shadow-md"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">K</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Core Kanban</h3>
                  <p className="text-gray-400 text-sm">
                    Exclusive Project Management For Core Team
                  </p>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed mb-4">
                Streamline your development workflow with our intuitive Kanban
                boards. Built for teams who value efficiency and clarity in
                project management.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex -space-x-2">
                  {members.slice(0, 4).map((member, index) => (
                    <UserAvatar
                      key={member.id}
                      member={member}
                      size="sm"
                      showName={false}
                      showRole={false}
                      className="ring-2 ring-gray-800"
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-400">
                  Trusted by {members.length}+ professionals
                </p>
              </div>
            </div>

            {/* Stats Section */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold mb-4">Platform Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Active Projects</span>
                  <span className="text-white font-semibold">
                    {boards.length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Tasks</span>
                  <span className="text-white font-semibold">
                    {boards.reduce(
                      (acc, board) => acc + Object.keys(board.tasks).length,
                      0
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Team Members</span>
                  <span className="text-white font-semibold">
                    {members.length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 mb-4 md:mb-0">
                <p className="text-sm">
                  &copy; 2025 Core Kanban. Crafted with ❤️ by cl3v, for
                  developers.
                </p>
              </div>
              <div className="flex items-center space-x-6 text-gray-400 text-sm">
                {currentUser && currentUser.role !== "member" && (
                  <Link
                    href="/boards/new"
                    className="hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    New Project
                  </Link>
                )}
                <span className="text-gray-600">•</span>
                <span className="text-gray-500">
                  Built with Next.js & TypeScript
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <UserSelector
        isOpen={showUserSelector}
        onUserSelect={handleUserSelect}
        members={members}
        onMembersUpdate={fetchMembers}
      />
    </div>
  );
}
