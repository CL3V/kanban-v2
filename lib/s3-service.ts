import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKET_NAME, S3_KEYS } from "./aws-config";
import type { Board, Task } from "@/types/kanban";

export class S3Service {
  private static async getObject(key: string): Promise<string | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);
      const body = await response.Body?.transformToString();
      return body || null;
    } catch (error) {
      if ((error as any)?.name === "NoSuchKey") {
        return null;
      }
      console.error("Error getting object from S3:", error);
      throw error;
    }
  }

  private static async putObject(key: string, data: string): Promise<void> {
    try {
      console.log("S3Service: Preparing to put object:", {
        bucket: S3_BUCKET_NAME,
        key,
        dataLength: data.length,
      });

      const command = new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
        Body: data,
        ContentType: "application/json",
      });

      console.log("S3Service: Sending command to S3...");
      await s3Client.send(command);
      console.log("S3Service: Object put successfully");
    } catch (error) {
      console.error("S3Service: Error putting object to S3:", {
        bucket: S3_BUCKET_NAME,
        key,
        error: error instanceof Error ? error.message : String(error),
        code: (error as any)?.Code,
        statusCode: (error as any)?.$metadata?.httpStatusCode,
      });
      throw error;
    }
  }

  private static async deleteObject(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
    } catch (error) {
      console.error("Error deleting object from S3:", error);
      throw error;
    }
  }

  private static async objectExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      if ((error as any)?.name === "NotFound") {
        return false;
      }
      throw error;
    }
  }

  // Public utility methods for general object operations
  static async getObjectData(key: string): Promise<string | null> {
    return this.getObject(key);
  }

  static async putObjectData(key: string, data: string): Promise<void> {
    return this.putObject(key, data);
  }

  // Board operations
  static async getAllBoards(): Promise<Board[]> {
    try {
      const boardListData = await this.getObject(S3_KEYS.BOARD_LIST);
      if (!boardListData) {
        return [];
      }

      const boardIds: string[] = JSON.parse(boardListData);
      const boards: Board[] = [];

      for (const boardId of boardIds) {
        const board = await this.getBoard(boardId);
        if (board) {
          boards.push(board);
        }
      }

      return boards;
    } catch (error) {
      console.error("Error getting all boards:", error);
      return [];
    }
  }

  static async getBoard(boardId: string): Promise<Board | null> {
    try {
      const boardData = await this.getObject(
        `${S3_KEYS.BOARDS}${boardId}.json`
      );
      if (!boardData) {
        return null;
      }

      return JSON.parse(boardData) as Board;
    } catch (error) {
      console.error("Error getting board:", error);
      return null;
    }
  }

  static async createBoard(board: Board): Promise<void> {
    try {
      // Save the board
      await this.putObject(
        `${S3_KEYS.BOARDS}${board.id}.json`,
        JSON.stringify(board)
      );

      // Update board list
      const boardListData = await this.getObject(S3_KEYS.BOARD_LIST);
      const boardIds: string[] = boardListData ? JSON.parse(boardListData) : [];

      if (!boardIds.includes(board.id)) {
        boardIds.push(board.id);
        await this.putObject(S3_KEYS.BOARD_LIST, JSON.stringify(boardIds));
      }
    } catch (error) {
      console.error("Error creating board:", error);
      throw error;
    }
  }

  static async updateBoard(board: Board): Promise<void> {
    try {
      console.log("S3Service: Updating board with ID:", board.id);

      // Validate board data
      if (!board.id) {
        throw new Error("Board ID is required");
      }
      if (!board.title) {
        throw new Error("Board title is required");
      }

      const boardKey = `${S3_KEYS.BOARDS}${board.id}.json`;
      console.log("S3Service: Board key:", boardKey);

      // Test JSON serialization
      let boardData: string;
      try {
        boardData = JSON.stringify(board);
        console.log("S3Service: Board data length:", boardData.length);
      } catch (jsonError) {
        console.error("S3Service: JSON serialization error:", jsonError);
        throw new Error(
          `Failed to serialize board data: ${
            jsonError instanceof Error ? jsonError.message : String(jsonError)
          }`
        );
      }

      await this.putObject(boardKey, boardData);
      console.log("S3Service: Board updated successfully");
    } catch (error) {
      console.error("S3Service: Error updating board:", {
        boardId: board?.id || "unknown",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  static async deleteBoard(boardId: string): Promise<void> {
    try {
      // Delete the board file
      await this.deleteObject(`${S3_KEYS.BOARDS}${boardId}.json`);

      // Update board list
      const boardListData = await this.getObject(S3_KEYS.BOARD_LIST);
      if (boardListData) {
        const boardIds: string[] = JSON.parse(boardListData);
        const updatedBoardIds = boardIds.filter((id) => id !== boardId);
        await this.putObject(
          S3_KEYS.BOARD_LIST,
          JSON.stringify(updatedBoardIds)
        );
      }
    } catch (error) {
      console.error("Error deleting board:", error);
      throw error;
    }
  }

  // Task operations (tasks are stored within boards, but these methods provide direct task access)
  static async getTask(boardId: string, taskId: string): Promise<Task | null> {
    try {
      const board = await this.getBoard(boardId);
      if (!board || !board.tasks[taskId]) {
        return null;
      }

      return board.tasks[taskId];
    } catch (error) {
      console.error("Error getting task:", error);
      return null;
    }
  }

  static async createTask(boardId: string, task: Task): Promise<void> {
    try {
      const board = await this.getBoard(boardId);
      if (!board) {
        throw new Error(`Board ${boardId} not found`);
      }

      // If the board has no columns, create a sensible default column
      if (!Array.isArray(board.columns) || board.columns.length === 0) {
        board.columns = [
          {
            id: `col-${Date.now()}`,
            title: "To Do",
            status: (task.status as any) || ("todo" as any),
            taskIds: [],
            color: "#3b82f6", // tailwind blue-500
          },
        ];
      }

      // Add task to board
      board.tasks[task.id] = task;

      // Add task to appropriate column (fallback to first column if no matching status)
      let column = board.columns.find((col) => col.status === task.status);
      if (!column && board.columns.length > 0) {
        // If no column matches the task.status, place in first column and align status to it
        column = board.columns[0];
        task.status = column.status as any;
      }
      if (column && !column.taskIds.includes(task.id)) {
        column.taskIds.push(task.id);
      }

      board.updatedAt = new Date().toISOString();

      await this.updateBoard(board);
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  }

  static async updateTask(
    boardId: string,
    taskId: string,
    updatedTask: Partial<Task>
  ): Promise<void> {
    try {
      const board = await this.getBoard(boardId);
      if (!board || !board.tasks[taskId]) {
        throw new Error(`Task ${taskId} not found in board ${boardId}`);
      }

      const currentTask = board.tasks[taskId];
      const oldStatus = currentTask.status;
      const newTask = {
        ...currentTask,
        ...updatedTask,
        updatedAt: new Date().toISOString(),
      };

      // Update task in board
      board.tasks[taskId] = newTask;

      // If status changed, move task between columns
      if (updatedTask.status && updatedTask.status !== oldStatus) {
        // Remove from old column
        const oldColumn = board.columns.find((col) => col.status === oldStatus);
        if (oldColumn) {
          oldColumn.taskIds = oldColumn.taskIds.filter((id) => id !== taskId);
        }

        // Add to new column
        const newColumn = board.columns.find(
          (col) => col.status === updatedTask.status
        );
        if (newColumn && !newColumn.taskIds.includes(taskId)) {
          newColumn.taskIds.push(taskId);
        }
      }

      board.updatedAt = new Date().toISOString();

      await this.updateBoard(board);
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  }

  static async deleteTask(boardId: string, taskId: string): Promise<void> {
    try {
      const board = await this.getBoard(boardId);
      if (!board) {
        throw new Error(`Board ${boardId} not found`);
      }

      // Remove task from board
      delete board.tasks[taskId];

      // Remove task from all columns
      board.columns.forEach((column) => {
        column.taskIds = column.taskIds.filter((id) => id !== taskId);
      });

      board.updatedAt = new Date().toISOString();

      await this.updateBoard(board);
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  }

  static async moveTask(
    boardId: string,
    taskId: string,
    newStatus: string,
    newPosition?: number
  ): Promise<void> {
    try {
      const board = await this.getBoard(boardId);
      if (!board || !board.tasks[taskId]) {
        throw new Error(`Task ${taskId} not found in board ${boardId}`);
      }

      const task = board.tasks[taskId];
      const oldStatus = task.status;

      // Update task status
      task.status = newStatus as any;
      task.updatedAt = new Date().toISOString();

      // Remove from old column
      const oldColumn = board.columns.find((col) => col.status === oldStatus);
      if (oldColumn) {
        oldColumn.taskIds = oldColumn.taskIds.filter((id) => id !== taskId);
      }

      // Add to new column
      const newColumn = board.columns.find((col) => col.status === newStatus);
      if (newColumn) {
        if (typeof newPosition === "number") {
          newColumn.taskIds.splice(newPosition, 0, taskId);
        } else {
          newColumn.taskIds.push(taskId);
        }
      }

      board.updatedAt = new Date().toISOString();

      await this.updateBoard(board);
    } catch (error) {
      console.error("Error moving task:", error);
      throw error;
    }
  }
}
