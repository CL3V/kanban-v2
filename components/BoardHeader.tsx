import React from "react";
import { Plus, Search, Filter, ChevronDown, Columns } from "lucide-react";

import { Board, TaskPriority } from "@/types/kanban";
import { Button } from "./ui/Button";
import { UserAvatar } from "./UserAvatar";

export interface TaskFilters {
  assignee?: string;
  priority?: TaskPriority;
  tags?: string[];
}

interface BoardHeaderProps {
  board: Board;
  onUpdateBoard: (boardData: Partial<Board>) => Promise<void>;
  onOpenCreateTask: () => void;
  onOpenColumnManagement?: () => void;
  onSearchChange?: (searchTerm: string) => void;
  onFiltersChange?: (filters: TaskFilters) => void;
  canCreateTask?: boolean;
  canManageColumns?: boolean;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({
  board,
  onOpenCreateTask,
  onOpenColumnManagement,
  onSearchChange,
  onFiltersChange,
  canCreateTask = true,
  canManageColumns = false,
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [showFilters, setShowFilters] = React.useState(false);
  const [filters, setFilters] = React.useState<TaskFilters>({});

  React.useEffect(() => {
    try {
      const key = `kanban:boardFilters:${board.id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw);
        if (typeof saved.searchTerm === "string") {
          setSearchTerm(saved.searchTerm);
          onSearchChange?.(saved.searchTerm);
        }
        if (saved.filters && typeof saved.filters === "object") {
          setFilters(saved.filters);
          onFiltersChange?.(saved.filters);
        }
      }
    } catch (e) {
      console.error("Failed to restore board filters from cache", e);
    }
  }, [board.id]);

  React.useEffect(() => {
    try {
      const key = `kanban:boardFilters:${board.id}`;
      const payload = JSON.stringify({ searchTerm, filters });
      localStorage.setItem(key, payload);
    } catch {
      // ignore write errors
    }
  }, [board.id, searchTerm, filters]);

  React.useEffect(() => {
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

  const getAllTags = () => {
    const allTags = new Set<string>();
    Object.values(board.tasks).forEach((task) => {
      task.tags?.forEach((tag) => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  };

  const handleFilterChange = React.useCallback(
    (newFilters: TaskFilters) => {
      setFilters(newFilters);
      onFiltersChange?.(newFilters);
    },
    [onFiltersChange]
  );

  const clearFilters = React.useCallback(() => {
    const emptyFilters: TaskFilters = {};
    setFilters(emptyFilters);
    onFiltersChange?.(emptyFilters);
  }, [onFiltersChange]);

  return (
    <div>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4"></div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
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
            {canManageColumns && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenColumnManagement}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <Columns className="h-4 w-4" />
                Manage Columns
              </Button>
            )}
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
