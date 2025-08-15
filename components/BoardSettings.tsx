"use client";

import React, { useState } from "react";
import { Board } from "@/types/kanban";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { MemberManagement } from "./MemberManagement";
import { ColumnManagement } from "./ColumnManagement";
import { BoardDetailsManagement } from "./BoardDetailsManagement";
import { Settings, X } from "lucide-react";

interface BoardSettingsProps {
  board: Board;
  onBoardUpdate: () => void;
}

export const BoardSettings: React.FC<BoardSettingsProps> = ({
  board,
  onBoardUpdate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "members" | "columns">(
    "details"
  );

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="text-secondary-500 hover:text-secondary-700"
        title="Board Settings"
      >
        <Settings className="h-4 w-4" />
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Board Settings"
        size="lg"
      >
        <div className="space-y-6">
          {/* Board Info */}
          <div className="pb-4 border-b border-secondary-200">
            <h2 className="text-lg font-semibold text-secondary-900 mb-1">
              {board.title}
            </h2>
            {board.description && (
              <p className="text-secondary-600">{board.description}</p>
            )}
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-secondary-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("details")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "details"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-secondary-600 hover:text-secondary-900"
              }`}
            >
              Board Details
            </button>
            <button
              onClick={() => setActiveTab("members")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "members"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-secondary-600 hover:text-secondary-900"
              }`}
            >
              Team Members
            </button>
            <button
              onClick={() => setActiveTab("columns")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "columns"
                  ? "bg-white text-primary-600 shadow-sm"
                  : "text-secondary-600 hover:text-secondary-900"
              }`}
            >
              Board Columns
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {activeTab === "details" && (
              <BoardDetailsManagement
                board={board}
                onBoardUpdate={onBoardUpdate}
              />
            )}

            {activeTab === "members" && (
              <MemberManagement
                boardId={board.id}
                members={board.members || {}}
                onMembersUpdate={onBoardUpdate}
              />
            )}

            {activeTab === "columns" && (
              <ColumnManagement
                boardId={board.id}
                columns={board.columns}
                onColumnsUpdate={onBoardUpdate}
              />
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
