"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Board, Task, Member } from "@/types/kanban";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  Users,
  Calendar,
  Target,
  Activity,
  PieChart,
  Download,
} from "lucide-react";
import { Button } from "./ui/Button";

interface ReportsProps {
  board: Board;
  currentUser?: Member;
}

interface TaskMetrics {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  completionRate: number;
  averageCompletionTime: number;
}

interface MemberMetrics {
  memberId: string;
  memberName: string;
  tasksAssigned: number;
  tasksCompleted: number;
  completionRate: number;
}

interface PriorityMetrics {
  urgent: number;
  high: number;
  medium: number;
  low: number;
}

interface ColumnMetrics {
  columnTitle: string;
  taskCount: number;
  wipLimit?: number;
  utilizationRate: number;
}

export const Reports: React.FC<ReportsProps> = ({ board, currentUser }) => {
  const [selectedDateRange, setSelectedDateRange] = useState<
    "7d" | "30d" | "90d" | "all"
  >("30d");

  // Helper function to check if task is completed (based on Done column)
  const isTaskCompleted = (task: Task) => {
    if (!board || !board.columns) return false;
    const doneColumn = board.columns.find(
      (column) =>
        column.title.toLowerCase() === "done" || column.status === "done"
    );
    return doneColumn ? doneColumn.taskIds.includes(task.id) : false;
  };

  // Helper function to check if task is in progress
  const isTaskInProgress = (task: Task) => {
    if (!board || !board.columns) return false;
    const progressColumns = board.columns.filter((column) => {
      const title = column.title.toLowerCase();
      return (
        title.includes("progress") ||
        title.includes("development") ||
        title.includes("review") ||
        title.includes("testing") ||
        (title !== "todo" && title !== "done" && title !== "backlog")
      );
    });
    return progressColumns.some((column) => column.taskIds.includes(task.id));
  };

  // Calculate task metrics
  const taskMetrics: TaskMetrics = useMemo(() => {
    const allTasks = Object.values(board.tasks || {});
    const completed = allTasks.filter(isTaskCompleted).length;
    const inProgress = allTasks.filter(isTaskInProgress).length;
    const todo = allTasks.length - completed - inProgress;

    return {
      total: allTasks.length,
      completed,
      inProgress,
      todo,
      completionRate:
        allTasks.length > 0 ? (completed / allTasks.length) * 100 : 0,
      averageCompletionTime: 0, // Could be calculated with creation/completion dates
    };
  }, [board, isTaskCompleted, isTaskInProgress]);

  // Calculate member metrics
  const memberMetrics: MemberMetrics[] = useMemo(() => {
    const members = Object.values(board.members || {});
    const allTasks = Object.values(board.tasks || {});

    return members.map((member) => {
      const memberTasks = allTasks.filter(
        (task) => task.assignee === member.id
      );
      const memberCompletedTasks = memberTasks.filter(isTaskCompleted);

      return {
        memberId: member.id,
        memberName: member.name,
        tasksAssigned: memberTasks.length,
        tasksCompleted: memberCompletedTasks.length,
        completionRate:
          memberTasks.length > 0
            ? (memberCompletedTasks.length / memberTasks.length) * 100
            : 0,
      };
    });
  }, [board, isTaskCompleted]);

  // Calculate priority metrics
  const priorityMetrics: PriorityMetrics = useMemo(() => {
    const allTasks = Object.values(board.tasks || {});

    return {
      urgent: allTasks.filter((task) => task.priority === "urgent").length,
      high: allTasks.filter((task) => task.priority === "high").length,
      medium: allTasks.filter((task) => task.priority === "medium").length,
      low: allTasks.filter((task) => task.priority === "low").length,
    };
  }, [board]);

  // Calculate column metrics
  const columnMetrics: ColumnMetrics[] = useMemo(() => {
    return board.columns.map((column) => {
      const taskCount = column.taskIds.length;
      const utilizationRate = column.wipLimit
        ? (taskCount / column.wipLimit) * 100
        : 0;

      return {
        columnTitle: column.title,
        taskCount,
        wipLimit: column.wipLimit,
        utilizationRate,
      };
    });
  }, [board]);

  // Generate export data
  const exportData = () => {
    const exportObj = {
      boardTitle: board.title,
      generatedAt: new Date().toISOString(),
      taskMetrics,
      memberMetrics,
      priorityMetrics,
      columnMetrics,
    };

    const dataStr = JSON.stringify(exportObj, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${board.title}-report-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-gray-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Project Reports
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Analytics and insights for {board.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <Button
              onClick={exportData}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {taskMetrics.total}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {taskMetrics.completed}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {taskMetrics.inProgress}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Completion Rate
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {taskMetrics.completionRate.toFixed(1)}%
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Task Distribution Chart */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Task Distribution
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (taskMetrics.completed / taskMetrics.total) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {taskMetrics.completed}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm text-gray-600">In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (taskMetrics.inProgress / taskMetrics.total) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {taskMetrics.inProgress}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-500 rounded"></div>
                  <span className="text-sm text-gray-600">To Do</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gray-500 h-2 rounded-full"
                      style={{
                        width: `${
                          (taskMetrics.todo / taskMetrics.total) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {taskMetrics.todo}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Priority Distribution
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm text-gray-600">Urgent</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {priorityMetrics.urgent}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-sm text-gray-600">High</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {priorityMetrics.high}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-sm text-gray-600">Medium</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {priorityMetrics.medium}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm text-gray-600">Low</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {priorityMetrics.low}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Team Performance */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Team Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {memberMetrics.map((member) => (
                  <tr key={member.memberId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.memberName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {member.tasksAssigned}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {member.tasksCompleted}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${member.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">
                          {member.completionRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Column Utilization */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Column Utilization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {columnMetrics.map((column) => (
              <div
                key={column.columnTitle}
                className="border border-gray-200 rounded-lg p-4"
              >
                <h4 className="font-medium text-gray-900 mb-2">
                  {column.columnTitle}
                </h4>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Tasks: {column.taskCount}</span>
                  {column.wipLimit && <span>Limit: {column.wipLimit}</span>}
                </div>
                {column.wipLimit && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        column.utilizationRate > 100
                          ? "bg-red-500"
                          : column.utilizationRate > 80
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(column.utilizationRate, 100)}%`,
                      }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
