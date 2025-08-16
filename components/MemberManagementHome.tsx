import { useState, useEffect } from "react";
import { Member } from "@/types/kanban";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import UserAvatar from "@/components/UserAvatar";
import { PermissionService } from "@/lib/PermissionService";
import { Plus, Edit2, Trash2, User, Mail, Shield } from "lucide-react";

interface MemberManagementHomeProps {
  onMemberSelect?: (member: Member) => void;
  currentUser?: Member | null;
}

export default function MemberManagementHome({
  onMemberSelect,
  currentUser,
}: MemberManagementHomeProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "member" as Member["role"],
    avatar: "",
  });

  // Check if current user can manage members
  const canManageMembers = currentUser
    ? PermissionService.canManageMembers(currentUser)
    : false;

  // Load members
  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/members");
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingMember
        ? `/api/members/${editingMember.id}`
        : "/api/members";

      const method = editingMember ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await loadMembers();
        handleCloseModal();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save member");
      }
    } catch (error) {
      console.error("Error saving member:", error);
      alert("Failed to save member");
    }
  };

  const handleDelete = async (memberId: string) => {
    if (!confirm("Are you sure you want to delete this member?")) {
      return;
    }

    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadMembers();
      } else {
        alert("Failed to delete member");
      }
    } catch (error) {
      console.error("Error deleting member:", error);
      alert("Failed to delete member");
    }
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      avatar: member.avatar || "",
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setFormData({
      name: "",
      email: "",
      role: "member",
      avatar: "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Only show member management to users with permission
  if (!canManageMembers) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-600">
            You don't have permission to manage team members
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage your organization members
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No members yet
          </h3>
          <p className="text-gray-600 mb-4">
            Get started by adding your first team member
          </p>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Add Member
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onMemberSelect?.(member)}
            >
              <div className="flex items-start justify-between">
                <UserAvatar
                  member={member}
                  size="md"
                  showName={true}
                  showEmail={true}
                  showRole={true}
                />
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(member);
                    }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(member.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingMember ? "Edit Member" : "Add New Member"}
      >
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    role: e.target.value as Member["role"],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="member">Member</option>
                <option value="project_manager">Project Manager</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avatar URL (optional)
              </label>
              <input
                type="url"
                value={formData.avatar}
                onChange={(e) =>
                  setFormData({ ...formData, avatar: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
              >
                {editingMember ? "Update Member" : "Add Member"}
              </Button>
              <Button
                type="button"
                onClick={handleCloseModal}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
