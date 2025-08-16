# Member Management System Documentation

## Overview

The Kanban application now includes a centralized member management system that allows you to:

1. **Create and manage team members globally** across all projects
2. **Select your user profile** when accessing the application
3. **Assign members to boards and tasks** using the global member database

## Key Features

### 1. Global Member Management

- **Centralized Storage**: All members are stored globally in AWS S3 (`global-members.json`)
- **Member Roles**: Support for `admin`, `project_manager`, and `member` roles
- **Avatar Support**: Auto-generated initials or custom avatar URLs
- **CRUD Operations**: Full create, read, update, delete functionality

### 2. User Selection System

- **Automatic Prompt**: Users are prompted to select their profile when first accessing the app
- **Local Caching**: Selected user is cached in localStorage for future sessions
- **Switch User**: Option to change user at any time
- **Cross-Page Consistency**: User selection persists across all pages

### 3. Home Page Integration

- **Member Management Interface**: Toggle to show/hide member management on home page
- **Quick Member Creation**: Add new team members directly from the home page
- **Member Selection**: Click on any member card to select them as current user

## API Endpoints

### Members API

- `GET /api/members` - Get all global members
- `POST /api/members` - Create a new member
- `GET /api/members/[memberId]` - Get specific member
- `PUT /api/members/[memberId]` - Update member
- `DELETE /api/members/[memberId]` - Delete member

## File Structure

```
lib/
  member-service.ts     # Centralized member operations
  s3-service.ts         # Updated with public methods

app/api/
  members/
    route.ts            # Global members CRUD
    [memberId]/
      route.ts          # Individual member operations

components/
  MemberManagementHome.tsx  # Home page member interface
  UserSelector.tsx          # User selection modal

app/
  page.tsx              # Home page with member management
  boards/
    page.tsx            # Boards list with user selection
    [boardId]/
      page.tsx          # Individual board with user selection
```

## How It Works

### 1. Data Flow

1. Members are stored globally in S3 (`global-members.json`)
2. `MemberService` provides centralized member operations
3. API routes handle HTTP requests and call `MemberService`
4. Components use the API to display and manage members

### 2. User Experience

1. **First Visit**: User is prompted to select their profile
2. **Member Management**: Admins can add/edit/delete members from home page
3. **Board Access**: User selection is maintained across all boards
4. **Profile Switching**: Users can change their profile at any time

### 3. Integration with Existing Features

- **Task Assignment**: Uses global members for task assignments
- **Board Members**: Board-specific members now draw from global member pool
- **Comments**: Comment authors are linked to global member profiles
- **Permissions**: Role-based access control using member roles

## Benefits

1. **Consistency**: Same member data across all projects and features
2. **Efficiency**: No need to recreate members for each board
3. **Scalability**: Central member management supports organization growth
4. **User Experience**: Smooth user selection and profile management
5. **Data Integrity**: Single source of truth for member information

## Usage Examples

### Adding a New Member

1. Go to the home page
2. Click "Members" button to show member management
3. Click "Add Member" button
4. Fill in name, email, role, and optional avatar URL
5. Click "Add Member" to save

### Selecting Your User Profile

1. When prompted, choose your profile from the member list
2. Your selection is saved and used across all boards
3. Use "Switch User" button to change profile

### Managing Members

- **Edit**: Click edit icon on member card
- **Delete**: Click delete icon (with confirmation)
- **View**: See all members with their roles and details

This system provides a solid foundation for team collaboration and user management within the Kanban application.
