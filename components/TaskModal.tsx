import React, { useState, useEffect } from "react";
import {
  Task,
  TaskPriority,
  TaskStatus,
  CreateTaskRequest,
  UpdateTaskRequest,
  Member,
} from "@/types/kanban";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { MemberSelector } from "./MemberSelector";
import {
  Calendar,
  Clock,
  User,
  Tag,
  FileText,
  Trash2,
  Save,
} from "lucide-react";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  members: { [memberId: string]: Member };
  onSave: (taskData: CreateTaskRequest | UpdateTaskRequest) => void;
  onDelete?: () => void;
  isEditing?: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  members,
  onSave,
  onDelete,
  isEditing = false,
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
      });
    }
  }, [task, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;

    onSave(formData);
    onClose();
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput("");
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
    }
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
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter task title..."
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
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={3}
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter task description..."
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
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="low">🟢 Low</option>
              <option value="medium">🟡 Medium</option>
              <option value="high">🟠 High</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
          </div>

          {isEditing && "status" in formData && (
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-secondary-700 mb-2"
              >
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as TaskStatus,
                  }))
                }
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="backlog">📋 Backlog</option>
                <option value="in-development">⚙️ In Development</option>
                <option value="code-review">👀 Code Review</option>
                <option value="deployed">✅ Deployed</option>
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
                setFormData((prev) => ({ ...prev, assignee: memberId || "" }))
              }
              placeholder="Select team member..."
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
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter estimated hours..."
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
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 text-primary-500 hover:text-primary-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Add a tag..."
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddTag}
              disabled={!tagInput.trim()}
            >
              Add
            </Button>
          </div>
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
            <Button
              type="submit"
              className="flex items-center gap-2"
              disabled={!formData.title?.trim()}
            >
              <Save className="h-4 w-4" />
              {task ? "Update" : "Create"} Task
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
