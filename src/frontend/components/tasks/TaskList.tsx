'use client';

import { Task } from '@/shared/types';
import { TaskCard } from './TaskCard';
import { ClipboardList, Mic, Plus } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export function TaskList({ tasks, onUpdateTask, onDeleteTask }: TaskListProps) {
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ClipboardList className="w-8 h-8 text-gray-400" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          Get started by adding your first task. You can use voice commands or add tasks manually.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            Use voice commands
          </span>
          <span className="hidden sm:inline text-gray-300">or</span>
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            Click &quot;Add task manually&quot;
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="list" aria-label="Tasks organized by status">
      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <TaskSection 
          title="Pending" 
          count={pendingTasks.length}
          colorClass="bg-yellow-100 text-yellow-800"
          description="Tasks waiting to be started"
        >
          {pendingTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
            />
          ))}
        </TaskSection>
      )}

      {/* In Progress Tasks */}
      {inProgressTasks.length > 0 && (
        <TaskSection 
          title="In Progress" 
          count={inProgressTasks.length}
          colorClass="bg-blue-100 text-blue-800"
          description="Tasks currently being worked on"
        >
          {inProgressTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
            />
          ))}
        </TaskSection>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <TaskSection 
          title="Completed" 
          count={completedTasks.length}
          colorClass="bg-green-100 text-green-800"
          description="Finished tasks"
          collapsible={completedTasks.length > 3}
        >
          {completedTasks.map(task => (
            <TaskCard 
              key={task.id} 
              task={task} 
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
            />
          ))}
        </TaskSection>
      )}
    </div>
  );
}

interface TaskSectionProps {
  title: string;
  count: number;
  colorClass: string;
  description: string;
  collapsible?: boolean;
  children: React.ReactNode;
}

function TaskSection({ title, count, colorClass, description, collapsible = false, children }: TaskSectionProps) {
  return (
    <section aria-labelledby={`section-${title.toLowerCase().replace(' ', '-')}`}>
      <div className="flex items-center gap-2 mb-3">
        <h2 
          id={`section-${title.toLowerCase().replace(' ', '-')}`}
          className="text-lg font-semibold text-gray-800"
        >
          {title}
        </h2>
        <span 
          className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
          aria-label={`${count} tasks`}
        >
          {count}
        </span>
        <span className="sr-only">{description}</span>
      </div>
      <div className="space-y-3" role="list">
        {children}
      </div>
    </section>
  );
}
