"use client";

import React, { useState } from "react";
import { Board, Member } from "@/types/kanban";
import { MemberManagement } from "./MemberManagement";
import { BoardDetailsManagement } from "./BoardDetailsManagement";
import { Settings as SettingsIcon, Users, FileText } from "lucide-react";
import { PermissionService } from "@/lib/PermissionService";

interface SettingsProps {
  board: Board;
  currentUser?: Member;
  onBoardUpdate: (boardData: Partial<Board>) => Promise<void>;
  onBoardStateUpdate?: (updater: (board: Board) => Board) => void;
  onRefresh?: () => Promise<void>;
}

export const Settings: React.FC<SettingsProps> = ({
  board,
  currentUser,
  onBoardUpdate,
  onBoardStateUpdate,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<"details" | "members">("details");

  // Optimistic update functions
  const handleMembersUpdate = () => {
    if (onBoardStateUpdate) {
      // This will be handled by the API calls within MemberManagement
      // We don't need to do anything here as the MemberManagement component
      // should handle its own optimistic updates
    } else if (onRefresh) {
      onRefresh();
    }
  };

  const canManageMembers = currentUser
    ? PermissionService.canManageProjectMembers(currentUser)
    : false;

  const tabs = [
    {
      id: "details" as const,
      label: "Board Details",
      icon: FileText,
      show: true,
    },
    {
      id: "members" as const,
      label: "Team Members",
      icon: Users,
      show: canManageMembers,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-6 w-6 text-gray-600" />
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage board details and team members
            </p>
          </div>
        </div>
      </div>

      {/* Board Info */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">
          {board.title}
        </h2>
        {board.description && (
          <p className="text-gray-600">{board.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg inline-flex">
          {tabs
            .filter((tab) => tab.show)
            .map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {activeTab === "details" && (
            <div className="max-w-2xl">
              <BoardDetailsManagement
                board={board}
                onBoardUpdate={onBoardUpdate}
                currentUser={currentUser}
              />
            </div>
          )}

          {activeTab === "members" && canManageMembers && (
            <div className="max-w-4xl">
              <MemberManagement
                boardId={board.id}
                members={board.members || {}}
                onMembersUpdate={handleMembersUpdate}
                onBoardStateUpdate={onBoardStateUpdate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
