export type TaskStatus = 'pending' | 'in-progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  dueTime?: string; // HH:mm format
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  tags?: string[];
  voiceTranscript?: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  dueTime?: string;
  userId: string;
  tags?: string[];
  voiceTranscript?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  dueTime?: string | null;
  tags?: string[];
}

export interface ParsedTaskData {
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  dueTime?: string;
  originalTranscript: string;
}

export interface VoiceCommand {
  action: 'add' | 'complete' | 'delete' | 'list' | 'unknown';
  taskTitle?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: Date;
  dueTime?: string;
  originalTranscript: string;
}
