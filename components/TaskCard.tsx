import React from "react";
import { Task, TaskPriority, Member } from "@/types/kanban";
import { UserAvatar } from "./UserAvatar";
import {
  User,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  Minus,
  MessageCircle,
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

// Triple chevron component for urgent priority
const TripleChevronUp = ({ className }: { className: string }) => (
  <div className={`relative ${className}`}>
    <ChevronUp className="h-3 w-3 absolute" style={{ top: "-4px" }} />
    <ChevronUp className="h-3 w-3 absolute" style={{ top: "-2px" }} />
    <ChevronUp className="h-3 w-3 absolute" style={{ top: "0px" }} />
  </div>
);

const priorityIcons: Record<TaskPriority, React.ReactNode> = {
  low: <ChevronDown className="h-5 w-5" />,
  medium: <Minus className="h-5 w-5" />,
  high: <ChevronsUp className="h-5 w-5" />,
  urgent: <TripleChevronUp className="h-5 w-5" />,
};

const taskTypeColors: Record<string, string> = {
  story: "bg-green-500",
  bug: "bg-red-500",
  task: "bg-blue-500",
  epic: "bg-purple-500",
};

// Tag colors based on tag content
const getTagColor = (tag: string): string => {
  const tagLower = tag.toLowerCase();

  // Define color mappings for common tags
  const tagColorMap: Record<string, string> = {
    // Feature types
    feature: "bg-blue-100 text-blue-800 border-blue-200",
    enhancement: "bg-blue-100 text-blue-800 border-blue-200",
    story: "bg-green-100 text-green-800 border-green-200",
    epic: "bg-purple-100 text-purple-800 border-purple-200",

    // Bug types
    bug: "bg-red-100 text-red-800 border-red-200",
    issue: "bg-red-100 text-red-800 border-red-200",
    hotfix: "bg-red-100 text-red-800 border-red-200",

    // Status/Priority
    urgent: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-green-100 text-green-800 border-green-200",

    // Categories
    frontend: "bg-pink-100 text-pink-800 border-pink-200",
    backend: "bg-indigo-100 text-indigo-800 border-indigo-200",
    api: "bg-indigo-100 text-indigo-800 border-indigo-200",
    ui: "bg-pink-100 text-pink-800 border-pink-200",
    ux: "bg-pink-100 text-pink-800 border-pink-200",
    design: "bg-pink-100 text-pink-800 border-pink-200",

    // Technical
    tech: "bg-gray-100 text-gray-800 border-gray-200",
    technical: "bg-gray-100 text-gray-800 border-gray-200",
    refactor: "bg-cyan-100 text-cyan-800 border-cyan-200",
    optimization: "bg-cyan-100 text-cyan-800 border-cyan-200",
    performance: "bg-cyan-100 text-cyan-800 border-cyan-200",

    // Testing
    test: "bg-amber-100 text-amber-800 border-amber-200",
    testing: "bg-amber-100 text-amber-800 border-amber-200",
    qa: "bg-amber-100 text-amber-800 border-amber-200",

    // Documentation
    docs: "bg-slate-100 text-slate-800 border-slate-200",
    documentation: "bg-slate-100 text-slate-800 border-slate-200",

    // Security
    security: "bg-red-100 text-red-800 border-red-200",
    auth: "bg-red-100 text-red-800 border-red-200",

    // Infrastructure
    devops: "bg-teal-100 text-teal-800 border-teal-200",
    deployment: "bg-teal-100 text-teal-800 border-teal-200",
    ci: "bg-teal-100 text-teal-800 border-teal-200",
    cd: "bg-teal-100 text-teal-800 border-teal-200",
  };

  // Check for exact matches first
  if (tagColorMap[tagLower]) {
    return tagColorMap[tagLower];
  }

  // Check for partial matches
  for (const [key, color] of Object.entries(tagColorMap)) {
    if (tagLower.includes(key) || key.includes(tagLower)) {
      return color;
    }
  }

  // Generate a consistent color based on tag hash if no match found
  const colors = [
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-green-100 text-green-800 border-green-200",
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-pink-100 text-pink-800 border-pink-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
    "bg-cyan-100 text-cyan-800 border-cyan-200",
    "bg-teal-100 text-teal-800 border-teal-200",
    "bg-emerald-100 text-emerald-800 border-emerald-200",
    "bg-lime-100 text-lime-800 border-lime-200",
    "bg-orange-100 text-orange-800 border-orange-200",
  ];

  // Generate hash from tag name
  const hash = tag.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  return colors[Math.abs(hash) % colors.length];
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

  // Get the first tag for display
  const firstTag = task.tags?.[0];

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
      {/* Second Row - Task Title */}
      <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 leading-tight">
        {task.title}
      </h3>
      {/* First Row - First Tag */}
      {firstTag && (
        <div className="mb-2">
          <span
            className={`inline-block px-2 py-1 text-xs font-medium rounded-md border ${getTagColor(
              firstTag
            )}`}
          >
            {firstTag}
          </span>
        </div>
      )}

      {/* Third Row - Ticket number, priority, assignee */}
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

        {/* Assignee Avatar and Comment Count */}
        <div className="flex items-center space-x-2">
          {/* Comment Count */}
          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center space-x-1 text-gray-500">
              <MessageCircle className="h-3 w-3" />
              <span className="text-xs font-medium">
                {task.comments.length}
              </span>
            </div>
          )}

          {/* Assignee Avatar */}
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
