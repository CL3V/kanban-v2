export type TaskStatus =
  | "todo"
  | "in-progress"
  | "in-review"
  | "done"
  | "backlog"
  | "in-development"
  | "code-review"
  | "deployed"
  | string;

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  reporter?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  tags?: string[];
  attachments?: string[];
  comments?: Comment[];
  estimatedHours?: number;
  actualHours?: number;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  id: string;
  title: string;
  status: TaskStatus;
  taskIds: string[];
  wipLimit?: number;
  color?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: "admin" | "project_manager" | "member" | "viewer";
  color: string;
  createdAt?: string;
  lastActive?: string;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  columns: Column[];
  tasks: { [taskId: string]: Task };
  members: { [memberId: string]: Member };
  createdAt: string;
  updatedAt: string;
  settings?: BoardSettings;
}

export interface BoardSettings {
  allowPriorityChange: boolean;
  allowStatusChange: boolean;
  enableWipLimits: boolean;
  enableTimeTracking: boolean;
  defaultAssignee?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  estimatedHours?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  dueDate?: string;
  tags?: string[];
  estimatedHours?: number;
  actualHours?: number;
}

export interface CreateBoardRequest {
  title: string;
  description?: string;
  settings?: BoardSettings;
}

export interface UpdateBoardRequest {
  title?: string;
  description?: string;
  settings?: BoardSettings;
}

export interface DragEndEvent {
  active: {
    id: string;
  };
  over: {
    id: string;
  } | null;
}
