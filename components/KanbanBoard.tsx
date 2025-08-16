"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskStatus,
  Task,
} from "@/types/kanban";
import { Button } from "./ui/Button";
import { Column } from "./Column";
import { TaskModal } from "./TaskModal";
import { BoardSettings } from "./BoardSettings";
import { BoardHeader, TaskFilters } from "./BoardHeader";
import { BoardStats } from "./BoardStats";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  rectIntersection,
  pointerWithin,
  getFirstCollision,
} from "@dnd-kit/core";
import { TaskCard } from "./TaskCard";
import { useBoard } from "@/hooks/useBoard";
import { PermissionService } from "@/lib/PermissionService";
import { useModalState } from "@/hooks/useModalState";
import { useColumnData } from "@/hooks/useColumnData";
import { Member } from "@/types/kanban";

interface KanbanBoardProps {
  boardId: string;
  currentUser?: Member;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  boardId,
  currentUser,
}) => {
  const {
    board,
    loading,
    error,
    fetchBoard,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    updateBoard,
    updateBoardState,
  } = useBoard(boardId);

  const {
    mode,
    isTaskModalOpen,
    isBoardSettingsOpen,
    selectedTask,
    activeColumnStatus,
    isEditing,
    isCreating,
    openCreateTask,
    openViewTask,
    openEditTask,
    switchToEdit,
    openBoardSettings,
    closeModal,
  } = useModalState();

  const columnData = useColumnData(board);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<TaskFilters>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleCreateTask = useCallback(
    async (taskData: CreateTaskRequest) => {
      if (!currentUser || !PermissionService.canCreateTask(currentUser)) {
        alert("You don't have permission to create tasks");
        return;
      }

      try {
        await createTask(taskData);
        closeModal();
      } catch (err) {
        console.error("Error creating task:", err);
        alert("Failed to create task");
      }
    },
    [createTask, closeModal, currentUser]
  );

  const handleUpdateTask = useCallback(
    async (taskId: string, taskData: UpdateTaskRequest) => {
      if (!currentUser || !PermissionService.canEditTask(currentUser)) {
        alert("You don't have permission to edit tasks");
        return;
      }

      try {
        await updateTask(taskId, taskData);
        closeModal();
      } catch (err) {
        console.error("Error updating task:", err);
        alert("Failed to update task");
      }
    },
    [updateTask, closeModal, currentUser]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      if (!currentUser || !PermissionService.canDeleteTask(currentUser)) {
        alert("You don't have permission to delete tasks");
        return;
      }

      if (!confirm("Are you sure you want to delete this task?")) return;

      try {
        await deleteTask(taskId);
        closeModal();
      } catch (err) {
        console.error("Error deleting task:", err);
        alert("Failed to delete task");
      }
    },
    [deleteTask, closeModal, currentUser]
  );

  const handleMoveTask = useCallback(
    async (taskId: string, newStatus: TaskStatus, newPosition?: number) => {
      try {
        await moveTask(taskId, newStatus, newPosition);
      } catch (err) {
        console.error("Error moving task:", err);
        alert("Failed to move task");
      }
    },
    [moveTask]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const task = board?.tasks[active.id as string];
      if (task) {
        setActiveTask(task);
      }
    },
    [board]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over || !board) return;

      const taskId = active.id as string;
      const task = board.tasks[taskId];
      if (!task) return;

      // Find the target column - check if over.id is a column first
      let targetColumn = board.columns.find((col) => col.id === over.id);

      // If not found directly, it might be a task - find its column
      if (!targetColumn) {
        const overTask = board.tasks[over.id as string];
        if (overTask) {
          targetColumn = board.columns.find(
            (col) => col.status === overTask.status
          );
        }
      }

      if (!targetColumn) return;

      // If the task is already in the target column, we might just be reordering
      const sourceColumn = board.columns.find(
        (col) => col.status === task.status
      );

      if (sourceColumn?.id === targetColumn.id) {
        // Reordering within the same column - not implemented in this basic version
        return;
      }

      // Check WIP limit before moving
      const targetColumnTasks = targetColumn.taskIds
        .map((id) => board.tasks[id])
        .filter(Boolean);

      // Don't count the task being moved if it's already in the target column
      const currentTaskCount = targetColumnTasks.filter(
        (t) => t.id !== taskId
      ).length;

      const willExceedWipLimit =
        targetColumn.wipLimit && currentTaskCount >= targetColumn.wipLimit;

      // Show warning if WIP limit will be exceeded, but still allow the move
      if (willExceedWipLimit) {
        const confirmed = confirm(
          `Moving this task will exceed the WIP limit for "${
            targetColumn.title
          }" (${currentTaskCount + 1}/${
            targetColumn.wipLimit
          }). Continue anyway?`
        );

        if (!confirmed) {
          return; // Cancel the move if user doesn't confirm
        }
      }

      // Move task to new column
      if (task.status !== targetColumn.status) {
        await handleMoveTask(taskId, targetColumn.status);
      }
    },
    [board, handleMoveTask]
  );

  const handleTaskSave = useCallback(
    async (taskData: CreateTaskRequest | UpdateTaskRequest) => {
      if (isCreating) {
        await handleCreateTask(taskData as CreateTaskRequest);
      } else if (isEditing && selectedTask) {
        await handleUpdateTask(selectedTask.id, taskData as UpdateTaskRequest);
      }
    },
    [isCreating, isEditing, selectedTask, handleCreateTask, handleUpdateTask]
  );

  // Filter tasks based on search and filters
  const filteredColumnData = useMemo(() => {
    if (!board) return [];

    return columnData.map(({ column, tasks }) => {
      const filteredTasks = tasks.filter((task) => {
        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const matchesSearch =
            task.title.toLowerCase().includes(searchLower) ||
            task.description?.toLowerCase().includes(searchLower) ||
            task.tags?.some((tag) => tag.toLowerCase().includes(searchLower));

          if (!matchesSearch) return false;
        }

        // Assignee filter
        if (filters.assignee && task.assignee !== filters.assignee) {
          return false;
        }

        // Priority filter
        if (filters.priority && task.priority !== filters.priority) {
          return false;
        }

        // Tags filter
        if (filters.tags && filters.tags.length > 0) {
          const hasMatchingTag = filters.tags.some((filterTag) =>
            task.tags?.some(
              (taskTag) => taskTag.toLowerCase() === filterTag.toLowerCase()
            )
          );
          if (!hasMatchingTag) return false;
        }

        return true;
      });

      return { column, tasks: filteredTasks };
    });
  }, [columnData, searchTerm, filters, board]);

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleFiltersChange = useCallback((newFilters: TaskFilters) => {
    setFilters(newFilters);
  }, []);

  const handleAddComment = useCallback(
    async (taskId: string, content: string) => {
      if (!currentUser || !board) return;

      try {
        const response = await fetch(
          `/api/boards/${boardId}/tasks/${taskId}/comments`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              content,
              author: currentUser.id,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error Response:", errorData);
          throw new Error(
            errorData.details || errorData.error || "Failed to add comment"
          );
        }

        // Get the new comment from response
        const newComment = await response.json();

        // Update the task with the new comment using optimistic update
        updateBoardState((prevBoard) => {
          const updatedBoard = { ...prevBoard };
          const task = updatedBoard.tasks[taskId];

          if (task) {
            // Check if comment already exists to prevent duplicates
            const commentExists = task.comments?.some(
              (comment) => comment.id === newComment.id
            );

            if (!commentExists) {
              updatedBoard.tasks[taskId] = {
                ...task,
                comments: [...(task.comments || []), newComment],
              };
            }
          }

          return updatedBoard;
        });
      } catch (error) {
        console.error("Error adding comment:", error);
        alert("Failed to add comment");
      }
    },
    [boardId, currentUser, board, updateBoardState]
  );

  const handleDeleteComment = useCallback(
    async (taskId: string, commentId: string) => {
      if (!currentUser || !board) return;

      try {
        const response = await fetch(
          `/api/boards/${boardId}/tasks/${taskId}/comments?commentId=${commentId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error Response:", errorData);
          throw new Error(
            errorData.details || errorData.error || "Failed to delete comment"
          );
        }

        // Update the task by removing the comment using optimistic update
        updateBoardState((prevBoard) => {
          const updatedBoard = { ...prevBoard };
          const task = updatedBoard.tasks[taskId];

          if (task && task.comments) {
            updatedBoard.tasks[taskId] = {
              ...task,
              comments: task.comments.filter(
                (comment) => comment.id !== commentId
              ),
            };
          }

          return updatedBoard;
        });
      } catch (error) {
        console.error("Error deleting comment:", error);
        alert("Failed to delete comment");
      }
    },
    [boardId, currentUser, board, updateBoardState]
  );

  // Custom collision detection that prioritizes column drop zones
  const customCollisionDetection = useCallback(
    (args: any) => {
      // First, try to find collisions with columns
      const columnCollisions = rectIntersection({
        ...args,
        droppableContainers: args.droppableContainers.filter((container: any) =>
          board?.columns.some((col) => col.id === container.id)
        ),
      });

      if (columnCollisions.length > 0) {
        return columnCollisions;
      }

      // Fallback to default collision detection
      return rectIntersection(args);
    },
    [board]
  );

  const renderContent = useMemo(() => {
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
          <Button onClick={() => window.location.reload()}>Retry</Button>
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

    return null;
  }, [loading, error, board]);

  if (renderContent) {
    return renderContent;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Board Header */}
      <BoardHeader
        board={board!}
        onUpdateBoard={updateBoard}
        onOpenCreateTask={() =>
          openCreateTask(board!.columns[0]?.status || "todo")
        }
        onOpenBoardSettings={openBoardSettings}
        onSearchChange={handleSearchChange}
        onFiltersChange={handleFiltersChange}
        canCreateTask={
          currentUser ? PermissionService.canCreateTask(currentUser) : false
        }
        canManageBoard={
          currentUser
            ? PermissionService.canManageProjectMembers(currentUser)
            : false
        }
      />

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto bg-gray-50">
          <div className="flex gap-4 p-6 h-full min-w-max">
            {filteredColumnData.map(({ column, tasks }) => (
              <Column
                key={column.id}
                column={column}
                tasks={tasks}
                members={board!.members}
                onAddTask={() => openCreateTask(column.status)}
                onTaskClick={openViewTask}
                canAddTask={
                  currentUser
                    ? PermissionService.canCreateTask(currentUser)
                    : false
                }
              />
            ))}
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
        onClose={closeModal}
        task={
          selectedTask
            ? board?.tasks[selectedTask.id] || selectedTask
            : undefined
        }
        members={board?.members || {}}
        columns={board?.columns || []}
        allTasks={board?.tasks}
        defaultStatus={isCreating ? activeColumnStatus || undefined : undefined}
        onSave={handleTaskSave}
        onDelete={
          selectedTask ? () => handleDeleteTask(selectedTask.id) : undefined
        }
        isEditing={isEditing}
        onEdit={switchToEdit}
        currentUser={currentUser}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
      />

      {/* Board Settings Modal */}
      <BoardSettings
        board={board!}
        onBoardUpdate={updateBoard}
        onBoardStateUpdate={updateBoardState}
        isOpen={isBoardSettingsOpen}
        onClose={closeModal}
        currentUser={currentUser}
      />
    </div>
  );
};
