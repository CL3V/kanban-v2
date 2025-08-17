import React, { useState, useEffect } from "react";
import {
  Task,
  TaskPriority,
  TaskStatus,
  CreateTaskRequest,
  UpdateTaskRequest,
  Member,
  Column,
  Comment,
} from "@/types/kanban";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { MemberSelector } from "./MemberSelector";
import { RichTextEditor, getPlainTextFromDraftState } from "./RichTextEditor";
import {
  Calendar,
  Clock,
  User,
  Tag,
  FileText,
  Trash2,
  Save,
  Edit,
  MessageCircle,
  Send,
} from "lucide-react";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  members: { [memberId: string]: Member };
  columns: Column[];
  allTasks?: { [taskId: string]: Task };
  defaultStatus?: TaskStatus;
  onSave: (taskData: CreateTaskRequest | UpdateTaskRequest) => void;
  onDelete?: () => void;
  isEditing?: boolean;
  onEdit?: () => void;
  currentUser?: Member;
  onAddComment?: (taskId: string, content: string) => Promise<void>;
  onDeleteComment?: (taskId: string, commentId: string) => Promise<void>;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  members,
  columns,
  allTasks,
  defaultStatus,
  onSave,
  onDelete,
  isEditing = false,
  onEdit,
  currentUser,
  onAddComment,
  onDeleteComment,
}) => {
  const [formData, setFormData] = useState<
    CreateTaskRequest | UpdateTaskRequest
  >({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
    assignee: "",
    dueDate: "",
    tags: [],
    estimatedHours: undefined,
  });

  const [tagInput, setTagInput] = useState("");
  const [newComment, setNewComment] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // Get all existing tags from other tasks
  const getExistingTags = (): string[] => {
    if (!allTasks) return [];

    const allTags = new Set<string>();
    Object.values(allTasks).forEach((taskItem) => {
      taskItem.tags?.forEach((tag) => allTags.add(tag));
    });

    return Array.from(allTags).sort();
  };

  // Filter tag suggestions based on input
  const getFilteredTagSuggestions = (): string[] => {
    const existingTags = getExistingTags();
    const currentTags = formData.tags || [];

    return existingTags.filter((tag) => {
      // Don't show tags that are already added
      if (currentTags.includes(tag)) return false;

      // Filter based on input
      if (!tagInput.trim()) return true;
      return tag.toLowerCase().includes(tagInput.toLowerCase());
    });
  };

  // Helper function to get initials from a name
  const getInitials = (name: string): string => {
    const words = name.split(" ").filter((word) => word.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return words[0]?.substring(0, 2).toUpperCase() || "UN";
  };

  // Helper function to generate avatar color based on name
  const getAvatarColor = (name: string): string => {
    const colors = [
      "#FF6B35",
      "#F7931E",
      "#FFD23F",
      "#A8E6CF",
      "#88D8B0",
      "#3B82F6",
      "#8B5CF6",
      "#EC4899",
      "#EF4444",
      "#10B981",
      "#F59E0B",
      "#8B5CF6",
      "#06B6D4",
      "#84CC16",
      "#F97316",
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        assignee: task.assignee || "",
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
        tags: task.tags || [],
        estimatedHours: task.estimatedHours,
        ...(isEditing && { status: task.status }),
      });
    } else {
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        assignee: "",
        dueDate: "",
        tags: [],
        estimatedHours: undefined,
        ...(defaultStatus && { status: defaultStatus }),
      });
    }
  }, [task, isEditing, defaultStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;

    // If creating and a defaultStatus was provided but not set in formData, include it
    const payload = { ...formData } as any;
    if (!task && defaultStatus && !("status" in payload)) {
      payload.status = defaultStatus;
    }

    onSave(payload);
    onClose();
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !task || !currentUser || !onAddComment) return;

    try {
      await onAddComment(task.id, newComment.trim());
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!task || !currentUser || !onDeleteComment) return;

    try {
      await onDeleteComment(task.id, commentId);
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleAddTag = (tagToAdd?: string) => {
    const tag = tagToAdd || tagInput.trim();
    if (tag && !formData.tags?.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tag],
      }));
      setTagInput("");
      setShowTagSuggestions(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      handleAddTag();
    } else if (e.key === "Escape") {
      setShowTagSuggestions(false);
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    setShowTagSuggestions(value.length > 0 || getExistingTags().length > 0);
  };

  const handleTagInputFocus = () => {
    setShowTagSuggestions(getExistingTags().length > 0);
  };

  const handleTagInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowTagSuggestions(false), 150);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        task ? (isEditing ? "Edit Task" : "Task Details") : "Create New Task"
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-secondary-700 mb-2"
          >
            <FileText className="inline h-4 w-4 mr-1" />
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              isEditing || !task
                ? "border-secondary-300 bg-white"
                : "border-secondary-200 bg-secondary-50"
            }`}
            placeholder="Enter task title..."
            readOnly={!isEditing && !!task}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-secondary-700 mb-2"
          >
            Description
          </label>
          <RichTextEditor
            value={formData.description || ""}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, description: value }))
            }
            placeholder="Enter task description..."
            readOnly={!isEditing && !!task}
            className={`${
              isEditing || !task
                ? "border-secondary-300"
                : "border-secondary-200 bg-secondary-50"
            }`}
          />
        </div>

        {/* Priority and Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-secondary-700 mb-2"
            >
              Priority
            </label>
            <select
              id="priority"
              value={formData.priority}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  priority: e.target.value as TaskPriority,
                }))
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                isEditing || !task
                  ? "border-secondary-300 bg-white"
                  : "border-secondary-200 bg-secondary-50"
              }`}
              disabled={!isEditing && !!task}
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🟠 High</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
          </div>

          {columns.length > 0 &&
            ((isEditing && "status" in formData) ||
              (!task && defaultStatus)) && (
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-secondary-700 mb-2"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={
                    (formData as UpdateTaskRequest).status ||
                    defaultStatus ||
                    ""
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: e.target.value as TaskStatus,
                    }))
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    isEditing || !task
                      ? "border-secondary-300 bg-white"
                      : "border-secondary-200 bg-secondary-50"
                  }`}
                  disabled={!isEditing && !!task}
                >
                  {columns.map((column) => (
                    <option key={column.id} value={column.status}>
                      {column.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
        </div>

        {/* Assignee and Due Date Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              <User className="inline h-4 w-4 mr-1" />
              Assignee
            </label>
            <MemberSelector
              members={members}
              selectedMemberId={formData.assignee}
              onSelect={(memberId) =>
                isEditing || !task
                  ? setFormData((prev) => ({
                      ...prev,
                      assignee: memberId || "",
                    }))
                  : undefined
              }
              placeholder="Select team member..."
              disabled={!isEditing && !!task}
            />
          </div>

          <div>
            <label
              htmlFor="dueDate"
              className="block text-sm font-medium text-secondary-700 mb-2"
            >
              <Calendar className="inline h-4 w-4 mr-1" />
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
              }
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                isEditing || !task
                  ? "border-secondary-300 bg-white"
                  : "border-secondary-200 bg-secondary-50"
              }`}
              readOnly={!isEditing && !!task}
            />
          </div>
        </div>

        {/* Estimated Hours */}
        <div>
          <label
            htmlFor="estimatedHours"
            className="block text-sm font-medium text-secondary-700 mb-2"
          >
            <Clock className="inline h-4 w-4 mr-1" />
            Estimated Hours
          </label>
          <input
            type="number"
            id="estimatedHours"
            value={formData.estimatedHours || ""}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                estimatedHours: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              }))
            }
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
              isEditing || !task
                ? "border-secondary-300 bg-white"
                : "border-secondary-200 bg-secondary-50"
            }`}
            placeholder="Enter estimated hours..."
            readOnly={!isEditing && !!task}
            min="0"
            step="0.5"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            <Tag className="inline h-4 w-4 mr-1" />
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags?.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-700 text-sm rounded-md"
              >
                {tag}
                {(isEditing || !task) && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-primary-500 hover:text-primary-700"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
          {(isEditing || !task) && (
            <div className="relative">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyPress={handleKeyPress}
                  onFocus={handleTagInputFocus}
                  onBlur={handleTagInputBlur}
                  className="flex-1 px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Add a tag..."
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddTag()}
                  disabled={!tagInput.trim()}
                >
                  Add
                </Button>
              </div>

              {/* Tag Suggestions Dropdown */}
              {showTagSuggestions && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-secondary-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {getFilteredTagSuggestions().length > 0 ? (
                    <div className="py-1">
                      {getFilteredTagSuggestions().map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleAddTag(tag)}
                          className="w-full px-3 py-2 text-left hover:bg-secondary-50 text-sm text-secondary-700"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  ) : (
                    tagInput.trim() && (
                      <div className="py-2 px-3 text-sm text-secondary-500">
                        Press Enter to add "{tagInput.trim()}" as a new tag
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Task Metadata (for existing tasks) */}
        {task && (
          <div className="border-t border-secondary-200 pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm text-secondary-600">
              <div>
                <span className="font-medium">Created:</span>{" "}
                {new Date(task.createdAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Updated:</span>{" "}
                {new Date(task.updatedAt).toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Reporter:</span> {task.reporter}
              </div>
              <div>
                <span className="font-medium">ID:</span> #{task.id.slice(0, 8)}
              </div>
            </div>
          </div>
        )}

        {/* Comments Section - Only show for existing tasks */}
        {task && (
          <div className="border-t border-secondary-200 pt-4">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="h-4 w-4 text-secondary-600" />
              <h3 className="text-sm font-medium text-secondary-700">
                Comments ({task.comments?.length || 0})
              </h3>
            </div>

            {/* Comments List */}
            <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
              {task.comments && task.comments.length > 0 ? (
                task.comments.map((comment) => {
                  const author = members[comment.author] || {
                    name: "Unknown User",
                    id: comment.author,
                  };
                  return (
                    <div
                      key={comment.id}
                      className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                        style={{ backgroundColor: getAvatarColor(author.name) }}
                      >
                        {author.avatar ? (
                          <img
                            src={author.avatar}
                            alt={author.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span>{getInitials(author.name)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">
                              {author.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleDateString()}{" "}
                              at{" "}
                              {new Date(comment.createdAt).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                          </div>
                          {/* Delete button - only show for comment author or admin */}
                          {currentUser &&
                            (comment.author === currentUser.id ||
                              currentUser.role === "admin") &&
                            onDeleteComment && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                        </div>
                        <p className="text-sm text-gray-700 break-words">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No comments yet. Be the first to add one!
                </p>
              )}
            </div>

            {/* Add Comment */}
            {currentUser && onAddComment && (
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                  style={{ backgroundColor: getAvatarColor(currentUser.name) }}
                >
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span>{getInitials(currentUser.name)}</span>
                  )}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <Button
                    type="button"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    size="sm"
                    className="px-3"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-secondary-200">
          <div>
            {task && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {task && !isEditing && onEdit && (
              <Button
                type="button"
                variant="secondary"
                onClick={onEdit}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
            {isEditing && (
              <Button
                type="submit"
                className="flex items-center gap-2"
                disabled={!formData.title?.trim()}
              >
                <Save className="h-4 w-4" />
                {task ? "Update" : "Create"} Task
              </Button>
            )}
            {!task && (
              <Button
                type="submit"
                className="flex items-center gap-2"
                disabled={!formData.title?.trim()}
              >
                <Save className="h-4 w-4" />
                Create Task
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
