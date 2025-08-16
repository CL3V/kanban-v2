import { Member } from "@/types/kanban";

export type Permission =
  | "create_project"
  | "delete_project"
  | "edit_project"
  | "manage_members"
  | "add_members_to_project"
  | "remove_members_from_project"
  | "create_task"
  | "edit_task"
  | "delete_task"
  | "add_comment"
  | "delete_comment"
  | "view_project";

export class PermissionService {
  private static rolePermissions: Record<Member["role"], Permission[]> = {
    admin: [
      "create_project",
      "delete_project",
      "edit_project",
      "manage_members",
      "add_members_to_project",
      "remove_members_from_project",
      "create_task",
      "edit_task",
      "delete_task",
      "add_comment",
      "delete_comment",
      "view_project",
    ],
    project_manager: [
      "create_project",
      "edit_project",
      "add_members_to_project",
      "remove_members_from_project",
      "create_task",
      "edit_task",
      "delete_task",
      "add_comment",
      "delete_comment",
      "view_project",
    ],
    member: ["create_task", "edit_task", "add_comment", "view_project"],
    viewer: ["view_project", "add_comment"],
  };

  /**
   * Check if a user has a specific permission
   */
  static hasPermission(user: Member, permission: Permission): boolean {
    const userPermissions = this.rolePermissions[user.role] || [];
    return userPermissions.includes(permission);
  }

  /**
   * Check if a user can access a project
   * - Admins can access all projects
   * - Project managers can access all projects
   * - Members can only access projects they're assigned to
   */
  static canAccessProject(user: Member, projectMembers: Member[]): boolean {
    // Admins and project managers can access all projects
    if (user.role === "admin" || user.role === "project_manager") {
      return true;
    }

    // Members can only access projects they're assigned to
    return projectMembers.some((member) => member.id === user.id);
  }

  /**
   * Check if a user can manage project members
   */
  static canManageProjectMembers(user: Member): boolean {
    return (
      this.hasPermission(user, "add_members_to_project") ||
      this.hasPermission(user, "remove_members_from_project")
    );
  }

  /**
   * Check if a user can create projects
   */
  static canCreateProject(user: Member): boolean {
    return this.hasPermission(user, "create_project");
  }

  /**
   * Check if a user can delete projects
   */
  static canDeleteProject(user: Member): boolean {
    return this.hasPermission(user, "delete_project");
  }

  /**
   * Check if a user can edit projects
   */
  static canEditProject(user: Member): boolean {
    return this.hasPermission(user, "edit_project");
  }

  /**
   * Check if a user can manage global members
   */
  static canManageGlobalMembers(user: Member): boolean {
    return this.hasPermission(user, "manage_members");
  }

  /**
   * Get all permissions for a user role
   */
  static getUserPermissions(user: Member): Permission[] {
    return this.rolePermissions[user.role] || [];
  }

  /**
   * Check if a user can delete comments
   * Users can delete their own comments, admins/PMs can delete any comment
   */
  static canDeleteComment(user: Member, commentAuthorId: string): boolean {
    // Users can delete their own comments
    if (user.id === commentAuthorId) {
      return true;
    }

    // Admins and project managers can delete any comment
    return this.hasPermission(user, "delete_comment");
  }
}
