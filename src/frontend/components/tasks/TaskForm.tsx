'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X, Loader2, AlertCircle, Calendar, Clock } from 'lucide-react';
import { TaskPriority, TaskStatus, CreateTaskInput } from '@/shared/types';

interface TaskFormProps {
  onSubmit: (task: Omit<CreateTaskInput, 'userId'>) => Promise<void>;
}

const MAX_TITLE_LENGTH = 200;
const MIN_TITLE_LENGTH = 1;

export function TaskForm({ onSubmit }: TaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when form opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const validateTitle = (value: string): string | null => {
    if (value.trim().length < MIN_TITLE_LENGTH) {
      return 'Task title is required';
    }
    if (value.length > MAX_TITLE_LENGTH) {
      return `Task title must be ${MAX_TITLE_LENGTH} characters or less`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateTitle(title);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const taskData: Omit<CreateTaskInput, 'userId'> = {
        title: title.trim(),
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        dueTime: dueTime || undefined,
      };
      
      await onSubmit(taskData);
      // Reset form
      setTitle('');
      setPriority('medium');
      setStatus('pending');
      setDueDate('');
      setDueTime('');
      setIsOpen(false);
      setError(null);
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    setTitle('');
    setPriority('medium');
    setStatus('pending');
    setDueDate('');
    setDueTime('');
    setError(null);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    if (error && value.trim().length >= MIN_TITLE_LENGTH) {
      setError(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isSubmitting) {
      handleClose();
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full h-full min-h-[120px] flex flex-col items-center justify-center gap-2 py-4 px-4 glass-emerald rounded-2xl text-emerald-700 hover:text-emerald-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 font-medium"
        aria-label="Open form to add a new task"
      >
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Plus className="w-6 h-6 text-white" aria-hidden="true" />
        </div>
        <span className="text-sm">Add task manually</span>
      </button>
    );
  }

  return (
    <form 
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="glass-emerald rounded-2xl p-4 h-full"
      aria-label="New task form"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Plus className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <h3 className="font-semibold text-gray-800">New Task</h3>
        </div>
        <button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="p-1 text-gray-400 hover:text-gray-600 rounded disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
          aria-label="Close form"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-3 p-2 bg-red-50/80 border border-red-200 rounded-lg flex items-start gap-2" role="alert">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span className="text-xs text-red-700">{error}</span>
        </div>
      )}

      <div className="space-y-3">
        {/* Title Field */}
        <div>
          <input
            ref={inputRef}
            id="task-title"
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="What needs to be done?"
            maxLength={MAX_TITLE_LENGTH}
            disabled={isSubmitting}
            className={`
              w-full px-3 py-2 border rounded-lg outline-none transition-all text-sm
              text-gray-900 placeholder:text-gray-400 bg-white/70
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:ring-2 focus:border-transparent
              ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-emerald-500'}
            `}
            aria-invalid={!!error}
            required
          />
        </div>

        {/* Due Date & Time Row - Compact */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="task-due-date" className="block text-xs font-medium text-gray-600 mb-1">
              <Calendar className="w-3 h-3 inline mr-1" aria-hidden="true" />
              Due Date
            </label>
            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={today}
              disabled={isSubmitting}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 text-gray-900 bg-white/70"
            />
          </div>
          <div>
            <label htmlFor="task-due-time" className="block text-xs font-medium text-gray-600 mb-1">
              <Clock className="w-3 h-3 inline mr-1" aria-hidden="true" />
              Due Time
            </label>
            <input
              id="task-due-time"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 text-gray-900 bg-white/70"
            />
          </div>
        </div>

        {/* Priority Field - Compact */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Priority</label>
          <div className="flex gap-1.5" role="radiogroup" aria-label="Task priority">
            {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                disabled={isSubmitting}
                className={`
                  flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${priority === p 
                    ? p === 'high'
                      ? 'bg-red-500 text-white shadow-sm'
                      : p === 'medium'
                        ? 'bg-amber-500 text-white shadow-sm'
                        : 'bg-green-500 text-white shadow-sm'
                    : 'bg-white/60 text-gray-600 hover:bg-white/80'
                  }
                `}
                role="radio"
                aria-checked={priority === p}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="w-full py-2 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Adding...
            </>
          ) : (
            'Add Task'
          )}
        </button>
      </div>
    </form>
  );
}
