"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Users, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { UserSelector } from "@/components/UserSelector";
import { UserAvatar } from "@/components/UserAvatar";
import { DeleteBoardConfirmationDialog } from "@/components/DeleteBoardConfirmationDialog";
import { useToast } from "@/contexts/ToastContext";
import { useCSRF } from "@/hooks/useCSRF";
import {
  SkeletonCard,
  SkeletonStats,
  SkeletonButton,
} from "@/components/ui/Skeleton";
import type { Board, Member } from "@/types/kanban";

export default function HomePage() {
  const { showSuccess, showError } = useToast();
  const { secureApiCall } = useCSRF();
  const [boards, setBoards] = React.useState<Board[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [membersLoading, setMembersLoading] = React.useState(true);
  const [showUserSelector, setShowUserSelector] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<Member | null>(null);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [deleteDialog, setDeleteDialog] = React.useState<{
    isOpen: boolean;
    boardId: string;
    boardTitle: string;
  }>({
    isOpen: false,
    boardId: "",
    boardTitle: "",
  });
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    fetchBoards();
    fetchMembers();
    checkCurrentUser();

    // Set page title
    document.title = "Dashboard | Juke";
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
      const response = await secureApiCall(
        `/api/boards/${deleteDialog.boardId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            boardName: deleteDialog.boardTitle,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete board");
      }

      await fetchBoards();
      setDeleteDialog({ isOpen: false, boardId: "", boardTitle: "" });
      showSuccess(
        "Board Deleted",
        `"${deleteDialog.boardTitle}" has been permanently deleted.`
      );
    } catch (err) {
      console.error("Error deleting board:", err);
      showError(
        "Delete Failed",
        err instanceof Error ? err.message : "Failed to delete board"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteDialog = () => {
    if (!isDeleting) {
      setDeleteDialog({ isOpen: false, boardId: "", boardTitle: "" });
    }
  };

  // Calculate board progress statistics
  const getBoardStats = (board: Board) => {
    const tasks = Object.values(board.tasks);
    const totalTasks = tasks.length;

    if (totalTasks === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        todo: 0,
        completionRate: 0,
      };
    }

    const completed = tasks.filter(
      (task) =>
        task.status === "done" ||
        task.status === "deployed" ||
        task.status === "completed"
    ).length;

    const inProgress = tasks.filter(
      (task) =>
        task.status === "in-progress" ||
        task.status === "in-development" ||
        task.status === "in-review" ||
        task.status === "code-review"
    ).length;

    const todo = tasks.filter(
      (task) => task.status === "todo" || task.status === "backlog"
    ).length;

    const completionRate = Math.round((completed / totalTasks) * 100);

    return {
      total: totalTasks,
      completed,
      inProgress,
      todo,
      completionRate,
    };
  };

  const filteredBoards = React.useMemo(() => {
    return boards.filter((board) => {
      if (!currentUser) return false;
      if (currentUser.role !== "member") return true;
      const projectMembers = Object.values(board.members || {});
      return projectMembers.some((m) => m.id === currentUser.id);
    });
  }, [boards, currentUser]);

  // Members stay on the dashboard even if they have no projects

  const stats = React.useMemo(() => {
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
    <div className="min-h-screen bg-white">
      {/* Top bar */}
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
            <h1 className="text-lg font-medium text-gray-900">Dashboard</h1>
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
      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {/* Stats */}
        <section className="mb-8">
          {loading ? (
            <SkeletonStats />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Projects
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.totalProjects}
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Tasks
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.totalTasks}
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Team
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {stats.uniqueMembers}
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors">
                <div className="text-sm font-medium text-gray-600 mb-1">
                  Last updated
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Boards */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {currentUser?.role === "member"
                ? "Your Projects"
                : "All Projects"}
            </h2>
            {currentUser && currentUser.role !== "member" && (
              <div className="flex items-center gap-3">
                <Link href="/members">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-200 hover:border-gray-300"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Members
                  </Button>
                </Link>
                <Link href="/boards/new">
                  <Button
                    size="sm"
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
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
            <div className="bg-gray-50 rounded-2xl p-12 text-center">
              {currentUser?.role !== "member" ? (
                <div className="space-y-4">
                  <div className="text-lg font-medium text-gray-900">
                    No projects yet
                  </div>
                  <div className="text-gray-600">
                    Get started by creating your first project
                  </div>
                  <Link href="/boards/new">
                    <Button className="bg-gray-900 hover:bg-gray-800 text-white mt-4">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-lg font-medium text-gray-900">
                  You're not assigned to any projects yet
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBoards.map((board) => {
                const stats = getBoardStats(board);
                return (
                  <div
                    key={board.id}
                    className="bg-white border border-gray-100 rounded-2xl p-6 flex flex-col gap-4 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {board.title}
                        </h3>
                        <div className="text-sm text-gray-500">
                          Updated{" "}
                          {new Date(board.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                      {currentUser && currentUser.role !== "member" && (
                        <Button
                          variant="outline"
                          size="icon"
                          title="Delete"
                          className="border-gray-200 hover:border-red-200 hover:bg-red-50"
                          onClick={() =>
                            handleDeleteBoard(board.id, board.title)
                          }
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 whitespace-nowrap">
                          {Object.keys(board.tasks).length} tasks
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 whitespace-nowrap">
                          {Object.keys(board.members || {}).length} members
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-600 whitespace-nowrap">
                          {board.columns.length} columns
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex -space-x-2">
                        {Object.values(board.members || {})
                          .slice(0, 3)
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
                        {Object.keys(board.members || {}).length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-gray-100 grid place-items-center text-xs font-medium text-gray-600">
                            +{Object.keys(board.members || {}).length - 3}
                          </div>
                        )}
                      </div>
                      <Link href={`/boards/${board.id}`}>
                        <Button
                          size="sm"
                          className="bg-gray-900 hover:bg-gray-800 text-white"
                        >
                          Open
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
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
