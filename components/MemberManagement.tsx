"use client";

import React, { useState } from "react";
import { Member } from "@/types/kanban";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
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
} from "lucide-react";

interface MemberManagementProps {
  boardId: string;
  members: { [memberId: string]: Member };
  onMembersUpdate: () => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  boardId,
  members,
  onMembersUpdate,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "member" as "admin" | "member" | "viewer",
  });

  const resetForm = () => {
    setFormData({ name: "", email: "", role: "member" });
    setEditingMember(null);
  };

  const openAddMember = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditMember = (member: Member) => {
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

      setIsModalOpen(false);
      resetForm();
      onMembersUpdate();
    } catch (error) {
      console.error("Error saving member:", error);
      alert(`Failed to ${editingMember ? "update" : "add"} member`);
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
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

      onMembersUpdate();
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member");
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
        <Button size="sm" onClick={openAddMember}>
          <Plus className="h-4 w-4 mr-1" />
          Add Member
        </Button>
      </div>

      {/* Members List */}
      {membersList.length === 0 ? (
        <div className="text-center py-8 bg-secondary-50 rounded-lg border-2 border-dashed border-secondary-300">
          <Users className="h-8 w-8 text-secondary-400 mx-auto mb-2" />
          <p className="text-secondary-500 mb-3">No team members yet</p>
          <Button size="sm" onClick={openAddMember}>
            <Plus className="h-4 w-4 mr-1" />
            Add First Member
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {membersList.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 bg-white border border-secondary-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: member.color }}
                >
                  {getInitials(member.name)}
                </div>
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
      </Modal>
    </div>
  );
};
