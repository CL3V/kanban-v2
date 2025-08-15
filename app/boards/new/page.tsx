"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function NewBoardPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    enableWipLimits: false,
    enableTimeTracking: true,
    allowPriorityChange: true,
    allowStatusChange: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          settings: {
            enableWipLimits: formData.enableWipLimits,
            enableTimeTracking: formData.enableTimeTracking,
            allowPriorityChange: formData.allowPriorityChange,
            allowStatusChange: formData.allowStatusChange,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create board");
      }

      const board = await response.json();
      router.push(`/boards/${board.id}`);
    } catch (error) {
      console.error("Error creating board:", error);
      alert("Failed to create board");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-secondary-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-secondary-900">
                  Create New Project
                </h1>
                <p className="text-sm text-secondary-600">
                  Set up your development project board
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-secondary-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-medium text-secondary-900 mb-4">
                Basic Information
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-secondary-700 mb-2"
                  >
                    Project Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter project title (e.g., 'User Authentication System')"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-secondary-700 mb-2"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Describe your development project objectives and scope..."
                  />
                </div>
              </div>
            </div>

            {/* Board Settings */}
            <div>
              <h2 className="text-lg font-medium text-secondary-900 mb-4">
                Project Settings
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label
                      htmlFor="enableTimeTracking"
                      className="text-sm font-medium text-secondary-900"
                    >
                      Enable Time Tracking
                    </label>
                    <p className="text-sm text-secondary-600">
                      Allow team members to log estimated and actual hours for
                      tasks
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="enableTimeTracking"
                    checked={formData.enableTimeTracking}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        enableTimeTracking: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label
                      htmlFor="enableWipLimits"
                      className="text-sm font-medium text-secondary-900"
                    >
                      Enable WIP Limits
                    </label>
                    <p className="text-sm text-secondary-600">
                      Set work-in-progress limits for columns to improve
                      workflow
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="enableWipLimits"
                    checked={formData.enableWipLimits}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        enableWipLimits: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label
                      htmlFor="allowPriorityChange"
                      className="text-sm font-medium text-secondary-900"
                    >
                      Allow Priority Changes
                    </label>
                    <p className="text-sm text-secondary-600">
                      Let team members update task priorities
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="allowPriorityChange"
                    checked={formData.allowPriorityChange}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        allowPriorityChange: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label
                      htmlFor="allowStatusChange"
                      className="text-sm font-medium text-secondary-900"
                    >
                      Allow Status Changes
                    </label>
                    <p className="text-sm text-secondary-600">
                      Enable drag-and-drop task movement between columns
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="allowStatusChange"
                    checked={formData.allowStatusChange}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        allowStatusChange: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                  />
                </div>
              </div>
            </div>

            {/* Default Columns Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Default Columns
              </h3>
              <p className="text-sm text-blue-700 mb-2">
                Your project will be created with these default development
                columns:
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-md">
                  📋 Backlog
                </span>
                <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-md">
                  ⚙️ In Development
                </span>
                <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md">
                  👀 Code Review
                </span>
                <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                  ✅ Deployed
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-secondary-200">
              <Link href="/">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>

              <Button
                type="submit"
                disabled={!formData.title.trim() || isCreating}
                className="flex items-center gap-2"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Project
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
