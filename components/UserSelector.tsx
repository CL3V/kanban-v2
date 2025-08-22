import React, { useState, useEffect, useMemo } from "react";
import { Member } from "@/types/kanban";
import { UserAvatar } from "./UserAvatar";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { SkeletonProfile } from "./ui/Skeleton";
import {
  User,
  LogIn,
  Plus,
  Mail,
  Shield,
  Search,
  Check,
  UserPlus,
} from "lucide-react";
import { useCSRF } from "@/hooks/useCSRF";

interface UserSelectorProps {
  isOpen: boolean;
  onUserSelect: (user: Member) => void;
  members: Member[];
  onMembersUpdate?: () => void; // Callback to refresh members list
  onClose?: () => void; // Allow closing the modal
  allowClose?: boolean; // Whether the modal can be closed (default: false for mandatory selection)
  loading?: boolean; // Loading state for members
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
  loading = false,
}) => {
  const [selectedUser, setSelectedUser] = useState<Member | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "member" as Member["role"],
    avatar: "",
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const { secureApiCall } = useCSRF();

  const handleUserSelect = (user: Member) => {
    setSelectedUser(user);
  };

  // Filter members based on search query
  const filteredMembers = members.filter((member) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.role.toLowerCase().replace("_", " ").includes(query)
    );
  });

  // Validate form data
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Check if email already exists
    if (
      formData.email &&
      members.some(
        (m) => m.email.toLowerCase() === formData.email.toLowerCase()
      )
    ) {
      errors.email = "A profile with this email already exists";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = () => {
    if (selectedUser) {
      // Cache the selected user in localStorage
      localStorage.setItem("currentUser", JSON.stringify(selectedUser));
      onUserSelect(selectedUser);
    }
  };

  const handleCreateMember = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const response = await secureApiCall("/api/members", {
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
        setFormErrors({});
        setSearchQuery("");

        // Refresh members list if callback provided
        if (onMembersUpdate) {
          onMembersUpdate();
        }
      } else {
        const error = await response.json();
        setFormErrors({ general: error.error || "Failed to create member" });
      }
    } catch (error) {
      console.error("Error creating member:", error);
      setFormErrors({ general: "Failed to create member. Please try again." });
    }
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || showCreateForm) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const currentIndex = selectedUser
          ? filteredMembers.findIndex((m) => m.id === selectedUser.id)
          : -1;
        let nextIndex;

        if (e.key === "ArrowDown") {
          nextIndex =
            currentIndex < filteredMembers.length - 1 ? currentIndex + 1 : 0;
        } else {
          nextIndex =
            currentIndex > 0 ? currentIndex - 1 : filteredMembers.length - 1;
        }

        if (filteredMembers[nextIndex]) {
          setSelectedUser(filteredMembers[nextIndex]);
        }
      } else if (e.key === "Enter" && selectedUser) {
        e.preventDefault();
        handleContinue();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showCreateForm, selectedUser, filteredMembers]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={allowClose && onClose ? onClose : () => {}}
      title=""
      size="lg"
    >
      <div className="p-0 max-h-[85vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-4 sm:p-6 lg:p-8 text-center border-b flex-shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-primary-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
            {showCreateForm ? (
              <UserPlus className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            ) : (
              <User className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            {showCreateForm ? "Create Your Profile" : "Welcome Back!"}
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-md mx-auto">
            {showCreateForm
              ? "Set up your profile to get started with the kanban board"
              : "Select your profile to continue to your workspace"}
          </p>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {showCreateForm ? (
            // Create Member Form
            <div className="space-y-6">
              {formErrors.general && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{formErrors.general}</p>
                </div>
              )}

              <form onSubmit={handleCreateMember} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (formErrors.name) {
                          setFormErrors({ ...formErrors, name: "" });
                        }
                      }}
                      className={`w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm sm:text-base ${
                        formErrors.name
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your full name"
                    />
                  </div>
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (formErrors.email) {
                          setFormErrors({ ...formErrors, email: "" });
                        }
                      }}
                      className={`w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm sm:text-base ${
                        formErrors.email
                          ? "border-red-300 bg-red-50"
                          : "border-gray-300"
                      }`}
                      placeholder="Enter your email address"
                    />
                  </div>
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          role: e.target.value as Member["role"],
                        })
                      }
                      className="w-full pl-9 sm:pl-10 pr-10 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white text-sm sm:text-base"
                    >
                      <option value="member">Team Member</option>
                      <option value="project_manager">Project Manager</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg
                        className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full sm:flex-1 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white py-2 sm:py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Create Profile
                  </Button>
                  {members.length > 0 && (
                    <Button
                      type="button"
                      onClick={() => {
                        setShowCreateForm(false);
                        setFormErrors({});
                        setFormData({
                          name: "",
                          email: "",
                          role: "member",
                          avatar: "",
                        });
                      }}
                      variant="outline"
                      size="lg"
                      className="w-full sm:flex-1 py-2 sm:py-3"
                    >
                      Back to Profiles
                    </Button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            // User Selection or Empty State
            <>
              {members.length === 0 ? (
                // Empty State - No Members
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    No profiles found
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    You're new here! Let's create your first profile to get
                    started with the kanban board.
                  </p>
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    size="lg"
                    className="bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="w-5 h-5" />
                    Create Your First Profile
                  </Button>
                </div>
              ) : loading ? (
                // Loading State
                <div className="space-y-3">
                  <div className="h-12 mb-6 rounded-lg animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
                  <div className="space-y-3 mb-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <SkeletonProfile key={i} />
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                    <div className="w-full sm:flex-1 h-12 rounded-lg animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
                    <div className="w-full sm:flex-1 h-12 rounded-lg animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]"></div>
                  </div>
                </div>
              ) : (
                // Member Selection
                <>
                  {/* Search Bar */}
                  {members.length > 3 && (
                    <div className="mb-4 sm:mb-6">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search profiles..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm sm:text-base"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 max-h-60 sm:max-h-80 overflow-y-auto">
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((member) => (
                        <div
                          key={member.id}
                          onClick={() => handleUserSelect(member)}
                          className={`group flex items-center p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                            selectedUser?.id === member.id
                              ? "border-primary-500 bg-gradient-to-r from-primary-50 to-blue-50 shadow-lg"
                              : "border-gray-200 hover:border-primary-300 hover:bg-gray-50 hover:shadow-md"
                          }`}
                        >
                          <UserAvatar
                            member={member}
                            size="md"
                            showName={false}
                            showRole={false}
                            className="mr-3 sm:mr-4 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                              {member.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2 truncate">
                              {member.email}
                            </p>
                            <span
                              className={`inline-flex items-center px-2 sm:px-3 py-1 text-xs font-medium rounded-full capitalize ${
                                member.role === "admin"
                                  ? "bg-purple-100 text-purple-700"
                                  : member.role === "project_manager"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              <Shield className="w-3 h-3 mr-1 hidden sm:inline" />
                              {member.role.replace("_", " ")}
                            </span>
                          </div>
                          {selectedUser?.id === member.id && (
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                              <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No profiles found
                        </h3>
                        <p className="text-gray-600 mb-4">
                          No profiles match your search criteria.
                        </p>
                        <Button
                          onClick={() => setSearchQuery("")}
                          variant="outline"
                          size="sm"
                        >
                          Clear Search
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 border-t mt-4 sm:mt-6">
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      variant="outline"
                      size="lg"
                      className="w-full sm:flex-1 py-2 sm:py-3 flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">
                        Create New Profile
                      </span>
                      <span className="sm:hidden">Create New</span>
                    </Button>
                    <Button
                      onClick={handleContinue}
                      disabled={!selectedUser}
                      size="lg"
                      className={`w-full sm:flex-1 py-2 sm:py-3 flex items-center justify-center gap-2 transition-all duration-200 ${
                        selectedUser
                          ? "bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 shadow-lg hover:shadow-xl"
                          : ""
                      }`}
                    >
                      <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden sm:inline">
                        Continue to Workspace
                      </span>
                      <span className="sm:hidden">Continue</span>
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
