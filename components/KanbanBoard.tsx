"use client";

import React, { useState, useEffect } from "react";
import {
  Board,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskStatus,
} from "@/types/kanban";
import { Column } from "./Column";
import { TaskModal } from "./TaskModal";
import { Button } from "./ui/Button";
import { BoardSettings } from "./BoardSettings";
import { Settings, Plus } from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";

interface KanbanBoardProps {
  boardId: string;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ boardId }) => {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalMode, setModalMode] = useState<"create" | "view" | "edit">(
    "create"
  );
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch board data
  useEffect(() => {
    fetchBoard();
  }, [boardId]);

  const fetchBoard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/boards/${boardId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch board");
      }
      const boardData = await response.json();
      setBoard(boardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch board");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: CreateTaskRequest) => {
    try {
      const response = await fetch(`/api/boards/${boardId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      const newTask = await response.json();

      // Optimistic update - add task to board immediately
      if (board) {
        const updatedBoard = { ...board };
        updatedBoard.tasks[newTask.id] = newTask;

        // Add task to appropriate column
        const column = updatedBoard.columns.find(
          (col) => col.status === newTask.status
        );
        if (column) {
          column.taskIds.push(newTask.id);
        }

        setBoard(updatedBoard);
      }
    } catch (err) {
      console.error("Error creating task:", err);
      alert("Failed to create task");
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    taskData: UpdateTaskRequest
  ) => {
    try {
      const response = await fetch(`/api/boards/${boardId}/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      await fetchBoard(); // Refresh board data
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Failed to update task");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/boards/${boardId}/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      await fetchBoard(); // Refresh board data
      setIsTaskModalOpen(false);
      setSelectedTask(null);
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Failed to delete task");
    }
  };

  const handleMoveTask = async (
    taskId: string,
    newStatus: TaskStatus,
    newPosition?: number
  ) => {
    if (!board) return;

    // Optimistic update - update UI immediately
    const updatedBoard = { ...board };
    const task = updatedBoard.tasks[taskId];

    if (!task) return;

    const oldStatus = task.status;

    // Remove task from old column
    const oldColumn = updatedBoard.columns.find(
      (col) => col.status === oldStatus
    );
    if (oldColumn) {
      oldColumn.taskIds = oldColumn.taskIds.filter((id) => id !== taskId);
    }

    // Add task to new column
    const newColumn = updatedBoard.columns.find(
      (col) => col.status === newStatus
    );
    if (newColumn) {
      newColumn.taskIds.push(taskId);
    }

    // Update task status
    task.status = newStatus;
    task.updatedAt = new Date().toISOString();

    // Update board immediately (optimistic)
    setBoard(updatedBoard);

    try {
      const response = await fetch(
        `/api/boards/${boardId}/tasks/${taskId}/move`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newStatus, newPosition }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to move task");
      }
      // Don't fetch board on success - we already updated optimistically
    } catch (err) {
      console.error("Error moving task:", err);
      // Revert optimistic update on error
      await fetchBoard();
      alert("Failed to move task");
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = board?.tasks[active.id as string];
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || !board) return;

    const taskId = active.id as string;
    const task = board.tasks[taskId];
    if (!task) return;

    // Find the target column
    const targetColumn = board.columns.find((col) => col.id === over.id);
    if (!targetColumn) return;

    // If the task is already in the target column, we might just be reordering
    const sourceColumn = board.columns.find(
      (col) => col.status === task.status
    );

    if (sourceColumn?.id === targetColumn.id) {
      // Reordering within the same column - not implemented in this basic version
      return;
    }

    // Move task to new column
    if (task.status !== targetColumn.status) {
      await handleMoveTask(taskId, targetColumn.status);
    }
  };

  const openCreateTaskModal = (columnStatus: TaskStatus) => {
    setActiveColumnId(null);
    setSelectedTask(null);
    setModalMode("create");
    setIsTaskModalOpen(true);
  };

  const openTaskModal = (task: Task, mode: "view" | "edit" = "view") => {
    setSelectedTask(task);
    setModalMode(mode);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
    setActiveColumnId(null);
  };

  const handleTaskSave = async (
    taskData: CreateTaskRequest | UpdateTaskRequest
  ) => {
    if (modalMode === "create") {
      await handleCreateTask(taskData as CreateTaskRequest);
    } else if (modalMode === "edit" && selectedTask) {
      await handleUpdateTask(selectedTask.id, taskData as UpdateTaskRequest);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchBoard}>Retry</Button>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="text-center py-8">
        <p className="text-secondary-600">Board not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Board Header */}
      <div className="bg-white border-b border-secondary-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-secondary-900 truncate">
                {board.title}
              </h1>
              {board.description && (
                <p className="text-secondary-600 mt-1 text-sm line-clamp-2">
                  {board.description}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-3 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() =>
                  openCreateTaskModal(board.columns[0]?.status || "backlog")
                }
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Task
              </Button>

              <BoardSettings board={board} onBoardUpdate={fetchBoard} />
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="max-w-full overflow-x-auto">
          <div className="flex gap-6 p-6 min-w-max">
            {board.columns.map((column) => {
              const columnTasks = column.taskIds
                .map((taskId) => board.tasks[taskId])
                .filter(Boolean)
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                );

              return (
                <Column
                  key={column.id}
                  column={column}
                  tasks={columnTasks}
                  members={board.members}
                  onAddTask={() => openCreateTaskModal(column.status)}
                  onTaskClick={(task) => openTaskModal(task)}
                />
              );
            })}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskCard task={activeTask} members={board?.members} />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={closeTaskModal}
        task={selectedTask || undefined}
        members={board?.members || {}}
        onSave={handleTaskSave}
        onDelete={
          selectedTask ? () => handleDeleteTask(selectedTask.id) : undefined
        }
        isEditing={modalMode === "edit"}
      />
    </div>
  );
};
