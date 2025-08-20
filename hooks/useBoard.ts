import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Board,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskStatus,
} from "@/types/kanban";
import { useCSRF } from "./useCSRF";

interface UseBoardState {
  board: Board | null;
  loading: boolean;
  error: string | null;
}

interface UseBoardActions {
  fetchBoard: () => Promise<void>;
  createTask: (taskData: CreateTaskRequest) => Promise<void>;
  updateTask: (taskId: string, taskData: UpdateTaskRequest) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (
    taskId: string,
    newStatus: TaskStatus,
    newPosition?: number
  ) => Promise<void>;
  updateBoard: (boardData: Partial<Board>) => Promise<void>;
  updateBoardState: (updater: (board: Board) => Board) => void;
}

export const useBoard = (boardId: string): UseBoardState & UseBoardActions => {
  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { secureApiCall } = useCSRF();

  const fetchBoard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/boards/${boardId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch board");
      }

      const boardData = await response.json();
      setBoard(boardData);
    } catch (err) {
      console.error("Error fetching board:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch board");
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  const createTask = useCallback(
    async (taskData: CreateTaskRequest) => {
      if (!board) return;

      try {
        const response = await secureApiCall(`/api/boards/${boardId}/tasks`, {
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

        // Try optimistic update, otherwise refresh board to sync server-created columns
        let placedOptimistically = false;
        setBoard((prevBoard) => {
          if (!prevBoard) return prevBoard;

          const updatedBoard = { ...prevBoard };
          updatedBoard.tasks[newTask.id] = newTask;

          // Add task to appropriate column only if not already present
          const column = updatedBoard.columns.find(
            (col) => col.status === newTask.status
          );
          if (column) {
            if (!column.taskIds.includes(newTask.id)) {
              column.taskIds.push(newTask.id);
            }
            placedOptimistically = true;
          }

          return updatedBoard;
        });

        // If we couldn't place the task (e.g., board had zero columns), fetch latest board from server
        if (!placedOptimistically) {
          await fetchBoard();
        }
      } catch (err) {
        console.error("Error creating task:", err);
        throw err;
      }
    },
    [boardId, board, fetchBoard, secureApiCall]
  );

  const updateTask = useCallback(
    async (taskId: string, taskData: UpdateTaskRequest) => {
      try {
        const response = await secureApiCall(
          `/api/boards/${boardId}/tasks/${taskId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(taskData),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update task");
        }

        // Optimistic update
        setBoard((prevBoard) => {
          if (!prevBoard) return prevBoard;

          const updatedBoard = { ...prevBoard };
          const currentTask = updatedBoard.tasks[taskId];

          if (!currentTask) return prevBoard;

          const oldStatus = currentTask.status;
          const updatedTask = {
            ...currentTask,
            ...taskData,
            updatedAt: new Date().toISOString(),
          };

          updatedBoard.tasks[taskId] = updatedTask;

          // If status changed, move task between columns
          if (taskData.status && taskData.status !== oldStatus) {
            // Remove from old column
            const oldColumn = updatedBoard.columns.find(
              (col) => col.status === oldStatus
            );
            if (oldColumn) {
              oldColumn.taskIds = oldColumn.taskIds.filter(
                (id) => id !== taskId
              );
            }

            // Add to new column
            const newColumn = updatedBoard.columns.find(
              (col) => col.status === taskData.status
            );
            if (newColumn && !newColumn.taskIds.includes(taskId)) {
              newColumn.taskIds.push(taskId);
            }
          }

          return updatedBoard;
        });
      } catch (err) {
        console.error("Error updating task:", err);
        // Only refresh on error to revert optimistic update
        await fetchBoard();
        throw err;
      }
    },
    [boardId, fetchBoard, secureApiCall]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      try {
        const response = await secureApiCall(
          `/api/boards/${boardId}/tasks/${taskId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to delete task");
        }

        // Optimistic update
        setBoard((prevBoard) => {
          if (!prevBoard) return prevBoard;

          const updatedBoard = { ...prevBoard };
          const task = updatedBoard.tasks[taskId];

          if (task) {
            // Remove from tasks
            delete updatedBoard.tasks[taskId];

            // Remove from column
            const column = updatedBoard.columns.find(
              (col) => col.status === task.status
            );
            if (column) {
              column.taskIds = column.taskIds.filter((id) => id !== taskId);
            }
          }

          return updatedBoard;
        });
      } catch (err) {
        console.error("Error deleting task:", err);
        throw err;
      }
    },
    [boardId, secureApiCall]
  );

  const moveTask = useCallback(
    async (taskId: string, newStatus: TaskStatus, newPosition?: number) => {
      if (!board) return;

      // Optimistic update first
      setBoard((prevBoard) => {
        if (!prevBoard) return prevBoard;

        const updatedBoard = { ...prevBoard };
        const task = updatedBoard.tasks[taskId];

        if (!task) return prevBoard;

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
          if (typeof newPosition === "number" && newPosition >= 0) {
            newColumn.taskIds.splice(newPosition, 0, taskId);
          } else {
            newColumn.taskIds.push(taskId);
          }
        }

        // Update task status
        task.status = newStatus;
        task.updatedAt = new Date().toISOString();

        return updatedBoard;
      });

      try {
        const response = await secureApiCall(
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
          // Revert optimistic update on error
          await fetchBoard();
        }
      } catch (err) {
        console.error("Error moving task:", err);
        // Revert optimistic update on error
        await fetchBoard();
        throw err;
      }
    },
    [boardId, board, fetchBoard, secureApiCall]
  );

  const updateBoard = useCallback(
    async (boardData: Partial<Board>) => {
      try {
        console.log("useBoard: Updating board with data:", boardData);

        if (!boardData || Object.keys(boardData).length === 0) {
          console.error("useBoard: No data provided for update");
          throw new Error("No data provided for board update");
        }

        const response = await secureApiCall(`/api/boards/${boardId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(boardData),
        });

        console.log("useBoard: Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("useBoard: Error response:", errorData);
          throw new Error(
            errorData.details || errorData.error || "Failed to update board"
          );
        }

        const updatedBoard = await response.json();
        console.log("useBoard: Board updated successfully");
        setBoard(updatedBoard);
      } catch (err) {
        console.error("useBoard: Error updating board:", err);
        throw err;
      }
    },
    [boardId, secureApiCall]
  );

  const updateBoardState = useCallback((updater: (board: Board) => Board) => {
    setBoard((prevBoard) => {
      if (!prevBoard) return prevBoard;
      return updater(prevBoard);
    });
  }, []);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  return {
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
  };
};
