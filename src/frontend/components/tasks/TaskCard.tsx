'use client';

import { useState } from 'react';
import { Task, TaskStatus } from '@/shared/types';
import { 
  Check, 
  Trash2, 
  Clock, 
  AlertCircle, 
  ChevronDown,
  Play,
  RotateCcw,
  Loader2,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow, format, isPast, isToday } from 'date-fns';
import { ConfirmDialog } from '@/frontend/components/ui/ConfirmDialog';

interface TaskCardProps {
  task: Task;
  onUpdate: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const priorityColors = {
    low: 'bg-gray-100 text-gray-600 border-gray-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    high: 'bg-red-50 text-red-700 border-red-200',
  };

  const statusColors = {
    'pending': 'border-l-yellow-400',
    'in-progress': 'border-l-blue-400',
    'completed': 'border-l-green-400',
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      await onUpdate(task.id, { status: newStatus });
    } catch (err) {
      setError('Failed to update status');
      console.error('Status update error:', err);
    } finally {
      setIsUpdating(false);
    }
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

  const getNextStatus = (): { status: TaskStatus; label: string; icon: React.ReactNode } | null => {
    switch (task.status) {
      case 'pending':
        return { status: 'in-progress', label: 'Start', icon: <Play className="w-4 h-4" aria-hidden="true" /> };
      case 'in-progress':
        return { status: 'completed', label: 'Complete', icon: <Check className="w-4 h-4" aria-hidden="true" /> };
      case 'completed':
        return { status: 'pending', label: 'Reopen', icon: <RotateCcw className="w-4 h-4" aria-hidden="true" /> };
      default:
        return null;
    }
  };

  // Format due date display
  const getDueDateDisplay = () => {
    if (!task.dueDate) return null;
    
    const isOverdue = isPast(task.dueDate) && task.status !== 'completed';
    const isDueToday = isToday(task.dueDate);
    
    let dateText = format(task.dueDate, 'MMM d, yyyy');
    if (isDueToday) dateText = 'Today';
    if (task.dueTime) dateText += ` at ${task.dueTime}`;
    
    return {
      text: dateText,
      isOverdue,
      isDueToday
    };
  };

  const dueDateInfo = getDueDateDisplay();
  const nextStatusAction = getNextStatus();

  return (
    <div 
      className={`
        bg-white rounded-xl border border-gray-100 shadow-sm 
        border-l-4 ${statusColors[task.status]}
        transition-all duration-200 hover:shadow-md
        ${task.status === 'completed' ? 'opacity-70' : ''}
        ${isDeleting ? 'animate-pulse opacity-50' : ''}
      `}
      role="article"
      aria-label={`Task: ${task.title}`}
    >
      <div className="p-4">
        {/* Error message */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600" role="alert">
            {error}
            <button 
              onClick={() => setError(null)} 
              className="ml-2 underline hover:no-underline"
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="flex items-start justify-between gap-3">
          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 
                className={`font-medium text-gray-900 ${
                  task.status === 'completed' ? 'line-through text-gray-500' : ''
                }`}
              >
                {task.title}
              </h3>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {/* Priority Badge */}
              <span className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                border ${priorityColors[task.priority]}
              `}>
                {task.priority === 'high' && <AlertCircle className="w-3 h-3" aria-hidden="true" />}
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>

              {/* Status badge */}
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-medium capitalize
                ${task.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : ''}
                ${task.status === 'in-progress' ? 'bg-blue-100 text-blue-700' : ''}
                ${task.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
              `}>
                {task.status.replace('-', ' ')}
              </span>

              {/* Due Date */}
              {dueDateInfo && (
                <span className={`
                  flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                  ${dueDateInfo.isOverdue 
                    ? 'bg-red-100 text-red-700' 
                    : dueDateInfo.isDueToday 
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  <Calendar className="w-3 h-3" aria-hidden="true" />
                  {dueDateInfo.isOverdue && 'Overdue: '}
                  {dueDateInfo.text}
                </span>
              )}

              {/* Created time */}
              <span className="flex items-center gap-1 text-gray-400 text-xs">
                <Clock className="w-3 h-3" aria-hidden="true" />
                {formatDistanceToNow(task.createdAt, { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {nextStatusAction && (
              <button
                onClick={() => handleStatusChange(nextStatusAction.status)}
                disabled={isUpdating || isDeleting}
                className={`
                  flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium
                  transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-offset-1
                  ${task.status === 'completed' 
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 focus:ring-gray-400'
                    : task.status === 'in-progress'
                      ? 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-400'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-blue-400'
                  }
                `}
                aria-label={`${nextStatusAction.label} task`}
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  nextStatusAction.icon
                )}
                {nextStatusAction.label}
              </button>
            )}
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting || isUpdating}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-400"
              aria-label="Delete task"
            >
              {isDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Voice Transcript (expandable) */}
        {task.voiceTranscript && (
          <div className="mt-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              aria-expanded={isExpanded}
              aria-controls={`transcript-${task.id}`}
            >
              <ChevronDown 
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
              Voice transcript
            </button>
            {isExpanded && (
              <p 
                id={`transcript-${task.id}`}
                className="mt-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-2 italic"
              >
                &ldquo;{task.voiceTranscript}&rdquo;
              </p>
            )}
          </div>
        )}
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
    </div>
  );
}
