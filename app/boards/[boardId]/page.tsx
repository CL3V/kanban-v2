"use client";

import React, { useState, useEffect } from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { UserSelector } from "@/components/UserSelector";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Board, Member } from "@/types/kanban";
import { PermissionService } from "@/lib/PermissionService";

interface BoardPageProps {
  params: Promise<{
    boardId: string;
  }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  const [boardId, setBoardId] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    params.then((resolvedParams) => {
      setBoardId(resolvedParams.boardId);
    });
  }, [params]);

  useEffect(() => {
    if (boardId) {
      fetchBoard();
      fetchMembers();
    }
  }, [boardId]);

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

  useEffect(() => {
    // Check for cached user
    const cachedUser = localStorage.getItem("currentUser");
    if (cachedUser) {
      try {
        const user = JSON.parse(cachedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error("Error parsing cached user:", error);
        localStorage.removeItem("currentUser");
      }
    }
  }, []);

  useEffect(() => {
    // Show user selector if we have a board but no current user
    if (board && !currentUser && !loading) {
      setShowUserSelector(true);
    }
  }, [board, currentUser, loading]);

  // Check if current user can access this board
  const canAccessBoard =
    currentUser && board
      ? PermissionService.canAccessProject(
          currentUser,
          Object.values(board.members || {})
        )
      : false;

  const fetchBoard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/boards/${boardId}`);
      if (response.ok) {
        const boardData = await response.json();
        setBoard(boardData);
      }
    } catch (error) {
      console.error("Error fetching board:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: Member) => {
    setCurrentUser(user);
    setShowUserSelector(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Board not found
          </h2>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check access permission after user is selected
  if (currentUser && board && !canAccessBoard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this project.
          </p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Boards
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50">
      {/* User Selector Modal */}
      <UserSelector
        isOpen={showUserSelector}
        onUserSelect={handleUserSelect}
        members={members}
        onMembersUpdate={fetchMembers}
      />

      {/* Kanban Board with integrated header */}
      {currentUser && (
        <KanbanBoard boardId={boardId} currentUser={currentUser} />
      )}
    </div>
  );
}
