'use client';

import { useState, useCallback } from 'react';
import { Task, TaskStatus } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { ClipboardList, Mic, Plus } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

const COLUMNS: { id: TaskStatus; title: string; color: string; bgColor: string; borderColor: string }[] = [
  { 
    id: 'pending', 
    title: 'Pending', 
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300'
  },
  { 
    id: 'in-progress', 
    title: 'In Progress', 
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300'
  },
  { 
    id: 'completed', 
    title: 'Completed', 
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300'
  },
];

export function KanbanBoard({ tasks, onUpdateTask, onDeleteTask }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const getTasksByStatus = useCallback((status: TaskStatus) => {
    return tasks
      .filter(task => task.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [tasks]);

  const handleDragStart = useCallback((task: Task) => {
    setDraggedTask(task);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((status: TaskStatus) => {
    setDragOverColumn(status);
  }, []);

  const handleDrop = useCallback(async (targetStatus: TaskStatus) => {
    if (draggedTask && draggedTask.status !== targetStatus) {
      await onUpdateTask(draggedTask.id, { status: targetStatus });
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  }, [draggedTask, onUpdateTask]);

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-white rounded-xl shadow-sm border border-gray-100">
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
    <div className="kanban-board">
      {/* Desktop: Horizontal columns */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        {COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            bgColor={column.bgColor}
            borderColor={column.borderColor}
            tasks={getTasksByStatus(column.id)}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            isDragOver={dragOverColumn === column.id}
            draggedTask={draggedTask}
          />
        ))}
      </div>

      {/* Mobile: Vertical columns (stacked) */}
      <div className="md:hidden space-y-4">
        {COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            bgColor={column.bgColor}
            borderColor={column.borderColor}
            tasks={getTasksByStatus(column.id)}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            isDragOver={dragOverColumn === column.id}
            draggedTask={draggedTask}
            isMobile
          />
        ))}
      </div>
    </div>
  );
}
