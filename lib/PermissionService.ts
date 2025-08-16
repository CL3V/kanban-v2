import { Member } from "@/types/kanban";

export type Permission =
  | "create_task"
  | "edit_task"
  | "delete_task"
  | "manage_project_members"
  | "manage_columns"
  | "delete_project"
  | "create_project"
  | "manage_members";

export class PermissionService {
  /**
   * Check if a user has a specific permission based on their role
   */
  static hasPermission(user: Member, permission: Permission): boolean {
    if (!user) return false;

    const rolePermissions: Record<string, Permission[]> = {
      admin: [
        "create_task",
        "edit_task",
        "delete_task",
        "manage_project_members",
        "manage_columns",
        "delete_project",
        "create_project",
        "manage_members",
      ],
      project_manager: [
        "create_task",
        "edit_task",
        "delete_task",
        "manage_project_members",
        "manage_columns",
        "create_project",
      ],
      member: ["create_task", "edit_task"],
      viewer: [],
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission);
  }

  /**
   * Check if user can access a project
   */
  static canAccessProject(user: Member, projectMembers: Member[]): boolean {
    if (!user) return false;

    // Admin can access all projects
    if (user.role === "admin") return true;

    // Check if user is a member of the project
    return projectMembers.some((member) => member.id === user.id);
  }

  /**
   * Check if user can manage project members
   */
  static canManageProjectMembers(user: Member): boolean {
    return this.hasPermission(user, "manage_project_members");
  }

  /**
   * Check if user can create tasks
   */
  static canCreateTask(user: Member): boolean {
    return this.hasPermission(user, "create_task");
  }

  /**
   * Check if user can edit tasks
   */
  static canEditTask(user: Member): boolean {
    return this.hasPermission(user, "edit_task");
  }

  /**
   * Check if user can delete tasks
   */
  static canDeleteTask(user: Member): boolean {
    return this.hasPermission(user, "delete_task");
  }

  /**
   * Check if user can delete projects
   */
  static canDeleteProject(user: Member): boolean {
    return this.hasPermission(user, "delete_project");
  }

  /**
   * Check if user can create projects
   */
  static canCreateProject(user: Member): boolean {
    return this.hasPermission(user, "create_project");
  }

  /**
   * Check if user can manage global members
   */
  static canManageMembers(user: Member): boolean {
    return this.hasPermission(user, "manage_members");
  }

  /**
   * Check if user can manage columns
   */
  static canManageColumns(user: Member): boolean {
    return this.hasPermission(user, "manage_columns");
  }

  /**
   * Get user display name
   */
  static getUserDisplayName(user: Member): string {
    return user.name || user.email || "Unknown User";
  }

  /**
   * Get user initials for avatar
   */
  static getUserInitials(user: Member): string {
    const name = this.getUserDisplayName(user);
    return name
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Get role display name
   */
  static getRoleDisplayName(role: string): string {
    const roleNames: Record<string, string> = {
      admin: "Administrator",
      project_manager: "Project Manager",
      member: "Member",
      viewer: "Viewer",
    };
    return roleNames[role] || role;
  }

  /**
   * Check if role can be assigned by current user
   */
  static canAssignRole(currentUser: Member, targetRole: string): boolean {
    if (!currentUser) return false;

    // Admin can assign any role
    if (currentUser.role === "admin") return true;

    // Project managers can assign member and viewer roles
    if (currentUser.role === "project_manager") {
      return ["member", "viewer"].includes(targetRole);
    }

    return false;
  }
}
