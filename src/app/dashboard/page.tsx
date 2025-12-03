'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User as UserIcon, AlertTriangle, Camera } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { signOut } from '@/lib/firebase/auth';
import { useTasks } from '@/lib/hooks/useTasks';
import { useToast } from '@/components/ui/Toast';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskForm } from '@/components/tasks/TaskForm';
import { LoadingScreen } from '@/components/ui/Loading';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ProfilePhotoUpload } from '@/components/profile/ProfilePhotoUpload';
import { Task, CreateTaskInput } from '@/types';
import { getErrorMessage, logError } from '@/lib/errors';

export default function DashboardPage() {
  const { user, loading: authLoading, error: authError, isConfigured } = useAuth();
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToast();
  const [showProfileUpload, setShowProfileUpload] = useState(false);
  const [userPhotoURL, setUserPhotoURL] = useState<string | null>(null);
  
  const { 
    tasks, 
    loading: tasksLoading, 
    error: tasksError,
    createTask,
    updateTask,
    deleteTask,
    getTaskStats,
    clearError
  } = useTasks();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Initialize user photo URL
  useEffect(() => {
    if (user?.photoURL) {
      setUserPhotoURL(user.photoURL);
    }
  }, [user?.photoURL]);

  // Show task errors via toast
  useEffect(() => {
    if (tasksError) {
      showError(tasksError);
      clearError();
    }
  }, [tasksError, showError, clearError]);

  const handleSignOut = async () => {
    try {
      await signOut();
      showSuccess('Signed out successfully');
      router.push('/login');
    } catch (error) {
      logError(error, { context: 'handleSignOut' });
      showError(getErrorMessage(error));
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await updateTask(taskId, updates);
      if (updates.status === 'completed') {
        showSuccess('Task completed!');
      }
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      showSuccess('Task deleted');
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handleCreateTask = async (taskData: Omit<CreateTaskInput, 'userId'>) => {
    try {
      await createTask(taskData);
      showSuccess('Task created!');
    } catch (error) {
      showError(getErrorMessage(error));
    }
  };

  const handlePhotoUpdated = (newPhotoURL: string | null) => {
    setUserPhotoURL(newPhotoURL);
  };

  // Show loading screen while auth is loading
  if (authLoading) {
    return <LoadingScreen message="Loading your tasks..." />;
  }

  // Show configuration error
  if (!isConfigured || authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Configuration Error</h2>
          <p className="text-gray-600 mb-4">
            {authError?.message || 'Firebase is not properly configured. Please check your environment variables.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  const stats = getTaskStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
              <svg 
                className="w-5 h-5 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Voice Task Tracker</h1>
              {stats.highPriority > 0 && (
                <p className="text-xs text-red-600 font-medium">
                  {stats.highPriority} urgent task{stats.highPriority !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProfileUpload(true)}
              className="relative group"
              aria-label="Edit profile photo"
              title="Edit profile photo"
            >
              {userPhotoURL ? (
                <img 
                  src={userPhotoURL} 
                  alt="" 
                  className="w-8 h-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-gray-500" aria-hidden="true" />
                </div>
              )}
              {/* Edit overlay */}
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-3 h-3 text-white" aria-hidden="true" />
              </div>
            </button>
            <span className="hidden sm:inline max-w-[150px] truncate text-sm text-gray-600">
              {user.displayName || user.email}
            </span>
          </div>
            <button
              onClick={handleSignOut}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Voice Recorder Section */}
          <section aria-label="Voice input">
            <ErrorBoundary>
              <VoiceRecorder tasks={tasks} />
            </ErrorBoundary>
          </section>

          {/* Manual Task Form */}
          <section aria-label="Add task manually">
            <ErrorBoundary>
              <TaskForm onSubmit={handleCreateTask} />
            </ErrorBoundary>
          </section>

          {/* Task List */}
          <section aria-label="Your tasks">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Your Tasks</h2>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{stats.pending} pending</span>
                <span>{stats.completed} completed</span>
              </div>
            </div>
            
            {tasksLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600" aria-label="Loading tasks"></div>
              </div>
            ) : (
              <ErrorBoundary>
                <TaskList 
                  tasks={tasks} 
                  onUpdateTask={handleUpdateTask}
                  onDeleteTask={handleDeleteTask}
                />
              </ErrorBoundary>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-4 text-center text-sm text-gray-500">
          <p>Voice Task Tracker &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>

      {/* Profile Photo Upload Modal */}
      <ProfilePhotoUpload
        user={user}
        isOpen={showProfileUpload}
        onClose={() => setShowProfileUpload(false)}
        onPhotoUpdated={handlePhotoUpdated}
      />
    </div>
  );
}
