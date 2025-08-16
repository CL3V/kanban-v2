import React, { useState, useEffect } from "react";
import { Member } from "@/types/kanban";
import { UserAvatar } from "./UserAvatar";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { User, LogIn, Plus, Mail, Shield } from "lucide-react";

interface UserSelectorProps {
  isOpen: boolean;
  onUserSelect: (user: Member) => void;
  members: Member[];
  onMembersUpdate?: () => void; // Callback to refresh members list
  onClose?: () => void; // Allow closing the modal
  allowClose?: boolean; // Whether the modal can be closed (default: false for mandatory selection)
}

// Helper function to get initials from a name
const getInitials = (name: string): string => {
  const words = name.split(" ").filter((word) => word.length > 0);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return words[0]?.substring(0, 2).toUpperCase() || "UN";
};

// Helper function to generate avatar color based on name
const getAvatarColor = (name: string): string => {
  const colors = [
    "#FF6B35",
    "#F7931E",
    "#FFD23F",
    "#A8E6CF",
    "#88D8B0",
    "#3B82F6",
    "#8B5CF6",
    "#EC4899",
    "#EF4444",
    "#10B981",
    "#F59E0B",
    "#8B5CF6",
    "#06B6D4",
    "#84CC16",
    "#F97316",
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
};

export const UserSelector: React.FC<UserSelectorProps> = ({
  isOpen,
  onUserSelect,
  members,
  onMembersUpdate,
  onClose,
  allowClose = false,
}) => {
  const [selectedUser, setSelectedUser] = useState<Member | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "member" as Member["role"],
    avatar: "",
  });

  const handleUserSelect = (user: Member) => {
    setSelectedUser(user);
  };

  const handleContinue = () => {
    if (selectedUser) {
      // Cache the selected user in localStorage
      localStorage.setItem("currentUser", JSON.stringify(selectedUser));
      onUserSelect(selectedUser);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch("/api/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        const newMember = result.member;

        // Automatically select the newly created member
        setSelectedUser(newMember);
        setShowCreateForm(false);

        // Reset form
        setFormData({
          name: "",
          email: "",
          role: "member",
          avatar: "",
        });

        // Refresh members list if callback provided
        if (onMembersUpdate) {
          onMembersUpdate();
        }
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create member");
      }
    } catch (error) {
      console.error("Error creating member:", error);
      alert("Failed to create member");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={allowClose && onClose ? onClose : () => {}}
      title=""
    >
      <div className="p-6 max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {showCreateForm ? "Create Your Profile" : "Select Your Profile"}
          </h2>
          <p className="text-gray-600">
            {showCreateForm
              ? "Create a new profile to get started"
              : "Choose your profile to continue to the board"}
          </p>
        </div>

        {showCreateForm ? (
          // Create Member Form
          <form onSubmit={handleCreateMember} className="space-y-4">
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
                placeholder="Enter your full name"
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
                placeholder="Enter your email address"
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
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
              >
                Create Profile
              </Button>
              {members.length > 0 && (
                <Button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg"
                >
                  Back
                </Button>
              )}
            </div>
          </form>
        ) : (
          // User Selection or Empty State
          <>
            {members.length === 0 ? (
              // Empty State - No Members
              <div className="text-center py-8">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No profiles found
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first profile to get started
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create Profile
                </Button>
              </div>
            ) : (
              // Member Selection
              <>
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => handleUserSelect(member)}
                      className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        selectedUser?.id === member.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <UserAvatar
                        member={member}
                        size="md"
                        showName={false}
                        showRole={false}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {member.name}
                        </h3>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded mt-1 capitalize">
                          {member.role.replace("_", " ")}
                        </span>
                      </div>
                      {selectedUser?.id === member.id && (
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create New
                  </Button>
                  <Button
                    onClick={handleContinue}
                    disabled={!selectedUser}
                    className="flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Continue
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </Modal>
  );
};
