import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  QueryConstraint,
  limit,
  getDocs
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseReady } from './config';
import { Task, CreateTaskInput, UpdateTaskInput, TaskStatus } from '@/shared/types';
import { FirestoreError, getErrorMessage, logError } from '@/backend/errors';

const TASKS_COLLECTION = 'tasks';
const MAX_TASKS_PER_USER = 1000; // Prevent unlimited growth

/**
 * Create a new task
 */
export async function createTask(task: CreateTaskInput): Promise<string> {
  if (!isFirebaseReady()) {
    throw new FirestoreError(
      'Database service is not available. Please refresh the page.',
      'firestore/not-initialized'
    );
  }

  // Validate input
  if (!task.title?.trim()) {
    throw new FirestoreError('Task title is required.', 'validation/title-required');
  }

  if (task.title.length > 500) {
    throw new FirestoreError('Task title is too long (max 500 characters).', 'validation/title-too-long');
  }

  if (!task.userId) {
    throw new FirestoreError('User ID is required.', 'validation/user-required');
  }

  const db = getFirebaseDb();

  try {
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
      title: task.title.trim(),
      description: task.description?.trim() || null,
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      dueDate: task.dueDate || null,
      dueTime: task.dueTime || null,
      userId: task.userId,
      tags: task.tags || [],
      voiceTranscript: task.voiceTranscript || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    logError(error, { context: 'createTask', task });
    throw new FirestoreError(getErrorMessage(error), 'firestore/create-failed');
  }
}

/**
 * Update an existing task
 */
export async function updateTask(taskId: string, updates: UpdateTaskInput): Promise<void> {
  if (!isFirebaseReady()) {
    throw new FirestoreError('Database service is not available.', 'firestore/not-initialized');
  }

  if (!taskId) {
    throw new FirestoreError('Task ID is required.', 'validation/id-required');
  }

  // Validate updates
  if (updates.title !== undefined && updates.title.trim() === '') {
    throw new FirestoreError('Task title cannot be empty.', 'validation/title-empty');
  }

  const db = getFirebaseDb();

  try {
    const taskRef = doc(db, TASKS_COLLECTION, taskId);
    
    // Clean up updates
    const cleanUpdates: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };

    if (updates.title !== undefined) cleanUpdates.title = updates.title.trim();
    if (updates.description !== undefined) cleanUpdates.description = updates.description?.trim() || null;
    if (updates.status !== undefined) cleanUpdates.status = updates.status;
    if (updates.priority !== undefined) cleanUpdates.priority = updates.priority;
    if (updates.dueDate !== undefined) cleanUpdates.dueDate = updates.dueDate;
    if (updates.dueTime !== undefined) cleanUpdates.dueTime = updates.dueTime;
    if (updates.tags !== undefined) cleanUpdates.tags = updates.tags;

    await updateDoc(taskRef, cleanUpdates);
  } catch (error) {
    logError(error, { context: 'updateTask', taskId, updates });
    throw new FirestoreError(getErrorMessage(error), 'firestore/update-failed');
  }
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
  if (!isFirebaseReady()) {
    throw new FirestoreError('Database service is not available.', 'firestore/not-initialized');
  }

  if (!taskId) {
    throw new FirestoreError('Task ID is required.', 'validation/id-required');
  }

  const db = getFirebaseDb();

  try {
    await deleteDoc(doc(db, TASKS_COLLECTION, taskId));
  } catch (error) {
    logError(error, { context: 'deleteTask', taskId });
    throw new FirestoreError(getErrorMessage(error), 'firestore/delete-failed');
  }
}

/**
 * Subscribe to real-time task updates for a user
 */
export function subscribeToTasks(
  userId: string, 
  callback: (tasks: Task[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (!isFirebaseReady()) {
    console.warn('Firestore is not initialized. Returning empty task list.');
    callback([]);
    return () => {};
  }

  if (!userId) {
    console.warn('User ID is required for task subscription.');
    callback([]);
    return () => {};
  }

  const db = getFirebaseDb();

  // Simple query without orderBy to avoid index requirement
  // Tasks will be sorted client-side
  const constraints: QueryConstraint[] = [
    where('userId', '==', userId),
    limit(MAX_TASKS_PER_USER)
  ];

  const q = query(collection(db, TASKS_COLLECTION), ...constraints);
  
  return onSnapshot(
    q, 
    (snapshot) => {
      const tasks = snapshot.docs
        .map(doc => parseTaskDocument(doc.id, doc.data()))
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by newest first
      callback(tasks);
    },
    (error) => {
      logError(error, { context: 'subscribeToTasks', userId });
      onError?.(new FirestoreError(getErrorMessage(error), 'firestore/subscription-failed'));
      callback([]);
    }
  );
}

/**
 * Get tasks by status
 */
export async function getTasksByStatus(userId: string, status: TaskStatus): Promise<Task[]> {
  if (!isFirebaseReady()) {
    throw new FirestoreError('Database service is not available.', 'firestore/not-initialized');
  }

  const db = getFirebaseDb();

  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => parseTaskDocument(doc.id, doc.data()));
  } catch (error) {
    logError(error, { context: 'getTasksByStatus', userId, status });
    throw new FirestoreError(getErrorMessage(error), 'firestore/query-failed');
  }
}

/**
 * Parse Firestore document data to Task object
 */
function parseTaskDocument(id: string, data: Record<string, unknown>): Task {
  return {
    id,
    title: data.title as string || 'Untitled Task',
    description: data.description as string | undefined,
    status: (data.status as TaskStatus) || 'pending',
    priority: (data.priority as Task['priority']) || 'medium',
    dueDate: data.dueDate instanceof Timestamp ? data.dueDate.toDate() : undefined,
    dueTime: data.dueTime as string | undefined,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
    updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
    userId: data.userId as string,
    tags: (data.tags as string[]) || [],
    voiceTranscript: data.voiceTranscript as string | undefined,
  };
}
