"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Plus, Folder, Calendar, Users, ArrowRight } from "lucide-react";
import { Board } from "@/types/kanban";

export default function HomePage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/boards");
      if (response.ok) {
        const boardsData = await response.json();
        setBoards(boardsData);
      }
    } catch (err) {
      console.error("Error fetching boards:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Core Team Kanban
                </h1>
              </div>
            </div>

            <nav className="flex items-center space-x-4">
              <Link href="/boards">
                <Button variant="outline">
                  <Folder className="h-4 w-4 mr-2" />
                  All Projects
                </Button>
              </Link>
              <Link href="/boards/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-secondary-900 mb-4">
            Core Development Team Projects
          </h2>
          <p className="text-xl text-secondary-600 mb-8 max-w-2xl mx-auto">
            Manage your development workflow with precision and clarity.
          </p>
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          {!loading && boards.length > 0 && (
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-secondary-900">
                Recent Projects
              </h3>
              <Link href="/boards">
                <Button variant="outline" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border-2 border-secondary-200 p-6 animate-pulse"
                >
                  {/* Title skeleton */}
                  <div className="h-5 bg-secondary-200 rounded mb-2 w-3/4"></div>
                  {/* Description skeleton */}
                  <div className="h-4 bg-secondary-100 rounded mb-3 w-full"></div>
                  <div className="h-4 bg-secondary-100 rounded mb-4 w-2/3"></div>

                  {/* Stats skeleton */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex space-x-4">
                      <div className="h-4 w-16 bg-secondary-100 rounded"></div>
                      <div className="h-4 w-20 bg-secondary-100 rounded"></div>
                    </div>
                    <div className="h-4 w-16 bg-secondary-100 rounded"></div>
                  </div>

                  {/* Members skeleton */}
                  <div className="flex space-x-1 mb-4">
                    <div className="w-6 h-6 bg-secondary-100 rounded-full"></div>
                    <div className="w-6 h-6 bg-secondary-100 rounded-full"></div>
                    <div className="w-6 h-6 bg-secondary-100 rounded-full"></div>
                  </div>

                  {/* Button skeleton */}
                  <div className="h-8 bg-secondary-100 rounded"></div>
                </div>
              ))}
            </div>
          ) : boards.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-secondary-300">
              <Folder className="h-20 w-20 text-secondary-300 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-secondary-900 mb-3">
                No projects yet
              </h3>
              <p className="text-secondary-600 mb-8 max-w-md mx-auto">
                Create your first project to start organizing your development
                tasks and streamline your workflow.
              </p>
              <Link href="/boards/new">
                <Button size="lg">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boards.slice(0, 6).map((board) => (
                <div
                  key={board.id}
                  className="bg-white rounded-xl border-2 border-secondary-200 p-6 hover:shadow-lg transition-all duration-200 hover:border-primary-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-secondary-900 mb-2">
                        {board.title}
                      </h4>
                      {board.description && (
                        <p className="text-secondary-600 text-sm mb-3 line-clamp-2">
                          {board.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Project Stats */}
                  <div className="flex items-center justify-between text-sm text-secondary-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Folder className="h-4 w-4 mr-1" />
                        <span>{Object.keys(board.tasks).length} tasks</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>
                          {Object.keys(board.members || {}).length} members
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>
                        {new Date(board.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Team Members Preview */}
                  {board.members && Object.keys(board.members).length > 0 && (
                    <div className="flex items-center space-x-1 mb-4">
                      {Object.values(board.members)
                        .slice(0, 3)
                        .map((member) => (
                          <div
                            key={member.id}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-white"
                            style={{ backgroundColor: member.color }}
                            title={member.name}
                          >
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                        ))}
                      {Object.keys(board.members).length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-secondary-200 flex items-center justify-center text-xs text-secondary-600 font-medium">
                          +{Object.keys(board.members).length - 3}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Open Project Button */}
                  <Link href={`/boards/${board.id}`}>
                    <Button className="w-full" size="sm">
                      Open Project
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {boards.length > 6 && (
            <div className="text-center mt-8">
              <Link href="/boards">
                <Button variant="outline">
                  View All {boards.length} Projects
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-secondary-900 py-6 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-secondary-400 mb-3 md:mb-0">
              <p className="text-sm">
                &copy; 2024 Core Team Kanban. Built for developers, by
                cl3v the great.
              </p>
            </div>

            <div className="flex space-x-6 text-secondary-400 text-sm">
              <Link
                href="/boards"
                className="hover:text-white transition-colors"
              >
                Team Projects
              </Link>
              <Link
                href="/boards/new"
                className="hover:text-white transition-colors"
              >
                New Project
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
