'use client';

import { useState, useEffect } from 'react';
import { Task, TaskPriority, TaskStatus } from '@/shared/types';
import { X, Loader2, Save, Calendar, Clock, Flag, CheckCircle, Pencil } from 'lucide-react';

interface EditTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

// Helper function to format date for input field (YYYY-MM-DD) without timezone issues
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function EditTaskModal({ task, isOpen, onClose, onSave }: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState(task.dueTime || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when task changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(task.title);
      setPriority(task.priority);
      setStatus(task.status);
      setDueTime(task.dueTime || '');
      // Use the helper function to avoid timezone issues
      if (task.dueDate) {
        const date = new Date(task.dueDate);
        setDueDate(formatDateForInput(date));
      } else {
        setDueDate('');
      }
      setError(null);
    }
  }, [isOpen, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updates: Partial<Task> = {
        title: title.trim(),
        priority,
        status,
        dueTime: dueTime || undefined,
      };

      // Parse date properly to avoid timezone issues
      if (dueDate) {
        const [year, month, day] = dueDate.split('-').map(Number);
        updates.dueDate = new Date(year, month - 1, day);
      } else {
        updates.dueDate = undefined;
      }

      await onSave(task.id, updates);
      onClose();
    } catch (err) {
      console.error('Failed to update task:', err);
      setError('Failed to update task. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Styled button classes matching TaskReviewModal
  const prioritySelectedStyles = {
    low: 'bg-green-500 text-white border-green-500 shadow-green-200 shadow-md',
    medium: 'bg-amber-500 text-white border-amber-500 shadow-amber-200 shadow-md',
    high: 'bg-red-500 text-white border-red-500 shadow-red-200 shadow-md',
  };

  const statusSelectedStyles = {
    pending: 'bg-slate-600 text-white border-slate-600 shadow-slate-200 shadow-md',
    'in-progress': 'bg-blue-500 text-white border-blue-500 shadow-blue-200 shadow-md',
    completed: 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-200 shadow-md',
  };

  const unselectedStyle = 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-task-title"
    >
      <div
        className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-white/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Matching TaskReviewModal */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Pencil className="w-4 h-4 text-white" />
              </div>
              <h2 id="edit-task-title" className="text-lg font-semibold text-white">
                Edit Task
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
              aria-label="Close"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="edit-title" className="block text-sm font-semibold text-gray-800 mb-1.5">
              Task Title
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-gray-400 bg-white/70 backdrop-blur-sm"
              autoFocus
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              <Flag className="w-4 h-4 inline mr-1" />
              Priority
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
                    priority === p
                      ? prioritySelectedStyles[p]
                      : unselectedStyle
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Status
            </label>
            <div className="flex gap-2">
              {(['pending', 'in-progress', 'completed'] as TaskStatus[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 px-3 py-2.5 text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
                    status === s
                      ? statusSelectedStyles[s]
                      : unselectedStyle
                  }`}
                >
                  {s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date & Time Row */}
          <div className="grid grid-cols-2 gap-3">
            {/* Due Date */}
            <div>
              <label htmlFor="edit-due-date" className="block text-sm font-semibold text-gray-800 mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1" />
                Due Date
              </label>
              <input
                id="edit-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white/70 backdrop-blur-sm"
              />
            </div>

            {/* Due Time */}
            <div>
              <label htmlFor="edit-due-time" className="block text-sm font-semibold text-gray-800 mb-1.5">
                <Clock className="w-4 h-4 inline mr-1" />
                Due Time
              </label>
              <input
                id="edit-due-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white/70 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100/80 hover:bg-gray-200/80 rounded-xl font-semibold transition-colors border border-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" aria-hidden="true" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
