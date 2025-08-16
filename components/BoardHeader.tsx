import React, { useState, useCallback, useEffect } from "react";
import { Board, Task, TaskPriority, Member } from "@/types/kanban";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { UserAvatar } from "./UserAvatar";
import {
  Settings,
  Plus,
  ArrowLeft,
  Edit,
  Save,
  X,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

export interface TaskFilters {
  assignee?: string;
  priority?: TaskPriority;
  tags?: string[];
}

interface BoardHeaderProps {
  board: Board;
  onUpdateBoard: (boardData: Partial<Board>) => Promise<void>;
  onOpenCreateTask: () => void;
  onOpenBoardSettings: () => void;
  onSearchChange?: (searchTerm: string) => void;
  onFiltersChange?: (filters: TaskFilters) => void;
  canCreateTask?: boolean;
  canManageBoard?: boolean;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  board,
  onUpdateBoard,
  onOpenCreateTask,
  onOpenBoardSettings,
  onSearchChange,
  onFiltersChange,
  canCreateTask = true,
  canManageBoard = true,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempTitle, setTempTitle] = useState(board.title);
  const [tempDescription, setTempDescription] = useState(
    board.description || ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({});

  // Close filters dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showFilters && !target.closest(".filter-dropdown")) {
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilters]);

  const getInitials = (name: string) => {
    const nameParts = name.split(" ");
    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    }
    return nameParts[0].charAt(0).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "#ef4444", // red
      "#f97316", // orange
      "#eab308", // yellow
      "#22c55e", // green
      "#06b6d4", // cyan
      "#3b82f6", // blue
      "#8b5cf6", // violet
      "#ec4899", // pink
      "#f59e0b", // amber
      "#10b981", // emerald
    ];
    const hash = name.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Get all unique tags from board tasks
  const getAllTags = () => {
    const allTags = new Set<string>();
    Object.values(board.tasks).forEach((task) => {
      task.tags?.forEach((tag) => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  };

  const handleSaveTitle = useCallback(async () => {
    const trimmedTitle = tempTitle.trim();
    if (trimmedTitle && trimmedTitle !== board.title) {
      setIsSaving(true);
      try {
        console.log(
          "BoardHeader: Updating title from",
          board.title,
          "to",
          trimmedTitle
        );
        const updateData = { title: trimmedTitle };
        console.log("BoardHeader: Update data for title:", updateData);
        await onUpdateBoard(updateData);
        console.log("BoardHeader: Title updated successfully");
      } catch (error) {
        console.error("BoardHeader: Failed to update title:", error);
        setTempTitle(board.title); // Revert on error
        alert(
          `Failed to update title: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditingTitle(false);
  }, [tempTitle, board.title, onUpdateBoard]);

  const handleSaveDescription = useCallback(async () => {
    if (tempDescription !== board.description) {
      setIsSaving(true);
      try {
        console.log(
          "BoardHeader: Updating description from",
          board.description,
          "to",
          tempDescription
        );
        const updateData = { description: tempDescription };
        console.log("BoardHeader: Update data for description:", updateData);
        await onUpdateBoard(updateData);
        console.log("BoardHeader: Description updated successfully");
      } catch (error) {
        console.error("BoardHeader: Failed to update description:", error);
        setTempDescription(board.description || ""); // Revert on error
        alert(
          `Failed to update description: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditingDescription(false);
  }, [tempDescription, board.description, onUpdateBoard]);

  const handleCancelTitle = useCallback(() => {
    setTempTitle(board.title);
    setIsEditingTitle(false);
  }, [board.title]);

  const handleCancelDescription = useCallback(() => {
    setTempDescription(board.description || "");
    setIsEditingDescription(false);
  }, [board.description]);

  const handleKeyPress = useCallback(
    (
      e: React.KeyboardEvent,
      saveHandler: () => void,
      cancelHandler: () => void
    ) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveHandler();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelHandler();
      }
    },
    []
  );

  const handleFilterChange = useCallback(
    (newFilters: TaskFilters) => {
      setFilters(newFilters);
      onFiltersChange?.(newFilters);
    },
    [onFiltersChange]
  );

  const clearFilters = useCallback(() => {
    const emptyFilters = {};
    setFilters(emptyFilters);
    onFiltersChange?.(emptyFilters);
  }, [onFiltersChange]);

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        {/* Main Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyDown={(e) =>
                      handleKeyPress(e, handleSaveTitle, handleCancelTitle)
                    }
                    className="text-xl font-semibold bg-transparent border-b border-blue-500 focus:outline-none focus:border-blue-600"
                    autoFocus
                    disabled={isSaving}
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveTitle}
                    disabled={!tempTitle.trim() || isSaving}
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelTitle}
                    disabled={isSaving}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold text-gray-900">
                    {board.title}
                  </h1>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingTitle(true)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Board Settings moved to be beside Add Task button */}
          </div>
        </div>

        {/* Search and Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  onSearchChange?.(e.target.value);
                }}
                className="pl-10 pr-4 py-2 w-64 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter Button */}
            <div className="relative filter-dropdown">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                <ChevronDown className="h-4 w-4" />
                {(filters.assignee ||
                  filters.priority ||
                  (filters.tags && filters.tags.length > 0)) && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {
                      Object.keys(filters).filter((key) => {
                        const value = filters[key as keyof TaskFilters];
                        return key === "tags"
                          ? Array.isArray(value) && value.length > 0
                          : !!value;
                      }).length
                    }
                  </span>
                )}
              </Button>

              {/* Filter Dropdown */}
              {showFilters && (
                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900">
                        Filters
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear all
                      </Button>
                    </div>

                    {/* Assignee Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Assignee
                      </label>
                      <select
                        value={filters.assignee || ""}
                        onChange={(e) =>
                          handleFilterChange({
                            ...filters,
                            assignee: e.target.value || undefined,
                          })
                        }
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All assignees</option>
                        {Object.values(board.members || {}).map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Priority Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Priority
                      </label>
                      <select
                        value={filters.priority || ""}
                        onChange={(e) =>
                          handleFilterChange({
                            ...filters,
                            priority:
                              (e.target.value as TaskPriority) || undefined,
                          })
                        }
                        className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    {/* Tags Filter */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Tags
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {getAllTags().map((tag) => (
                          <label
                            key={tag}
                            className="flex items-center space-x-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={filters.tags?.includes(tag) || false}
                              onChange={(e) => {
                                const currentTags = filters.tags || [];
                                const newTags = e.target.checked
                                  ? [...currentTags, tag]
                                  : currentTags.filter((t) => t !== tag);
                                handleFilterChange({
                                  ...filters,
                                  tags:
                                    newTags.length > 0 ? newTags : undefined,
                                });
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                              {tag}
                            </span>
                          </label>
                        ))}
                        {getAllTags().length === 0 && (
                          <p className="text-xs text-gray-500 italic">
                            No tags available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Team Members Display */}
            <div className="flex items-center gap-1">
              {Object.values(board.members || {})
                .slice(0, 4)
                .map((member, index) => (
                  <UserAvatar
                    key={member.id}
                    member={member}
                    size="sm"
                    className={`border-2 border-white ${
                      index > 0 ? "ml-[-8px]" : ""
                    }`}
                  />
                ))}
              {Object.keys(board.members || {}).length > 4 && (
                <div className="relative w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white ml-[-8px]">
                  +{Object.keys(board.members || {}).length - 4}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Board Settings Icon Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenBoardSettings}
              className="h-10 w-10 text-secondary-600 hover:text-secondary-700 hover:bg-secondary-50"
              title="Board Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>

            {canCreateTask && (
              <Button
                onClick={onOpenCreateTask}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 shadow-md transition-all duration-200 hover:shadow-lg"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
