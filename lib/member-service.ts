import { S3Service } from "./s3-service";
import { Member } from "@/types/kanban";

export class MemberService {
  private static readonly MEMBERS_KEY = "members/global-members.json";

  // Get all global members
  static async getAllMembers(): Promise<Member[]> {
    try {
      const membersData = await S3Service.getObjectData(this.MEMBERS_KEY);
      if (!membersData) {
        return [];
      }
      const parsedData = JSON.parse(membersData);
      return parsedData.members || [];
    } catch (error) {
      console.error("Error getting members:", error);
      return [];
    }
  }

  // Add a new member
  static async addMember(member: Omit<Member, "id">): Promise<Member> {
    try {
      const existingMembers = await this.getAllMembers();

      // Check if member with same email already exists
      const existingMember = existingMembers.find(
        (m) => m.email === member.email
      );
      if (existingMember) {
        throw new Error("Member with this email already exists");
      }

      const newMember: Member = {
        ...member,
        id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      const updatedMembers = [...existingMembers, newMember];

      await S3Service.putObjectData(
        this.MEMBERS_KEY,
        JSON.stringify({
          members: updatedMembers,
          updatedAt: new Date().toISOString(),
        })
      );

      return newMember;
    } catch (error) {
      console.error("Error adding member:", error);
      throw error;
    }
  }

  // Update a member
  static async updateMember(
    memberId: string,
    updates: Partial<Member>
  ): Promise<Member> {
    try {
      const existingMembers = await this.getAllMembers();
      const memberIndex = existingMembers.findIndex((m) => m.id === memberId);

      if (memberIndex === -1) {
        throw new Error("Member not found");
      }

      const updatedMember = { ...existingMembers[memberIndex], ...updates };
      existingMembers[memberIndex] = updatedMember;

      await S3Service.putObjectData(
        this.MEMBERS_KEY,
        JSON.stringify({
          members: existingMembers,
          updatedAt: new Date().toISOString(),
        })
      );

      return updatedMember;
    } catch (error) {
      console.error("Error updating member:", error);
      throw error;
    }
  }

  // Delete a member
  static async deleteMember(memberId: string): Promise<void> {
    try {
      const existingMembers = await this.getAllMembers();
      const updatedMembers = existingMembers.filter((m) => m.id !== memberId);

      await S3Service.putObjectData(
        this.MEMBERS_KEY,
        JSON.stringify({
          members: updatedMembers,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error("Error deleting member:", error);
      throw error;
    }
  }

  // Get member by ID
  static async getMemberById(memberId: string): Promise<Member | null> {
    try {
      const members = await this.getAllMembers();
      return members.find((m) => m.id === memberId) || null;
    } catch (error) {
      console.error("Error getting member by ID:", error);
      return null;
    }
  }

  // Generate avatar color for consistency
  static getAvatarColor(name: string): string {
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
  }

  // Get initials for avatar
  static getInitials(name: string): string {
    const words = name.split(" ").filter((word) => word.length > 0);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return words[0]?.substring(0, 2).toUpperCase() || "UN";
  }
}
