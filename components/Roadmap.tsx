"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Board, Task, Member } from "@/types/kanban";
import { Button } from "./ui/Button";
import { Calendar, Clock, Users, Plus } from "lucide-react";

interface RoadmapProps {
  board: Board;
  currentUser?: Member;
}

interface Epic {
  id: string;
  title: string;
  description?: string;
  status: "planning" | "in_progress" | "completed";
  startDate?: Date;
  endDate?: Date;
  tasks: Task[];
  color: string;
}

export const Roadmap: React.FC<RoadmapProps> = ({ board, currentUser }) => {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [viewMode, setViewMode] = useState<"months" | "quarters">("months");

  // Generate timeline months for Gantt chart
  const generateTimeline = () => {
    const now = new Date();
    const months = [];

    // Start from current month and show next 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      months.push(date);
    }

    return months;
  };

  const timeline = generateTimeline();

  // Calculate epic position on timeline
  const getEpicPosition = (epic: Epic) => {
    const timelineStart = timeline[0];
    const timelineEnd = new Date(timeline[timeline.length - 1]);
    timelineEnd.setMonth(timelineEnd.getMonth() + 1); // End of last month

    const totalTimelineWidth = timelineEnd.getTime() - timelineStart.getTime();
    const epicStart = epic.startDate!.getTime() - timelineStart.getTime();
    const epicDuration = epic.endDate!.getTime() - epic.startDate!.getTime();

    const leftPercent = Math.max(0, (epicStart / totalTimelineWidth) * 100);
    const widthPercent = Math.min(
      100 - leftPercent,
      (epicDuration / totalTimelineWidth) * 100
    );

    return { left: leftPercent, width: widthPercent };
  };

  // Helper function to check if task is completed (based on Done column)
  const isTaskCompleted = useCallback(
    (task: Task) => {
      if (!board || !board.columns) return false;

      // Find the Done column
      const doneColumn = board.columns.find(
        (column) =>
          column.title.toLowerCase() === "done" || column.status === "done"
      );

      // Check if task is in the Done column
      return doneColumn ? doneColumn.taskIds.includes(task.id) : false;
    },
    [board]
  );

  // Helper function to check if task is in progress (based on columns)
  const isTaskInProgress = useCallback(
    (task: Task) => {
      if (!board || !board.columns) return false;

      // Find columns that represent work in progress
      const progressColumns = board.columns.filter((column) => {
        const title = column.title.toLowerCase();
        const status = column.status.toLowerCase();

        return (
          title.includes("progress") ||
          title.includes("development") ||
          title.includes("review") ||
          title.includes("testing") ||
          status.includes("progress") ||
          status.includes("development") ||
          status.includes("review") ||
          (title !== "todo" && title !== "done" && title !== "backlog")
        );
      });

      // Check if task is in any progress column
      return progressColumns.some((column) => column.taskIds.includes(task.id));
    },
    [board]
  );

  // Generate epics from board data
  useEffect(() => {
    if (!board || !board.tasks) return;

    // Group tasks by epic (using tags as epic identifiers for now)
    const epicMap = new Map<string, Task[]>();
    const allTasks = Object.values(board.tasks);

    // Default epic for tasks without tags
    epicMap.set("General Tasks", []);

    allTasks.forEach((task) => {
      if (task.tags && task.tags.length > 0) {
        // Use first tag as epic name
        const epicName = task.tags[0];
        if (!epicMap.has(epicName)) {
          epicMap.set(epicName, []);
        }
        epicMap.get(epicName)!.push(task);
      } else {
        epicMap.get("General Tasks")!.push(task);
      }
    });

    // Convert to Epic objects
    const colors = [
      "#3b82f6", // blue
      "#10b981", // emerald
      "#f59e0b", // amber
      "#ef4444", // red
      "#8b5cf6", // violet
      "#06b6d4", // cyan
      "#ec4899", // pink
      "#84cc16", // lime
    ];

    const generatedEpics: Epic[] = Array.from(epicMap.entries()).map(
      ([name, tasks], index) => {
        // Calculate status based on tasks
        const completedTasks = tasks.filter(isTaskCompleted).length;
        const inProgressTasks = tasks.filter(isTaskInProgress).length;

        let status: Epic["status"] = "planning";
        if (completedTasks === tasks.length && tasks.length > 0) {
          status = "completed";
        } else if (inProgressTasks > 0 || completedTasks > 0) {
          status = "in_progress";
        }

        // Calculate realistic dates based on epic size and current date
        const now = new Date();
        const startDate = new Date(now);

        // Stagger epics by 2 weeks, with some randomness
        const daysToAdd = index * 14 + Math.floor(Math.random() * 7);
        startDate.setDate(startDate.getDate() + daysToAdd);

        const endDate = new Date(startDate);
        // Epic duration based on task count: 2-8 weeks
        const epicDurationWeeks = Math.max(
          2,
          Math.min(8, Math.ceil(tasks.length / 3))
        );
        endDate.setDate(endDate.getDate() + epicDurationWeeks * 7);

        return {
          id: `epic-${index}`,
          title: name,
          description: `Contains ${tasks.length} task${
            tasks.length !== 1 ? "s" : ""
          }`,
          status,
          startDate,
          endDate,
          tasks,
          color: colors[index % colors.length],
        };
      }
    );

    setEpics(generatedEpics.filter((epic) => epic.tasks.length > 0));
  }, [board, isTaskCompleted, isTaskInProgress]);

  const getStatusLabel = (status: Epic["status"]) => {
    switch (status) {
      case "planning":
        return "Planning";
      case "in_progress":
        return "In Progress";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  const getStatusColor = (status: Epic["status"]) => {
    switch (status) {
      case "planning":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Project Roadmap
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Epic timeline and progress tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setViewMode("months")}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === "months"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Months
              </button>
              <button
                onClick={() => setViewMode("quarters")}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === "quarters"
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Quarters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex">
          {/* Epic Names Column */}
          <div className="w-80 flex-shrink-0 px-6 py-4 border-r border-gray-200">
            <span className="text-sm font-semibold text-gray-900">Epics</span>
          </div>

          {/* Timeline Grid */}
          <div className="flex-1 relative">
            <div className="flex">
              {timeline.map((month, index) => (
                <div
                  key={month.getTime()}
                  className="flex-1 px-2 py-4 text-center border-r border-gray-200 last:border-r-0"
                  style={{ minWidth: "80px" }}
                >
                  <div className="text-xs font-medium text-gray-900">
                    {month.toLocaleDateString("en-US", { month: "short" })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {month.getFullYear()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Epics Gantt Chart */}
      <div className="flex-1 overflow-y-auto">
        {epics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <Calendar className="h-12 w-12 mb-4" />
            <h3 className="text-lg font-medium mb-2">No epics found</h3>
            <p className="text-sm text-center max-w-md">
              Create tasks with tags to automatically generate epics for your
              roadmap
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {epics.map((epic) => {
              const position = getEpicPosition(epic);

              return (
                <div key={epic.id} className="flex hover:bg-gray-50">
                  {/* Epic Info Column */}
                  <div className="w-80 flex-shrink-0 px-6 py-4 border-r border-gray-200">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: epic.color }}
                        />
                        <h4 className="font-medium text-gray-900 text-sm">
                          {epic.title}
                        </h4>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                            epic.status
                          )}`}
                        >
                          {getStatusLabel(epic.status)}
                        </span>
                      </div>

                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex justify-between">
                          <span>Tasks:</span>
                          <span>{epic.tasks.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span className="text-green-600">
                            {epic.tasks.filter(isTaskCompleted).length}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Progress:</span>
                          <span className="text-blue-600">
                            {Math.round(
                              (epic.tasks.filter(isTaskCompleted).length /
                                epic.tasks.length) *
                                100
                            )}
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Gantt Bar */}
                  <div className="flex-1 relative py-4 px-2">
                    {/* Timeline Grid Background */}
                    <div className="absolute inset-0 flex">
                      {timeline.map((month, index) => (
                        <div
                          key={month.getTime()}
                          className="flex-1 border-r border-gray-100 last:border-r-0"
                          style={{ minWidth: "80px" }}
                        />
                      ))}
                    </div>

                    {/* Epic Bar */}
                    <div
                      className="absolute top-1/2 transform -translate-y-1/2 h-6 rounded-md border-2 transition-all duration-300"
                      style={{
                        left: `${position.left}%`,
                        width: `${position.width}%`,
                        backgroundColor: epic.color + "40",
                        borderColor: epic.color,
                        minWidth: "60px",
                      }}
                    >
                      {/* Progress Fill */}
                      <div
                        className="h-full rounded-sm transition-all duration-300"
                        style={{
                          backgroundColor: epic.color,
                          width: `${
                            (epic.tasks.filter(isTaskCompleted).length /
                              epic.tasks.length) *
                            100
                          }%`,
                        }}
                      />

                      {/* Epic Dates */}
                      <div className="absolute -top-5 left-0 text-xs text-gray-500">
                        {epic.startDate?.toLocaleDateString("en-US", {
                          month: "numeric",
                          day: "numeric",
                        })}
                      </div>
                      <div className="absolute -top-5 right-0 text-xs text-gray-500">
                        {epic.endDate?.toLocaleDateString("en-US", {
                          month: "numeric",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
