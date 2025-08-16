import React from "react";
import { Task, TaskPriority, Member } from "@/types/kanban";
import { UserAvatar } from "./UserAvatar";
import {
  Calendar,
  Clock,
  User,
  MessageCircle,
  Paperclip,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskCardProps {
  task: Task;
  members?: { [memberId: string]: Member };
  onClick?: () => void;
  isDragging?: boolean;
}

const priorityColors: Record<TaskPriority, string> = {
  low: "text-green-600",
  medium: "text-yellow-600",
  high: "text-orange-600",
  urgent: "text-red-600",
};

const priorityIcons: Record<TaskPriority, React.ReactNode> = {
  low: <ArrowDown className="h-4 w-4" />,
  medium: <div className="w-4 h-4 bg-yellow-500 rounded-sm" />,
  high: <ArrowUp className="h-4 w-4" />,
  urgent: <AlertTriangle className="h-4 w-4" />,
};

const taskTypeColors: Record<string, string> = {
  story: "bg-green-500",
  bug: "bg-red-500",
  task: "bg-blue-500",
  epic: "bg-purple-500",
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  members,
  onClick,
  isDragging,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: sortableIsDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const assignedMember =
    task.assignee && members ? members[task.assignee] : undefined;

  const getInitials = (name: string) => {
    const nameParts = name.split(" ");
    if (nameParts.length >= 2) {
      return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
    }
    return nameParts[0].charAt(0).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "#ef4444", // red
      "#f97316", // orange
      "#eab308", // yellow
      "#22c55e", // green
      "#06b6d4", // cyan
      "#3b82f6", // blue
      "#8b5cf6", // violet
      "#ec4899", // pink
      "#f59e0b", // amber
      "#10b981", // emerald
    ];
    const hash = name.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Generate a more realistic ticket number
  const ticketNumber = `NUC-${task.id.slice(-3).padStart(3, "0")}`;

  // Get task type from tags or default to 'task'
  const taskType = task.tags?.[0]?.toLowerCase() || "task";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer ${
        isDragging || sortableIsDragging ? "opacity-50 shadow-lg" : ""
      }`}
      onClick={onClick}
    >
      {/* Task Title */}
      <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 leading-tight">
        {task.title}
      </h3>
      {/* Bottom Row - Ticket number, priority, assignee */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Task Type Icon */}
          <div
            className={`w-4 h-4 rounded ${
              taskTypeColors[taskType] || taskTypeColors.task
            }`}
            title={taskType}
          />

          {/* Ticket Number */}
          <span className="text-xs text-gray-600 font-medium">
            {ticketNumber}
          </span>

          {/* Priority */}
          <div className={`${priorityColors[task.priority]} flex items-center`}>
            {priorityIcons[task.priority]}
          </div>
        </div>

        {/* Assignee Avatar */}
        <div className="flex items-center space-x-1">
          {assignedMember ? (
            <UserAvatar
              member={assignedMember}
              size="xs"
              showName={false}
              showRole={false}
              className=""
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-3 w-3 text-gray-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
