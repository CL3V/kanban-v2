import React from "react";
import { Column as ColumnType, Task, Member } from "@/types/kanban";
import { TaskCard } from "./TaskCard";
import { Plus } from "lucide-react";
import { Button } from "./ui/Button";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  members?: { [memberId: string]: Member };
  onAddTask: () => void;
  onTaskClick: (task: Task) => void;
  canAddTask?: boolean;
}

export const Column: React.FC<ColumnProps> = ({
  column,
  tasks,
  members,
  onAddTask,
  onTaskClick,
  canAddTask = true,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const wipLimitExceeded = column.wipLimit && tasks.length > column.wipLimit;

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-100 rounded-lg border-2 w-80 flex-shrink-0 flex flex-col h-full transition-all duration-200 ${
        isOver
          ? "bg-blue-50 border-blue-400 shadow-lg scale-105"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* Color indicator */}
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.color }}
            />
            <h2 className="font-semibold text-sm text-gray-800 uppercase tracking-wide">
              {column.title}
            </h2>
            <span className="text-sm text-gray-500 font-medium">
              {tasks.length}
            </span>
          </div>
          {column.wipLimit && (
            <span
              className={`text-xs px-2 py-1 rounded ${
                wipLimitExceeded
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              WIP {tasks.length}/{column.wipLimit}
            </span>
          )}
        </div>
      </div>

      {/* Tasks Container with Drop Zone */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[200px] vertical-scrollbar">
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              members={members}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {/* Drop Zone - Always present for better drag experience */}
        <div className="min-h-[100px] flex items-center justify-center">
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-300 mb-3">
                <Plus className="h-8 w-8 mx-auto" />
              </div>
              <p className="text-sm text-gray-500 mb-3">No tasks yet</p>
              {canAddTask && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddTask}
                  className="text-gray-600 border-dashed"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              )}
            </div>
          ) : (
            <div
              className={`w-full h-20 border-2 border-dashed border-transparent rounded-lg flex items-center justify-center transition-all duration-200 ${
                isOver ? "border-blue-300 bg-blue-50" : "hover:border-gray-300"
              }`}
            >
              <span className="text-xs text-gray-400">Drop tasks here</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
