import React from "react";
import { useBoardStats } from "@/hooks/useColumnData";
import { Board } from "@/types/kanban";

interface BoardStatsProps {
  board: Board | null;
}

export const BoardStats: React.FC<BoardStatsProps> = ({ board }) => {
  const stats = useBoardStats(board);

  if (!board) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-lg border border-secondary-200 p-4">
        <div className="text-2xl font-bold text-primary-600">
          {stats.totalTasks}
        </div>
        <div className="text-sm text-secondary-600">Total Tasks</div>
      </div>

      <div className="bg-white rounded-lg border border-secondary-200 p-4">
        <div className="text-2xl font-bold text-blue-600">
          {stats.totalColumns}
        </div>
        <div className="text-sm text-secondary-600">Columns</div>
      </div>

      <div className="bg-white rounded-lg border border-secondary-200 p-4">
        <div className="text-2xl font-bold text-green-600">
          {stats.completionRate}%
        </div>
        <div className="text-sm text-secondary-600">Completion Rate</div>
      </div>

      <div className="bg-white rounded-lg border border-secondary-200 p-4">
        <div className="text-2xl font-bold text-purple-600">
          {Object.keys(board.members || {}).length}
        </div>
        <div className="text-sm text-secondary-600">Team Members</div>
      </div>
    </div>
  );
};
