"use client";

import React from "react";
import {
  Columns,
  BarChart3,
  Settings,
  Users,
  ArrowLeft,
  ChevronLeft,
  PieChart,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export type SidebarView =
  | "kanban"
  | "roadmap"
  | "settings"
  | "reports"
  | "backlog";

interface SidebarProps {
  activeView: SidebarView;
  onViewChange: (view: SidebarView) => void;
  boardTitle: string;
}

interface SidebarItem {
  id: SidebarView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  boardTitle,
}) => {
  const sidebarItems: SidebarItem[] = [
    {
      id: "kanban",
      label: "Board",
      icon: Columns,
    },
    {
      id: "roadmap",
      label: "Roadmap",
      icon: BarChart3,
    },
    {
      id: "reports",
      label: "Reports",
      icon: PieChart,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="text-sm">Back to Boards</span>
        </Link>
        <div className="flex items-center gap-3">
          <Image
            src="/images/juke-logo.svg"
            alt="Juke Logo"
            width={32}
            height={32}
            className="rounded-sm"
            priority
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {boardTitle}
            </h2>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isActive ? "text-blue-600" : "text-gray-500"
                    }`}
                  />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};
