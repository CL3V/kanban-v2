"use client";

import React, { useState } from "react";
import { Board } from "@/types/kanban";
import { Button } from "./ui/Button";
import { Save, Edit3 } from "lucide-react";

interface BoardDetailsManagementProps {
  board: Board;
  onBoardUpdate: () => void;
}

export const BoardDetailsManagement: React.FC<BoardDetailsManagementProps> = ({
  board,
  onBoardUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description || "");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/boards/${board.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update board");
      }

      setIsEditing(false);
      onBoardUpdate();
    } catch (error) {
      console.error("Error updating board:", error);
      alert("Failed to update board details");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle(board.title);
    setDescription(board.description || "");
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-secondary-900">
          Board Details
        </h3>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Edit Details
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Board Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter board title"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Enter board description (optional)"
              maxLength={500}
            />
            <p className="text-xs text-secondary-500 mt-1">
              {description.length}/500 characters
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-secondary-200">
            <Button variant="ghost" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading || !title.trim()}
              className="flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Board Title
            </label>
            <div className="p-3 bg-secondary-50 rounded-md border">
              <p className="text-secondary-900 font-medium">{board.title}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Description
            </label>
            <div className="p-3 bg-secondary-50 rounded-md border min-h-[100px]">
              <p className="text-secondary-700">
                {board.description || (
                  <span className="italic text-secondary-500">
                    No description provided
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Created At
              </label>
              <div className="p-3 bg-secondary-50 rounded-md border">
                <p className="text-secondary-700 text-sm">
                  {new Date(board.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Last Updated
              </label>
              <div className="p-3 bg-secondary-50 rounded-md border">
                <p className="text-secondary-700 text-sm">
                  {new Date(board.updatedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
