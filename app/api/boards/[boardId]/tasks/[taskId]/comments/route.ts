import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3-service";

interface RouteParams {
  params: Promise<{
    boardId: string;
    taskId: string;
  }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    console.log("Adding comment - start");
    const { boardId, taskId } = await params;
    console.log("Board ID:", boardId, "Task ID:", taskId);

    const { content, author } = await request.json();
    console.log("Comment content:", content, "Author:", author);

    if (!content || !author) {
      console.log("Missing content or author");
      return NextResponse.json(
        { error: "Content and author are required" },
        { status: 400 }
      );
    }

    // Get the current board
    console.log("Fetching board...");
    const board = await S3Service.getBoard(boardId);
    if (!board) {
      console.log("Board not found");
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }
    console.log("Board found, task count:", Object.keys(board.tasks).length);

    // Get the task
    const task = board.tasks[taskId];
    if (!task) {
      console.log("Task not found, available tasks:", Object.keys(board.tasks));
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    console.log("Task found:", task.title);

    // Create new comment
    const newComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      author,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    console.log("Created new comment:", newComment.id);

    // Add comment to task
    const updatedTask = {
      ...task,
      comments: [...(task.comments || []), newComment],
      updatedAt: new Date().toISOString(),
    };
    console.log(
      "Updated task with comment count:",
      updatedTask.comments.length
    );

    // Update the task in the board
    const updatedBoard = {
      ...board,
      tasks: {
        ...board.tasks,
        [taskId]: updatedTask,
      },
      updatedAt: new Date().toISOString(),
    };

    // Save updated board
    console.log("Saving updated board...");
    await S3Service.updateBoard(updatedBoard);
    console.log("Board saved successfully");

    return NextResponse.json(newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    console.log("Deleting comment - start");
    const { boardId, taskId } = await params;

    const url = new URL(request.url);
    const commentId = url.searchParams.get("commentId");

    console.log(
      "Board ID:",
      boardId,
      "Task ID:",
      taskId,
      "Comment ID:",
      commentId
    );

    if (!commentId) {
      console.log("Missing comment ID");
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }

    // Get the current board
    console.log("Fetching board...");
    const board = await S3Service.getBoard(boardId);
    if (!board) {
      console.log("Board not found");
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    // Get the task
    const task = board.tasks[taskId];
    if (!task) {
      console.log("Task not found");
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Find and remove the comment
    const commentIndex = (task.comments || []).findIndex(
      (comment) => comment.id === commentId
    );
    if (commentIndex === -1) {
      console.log("Comment not found");
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Remove comment from task
    const updatedComments = [...(task.comments || [])];
    updatedComments.splice(commentIndex, 1);

    const updatedTask = {
      ...task,
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
    };

    // Update the task in the board
    const updatedBoard = {
      ...board,
      tasks: {
        ...board.tasks,
        [taskId]: updatedTask,
      },
      updatedAt: new Date().toISOString(),
    };

    // Save updated board
    console.log("Saving updated board...");
    await S3Service.updateBoard(updatedBoard);
    console.log("Board saved successfully");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
