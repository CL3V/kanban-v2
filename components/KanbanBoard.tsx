"use client";

import React from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  rectIntersection,
} from "@dnd-kit/core";

import {
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskStatus,
  Task,
} from "@/types/kanban";
import { Button } from "./ui/Button";
import { Column } from "./Column";
import { TaskModal } from "./TaskModal";
import { BoardHeader, TaskFilters } from "./BoardHeader";
import { ColumnManagement } from "./ColumnManagement";
import { Modal } from "./ui/Modal";
import { TaskCard } from "./TaskCard";
import { useBoard } from "@/hooks/useBoard";
import { PermissionService } from "@/lib/PermissionService";
import {
  SkeletonBoard,
  SkeletonHeader,
  SkeletonButton,
} from "@/components/ui/Skeleton";
import { useModalState } from "@/hooks/useModalState";
import { useColumnData } from "@/hooks/useColumnData";
import { useToast } from "@/contexts/ToastContext";
import { useCSRF } from "@/hooks/useCSRF";
import { Member } from "@/types/kanban";

interface KanbanBoardProps {
  boardId: string;
  currentUser?: Member;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  boardId,
  currentUser,
}) => {
  const { showSuccess, showError } = useToast();
  const { secureApiCall } = useCSRF();
  const {
    board,
    loading,
    error,
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
    selectedTask,
    activeColumnStatus,
    isEditing,
    isCreating,
    openCreateTask,
    openViewTask,
    openEditTask,
    switchToEdit,
    closeModal,
  } = useModalState();

  const columnData = useColumnData(board);
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filters, setFilters] = React.useState<TaskFilters>({});
  const [scrollContainerRef, setScrollContainerRef] =
    React.useState<HTMLDivElement | null>(null);
  const [topScrollRef, setTopScrollRef] = React.useState<HTMLDivElement | null>(
    null
  );
  const [needsHorizontalScroll, setNeedsHorizontalScroll] =
    React.useState(false);
  const [showColumnManagement, setShowColumnManagement] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleCreateTask = React.useCallback(
    async (taskData: CreateTaskRequest) => {
      if (!currentUser || !PermissionService.canCreateTask(currentUser)) {
        showError(
          "Permission Denied",
          "You don't have permission to create tasks"
        );
        return;
      }

      try {
        await createTask(taskData);
        showSuccess(
          "Task Created",
          `"${taskData.title}" has been created successfully`
        );
        closeModal();
      } catch (err) {
        console.error("Error creating task:", err);
        showError("Creation Failed", "Failed to create task");
      }
    },
    [createTask, closeModal, currentUser, showSuccess, showError]
  );

  const handleUpdateTask = React.useCallback(
    async (taskId: string, taskData: UpdateTaskRequest) => {
      if (!currentUser || !PermissionService.canEditTask(currentUser)) {
        showError(
          "Permission Denied",
          "You don't have permission to edit tasks"
        );
        return;
      }

      try {
        await updateTask(taskId, taskData);
        showSuccess(
          "Task Updated",
          `"${taskData.title}" has been updated successfully`
        );
        closeModal();
      } catch (err) {
        showError("Update Failed", "Failed to update task");
      }
    },
    [updateTask, closeModal, currentUser, showSuccess, showError]
  );

  const handleDeleteTask = React.useCallback(
    async (taskId: string) => {
      if (!currentUser || !PermissionService.canDeleteTask(currentUser)) {
        showError(
          "Permission Denied",
          "You don't have permission to delete tasks"
        );
        return;
      }

      if (!confirm("Are you sure you want to delete this task?")) return;

      try {
        const taskTitle = board?.tasks[taskId]?.title || "Task";
        await deleteTask(taskId);
        showSuccess(
          "Task Deleted",
          `"${taskTitle}" has been deleted successfully`
        );
        closeModal();
      } catch (err) {
        console.error("Error deleting task:", err);
        showError("Delete Failed", "Failed to delete task");
      }
    },
    [deleteTask, closeModal, currentUser, board, showSuccess, showError]
  );

  const handleMoveTask = React.useCallback(
    async (taskId: string, newStatus: TaskStatus, newPosition?: number) => {
      try {
        await moveTask(taskId, newStatus, newPosition);
        const taskTitle = board?.tasks[taskId]?.title || "Task";
        showSuccess("Task Moved", `"${taskTitle}" moved to ${newStatus}`);
      } catch (err) {
        console.error("Error moving task:", err);
        showError("Move Failed", "Failed to move task");
      }
    },
    [moveTask, board, showSuccess, showError]
  );

  const handleDragStart = React.useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const task = board?.tasks[active.id as string];
      if (task) {
        setActiveTask(task);
      }
    },
    [board]
  );

  const handleDragEnd = React.useCallback(
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

  const handleTaskSave = React.useCallback(
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
  const filteredColumnData = React.useMemo(() => {
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

  const handleSearchChange = React.useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  const handleFiltersChange = React.useCallback((newFilters: TaskFilters) => {
    setFilters(newFilters);
  }, []);

  const handleAddComment = React.useCallback(
    async (taskId: string, content: string) => {
      if (!currentUser || !board) return;

      try {
        const response = await secureApiCall(
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
    [boardId, currentUser, board, updateBoardState, secureApiCall]
  );

  const handleDeleteComment = React.useCallback(
    async (taskId: string, commentId: string) => {
      if (!currentUser || !board) return;

      try {
        const response = await secureApiCall(
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
    [boardId, currentUser, board, updateBoardState, secureApiCall]
  );

  const handleUpdateComment = React.useCallback(
    async (taskId: string, commentId: string, content: string) => {
      if (!currentUser || !board) return;

      try {
        const response = await secureApiCall(
          `/api/boards/${boardId}/tasks/${taskId}/comments`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              commentId,
              content,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error Response:", errorData);
          throw new Error(
            errorData.details || errorData.error || "Failed to update comment"
          );
        }

        // Update the task by modifying the comment using optimistic update
        updateBoardState((prevBoard) => {
          const updatedBoard = { ...prevBoard };
          const task = updatedBoard.tasks[taskId];

          if (task && task.comments) {
            updatedBoard.tasks[taskId] = {
              ...task,
              comments: task.comments.map((comment) =>
                comment.id === commentId
                  ? { ...comment, content, updatedAt: new Date().toISOString() }
                  : comment
              ),
            };
          }

          return updatedBoard;
        });
      } catch (error) {
        console.error("Error updating comment:", error);
        alert("Failed to update comment");
      }
    },
    [boardId, currentUser, board, updateBoardState, secureApiCall]
  );

  const handleColumnsUpdate = React.useCallback(() => {
    // This will be handled by the API calls within ColumnManagement
    // The component uses optimistic updates via onBoardStateUpdate
  }, []);

  // Custom collision detection that prioritizes column drop zones
  const customCollisionDetection = React.useCallback(
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

  // Check if horizontal scrolling is needed
  const checkScrollNeeded = React.useCallback(() => {
    if (scrollContainerRef) {
      const needsScroll =
        scrollContainerRef.scrollWidth > scrollContainerRef.clientWidth;
      setNeedsHorizontalScroll(needsScroll);
    }
  }, [scrollContainerRef]);

  // Sync scrolling between top scrollbar and content
  const handleTopScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (scrollContainerRef) {
        scrollContainerRef.scrollLeft = e.currentTarget.scrollLeft;
      }
    },
    [scrollContainerRef]
  );

  const handleContentScroll = React.useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (topScrollRef) {
        topScrollRef.scrollLeft = e.currentTarget.scrollLeft;
      }
    },
    [topScrollRef]
  );

  // Check scroll needed when component updates or window resizes
  React.useEffect(() => {
    checkScrollNeeded();
    const handleResize = () => checkScrollNeeded();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [checkScrollNeeded, filteredColumnData]);

  // Check scroll needed when container ref changes
  React.useEffect(() => {
    if (scrollContainerRef) {
      checkScrollNeeded();
    }
  }, [scrollContainerRef, checkScrollNeeded]);

  const renderContent = React.useMemo(() => {
    if (loading) {
      return (
        <div className="flex flex-col h-screen overflow-y-hidden">
          <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SkeletonButton className="w-12" />
              <div className="w-7 h-7 bg-gray-200 rounded-sm animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
              <div>
                <SkeletonHeader className="w-48 mb-2" />
                <div className="w-32 h-3 bg-gray-200 rounded animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <SkeletonButton className="w-20" />
              <SkeletonButton className="w-24" />
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
            </div>
          </header>

          {/* Skeleton Kanban Board */}
          <div className="flex-1 bg-white">
            <SkeletonBoard />
          </div>

          {/* Skeleton Bottom Scrollbar */}
          <div className="bg-white border-t border-gray-100 px-6">
            <div className="py-2">
              <div className="w-full h-3 bg-gray-200 rounded-full animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
            </div>
          </div>
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
    <div className="flex flex-col h-full overflow-y-hidden bg-white">
      {/* Board Header */}
      <BoardHeader
        board={board!}
        onUpdateBoard={updateBoard}
        onOpenCreateTask={() =>
          openCreateTask(board!.columns[0]?.status || "todo")
        }
        onOpenColumnManagement={() => setShowColumnManagement(true)}
        onSearchChange={handleSearchChange}
        onFiltersChange={handleFiltersChange}
        canCreateTask={
          currentUser ? PermissionService.canCreateTask(currentUser) : false
        }
        canManageColumns={
          currentUser ? PermissionService.canManageColumns(currentUser) : false
        }
      />

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={setScrollContainerRef}
          className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden bg-white content-scrollbar"
          onScroll={handleContentScroll}
        >
          <div className="flex gap-6 pl-6 pr-6 py-6 h-full min-w-max">
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

      {/* Bottom Scrollbar - Only show if content overflows */}
      {needsHorizontalScroll && (
        <div className="bg-white border-t border-gray-100 px-6">
          <div className="py-2">
            <div
              ref={setTopScrollRef}
              className="overflow-x-auto top-scrollbar"
              onScroll={handleTopScroll}
            >
              <div
                style={{
                  width:
                    filteredColumnData.length * 320 +
                    (filteredColumnData.length - 1) * 24 +
                    48 +
                    "px",
                  height: "1px",
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

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
        onUpdateComment={handleUpdateComment}
      />

      {/* Column Management Modal */}
      <Modal
        isOpen={showColumnManagement}
        onClose={() => setShowColumnManagement(false)}
        title="Manage Board Columns"
        size="lg"
      >
        <ColumnManagement
          boardId={boardId}
          columns={board?.columns || []}
          onColumnsUpdate={handleColumnsUpdate}
          onBoardStateUpdate={updateBoardState}
          currentUser={currentUser}
        />
      </Modal>
    </div>
  );
};
