"use client";

import React, { useState, useRef, useEffect } from "react";
import { Member } from "@/types/kanban";
import { UserAvatar } from "./UserAvatar";
import { ChevronDown, User, X, Search } from "lucide-react";
import { Button } from "./ui/Button";

interface MemberSelectorProps {
  members: { [memberId: string]: Member };
  selectedMemberId?: string;
  onSelect: (memberId: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const MemberSelector: React.FC<MemberSelectorProps> = ({
  members,
  selectedMemberId,
  onSelect,
  placeholder = "Select a member...",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedMember = selectedMemberId
    ? members[selectedMemberId]
    : undefined;
  const membersList = Object.values(members);

  // Filter members based on search query
  const filteredMembers = membersList.filter((member) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query) ||
      member.role.toLowerCase().replace("_", " ").includes(query)
    );
  });

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (memberId: string | undefined) => {
    onSelect(memberId);
    setIsOpen(false);
    setSearchQuery(""); // Clear search when closing
  };

  const handleToggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (isOpen) {
        setSearchQuery(""); // Clear search when closing
      }
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ")[0].charAt(0).toUpperCase();
  };

  return (
    <div className="relative">
      <div
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent flex items-center justify-between ${
          disabled
            ? "border-secondary-200 bg-secondary-50 cursor-not-allowed"
            : "border-secondary-300 bg-white cursor-pointer"
        }`}
        onClick={handleToggleDropdown}
      >
        <div className="flex items-center space-x-2">
          {selectedMember ? (
            <>
              <UserAvatar
                member={selectedMember}
                size="xs"
                showName={false}
                showRole={false}
                className=""
              />
              <span className="text-secondary-900">{selectedMember.name}</span>
              <span className="text-xs text-secondary-500 capitalize">
                ({selectedMember.role.replace("_", " ")})
              </span>
            </>
          ) : (
            <>
              <User className="h-4 w-4 text-secondary-400" />
              <span className="text-secondary-500">{placeholder}</span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {selectedMember && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(undefined);
              }}
              className="text-secondary-400 hover:text-secondary-600 p-1 rounded hover:bg-secondary-100"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <ChevronDown className="h-4 w-4 text-secondary-400" />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-secondary-200 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-secondary-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-secondary-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-secondary-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                onClick={(e) => e.stopPropagation()} // Prevent closing dropdown when clicking input
              />
            </div>
          </div>

          {/* Members List */}
          <div className="py-1 max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => handleSelect(undefined)}
              className="w-full px-3 py-2 text-left hover:bg-secondary-50 flex items-center space-x-2"
            >
              <User className="h-4 w-4 text-secondary-400" />
              <span className="text-secondary-500">Unassigned</span>
            </button>

            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => handleSelect(member.id)}
                  className={`w-full px-3 py-2 text-left hover:bg-secondary-50 flex items-center space-x-2 ${
                    selectedMemberId === member.id ? "bg-primary-50" : ""
                  }`}
                >
                  <UserAvatar
                    member={member}
                    size="xs"
                    showName={false}
                    showRole={false}
                    className=""
                  />
                  <div className="flex-1">
                    <div className="font-medium text-secondary-900">
                      {member.name}
                    </div>
                    <div className="text-xs text-secondary-500">
                      {member.email} • {member.role.replace("_", " ")}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-secondary-500 text-center">
                No members found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
