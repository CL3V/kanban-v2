import { useMemo } from "react";
import { Board, Task, Column } from "@/types/kanban";

interface ColumnData {
  column: Column;
  tasks: Task[];
}

export const useColumnData = (board: Board | null): ColumnData[] => {
  return useMemo(() => {
    if (!board) return [];

    return board.columns.map((column) => {
      const tasks = column.taskIds
        .map((taskId) => board.tasks[taskId])
        .filter((task): task is Task => Boolean(task));

      return {
        column,
        tasks,
      };
    });
  }, [board]);
};

export const useTaskById = (
  board: Board | null,
  taskId: string | null
): Task | null => {
  return useMemo(() => {
    if (!board || !taskId) return null;
    return board.tasks[taskId] || null;
  }, [board, taskId]);
};

export const useBoardStats = (board: Board | null) => {
  return useMemo(() => {
    if (!board) {
      return {
        totalTasks: 0,
        totalColumns: 0,
        tasksByStatus: {},
        completionRate: 0,
      };
    }

    const totalTasks = Object.keys(board.tasks).length;
    const totalColumns = board.columns.length;

    const tasksByStatus = board.columns.reduce((acc, column) => {
      acc[column.status] = column.taskIds.length;
      return acc;
    }, {} as Record<string, number>);

    // Assuming last column is "done" status for completion rate
    const doneColumn = board.columns[board.columns.length - 1];
    const completedTasks = doneColumn
      ? tasksByStatus[doneColumn.status] || 0
      : 0;
    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      totalColumns,
      tasksByStatus,
      completionRate: Math.round(completionRate),
    };
  }, [board]);
};
