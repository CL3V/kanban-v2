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
    const { boardId, taskId } = await params;
    const { content, author } = await request.json();

    if (!content || !author) {
      return NextResponse.json(
        { error: "Content and author are required" },
        { status: 400 }
      );
    }

    const board = await S3Service.getBoard(boardId);
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const task = board.tasks[taskId];
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const newComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      author,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedTask = {
      ...task,
      comments: [...(task.comments || []), newComment],
      updatedAt: new Date().toISOString(),
    };

    const updatedBoard = {
      ...board,
      tasks: {
        ...board.tasks,
        [taskId]: updatedTask,
      },
      updatedAt: new Date().toISOString(),
    };

    await S3Service.updateBoard(updatedBoard);

    return NextResponse.json(newComment);
  } catch (error) {
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
    const { boardId, taskId } = await params;

    const url = new URL(request.url);
    const commentId = url.searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }

    const board = await S3Service.getBoard(boardId);
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const task = board.tasks[taskId];
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const commentIndex = (task.comments || []).findIndex(
      (comment) => comment.id === commentId
    );
    if (commentIndex === -1) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const updatedComments = [...(task.comments || [])];
    updatedComments.splice(commentIndex, 1);

    const updatedTask = {
      ...task,
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
    };

    const updatedBoard = {
      ...board,
      tasks: {
        ...board.tasks,
        [taskId]: updatedTask,
      },
      updatedAt: new Date().toISOString(),
    };

    await S3Service.updateBoard(updatedBoard);

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { boardId, taskId } = await params;
    const { commentId, content } = await request.json();

    if (!commentId || !content) {
      return NextResponse.json(
        { error: "Comment ID and content are required" },
        { status: 400 }
      );
    }

    const board = await S3Service.getBoard(boardId);
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const task = board.tasks[taskId];
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const commentIndex = (task.comments || []).findIndex(
      (comment) => comment.id === commentId
    );
    if (commentIndex === -1) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const updatedComments = [...(task.comments || [])];
    updatedComments[commentIndex] = {
      ...updatedComments[commentIndex],
      content,
      updatedAt: new Date().toISOString(),
    };

    const updatedTask = {
      ...task,
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
    };

    const updatedBoard = {
      ...board,
      tasks: {
        ...board.tasks,
        [taskId]: updatedTask,
      },
      updatedAt: new Date().toISOString(),
    };

    await S3Service.updateBoard(updatedBoard);

    return NextResponse.json(updatedComments[commentIndex]);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
