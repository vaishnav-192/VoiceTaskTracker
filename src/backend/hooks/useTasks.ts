'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, CreateTaskInput, UpdateTaskInput, TaskPriority, TaskStatus } from '@/shared/types';
import { 
  subscribeToTasks, 
  createTask as createTaskApi, 
  updateTask as updateTaskApi, 
  deleteTask as deleteTaskApi 
} from '@/backend/firebase/firestore';
import { useAuth } from '@/frontend/context/AuthContext';
import { getErrorMessage, logError, isNetworkError, isRetryableError } from '@/backend/errors';

interface CreateTaskData {
  title: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: Date;
  dueTime?: string;
  voiceTranscript?: string;
}

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  createTask: (taskData: CreateTaskData) => Promise<void>;
  updateTask: (taskId: string, updates: UpdateTaskInput) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  findTaskByTitle: (searchTitle: string) => Task | undefined;
  getTaskStats: () => TaskStats;
  clearError: () => void;
  retryLastAction: () => Promise<void>;
}

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  highPriority: number;
}

interface LastAction {
  type: 'create' | 'update' | 'delete';
  data: CreateTaskData | { taskId: string; updates: UpdateTaskInput } | string;
}

export function useTasks(): UseTasksReturn {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [lastFailedAction, setLastFailedAction] = useState<LastAction | null>(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Clear network-related errors when back online
      if (error && error.includes('offline')) {
        setError(null);
      }
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setError('You appear to be offline. Changes will sync when you reconnect.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initial state
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error]);

  // Subscribe to tasks when user is authenticated
  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    console.log('Subscribing to tasks for user:', user.uid);

    const unsubscribe = subscribeToTasks(
      user.uid,
      (fetchedTasks: Task[]) => {
        console.log('Tasks received:', fetchedTasks.length);
        setTasks(fetchedTasks);
        setLoading(false);
        // Clear any offline errors on successful data receipt
        if (error && isOffline) {
          setError(null);
          setIsOffline(false);
        }
      },
      (err: Error) => {
        console.error('Task subscription error:', err);
        const errorMessage = getErrorMessage(err);
        
        if (isNetworkError(err)) {
          setIsOffline(true);
          setError('Unable to sync tasks. Please check your connection.');
        } else {
          setError(errorMessage);
        }
        
        setLoading(false);
        logError(err, { context: 'subscribeToTasks', userId: user.uid });
      }
    );

    return () => {
      console.log('Unsubscribing from tasks');
      unsubscribe();
    };
  }, [user, error, isOffline]);

  const createTask = useCallback(async (taskData: CreateTaskData): Promise<void> => {
    if (!user) {
      const errorMsg = 'You must be logged in to create tasks.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    // Validate input
    if (!taskData.title?.trim()) {
      const errorMsg = 'Task title is required.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      setError(null);
      const taskInput: CreateTaskInput = {
        title: taskData.title.trim(),
        status: taskData.status || 'pending',
        priority: taskData.priority || 'medium',
        dueDate: taskData.dueDate,
        dueTime: taskData.dueTime,
        userId: user.uid,
        voiceTranscript: taskData.voiceTranscript,
      };
      
      console.log('Creating task:', taskInput);
      await createTaskApi(taskInput);
      console.log('Task created successfully');
      
      // Clear last failed action on success
      setLastFailedAction(null);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, { context: 'createTask', taskData, userId: user.uid });
      
      // Store for retry if retryable
      if (isRetryableError(err)) {
        setLastFailedAction({ type: 'create', data: taskData });
      }
      
      throw err;
    }
  }, [user]);

  const updateTask = useCallback(async (
    taskId: string, 
    updates: UpdateTaskInput
  ): Promise<void> => {
    if (!user) {
      const errorMsg = 'You must be logged in to update tasks.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    if (!taskId) {
      const errorMsg = 'Task ID is required.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      setError(null);
      await updateTaskApi(taskId, updates);
      setLastFailedAction(null);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, { context: 'updateTask', taskId, updates, userId: user.uid });
      
      if (isRetryableError(err)) {
        setLastFailedAction({ type: 'update', data: { taskId, updates } });
      }
      
      throw err;
    }
  }, [user]);

  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    if (!user) {
      const errorMsg = 'You must be logged in to delete tasks.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    if (!taskId) {
      const errorMsg = 'Task ID is required.';
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      setError(null);
      await deleteTaskApi(taskId);
      setLastFailedAction(null);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, { context: 'deleteTask', taskId, userId: user.uid });
      
      if (isRetryableError(err)) {
        setLastFailedAction({ type: 'delete', data: taskId });
      }
      
      throw err;
    }
  }, [user]);

  const retryLastAction = useCallback(async (): Promise<void> => {
    if (!lastFailedAction) return;
    
    try {
      switch (lastFailedAction.type) {
        case 'create':
          await createTask(lastFailedAction.data as CreateTaskData);
          break;
        case 'update':
          const updateData = lastFailedAction.data as { taskId: string; updates: UpdateTaskInput };
          await updateTask(updateData.taskId, updateData.updates);
          break;
        case 'delete':
          await deleteTask(lastFailedAction.data as string);
          break;
      }
    } catch {
      // Error already handled in individual methods
    }
  }, [lastFailedAction, createTask, updateTask, deleteTask]);

  const findTaskByTitle = useCallback((searchTitle: string): Task | undefined => {
    if (!searchTitle?.trim()) return undefined;
    
    const normalizedSearch = searchTitle.toLowerCase().trim();
    
    const exactMatch = tasks.find(
      task => task.title.toLowerCase() === normalizedSearch
    );
    if (exactMatch) return exactMatch;

    return tasks.find(
      task => 
        task.title.toLowerCase().includes(normalizedSearch) ||
        normalizedSearch.includes(task.title.toLowerCase())
    );
  }, [tasks]);

  const getTaskStats = useCallback((): TaskStats => {
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      highPriority: tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length,
    };
  }, [tasks]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    tasks,
    loading,
    error,
    isOffline,
    createTask,
    updateTask,
    deleteTask,
    findTaskByTitle,
    getTaskStats,
    clearError,
    retryLastAction,
  };
}
