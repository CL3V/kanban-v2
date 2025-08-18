"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { UserSelector } from "@/components/UserSelector";
import { UserAvatar } from "@/components/UserAvatar";
import { DeleteBoardConfirmationDialog } from "@/components/DeleteBoardConfirmationDialog";
import {
  SkeletonCard,
  SkeletonStats,
  SkeletonHeader,
  SkeletonButton,
} from "@/components/ui/Skeleton";
import { Plus, Folder, Calendar, Users, Trash2 } from "lucide-react";
import type { Board, Member } from "@/types/kanban";

export default function HomePage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(true);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    boardId: string;
    boardTitle: string;
  }>({
    isOpen: false,
    boardId: "",
    boardTitle: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchBoards();
    fetchMembers();
    checkCurrentUser();
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

  const handleUserChange = () => setShowUserSelector(true);

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

  const handleDeleteBoard = (boardId: string, boardTitle: string) => {
    setDeleteDialog({
      isOpen: true,
      boardId,
      boardTitle,
    });
  };

  const confirmDeleteBoard = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/boards/${deleteDialog.boardId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          boardName: deleteDialog.boardTitle,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete board");
      }

      await fetchBoards();
      setDeleteDialog({ isOpen: false, boardId: "", boardTitle: "" });
    } catch (err) {
      console.error("Error deleting board:", err);
      alert(err instanceof Error ? err.message : "Failed to delete board");
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteDialog = () => {
    if (!isDeleting) {
      setDeleteDialog({ isOpen: false, boardId: "", boardTitle: "" });
    }
  };

  const filteredBoards = useMemo(() => {
    return boards.filter((board) => {
      if (!currentUser) return false;
      if (currentUser.role !== "member") return true;
      const projectMembers = Object.values(board.members || {});
      return projectMembers.some((m) => m.id === currentUser.id);
    });
  }, [boards, currentUser]);

  // Members stay on the dashboard even if they have no projects

  const stats = useMemo(() => {
    const source = currentUser?.role === "member" ? filteredBoards : boards;
    const totalTasks = source.reduce(
      (acc, b) => acc + Object.keys(b.tasks || {}).length,
      0
    );
    const totalProjects = source.length;
    const uniqueMembers = new Set(
      source.flatMap((b) => Object.keys(b.members || {}))
    ).size;
    return { totalTasks, totalProjects, uniqueMembers };
  }, [boards, filteredBoards, currentUser]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/images/logo.png"
              alt="App Logo"
              width={28}
              height={28}
              className="rounded-sm"
              priority
            />
            <h1 className="text-sm sm:text-base font-semibold text-gray-900">
              Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {membersLoading && !currentUser ? (
              <div className="hidden md:flex items-center gap-2 pr-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
                <div className="text-sm space-y-1">
                  <div className="h-3 w-20 bg-gray-200 rounded animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
                  <div className="h-2 w-16 bg-gray-200 rounded animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
                </div>
              </div>
            ) : currentUser ? (
              <div className="hidden md:flex items-center gap-2 pr-2">
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
            ) : null}
            {membersLoading && !currentUser ? (
              <SkeletonButton className="w-16" />
            ) : currentUser ? (
              <Button variant="outline" size="sm" onClick={handleUserChange}>
                Switch
              </Button>
            ) : null}
            {/* Admin/PM quick actions moved to boards header */}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <section className="mb-6">
          {loading ? (
            <SkeletonStats />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-sm text-gray-500">Projects</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {stats.totalProjects}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-sm text-gray-500">Tasks</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {stats.totalTasks}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-sm text-gray-500">Team</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {stats.uniqueMembers}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-sm text-gray-500">Last updated</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Boards */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {currentUser?.role === "member" ? "Your Boards" : "All Boards"}
            </h2>
            {currentUser && currentUser.role !== "member" && (
              <div className="flex items-center gap-2">
                <Link href="/members">
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-1" />
                    Members
                  </Button>
                </Link>
                <Link href="/boards/new">
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    New Project
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filteredBoards.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-600">
              {currentUser?.role !== "member" ? (
                <div className="space-y-3">
                  <div className="text-base">No projects yet.</div>
                  <Link href="/boards/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-1" />
                      Create your first project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-base">
                  You're not assigned to any boards.
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredBoards.map((board) => (
                <div
                  key={board.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm text-gray-500">
                        Updated {new Date(board.updatedAt).toLocaleDateString()}
                      </div>
                      <h3 className="text-base font-semibold text-gray-900">
                        {board.title}
                      </h3>
                    </div>
                    {currentUser && currentUser.role !== "member" && (
                      <Button
                        variant="outline"
                        size="icon"
                        title="Delete"
                        onClick={() => handleDeleteBoard(board.id, board.title)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Folder className="h-4 w-4 text-blue-600" />
                      {Object.keys(board.tasks).length} tasks
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4 text-green-600" />
                      {Object.keys(board.members || {}).length} members
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      {board.columns.length} columns
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex -space-x-2">
                      {Object.values(board.members || {})
                        .slice(0, 4)
                        .map((m) => (
                          <UserAvatar
                            key={m.id}
                            member={m}
                            size="sm"
                            showName={false}
                            showRole={false}
                            className="ring-2 ring-white"
                          />
                        ))}
                      {Object.keys(board.members || {}).length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 grid place-items-center text-xs text-gray-600">
                          +{Object.keys(board.members || {}).length - 4}
                        </div>
                      )}
                    </div>
                    <Link href={`/boards/${board.id}`}>
                      <Button size="sm">Open</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <UserSelector
        isOpen={showUserSelector}
        onUserSelect={handleUserSelect}
        members={members}
        onMembersUpdate={fetchMembers}
        loading={membersLoading}
      />

      {/* Delete Board Confirmation Dialog */}
      <DeleteBoardConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={confirmDeleteBoard}
        boardTitle={deleteDialog.boardTitle}
        isDeleting={isDeleting}
      />
    </div>
  );
}
