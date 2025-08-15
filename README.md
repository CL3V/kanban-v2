# Core Team Kanban - Development Task Management

A specialized Kanban board application built for development teams with Next.js, TypeScript, Tailwind CSS, and AWS S3 for data storage. Core Team Kanban offers an intuitive experience tailored for software engineering workflows and agile development practices.

## 🚀 Features

- **Developer-Focused Kanban Board**: Specialized for software development workflows with clear column borders
- **Dynamic Project Management**: Create, edit, delete, and move development tasks with smooth animations
- **Team Member Management**: Built-in team system with role-based access (Admin, Member, Viewer)
- **Priority System**: Four priority levels (Low, Medium, High, Urgent) with visual indicators
- **Agile Ready**: Support for sprint planning, story points, and development cycles
- **Dynamic Column Management**: Create custom columns for your development workflow
- **Tag System**: Organize tasks with custom labels (bug, feature, enhancement, etc.)
- **Modern Development UI**: Clean, professional interface designed for engineering teams
- **WIP Limits**: Set work-in-progress limits for columns to optimize workflow
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Updates**: Changes persist immediately to AWS S3

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Drag & Drop**: @dnd-kit/core for smooth interactions
- **Backend**: Next.js API Routes
- **Database**: AWS S3 (JSON-based storage)
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## 🏗️ Architecture

### Data Storage

- **AWS S3**: All data is stored in S3 as JSON files
- **Project Storage**: Each project is stored as `boards/{boardId}.json`
- **Board Index**: `board-list.json` maintains list of all projects
- **Task Integration**: Tasks are embedded within board documents for atomic updates

### File Structure

```
kanban-v2/
├── app/                    # Next.js 15+ app directory
│   ├── api/               # API routes
│   │   └── boards/        # Board, task, member, and column endpoints
│   ├── boards/            # Board pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── BoardSettings.tsx # Dynamic board management
│   ├── Column.tsx        # Kanban column component
│   ├── ColumnManagement.tsx # Dynamic column management
│   ├── KanbanBoard.tsx   # Main board component
│   ├── MemberManagement.tsx # Team member management
│   ├── TaskCard.tsx      # Individual task component
│   └── TaskModal.tsx     # Task creation/editing modal
├── lib/                  # Utility libraries
│   ├── aws-config.ts     # AWS S3 configuration
│   └── s3-service.ts     # S3 operations service
└── types/                # TypeScript type definitions
    └── kanban.ts         # Kanban-related types
```

## ⚙️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm/yarn
- AWS Account with S3 access
- AWS CLI configured (optional)

### 1. Environment Configuration

You need to set up your AWS credentials. Since `.env` files are ignored, you have several options:

**Option A: Environment Variables**
Set these environment variables in your deployment platform (Vercel, etc.):

```bash
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
S3_BUCKET_NAME=your_bucket_name_here
```

**Option B: Local Development**
Create a `.env.local` file in the root directory:

```bash
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
S3_BUCKET_NAME=your_bucket_name_here
```

### 2. AWS S3 Setup

1. Create an S3 bucket in your AWS account
2. Ensure your AWS credentials have the following permissions:

   - `s3:GetObject`
   - `s3:PutObject`
   - `s3:DeleteObject`
   - `s3:ListBucket`

3. Update the bucket name in your environment variables

### 3. Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### 4. First Run

1. Visit `http://localhost:3000`
2. Click "Create Project Board" to start your first development project
3. Click "View All Projects" to see your team's project dashboard

## 📱 Usage Guide

### Creating a Project

1. Click "New Project" from the homepage or projects page
2. Fill in project title and description (focus on development objectives)
3. Configure project settings (WIP limits, time tracking, etc.)
4. Click "Create Project"

### Managing Development Tasks

- **Create Task**: Click the "+" button in any column or use "Add Task" button
- **Edit Task**: Click on any task card to view/edit details
- **Move Task**: Drag and drop tasks between development stages
- **Delete Task**: Open task modal and click "Delete"

### Task Properties for Development

- **Title & Description**: Basic task information (feature, bug, enhancement)
- **Priority**: Low (🟢), Medium (🟡), High (🟠), Urgent (🔴)
- **Status**: Backlog, In Development, Code Review, Deployed
- **Assignee**: Team member responsible for the task
- **Due Date**: Task deadline with sprint/milestone indicators
- **Tags**: Custom labels (bug, feature, hotfix, refactor, etc.)
- **Time Tracking**: Estimated and actual hours for sprint planning

### Team Management

- **Add Team Members**: Use Settings → Team Members to add developers
- **Role Assignment**: Admin (full access), Member (create/edit), Viewer (read-only)
- **Member Colors**: Automatic unique color assignment for easy identification

### Dynamic Column Management

- **Add Columns**: Create custom development stages (Testing, QA, Staging, etc.)
- **Edit Columns**: Update column names and WIP limits
- **Status Management**: Each column has a unique status identifier
- **Delete Protection**: Cannot delete columns with tasks

## 🎨 Customization for Development Teams

### Default Development Columns

The app creates these development-focused columns by default:

- **Backlog**: Features and tasks ready for development
- **In Development**: Active development work
- **Code Review**: Tasks awaiting peer review
- **Deployed**: Completed and deployed features

### Theme Colors

The app uses a professional color palette defined in `tailwind.config.ts`:

- **Primary**: Blue tones for development-focused branding
- **Secondary**: Gray tones for clean, professional appearance
- **Status Colors**: Red (backlog), Yellow (in-development), Blue (code-review), Green (deployed)

### Adding Development-Specific Features

The architecture supports development team needs:

- **Sprint Planning**: Extend task properties for story points
- **Git Integration**: Add branch/commit tracking to tasks
- **Code Review Links**: Connect tasks to pull request URLs
- **Bug Tracking**: Enhanced priority and severity systems

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The app can be deployed on any platform that supports Next.js:

- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/development-enhancement`)
3. Commit changes (`git commit -m 'Add development team feature'`)
4. Push to branch (`git push origin feature/development-enhancement`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Designed specifically for software development teams
- Built with modern React patterns and agile development practices
- Uses AWS S3 for reliable, scalable data storage
- Tailwind CSS for rapid, maintainable styling
- Optimized for development workflow efficiency

---

**Built for developers, by developers 💻**

For questions or support, please open an issue in the GitHub repository.
# kanban-v2
