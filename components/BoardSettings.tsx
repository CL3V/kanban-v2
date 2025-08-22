"use client";

import React from "react";
import { Settings } from "lucide-react";

import { Board, Member } from "@/types/kanban";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { MemberManagement } from "./MemberManagement";
import { ColumnManagement } from "./ColumnManagement";
import { BoardDetailsManagement } from "./BoardDetailsManagement";
import { PermissionService } from "@/lib/PermissionService";

interface BoardSettingsProps {
  board: Board;
  onBoardUpdate: (boardData: Partial<Board>) => Promise<void>;
  onBoardStateUpdate?: (updater: (board: Board) => Board) => void;
  onRefresh?: () => Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
  currentUser?: Member | null;
}

export const BoardSettings: React.FC<BoardSettingsProps> = ({
  board,
  onBoardUpdate,
  onBoardStateUpdate,
  onRefresh,
  isOpen: externalIsOpen,
  onClose: externalOnClose,
  currentUser,
}) => {
  const [internalIsOpen, setInternalIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<
    "details" | "members" | "columns"
  >("details");

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const onClose = externalOnClose || (() => setInternalIsOpen(false));
  const onOpen = () =>
    externalIsOpen === undefined ? setInternalIsOpen(true) : undefined;

  const handleMembersUpdate = () => {
    if (onBoardStateUpdate) {
      // This will be handled by the API calls within MemberManagement
      // We don't need to do anything here as the MemberManagement component
      // should handle its own optimistic updates
    } else if (onRefresh) {
      onRefresh();
    }
  };

  const handleColumnsUpdate = () => {
    if (onBoardStateUpdate) {
      // This will be handled by the API calls within ColumnManagement
      // We don't need to do anything here as the ColumnManagement component
      // should handle its own optimistic updates
    } else if (onRefresh) {
      onRefresh();
    }
  };

  const canManageMembers = currentUser
    ? PermissionService.canManageProjectMembers(currentUser)
    : false;
  const canManageColumns = currentUser
    ? PermissionService.canManageColumns(currentUser)
    : false;

  return (
    <>
      {externalIsOpen === undefined && (
        <Button
          variant="outline"
          size="icon"
          onClick={onOpen}
          className="text-secondary-500 hover:text-secondary-700"
          title="Board Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}

      <Modal isOpen={isOpen} onClose={onClose} title="Board Settings" size="lg">
        <div className="space-y-6">
          <div className="pb-4 border-b border-secondary-200">
            <h2 className="text-lg font-semibold text-secondary-900 mb-1">
              {board.title}
            </h2>
            {board.description && (
              <p className="text-secondary-600">{board.description}</p>
            )}
          </div>

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
            {canManageMembers && (
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
            )}
            {canManageColumns && (
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
            )}
          </div>

          <div className="min-h-[400px]">
            {activeTab === "details" && (
              <BoardDetailsManagement
                board={board}
                onBoardUpdate={onBoardUpdate}
                currentUser={currentUser}
              />
            )}

            {activeTab === "members" && canManageMembers && (
              <MemberManagement
                boardId={board.id}
                members={board.members || {}}
                onMembersUpdate={handleMembersUpdate}
                onBoardStateUpdate={onBoardStateUpdate}
              />
            )}

            {activeTab === "columns" && canManageColumns && (
              <ColumnManagement
                boardId={board.id}
                columns={board.columns}
                onColumnsUpdate={handleColumnsUpdate}
                onBoardStateUpdate={onBoardStateUpdate}
                currentUser={currentUser || undefined}
              />
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
