"use client";

import React, { useState, useEffect } from "react";
import { Member, Board } from "@/types/kanban";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { UserAvatar } from "./UserAvatar";
import { PermissionService } from "@/lib/PermissionService";
import { useToast } from "@/contexts/ToastContext";
import {
  Users,
  Plus,
  User,
  Mail,
  Crown,
  Edit,
  Trash2,
  UserCheck,
  Eye,
  Check,
} from "lucide-react";

interface MemberManagementProps {
  boardId: string;
  members: { [memberId: string]: Member };
  onMembersUpdate: () => void;
  onBoardStateUpdate?: (updater: (board: Board) => Board) => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  boardId,
  members,
  onMembersUpdate,
  onBoardStateUpdate,
}) => {
  const { showSuccess, showError } = useToast();
  const [currentUser, setCurrentUser] = React.useState<Member | null>(null);
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("currentUser");
      if (saved) setCurrentUser(JSON.parse(saved));
    } catch {}
  }, []);
  const canManage = currentUser
    ? PermissionService.canManageProjectMembers(currentUser)
    : false;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGlobalMembersModalOpen, setIsGlobalMembersModalOpen] =
    useState(false);
  const [globalMembers, setGlobalMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [loadingGlobalMembers, setLoadingGlobalMembers] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "member" as "admin" | "project_manager" | "member" | "viewer",
  });

  const resetForm = () => {
    setFormData({ name: "", email: "", role: "member" });
    setEditingMember(null);
  };

  const fetchGlobalMembers = async () => {
    try {
      setLoadingGlobalMembers(true);
      const response = await fetch("/api/members");
      if (response.ok) {
        const data = await response.json();
        setGlobalMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error fetching global members:", error);
    } finally {
      setLoadingGlobalMembers(false);
    }
  };

  const openAddExistingMembers = () => {
    if (!canManage) return;
    setSelectedMembers(new Set());
    setIsGlobalMembersModalOpen(true);
    fetchGlobalMembers();
  };

  const handleMemberToggle = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleAddSelectedMembers = async () => {
    if (!canManage) return;
    if (selectedMembers.size === 0) return;

    try {
      setAddingMembers(true);

      for (const memberId of Array.from(selectedMembers)) {
        const response = await fetch(`/api/boards/${boardId}/members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ memberId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to add member");
        }
      }

      setSelectedMembers(new Set());
      setIsGlobalMembersModalOpen(false);

      // Update board state optimistically or refresh
      if (onBoardStateUpdate) {
        onBoardStateUpdate((board) => {
          const updatedMembers = { ...board.members };
          Array.from(selectedMembers).forEach((memberId) => {
            const member = globalMembers.find((m) => m.id === memberId);
            if (member) {
              updatedMembers[memberId] = { ...member, role: "member" };
            }
          });
          return {
            ...board,
            members: updatedMembers,
          };
        });
      } else {
        onMembersUpdate();
      }

      const memberCount = selectedMembers.size;
      showSuccess(
        "Members Added",
        `${memberCount} member${
          memberCount > 1 ? "s" : ""
        } added to the board successfully`
      );
    } catch (error) {
      console.error("Error adding members:", error);
      showError("Add Failed", "Failed to add members");
    } finally {
      setAddingMembers(false);
    }
  };

  const openAddMember = () => {
    if (!canManage) return;
    resetForm();
    setIsModalOpen(true);
  };

  const openEditMember = (member: Member) => {
    if (!canManage) return;
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
    });
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    if (!formData.name.trim() || !formData.email.trim()) return;

    try {
      const url = editingMember
        ? `/api/boards/${boardId}/members/${editingMember.id}`
        : `/api/boards/${boardId}/members`;

      const method = editingMember ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${editingMember ? "update" : "add"} member`);
      }

      const savedMember = await response.json();

      setIsModalOpen(false);
      resetForm();

      // Update board state optimistically or refresh
      if (onBoardStateUpdate) {
        onBoardStateUpdate((board) => ({
          ...board,
          members: {
            ...board.members,
            [savedMember.id]: savedMember,
          },
        }));
      } else {
        onMembersUpdate();
      }

      showSuccess(
        editingMember ? "Member Updated" : "Member Added",
        `${formData.name} has been ${
          editingMember ? "updated" : "added to the board"
        } successfully`
      );
    } catch (error) {
      console.error("Error saving member:", error);
      showError(
        editingMember ? "Update Failed" : "Add Failed",
        `Failed to ${editingMember ? "update" : "add"} member`
      );
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    if (!canManage) return;
    if (!confirm(`Remove ${memberName} from this board?`)) return;

    try {
      const response = await fetch(
        `/api/boards/${boardId}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove member");
      }

      // Update board state optimistically or refresh
      if (onBoardStateUpdate) {
        onBoardStateUpdate((board) => {
          const updatedMembers = { ...board.members };
          delete updatedMembers[memberId];
          return {
            ...board,
            members: updatedMembers,
          };
        });
      } else {
        onMembersUpdate();
      }

      showSuccess(
        "Member Removed",
        `${memberName} has been removed from the board`
      );
    } catch (error) {
      console.error("Error removing member:", error);
      showError("Remove Failed", "Failed to remove member");
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Crown className="h-3 w-3" />;
      case "member":
        return <UserCheck className="h-3 w-3" />;
      case "viewer":
        return <Eye className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "text-yellow-600 bg-yellow-100";
      case "member":
        return "text-blue-600 bg-blue-100";
      case "viewer":
        return "text-gray-600 bg-gray-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const membersList = Object.values(members);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-secondary-600" />
          <h3 className="font-medium text-secondary-900">
            Team Members ({membersList.length})
          </h3>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={openAddExistingMembers}
            >
              <Users className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        )}
      </div>

      {/* Members List */}
      {membersList.length === 0 ? (
        <div className="text-center py-8 bg-secondary-50 rounded-lg border-2 border-dashed border-secondary-300">
          <Users className="h-8 w-8 text-secondary-400 mx-auto mb-2" />
          <p className="text-secondary-500 mb-3">No team members yet</p>
          {canManage && (
            <div className="flex gap-2 justify-center">
              <Button
                size="sm"
                variant="outline"
                onClick={openAddExistingMembers}
              >
                <Users className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {membersList.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-white border border-secondary-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <UserAvatar
                  member={member}
                  size="sm"
                  showName={false}
                  showRole={false}
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-secondary-900">
                      {member.name}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                        member.role
                      )}`}
                    >
                      {getRoleIcon(member.role)}
                      <span className="ml-1 capitalize">{member.role}</span>
                    </span>
                  </div>
                  <p className="text-sm text-secondary-500">{member.email}</p>
                </div>
              </div>
              {canManage && (
                <div className="flex items-center space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditMember(member)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteMember(member.id, member.name)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Member Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingMember ? "Edit Member" : "Add New Member"}
      >
        {canManage ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                <User className="inline h-4 w-4 mr-1" />
                Full Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter full name..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                <Mail className="inline h-4 w-4 mr-1" />
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter email address..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    role: e.target.value as "admin" | "member" | "viewer",
                  }))
                }
                className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="member">
                  👤 Member - Can create and edit tasks
                </option>
                <option value="admin">👑 Admin - Full board permissions</option>
                <option value="viewer">👁️ Viewer - Read-only access</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!formData.name.trim() || !formData.email.trim()}
              >
                {editingMember ? "Update Member" : "Add Member"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="text-secondary-600 text-sm">
            You don't have permission to manage members.
          </div>
        )}
      </Modal>

      {/* Global Members Selection Modal */}
      <Modal
        isOpen={isGlobalMembersModalOpen}
        onClose={() => setIsGlobalMembersModalOpen(false)}
        title="Add Members"
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Add Team Members</h2>
          </div>

          {loadingGlobalMembers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {globalMembers.filter((member) => !members[member.id]).length ===
              0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>All available members are already in this project</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {globalMembers
                    .filter((member) => !members[member.id])
                    .map((member) => (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedMembers.has(member.id)
                            ? "bg-blue-50 border-blue-200"
                            : "hover:bg-gray-50 border-gray-200"
                        }`}
                        onClick={() => handleMemberToggle(member.id)}
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar member={member} size="sm" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {member.email}
                            </p>
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              {PermissionService.getRoleDisplayName(
                                member.role
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {selectedMembers.has(member.id) && (
                            <Check className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsGlobalMembersModalOpen(false)}
                  disabled={addingMembers}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddSelectedMembers}
                  disabled={selectedMembers.size === 0 || addingMembers}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {addingMembers
                    ? "Adding..."
                    : `Add ${selectedMembers.size} Member${
                        selectedMembers.size !== 1 ? "s" : ""
                      }`}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
