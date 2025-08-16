import React from "react";
import { Member } from "@/types/kanban";

interface UserAvatarProps {
  member: Member | null | undefined;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  showRole?: boolean;
  showEmail?: boolean;
  className?: string;
}

// Helper function to get initials from a name
const getInitials = (name: string): string => {
  const words = name.split(" ").filter((word) => word.length > 0);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return words[0]?.substring(0, 2).toUpperCase() || "UN";
};

// Helper function to generate avatar color based on name
const getAvatarColor = (name: string): string => {
  const colors = [
    "#FF6B35",
    "#F7931E",
    "#FFD23F",
    "#A8E6CF",
    "#88D8B0",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#06B6D4",
    "#84CC16",
    "#F97316",
    "#6366F1",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

const sizeMap = {
  xs: "w-6 h-6 text-xs",
  sm: "w-8 h-8 text-sm",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const getRoleIcon = (role: Member["role"]) => {
  switch (role) {
    case "admin":
      return "👑";
    case "project_manager":
      return "🎯";
    default:
      return "👤";
  }
};

const getRoleLabel = (role: Member["role"]) => {
  switch (role) {
    case "admin":
      return "Admin";
    case "project_manager":
      return "Project Manager";
    default:
      return "Member";
  }
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  member,
  size = "md",
  showName = false,
  showRole = false,
  showEmail = false,
  className = "",
}) => {
  const [imageError, setImageError] = React.useState(false);

  // Handle null or undefined member
  if (!member) {
    return (
      <div
        className={`${sizeMap[size]} rounded-full flex items-center justify-center bg-gray-300 text-gray-500 font-medium ${className}`}
      >
        <span>?</span>
      </div>
    );
  }

  const avatarClasses = `${sizeMap[size]} rounded-full flex items-center justify-center text-white font-medium ${className}`;
  const backgroundColor = getAvatarColor(member.name);

  const handleImageError = () => {
    setImageError(true);
  };

  const renderAvatar = () => {
    if (member.avatar && !imageError) {
      return (
        <img
          src={member.avatar}
          alt={member.name}
          className="w-full h-full rounded-full object-cover"
          onError={handleImageError}
        />
      );
    }
    return <span>{getInitials(member.name)}</span>;
  };

  return (
    <div className="flex items-center gap-3">
      {/* Avatar */}
      <div
        className={avatarClasses}
        style={{ backgroundColor }}
        title={`${member.name} (${getRoleLabel(member.role)})`}
      >
        {renderAvatar()}
      </div>

      {/* User Info */}
      {(showName || showRole || showEmail) && (
        <div className="flex-1 min-w-0">
          {showName && (
            <div className="flex items-center gap-1">
              <span className="font-medium text-gray-900 truncate">
                {member.name}
              </span>
              {showRole && (
                <span className="text-sm" title={getRoleLabel(member.role)}>
                  {getRoleIcon(member.role)}
                </span>
              )}
            </div>
          )}
          {showEmail && (
            <p className="text-sm text-gray-500 truncate">{member.email}</p>
          )}
          {showRole && !showName && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <span>{getRoleIcon(member.role)}</span>
              <span>{getRoleLabel(member.role)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
