"use client";

import React, { useState } from "react";
import { Member } from "@/types/kanban";
import { ChevronDown, User, X } from "lucide-react";
import { Button } from "./ui/Button";

interface MemberSelectorProps {
  members: { [memberId: string]: Member };
  selectedMemberId?: string;
  onSelect: (memberId: string | undefined) => void;
  placeholder?: string;
}

export const MemberSelector: React.FC<MemberSelectorProps> = ({
  members,
  selectedMemberId,
  onSelect,
  placeholder = "Select a member...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedMember = selectedMemberId
    ? members[selectedMemberId]
    : undefined;
  const membersList = Object.values(members);

  const handleSelect = (memberId: string | undefined) => {
    onSelect(memberId);
    setIsOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative">
      <div
        className="w-full px-3 py-2 border border-secondary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center space-x-2">
          {selectedMember ? (
            <>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: selectedMember.color }}
              >
                {getInitials(selectedMember.name)}
              </div>
              <span className="text-secondary-900">{selectedMember.name}</span>
              <span className="text-xs text-secondary-500 capitalize">
                ({selectedMember.role})
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
          {selectedMember && (
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

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-secondary-200 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="py-1">
            <button
              type="button"
              onClick={() => handleSelect(undefined)}
              className="w-full px-3 py-2 text-left hover:bg-secondary-50 flex items-center space-x-2"
            >
              <User className="h-4 w-4 text-secondary-400" />
              <span className="text-secondary-500">Unassigned</span>
            </button>

            {membersList.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => handleSelect(member.id)}
                className={`w-full px-3 py-2 text-left hover:bg-secondary-50 flex items-center space-x-2 ${
                  selectedMemberId === member.id ? "bg-primary-50" : ""
                }`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: member.color }}
                >
                  {getInitials(member.name)}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-secondary-900">
                    {member.name}
                  </div>
                  <div className="text-xs text-secondary-500">
                    {member.email} • {member.role}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
