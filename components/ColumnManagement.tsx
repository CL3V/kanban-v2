"use client";

import React from "react";
import { Columns, Plus, Edit, Trash2, Hash, GripVertical } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { arrayMove } from "@dnd-kit/sortable";

import { Column, Board, Member } from "@/types/kanban";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { useToast } from "@/contexts/ToastContext";

interface ColumnManagementProps {
  boardId: string;
  columns: Column[];
  onColumnsUpdate: () => void;
  onBoardStateUpdate?: (updater: (board: Board) => Board) => void;
  currentUser?: Member;
}

interface SortableColumnItemProps {
  column: Column;
  onEdit: (column: Column) => void;
  onDelete: (columnId: string, columnTitle: string) => void;
}

const SortableColumnItem: React.FC<SortableColumnItemProps> = ({
  column,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 bg-white border border-secondary-200 rounded-lg ${
        isDragging ? "shadow-lg z-10" : "shadow-sm"
      }`}
    >
      <div className="flex items-center space-x-3 flex-1">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:bg-secondary-100 p-1 rounded"
        >
          <GripVertical className="h-4 w-4 text-secondary-400" />
        </div>
        <div
          className="w-4 h-4 rounded-full ring-2 ring-white shadow-sm"
          style={{ backgroundColor: column.color }}
        />
        <div className="flex-1">
          <h3 className="font-medium text-secondary-900">{column.title}</h3>
          <p className="text-sm text-secondary-500">
            Status:{" "}
            <code className="text-xs bg-secondary-100 px-1 rounded">
              {column.status}
            </code>
            {column.wipLimit && ` • WIP Limit: ${column.wipLimit}`}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onEdit(column)}
          className="text-secondary-600 hover:text-secondary-700"
        >
          <Edit className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onDelete(column.id, column.title)}
          className="text-red-600 hover:text-red-700"
          disabled={column.taskIds.length > 0}
          title={
            column.taskIds.length > 0
              ? "Cannot delete column with tasks"
              : "Delete column"
          }
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export const ColumnManagement: React.FC<ColumnManagementProps> = ({
  boardId,
  columns,
  onColumnsUpdate,
  onBoardStateUpdate,
  currentUser,
}) => {
  const { showSuccess, showError } = useToast();
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingColumn, setEditingColumn] = React.useState<Column | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    title: "",
    status: "",
    wipLimit: undefined as number | undefined,
    color: "#3b82f6" as string,
  });
  const [localColumns, setLocalColumns] = React.useState(columns);

  React.useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const resetForm = () => {
    setFormData({
      title: "",
      status: "",
      wipLimit: undefined,
      color: "#3b82f6",
    });
    setEditingColumn(null);
    setIsSubmitting(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = localColumns.findIndex((col) => col.id === active.id);
    const newIndex = localColumns.findIndex((col) => col.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedColumns = arrayMove(localColumns, oldIndex, newIndex);
    setLocalColumns(reorderedColumns);

    try {
      const response = await fetch(`/api/boards/${boardId}/columns/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-current-user": currentUser ? JSON.stringify(currentUser) : "",
        },
        body: JSON.stringify({
          columnIds: reorderedColumns.map((col) => col.id),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder columns");
      }

      // Update board state optimistically or refresh
      if (onBoardStateUpdate) {
        onBoardStateUpdate((board) => ({
          ...board,
          columns: reorderedColumns,
        }));
      } else {
        onColumnsUpdate();
      }
    } catch (error) {
      console.error("Error reordering columns:", error);
      // Revert local state on error
      setLocalColumns(columns);
      alert("Failed to reorder columns");
    }
  };

  const openAddColumn = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditColumn = (column: Column) => {
    setFormData({
      title: column.title,
      status: column.status,
      wipLimit: column.wipLimit,
      color: column.color || "#3b82f6",
    });
    setEditingColumn(column);
    setIsModalOpen(true);
  };

  const generateStatusFromTitle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      const submitData = {
        ...formData,
        status: editingColumn
          ? formData.status
          : formData.status || generateStatusFromTitle(formData.title),
      };

      const url = editingColumn
        ? `/api/boards/${boardId}/columns/${editingColumn.id}`
        : `/api/boards/${boardId}/columns`;

      const method = editingColumn ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-current-user": currentUser ? JSON.stringify(currentUser) : "",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          error.error || `Failed to ${editingColumn ? "update" : "add"} column`
        );
      }

      const savedColumn = await response.json();

      setIsModalOpen(false);
      resetForm();

      // Update board state optimistically or refresh
      if (onBoardStateUpdate) {
        onBoardStateUpdate((board) => {
          const updatedColumns = editingColumn
            ? board.columns.map((col) =>
                col.id === editingColumn.id ? savedColumn : col
              )
            : [...board.columns, savedColumn];

          return {
            ...board,
            columns: updatedColumns,
          };
        });
      } else {
        onColumnsUpdate();
      }

      showSuccess(
        editingColumn ? "Column Updated" : "Column Added",
        `"${formData.title}" has been ${
          editingColumn ? "updated" : "added"
        } successfully`
      );
    } catch (error) {
      console.error("Error saving column:", error);
      showError(
        editingColumn ? "Update Failed" : "Add Failed",
        error instanceof Error
          ? error.message
          : `Failed to ${editingColumn ? "update" : "add"} column`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteColumn = async (columnId: string, columnTitle: string) => {
    if (
      !confirm(`Delete "${columnTitle}" column? This action cannot be undone.`)
    )
      return;

    try {
      const response = await fetch(
        `/api/boards/${boardId}/columns/${columnId}`,
        {
          method: "DELETE",
          headers: {
            "x-current-user": currentUser ? JSON.stringify(currentUser) : "",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete column");
      }

      // Update board state optimistically or refresh
      if (onBoardStateUpdate) {
        onBoardStateUpdate((board) => ({
          ...board,
          columns: board.columns.filter((col) => col.id !== columnId),
        }));
      } else {
        onColumnsUpdate();
      }

      showSuccess(
        "Column Deleted",
        `"${columnTitle}" has been deleted successfully`
      );
    } catch (error) {
      console.error("Error deleting column:", error);
      showError(
        "Delete Failed",
        error instanceof Error ? error.message : "Failed to delete column"
      );
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Columns className="h-5 w-5 text-secondary-600" />
          <h3 className="font-medium text-secondary-900">
            Board Columns ({columns.length})
          </h3>
        </div>
        <Button size="sm" onClick={openAddColumn}>
          <Plus className="h-4 w-4 mr-1" />
          Add Column
        </Button>
      </div>

      {/* Columns List */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 text-sm text-secondary-600">
          <GripVertical className="h-4 w-4" />
          <span>Drag and drop to reorder columns</span>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localColumns.map((col) => col.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {localColumns.map((column) => (
                <SortableColumnItem
                  key={column.id}
                  column={column}
                  onEdit={openEditColumn}
                  onDelete={handleDeleteColumn}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Keep original fallback for when no columns */}
      <div className="hidden space-y-2">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex items-center justify-between p-3 bg-white border border-secondary-200 rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full ring-2 ring-white shadow-sm"
                style={{ backgroundColor: column.color }}
              />
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-secondary-900">
                    {column.title}
                  </span>
                  {column.wipLimit && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Hash className="h-3 w-3 mr-1" />
                      WIP: {column.wipLimit}
                    </span>
                  )}
                </div>
                <p className="text-sm text-secondary-500">
                  Status: {column.status} • {column.taskIds.length} tasks
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openEditColumn(column)}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteColumn(column.id, column.title)}
                className="text-red-600 hover:text-red-700"
                disabled={column.taskIds.length > 0}
                title={
                  column.taskIds.length > 0
                    ? "Cannot delete column with tasks"
                    : "Delete column"
                }
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Column Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingColumn ? "Edit Column" : "Add New Column"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Column Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., In Progress, Testing, Review..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Status Key {!editingColumn && "(auto-generated)"}
            </label>
            <input
              type="text"
              value={
                editingColumn
                  ? formData.status
                  : generateStatusFromTitle(formData.title)
              }
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., in-progress, testing, review..."
              disabled={!editingColumn}
              required
            />
            <p className="text-xs text-secondary-500 mt-1">
              This is used internally to identify the column status
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              WIP Limit (optional)
            </label>
            <input
              type="number"
              value={formData.wipLimit || ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  wipLimit: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
              className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Maximum number of tasks allowed"
              min="1"
            />
            <p className="text-xs text-secondary-500 mt-1">
              Set a work-in-progress limit to help manage workflow
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-2">
              Column Color
            </label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="w-12 h-10 border border-secondary-300 rounded-md cursor-pointer"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="#3b82f6"
                    pattern="^#[A-Fa-f0-9]{6}$"
                  />
                </div>
                <div
                  className="w-10 h-10 rounded-md border border-secondary-300 shadow-sm"
                  style={{ backgroundColor: formData.color }}
                />
              </div>
              <div className="grid grid-cols-7 gap-2">
                {[
                  "#ef4444",
                  "#f59e0b",
                  "#eab308",
                  "#84cc16",
                  "#22c55e",
                  "#10b981",
                  "#06b6d4",
                  "#3b82f6",
                  "#6366f1",
                  "#8b5cf6",
                  "#a855f7",
                  "#d946ef",
                  "#ec4899",
                  "#f43f5e",
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                    className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                      formData.color === color
                        ? "border-gray-800 ring-2 ring-gray-300"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-secondary-500 mt-1">
              Choose a color to visually identify this column
            </p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!formData.title.trim() || isSubmitting}
            >
              {isSubmitting && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              )}
              {isSubmitting
                ? editingColumn
                  ? "Updating..."
                  : "Adding..."
                : editingColumn
                ? "Update Column"
                : "Add Column"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
