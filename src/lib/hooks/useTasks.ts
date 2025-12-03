'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task, CreateTaskInput, UpdateTaskInput, TaskPriority, TaskStatus } from '@/types';
import { 
  subscribeToTasks, 
  createTask as createTaskApi, 
  updateTask as updateTaskApi, 
  deleteTask as deleteTaskApi 
} from '@/lib/firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage, logError } from '@/lib/errors';

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
  createTask: (taskData: CreateTaskData) => Promise<void>;
  updateTask: (taskId: string, updates: UpdateTaskInput) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  findTaskByTitle: (searchTitle: string) => Task | undefined;
  getTaskStats: () => TaskStats;
  clearError: () => void;
}

interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  highPriority: number;
}

export function useTasks(): UseTasksReturn {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      (fetchedTasks) => {
        console.log('Tasks received:', fetchedTasks.length);
        setTasks(fetchedTasks);
        setLoading(false);
      },
      (err) => {
        console.error('Task subscription error:', err);
        setError(getErrorMessage(err));
        setLoading(false);
      }
    );

    return () => {
      console.log('Unsubscribing from tasks');
      unsubscribe();
    };
  }, [user]);

  const createTask = useCallback(async (taskData: CreateTaskData): Promise<void> => {
    if (!user) {
      setError('You must be logged in to create tasks.');
      return;
    }

    try {
      setError(null);
      const taskInput: CreateTaskInput = {
        title: taskData.title,
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
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, { context: 'createTask', taskData });
      throw err;
    }
  }, [user]);

  const updateTask = useCallback(async (
    taskId: string, 
    updates: UpdateTaskInput
  ): Promise<void> => {
    if (!user) {
      setError('You must be logged in to update tasks.');
      return;
    }

    try {
      setError(null);
      await updateTaskApi(taskId, updates);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, { context: 'updateTask', taskId, updates });
      throw err;
    }
  }, [user]);

  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    if (!user) {
      setError('You must be logged in to delete tasks.');
      return;
    }

    try {
      setError(null);
      await deleteTaskApi(taskId);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, { context: 'deleteTask', taskId });
      throw err;
    }
  }, [user]);

  const findTaskByTitle = useCallback((searchTitle: string): Task | undefined => {
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
    createTask,
    updateTask,
    deleteTask,
    findTaskByTitle,
    getTaskStats,
    clearError,
  };
}
