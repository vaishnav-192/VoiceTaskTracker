'use client';

import { useCallback } from 'react';
import { Task, TaskStatus } from '@/types';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onDragStart: (task: Task) => void;
  onDragEnd: () => void;
  onDragOver: (status: TaskStatus) => void;
  onDrop: (status: TaskStatus) => void;
  isDragOver: boolean;
  draggedTask: Task | null;
  isMobile?: boolean;
}

export function KanbanColumn({
  id,
  title,
  color,
  bgColor,
  borderColor,
  gradient,
  tasks,
  onUpdateTask,
  onDeleteTask,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  isDragOver,
  draggedTask,
  isMobile = false,
}: KanbanColumnProps) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onDragOver(id);
  }, [id, onDragOver]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onDrop(id);
  }, [id, onDrop]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only trigger if leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      // Could add state for leaving if needed
    }
  }, []);

  const isDropTarget = isDragOver && draggedTask?.status !== id;

  return (
    <div
      className={`
        flex flex-col rounded-2xl border transition-all duration-300
        backdrop-blur-md bg-white/40 shadow-lg
        ${borderColor}
        ${isDropTarget ? 'ring-2 ring-indigo-400 ring-offset-2 scale-[1.02] bg-white/60' : ''}
        ${isMobile ? 'min-h-[200px]' : 'min-h-[400px] h-full'}
      `}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    >
      {/* Column Header */}
      <div className={`px-4 py-3 border-b ${borderColor} ${bgColor} rounded-t-2xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${gradient} shadow-sm`}></div>
            <h3 className={`font-semibold ${color}`}>
              {title}
            </h3>
          </div>
          <span className={`
            px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm
            bg-gradient-to-br ${gradient} text-white
          `}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div className={`
        flex-1 p-3 space-y-3 overflow-y-auto
        ${isMobile ? '' : 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent'}
      `}>
        {tasks.length === 0 ? (
          <div className={`
            flex items-center justify-center h-24 rounded-xl border-2 border-dashed
            ${borderColor} transition-colors
            ${isDropTarget ? 'bg-white/60' : 'bg-white/20'}
          `}>
            <p className="text-sm text-gray-400">
              {isDropTarget ? 'Drop here' : 'No tasks'}
            </p>
          </div>
        ) : (
          tasks.map(task => (
            <KanbanCard
              key={task.id}
              task={task}
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
              onDragStart={() => onDragStart(task)}
              onDragEnd={onDragEnd}
              isDragging={draggedTask?.id === task.id}
            />
          ))
        )}
        
        {/* Drop indicator at bottom when dragging */}
        {isDropTarget && tasks.length > 0 && (
          <div className="h-16 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 flex items-center justify-center backdrop-blur-sm">
            <p className="text-sm text-indigo-500 font-medium">Drop here</p>
          </div>
        )}
      </div>
    </div>
  );
}
