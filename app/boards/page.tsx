"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Board } from "@/types/kanban";
import { Plus, Folder, Calendar, Users, ArrowLeft } from "lucide-react";

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/boards");
      if (!response.ok) {
        throw new Error("Failed to fetch boards");
      }
      const boardsData = await response.json();
      setBoards(boardsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch boards");
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

      // Refresh the boards list
      await fetchBoards();
    } catch (err) {
      console.error("Error deleting board:", err);
      alert("Failed to delete board");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-secondary-900 mb-2">
            Loading Boards
          </h2>
          <p className="text-secondary-600">Fetching your projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-secondary-900 mb-4">
            Error Loading Boards
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchBoards}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-secondary-900">
                  Team Projects
                </h1>
                <p className="text-sm text-secondary-600">
                  {boards.length} {boards.length === 1 ? "project" : "projects"}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button onClick={fetchBoards} variant="outline">
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <Link href="/boards/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Boards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {boards.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="h-16 w-16 text-secondary-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-900 mb-2">
              No projects yet
            </h3>
            <p className="text-secondary-600 mb-6">
              Create your first project to start organizing your development
              tasks
            </p>
            <Link href="/boards/new">
              <Button size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <div
                key={board.id}
                className="bg-white rounded-xl border-2 border-secondary-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-primary-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-secondary-900 mb-2">
                      {board.title}
                    </h3>
                    {board.description && (
                      <p className="text-secondary-600 text-sm mb-3 line-clamp-2">
                        {board.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Board Stats */}
                <div className="flex items-center justify-between text-sm text-secondary-500 mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Folder className="h-4 w-4 mr-1" />
                      <span>{Object.keys(board.tasks).length} tasks</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>
                        {Object.keys(board.members || {}).length} members
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>
                      {new Date(board.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Board Members Preview */}
                {board.members && Object.keys(board.members).length > 0 && (
                  <div className="flex items-center space-x-1 mb-4">
                    {Object.values(board.members)
                      .slice(0, 3)
                      .map((member) => (
                        <div
                          key={member.id}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white"
                          style={{ backgroundColor: member.color }}
                          title={member.name}
                        >
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                      ))}
                    {Object.keys(board.members).length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-secondary-200 flex items-center justify-center text-xs text-secondary-600 font-medium">
                        +{Object.keys(board.members).length - 3}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link href={`/boards/${board.id}`} className="flex-1">
                    <Button className="w-full" size="sm">
                      Open Project
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteBoard(board.id, board.title)}
                    className="text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
