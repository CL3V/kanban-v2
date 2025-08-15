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
  isDragOver?: boolean;
}

export const Column: React.FC<ColumnProps> = ({
  column,
  tasks,
  members,
  onAddTask,
  onTaskClick,
  isDragOver = false,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const wipLimitExceeded = column.wipLimit && tasks.length > column.wipLimit;

  return (
    <div
      className={`bg-white rounded-xl border-2 shadow-sm hover:shadow-md transition-all duration-200 p-4 w-80 flex-shrink-0 flex flex-col ${
        isOver || isDragOver
          ? "border-primary-400 bg-primary-50 ring-2 ring-primary-200 shadow-lg scale-105"
          : "border-secondary-200"
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 min-h-[48px]">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div
            className="w-4 h-4 rounded-full ring-2 ring-white shadow-sm flex-shrink-0"
            style={{ backgroundColor: column.color }}
          />
          <h2 className="font-bold text-lg text-secondary-900 truncate">
            {column.title}
          </h2>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
              wipLimitExceeded
                ? "bg-red-100 text-red-800 ring-2 ring-red-200"
                : "bg-gradient-to-r from-secondary-100 to-secondary-200 text-secondary-700"
            }`}
          >
            {tasks.length}
            {column.wipLimit && ` / ${column.wipLimit}`}
          </span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onAddTask}
          className="text-secondary-500 hover:text-secondary-700 flex-shrink-0 ml-2"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* WIP Limit Warning */}
      {wipLimitExceeded && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-lg p-3 mb-4 shadow-sm">
          <p className="text-sm text-red-700 font-medium flex items-center">
            <span className="mr-2">⚠️</span>
            WIP limit exceeded ({tasks.length}/{column.wipLimit})
          </p>
        </div>
      )}

      {/* Tasks */}
      <div
        ref={setNodeRef}
        className={`space-y-3 min-h-[400px] p-3 rounded-lg transition-all duration-200 flex-1 ${
          isOver || isDragOver
            ? "bg-primary-100 border-2 border-dashed border-primary-300"
            : "bg-secondary-25"
        }`}
      >
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
      </div>

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-8">
          <div className="text-secondary-300 mb-3">
            <Plus className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-sm text-secondary-500 mb-3 font-medium">
            No tasks yet
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddTask}
            className="text-secondary-600 border-2 border-dashed border-secondary-300 hover:border-primary-400 hover:text-primary-600 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add your first task
          </Button>
        </div>
      )}
    </div>
  );
};
