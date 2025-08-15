import React from "react";
import { Task, TaskPriority, Member } from "@/types/kanban";
import { Calendar, Clock, User, MessageCircle, Paperclip } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface TaskCardProps {
  task: Task;
  members?: { [memberId: string]: Member };
  onClick?: () => void;
}

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-green-100 text-green-800 border-green-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  urgent: "bg-red-100 text-red-800 border-red-200",
};

const priorityIcons: Record<TaskPriority, string> = {
  low: "⬇️",
  medium: "➡️",
  high: "⬆️",
  urgent: "🔥",
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  members,
  onClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const assignedMember =
    task.assignee && members ? members[task.assignee] : undefined;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-xl border-2 border-secondary-200 p-4 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-[1.02] ${
        isDragging ? "opacity-50 rotate-3 scale-105" : ""
      } ${isOverdue ? "border-red-300 bg-red-50" : ""}`}
      onClick={onClick}
    >
      {/* Priority Badge */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
            priorityColors[task.priority]
          }`}
        >
          <span className="mr-1">{priorityIcons[task.priority]}</span>
          {task.priority}
        </span>
        <span className="text-xs text-secondary-500">
          #{task.id.slice(0, 8)}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-medium text-secondary-900 mb-2 line-clamp-2">
        {task.title}
      </h3>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-secondary-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-md"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="text-xs text-secondary-500">
              +{task.tags.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Meta Information */}
      <div className="flex items-center justify-between text-xs text-secondary-500">
        <div className="flex items-center space-x-2">
          {assignedMember ? (
            <div className="flex items-center space-x-1">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm"
                style={{ backgroundColor: assignedMember.color }}
                title={assignedMember.name}
              >
                {getInitials(assignedMember.name)}
              </div>
              <span className="text-xs font-medium">
                {assignedMember.name.split(" ")[0]}
              </span>
            </div>
          ) : (
            task.assignee && (
              <div className="flex items-center">
                <User className="h-3 w-3 mr-1" />
                <span>{task.assignee}</span>
              </div>
            )
          )}

          {task.dueDate && (
            <div
              className={`flex items-center ${
                isOverdue ? "text-red-600 font-medium" : ""
              }`}
            >
              <Calendar className="h-3 w-3 mr-1" />
              <span>{new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {task.estimatedHours && (
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>{task.estimatedHours}h</span>
            </div>
          )}

          {task.comments && task.comments.length > 0 && (
            <div className="flex items-center">
              <MessageCircle className="h-3 w-3 mr-1" />
              <span>{task.comments.length}</span>
            </div>
          )}

          {task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center">
              <Paperclip className="h-3 w-3 mr-1" />
              <span>{task.attachments.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
