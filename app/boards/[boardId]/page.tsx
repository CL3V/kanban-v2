import React from "react";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BoardPageProps {
  params: Promise<{
    boardId: string;
  }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { boardId } = await params;
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50">
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
                  Project Board
                </h1>
                <p className="text-sm text-secondary-600">
                  Board ID: {boardId}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Link href="/boards/new">
                <Button variant="outline">Create New Board</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <KanbanBoard boardId={boardId} />
    </div>
  );
}
