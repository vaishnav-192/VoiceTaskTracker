'use client';

import { useState } from 'react';
import { Task } from '@/types';
import { 
  Trash2, 
  Clock, 
  AlertCircle, 
  GripVertical,
  Loader2,
  Calendar,
  Pencil
} from 'lucide-react';
import { formatDistanceToNow, format, isPast, isToday } from 'date-fns';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EditTaskModal } from './EditTaskModal';

interface KanbanCardProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  onDragStart: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export function KanbanCard({ 
  task, 
  onUpdate,
  onDelete, 
  onDragStart, 
  onDragEnd,
  isDragging 
}: KanbanCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priorityStyles = {
    low: 'border-l-gray-400 bg-white/70',
    medium: 'border-l-amber-400 bg-amber-50/50',
    high: 'border-l-red-400 bg-red-50/50',
  };

  const priorityBadge = {
    low: 'bg-gray-100/80 text-gray-600',
    medium: 'bg-amber-100/80 text-amber-700',
    high: 'bg-red-100/80 text-red-700',
  };

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    setShowDeleteConfirm(false);
    setError(null);
    
    try {
      await onDelete(task.id);
    } catch (err) {
      setError('Failed to delete task');
      console.error('Delete error:', err);
      setIsDeleting(false);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
    onDragStart();
  };

  // Format due date display
  const getDueDateDisplay = () => {
    if (!task.dueDate) return null;
    
    const isOverdue = isPast(task.dueDate) && task.status !== 'completed';
    const isDueToday = isToday(task.dueDate);
    
    let dateText = format(task.dueDate, 'MMM d');
    if (isDueToday) dateText = 'Today';
    if (task.dueTime) dateText += ` ${task.dueTime}`;
    
    return { text: dateText, isOverdue, isDueToday };
  };

  const dueDateInfo = getDueDateDisplay();

  return (
    <>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
        className={`
          group relative rounded-xl border shadow-sm backdrop-blur-sm
          border-l-4 ${priorityStyles[task.priority]}
          transition-all duration-200 cursor-grab active:cursor-grabbing
          hover:shadow-lg hover:scale-[1.02] hover:bg-white/90
          ${isDragging ? 'opacity-50 scale-95 shadow-xl rotate-2' : ''}
          ${isDeleting ? 'opacity-50 animate-pulse' : ''}
          ${task.status === 'completed' ? 'opacity-70' : ''}
        `}
        role="article"
        aria-label={`Task: ${task.title}`}
      >
        {/* Drag Handle */}
        <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
          <GripVertical className="w-4 h-4 text-gray-400" aria-hidden="true" />
        </div>

        <div className="p-3 pl-5">
          {/* Error message */}
          {error && (
            <div className="mb-2 p-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-600" role="alert">
              {error}
            </div>
          )}

          {/* Task Title */}
          <h4 className={`
            font-medium text-gray-900 text-sm mb-2 pr-6
            ${task.status === 'completed' ? 'line-through text-gray-500' : ''}
          `}>
            {task.title}
          </h4>

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {/* Priority Badge */}
            <span className={`
              inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium
              ${priorityBadge[task.priority]}
            `}>
              {task.priority === 'high' && <AlertCircle className="w-3 h-3" aria-hidden="true" />}
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>

            {/* Due Date */}
            {dueDateInfo && (
              <span className={`
                flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium
                ${dueDateInfo.isOverdue 
                  ? 'bg-red-100 text-red-700' 
                  : dueDateInfo.isDueToday 
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-gray-100 text-gray-600'
                }
              `}>
                <Calendar className="w-3 h-3" aria-hidden="true" />
                {dueDateInfo.isOverdue && '! '}
                {dueDateInfo.text}
              </span>
            )}
          </div>

          {/* Created time - small text */}
          <div className="flex items-center justify-between mt-2">
            <span className="flex items-center gap-1 text-gray-400 text-xs">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {formatDistanceToNow(task.createdAt, { addSuffix: true })}
            </span>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* Edit Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditModal(true);
                }}
                className="p-1 text-gray-300 hover:text-indigo-500 hover:bg-indigo-50 rounded transition-colors"
                aria-label="Edit task"
              >
                <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                disabled={isDeleting}
                className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                aria-label="Delete task"
              >
                {isDeleting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        variant="danger"
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        task={task}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={onUpdate}
      />
    </>
  );
}
