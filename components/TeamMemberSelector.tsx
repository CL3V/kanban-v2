import React, { useState, useEffect } from "react";
import { Member } from "@/types/kanban";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { UserAvatar } from "./UserAvatar";
import { PermissionService } from "@/lib/PermissionService";
import { Users, Plus, Check, X } from "lucide-react";
import { useCSRF } from "@/hooks/useCSRF";

interface TeamMemberSelectorProps {
  boardId: string;
  currentMembers: { [memberId: string]: Member };
  onMembersUpdate: () => void;
  currentUser?: Member;
}

export const TeamMemberSelector: React.FC<TeamMemberSelectorProps> = ({
  boardId,
  currentMembers,
  onMembersUpdate,
  currentUser,
}) => {
  const { secureApiCall } = useCSRF();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [globalMembers, setGlobalMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set()
  );
  const [saving, setSaving] = useState(false);

  const canManageMembers = currentUser
    ? PermissionService.canManageProjectMembers(currentUser)
    : false;

  useEffect(() => {
    if (isModalOpen) {
      fetchGlobalMembers();
    }
  }, [isModalOpen]);

  const fetchGlobalMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/members");
      if (response.ok) {
        const data = await response.json();
        setGlobalMembers(data.members || []);
      }
    } catch (error) {
      console.error("Error fetching global members:", error);
    } finally {
      setLoading(false);
    }
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

  const handleAddMembers = async () => {
    if (selectedMembers.size === 0) return;

    try {
      setSaving(true);

      // Add each selected member to the board
      for (const memberId of Array.from(selectedMembers)) {
        const response = await secureApiCall(`/api/boards/${boardId}/members`, {
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

      // Reset and close
      setSelectedMembers(new Set());
      setIsModalOpen(false);
      onMembersUpdate();
    } catch (error) {
      console.error("Error adding members:", error);
      alert("Failed to add members");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (
      !confirm("Are you sure you want to remove this member from the project?")
    ) {
      return;
    }

    try {
      const response = await secureApiCall(
        `/api/boards/${boardId}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to remove member");
      }

      onMembersUpdate();
    } catch (error) {
      console.error("Error removing member:", error);
      alert("Failed to remove member");
    }
  };

  const availableMembers = globalMembers.filter(
    (member) => !currentMembers[member.id]
  );

  if (!canManageMembers) {
    return (
      <div className="flex items-center gap-1">
        {Object.values(currentMembers)
          .slice(0, 4)
          .map((member, index) => (
            <UserAvatar
              key={member.id}
              member={member}
              size="sm"
              className={`border-2 border-white ${
                index > 0 ? "ml-[-8px]" : ""
              }`}
            />
          ))}
        {Object.keys(currentMembers).length > 4 && (
          <div className="relative w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white ml-[-8px]">
            +{Object.keys(currentMembers).length - 4}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {Object.values(currentMembers)
          .slice(0, 3)
          .map((member, index) => (
            <div key={member.id} className="relative group">
              <UserAvatar
                member={member}
                size="sm"
                className={`border-2 border-white cursor-pointer ${
                  index > 0 ? "ml-[-8px]" : ""
                }`}
              />
              {canManageMembers && (
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  title="Remove member"
                >
                  <X className="h-2 w-2" />
                </button>
              )}
            </div>
          ))}

        {Object.keys(currentMembers).length > 3 && (
          <div className="relative w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 border-2 border-white ml-[-8px]">
            +{Object.keys(currentMembers).length - 3}
          </div>
        )}

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-600 border-2 border-white ml-1 transition-colors"
          title="Add team members"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Team Members"
      >
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Add Team Members</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {availableMembers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>All available members are already in this project</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {availableMembers.map((member) => (
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
                            {PermissionService.getRoleDisplayName(member.role)}
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
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMembers}
                  disabled={selectedMembers.size === 0 || saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving
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
    </>
  );
};
