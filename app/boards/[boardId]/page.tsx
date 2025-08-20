"use client";

import React from "react";
import Link from "next/link";

import { KanbanBoard } from "@/components/KanbanBoard";
import { Sidebar, SidebarView } from "@/components/Sidebar";
import { Roadmap } from "@/components/Roadmap";
import { Settings } from "@/components/Settings";
import { Reports } from "@/components/Reports";
import { UserSelector } from "@/components/UserSelector";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { Board, Member } from "@/types/kanban";
import { PermissionService } from "@/lib/PermissionService";

interface BoardPageProps {
  params: Promise<{
    boardId: string;
  }>;
}

export default function BoardPage({ params }: BoardPageProps) {
  const [boardId, setBoardId] = React.useState<string>("");
  const [currentUser, setCurrentUser] = React.useState<Member | null>(null);
  const [showUserSelector, setShowUserSelector] = React.useState(false);
  const [board, setBoard] = React.useState<Board | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [membersLoading, setMembersLoading] = React.useState(true);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [activeView, setActiveView] = React.useState<SidebarView>("kanban");

  React.useEffect(() => {
    params.then((resolvedParams) => {
      setBoardId(resolvedParams.boardId);
    });
  }, [params]);

  React.useEffect(() => {
    if (boardId) {
      fetchBoard();
      fetchMembers();
    }
  }, [boardId]);

  const fetchMembers = async () => {
    try {
      setMembersLoading(true);
      const response = await fetch("/api/members");
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error fetching members");
    } finally {
      setMembersLoading(false);
    }
  };

  React.useEffect(() => {
    const cachedUser = localStorage.getItem("currentUser");
    if (cachedUser) {
      try {
        const user = JSON.parse(cachedUser);
        setCurrentUser(user);
      } catch (error) {
        localStorage.removeItem("currentUser");
      }
    }
  }, []);

  React.useEffect(() => {
    if (board && !currentUser && !loading) {
      setShowUserSelector(true);
    }
  }, [board, currentUser, loading]);

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

        document.title = `${boardData.title} | Juke`;
      }
    } catch (error) {
      console.error("Error fetching board");
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
      <div className="flex h-screen bg-gray-50">
        <div className="w-64 bg-white border-r border-gray-200 animate-pulse">
          <div className="p-6 border-b border-gray-200">
            <div className="h-4 bg-gray-200 rounded mb-4"></div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
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

  if (currentUser && board && !canAccessBoard) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
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

  const handleBoardUpdate = async (boardData: Partial<Board>) => {
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(boardData),
      });

      if (!response.ok) {
        throw new Error("Failed to update board");
      }

      const updatedBoard = await response.json();
      setBoard(updatedBoard);
    } catch (error) {
      alert("Failed to update board");
    }
  };

  const handleBoardStateUpdate = (updater: (board: Board) => Board) => {
    if (board) {
      const updatedBoard = updater(board);
      setBoard(updatedBoard);
    }
  };

  const renderMainContent = () => {
    if (!currentUser) return null;

    switch (activeView) {
      case "kanban":
        return <KanbanBoard boardId={boardId} currentUser={currentUser} />;
      case "roadmap":
        return <Roadmap board={board!} currentUser={currentUser} />;
      case "settings":
        return (
          <Settings
            board={board!}
            currentUser={currentUser}
            onBoardUpdate={handleBoardUpdate}
            onBoardStateUpdate={handleBoardStateUpdate}
            onRefresh={fetchBoard}
          />
        );
      case "reports":
        return <Reports board={board!} currentUser={currentUser} />;
      default:
        return <KanbanBoard boardId={boardId} currentUser={currentUser} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <UserSelector
        isOpen={showUserSelector}
        onUserSelect={handleUserSelect}
        members={members}
        onMembersUpdate={fetchMembers}
        loading={membersLoading}
      />

      {currentUser && board && (
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          boardTitle={board.title}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {currentUser && renderMainContent()}
      </div>
    </div>
  );
}
