# 🎙️ Voice-Enabled Task Tracker

A modern, voice-enabled task management application with multiple views (Kanban, List, Calendar). Built with Next.js, Firebase, and Tailwind CSS.

![Next.js](https://img.shields.io/badge/Next.js-16.0.6-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Storage-orange?style=flat-square&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)

## ✨ Features

### 🎯 Task Management
- **Multiple Views** - Switch between three different task views:
  - 📊 **Kanban Board** - Visual columns for Pending, In Progress, Completed
  - 📋 **List View** - Tabular view with sorting and filtering
  - 📅 **Calendar View** - Monthly calendar showing tasks by due date

- **Kanban Board Layout** - Visual task organization with three columns:
  - 📋 **Pending** - Tasks waiting to be started
  - 🔄 **In Progress** - Tasks currently being worked on
  - ✅ **Completed** - Finished tasks
- **Drag & Drop** - Easily move tasks between columns with intuitive drag-and-drop

- **List View Features**:
  - Sort by title, priority, status, due date, or creation date
  - Filter by status (Pending, In Progress, Completed)
  - Filter by priority (High, Medium, Low)
  - Quick status toggle with clickable icons

- **Calendar View Features**:
  - Monthly calendar layout
  - Tasks displayed on their due dates
  - Color-coded by priority
  - Click on a day to see all tasks
  - Navigate between months

- **Task Details** - Each task includes:
  - Title
  - Priority (Low, Medium, High)
  - Status (Pending, In Progress, Completed)
  - Due Date & Time
  - Creation timestamp

### 🎙️ Voice Commands
- **Voice Input** - Create tasks using natural speech
- **Supported Commands**:
  - `"Add task [task name]"` - Create a new task
  - `"Add urgent task [task name]"` - Create a high-priority task
  - `"List my tasks"` - Hear a summary of your tasks
- **Real-time Feedback** - Visual indicators for recording status

### 🔐 Authentication
- **Google Sign-In** - Secure authentication via Google OAuth
- **Profile Management** - View and update your profile
- **Custom Profile Photo** - Upload your own profile picture to Firebase Storage

### 📱 User Experience
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Modern UI** - Clean, gradient-based design with smooth animations
- **Toast Notifications** - Real-time feedback for all actions
- **Error Boundaries** - Graceful error handling throughout the app
- **Custom Confirmation Dialogs** - Beautiful popups instead of browser alerts

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.0.6 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Authentication** | Firebase Auth (Google OAuth) |
| **Database** | Cloud Firestore |
| **Storage** | Firebase Storage |
| **Icons** | Lucide React |
| **Deployment** | Vercel |

## 📁 Project Structure

```
src/
├── app/
│   ├── dashboard/
│   │   └── page.tsx          # Main dashboard with Kanban board
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── globals.css           # Global styles & animations
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing page
├── components/
│   ├── auth/
│   │   └── AuthProvider.tsx  # Authentication context
│   ├── layout/
│   │   ├── Header.tsx        # Navigation header
│   │   └── ProfilePhotoUpload.tsx  # Profile photo modal
│   ├── tasks/
│   │   ├── KanbanBoard.tsx   # Main Kanban layout
│   │   ├── KanbanCard.tsx    # Draggable task card
│   │   ├── KanbanColumn.tsx  # Column container
│   │   ├── ListView.tsx      # List/Table view with sorting & filtering
│   │   ├── CalendarView.tsx  # Monthly calendar view
│   │   ├── ViewToggle.tsx    # View switcher component
│   │   ├── TaskForm.tsx      # New task form
│   │   └── EditTaskModal.tsx # Edit task modal
│   ├── ui/
│   │   ├── ConfirmDialog.tsx # Custom confirmation popup
│   │   ├── ErrorBoundary.tsx # Error handling wrapper
│   │   └── Toast.tsx         # Notification component
│   └── voice/
│       └── VoiceRecorder.tsx # Voice input component
├── hooks/
│   ├── useTasks.ts           # Task CRUD operations
│   └── useToast.ts           # Toast notifications
├── lib/
│   └── firebase.ts           # Firebase configuration
└── types/
    └── task.ts               # TypeScript interfaces
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project with:
  - Authentication (Google provider enabled)
  - Cloud Firestore
  - Firebase Storage

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vaishnav-192/VoiceTaskTracker.git
   cd VoiceTaskTracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Configure Firebase**
   
   - Enable Google Sign-In in Firebase Console → Authentication → Sign-in method
   - Add your domain to authorized domains (including `localhost` for development)
   - Set up Firestore security rules:
     ```javascript
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /tasks/{taskId} {
           allow read, write: if request.auth != null 
             && request.auth.uid == resource.data.userId;
           allow create: if request.auth != null;
         }
       }
     }
     ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Creating Tasks

#### Via Voice Input
1. Click the microphone button in the "Voice Input" section
2. Speak your command (e.g., "Add task Buy groceries")
3. The task will be created automatically

#### Via Manual Input
1. Click "Add task manually" to expand the form
2. Fill in the task details:
   - Task title (required)
   - Priority (Low/Medium/High)
   - Status (Pending/In Progress/Completed)
   - Due date and time (optional)
3. Click "Add Task" or press Enter

### Managing Tasks

- **Move Tasks** - Drag and drop cards between columns
- **Edit Tasks** - Hover over a card and click the pencil icon
- **Delete Tasks** - Hover over a card and click the trash icon
- **View Details** - All task details are visible on the card

### Profile Management

1. Click your profile picture in the header
2. Select "Change Photo" to upload a custom profile picture
3. Images are stored securely in Firebase Storage

## 🎨 UI Components

### Color Scheme

| Section | Colors |
|---------|--------|
| Voice Input | Indigo/Purple gradient (`from-indigo-50 to-purple-50`) |
| Add Task | Emerald/Teal gradient (`from-emerald-50 to-teal-50`) |
| Pending Column | Yellow theme |
| In Progress Column | Blue theme |
| Completed Column | Green theme |
| Priority Badges | Red (High), Yellow (Medium), Green (Low) |

### Animations

- `fadeIn` - Smooth opacity transitions
- `scaleIn` - Scale-up entrance animations
- Drag preview with rotation effect
- Smooth hover transitions on cards

## 🔧 Configuration

### Firebase Setup

The app requires the following Firebase services:

1. **Authentication**
   - Google Sign-In provider
   - Authorized domains configured

2. **Cloud Firestore**
   - Collection: `tasks`
   - Document structure:
     ```typescript
     {
       userId: string;
       title: string;
       priority: 'low' | 'medium' | 'high';
       status: 'pending' | 'in-progress' | 'completed';
       dueDate?: string;
       dueTime?: string;
       createdAt: Timestamp;
       updatedAt: Timestamp;
     }
     ```

3. **Firebase Storage**
   - Used for profile photo uploads
   - Path: `profile-photos/{userId}`

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

Make sure to add all `.env.local` variables to your Vercel project settings.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Firebase](https://firebase.google.com/) - Backend services
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Lucide](https://lucide.dev/) - Beautiful icons
- [Vercel](https://vercel.com/) - Deployment platform

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/vaishnav-192">vaishnav-192</a>
</p>
