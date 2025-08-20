import { z } from 'zod';

// UUID validation pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Common validators
export const validators = {
  uuid: z.string().regex(UUID_REGEX, 'Invalid UUID format'),
  email: z.string().email('Invalid email format').max(254, 'Email too long'),
  boardTitle: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  boardDescription: z.string().max(500, 'Description too long').optional(),
  taskTitle: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  taskDescription: z.string().max(5000, 'Description too long').optional(),
  memberName: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  tag: z.string().min(1).max(50, 'Tag too long'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  role: z.enum(['admin', 'project_manager', 'member', 'viewer']),
};

// HTML/Script sanitization
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Prevent path traversal
export function sanitizePath(path: string): string {
  // Remove any path traversal attempts
  return path.replace(/\.\./g, '').replace(/[\/\\]/g, '');
}

// Validate and sanitize board ID
export function validateBoardId(boardId: string): string {
  const sanitized = sanitizePath(boardId);
  const result = validators.uuid.safeParse(sanitized);
  if (!result.success) {
    throw new Error('Invalid board ID');
  }
  return result.data;
}

// Validate and sanitize task ID
export function validateTaskId(taskId: string): string {
  const sanitized = sanitizePath(taskId);
  const result = validators.uuid.safeParse(sanitized);
  if (!result.success) {
    throw new Error('Invalid task ID');
  }
  return result.data;
}

// Validate request body size (to prevent DoS)
export function validateRequestSize(body: any, maxSizeKB: number = 1024): void {
  const size = JSON.stringify(body).length / 1024;
  if (size > maxSizeKB) {
    throw new Error(`Request body too large: ${size.toFixed(2)}KB (max: ${maxSizeKB}KB)`);
  }
}

// Safe JSON parse with error handling
export function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

// Validate and sanitize member data
export const memberSchema = z.object({
  name: validators.memberName,
  email: validators.email,
  role: validators.role,
  avatar: z.string().url().optional().or(z.literal('')),
});

// Validate and sanitize board creation
export const createBoardSchema = z.object({
  title: validators.boardTitle,
  description: validators.boardDescription,
  settings: z.object({
    allowPriorityChange: z.boolean().optional(),
    allowStatusChange: z.boolean().optional(),
    enableWipLimits: z.boolean().optional(),
    enableTimeTracking: z.boolean().optional(),
  }).optional(),
});

// Validate and sanitize task creation
export const createTaskSchema = z.object({
  title: validators.taskTitle,
  description: validators.taskDescription,
  priority: validators.priority.optional(),
  assignee: validators.uuid.optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.array(validators.tag).max(10, 'Too many tags').optional(),
  estimatedHours: z.number().min(0).max(999).optional(),
  status: z.string().optional(),
});

// Validate and sanitize board update
export const updateBoardSchema = z.object({
  title: validators.boardTitle.optional(),
  description: validators.boardDescription.optional(),
  columns: z.array(z.any()).optional(),
  tasks: z.record(z.string(), z.any()).optional(),
  members: z.record(z.string(), z.any()).optional(),
  settings: z.any().optional(),
});

// Validate and sanitize task update  
export const updateTaskSchema = z.object({
  title: validators.taskTitle.optional(),
  description: validators.taskDescription.optional(),
  priority: validators.priority.optional(),
  assignee: validators.uuid.optional().or(z.null()),
  dueDate: z.string().datetime().optional().or(z.null()),
  tags: z.array(validators.tag).max(10, 'Too many tags').optional(),
  estimatedHours: z.number().min(0).max(999).optional().or(z.null()),
  status: z.string().optional(),
  attachments: z.array(z.any()).optional(),
  comments: z.array(z.any()).optional(),
});
