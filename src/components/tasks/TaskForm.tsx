'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X, Loader2, AlertCircle, Calendar, Clock } from 'lucide-react';
import { TaskPriority, TaskStatus, CreateTaskInput } from '@/types';

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
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="Open form to add a new task"
      >
        <Plus className="w-5 h-5" aria-hidden="true" />
        Add task manually
      </button>
    );
  }

  return (
    <form 
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="bg-white rounded-xl shadow-lg p-5 border border-gray-100"
      aria-label="New task form"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 text-lg">New Task</h3>
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
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2" role="alert">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {/* Title Field */}
        <div>
          <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500" aria-hidden="true">*</span>
          </label>
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
              w-full px-3 py-2.5 border rounded-lg outline-none transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
              focus:ring-2 focus:border-transparent
              ${error ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-indigo-500'}
            `}
            aria-invalid={!!error}
            required
          />
          <div className="flex justify-end mt-1">
            <span className={`text-xs ${title.length > MAX_TITLE_LENGTH * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
              {title.length}/{MAX_TITLE_LENGTH}
            </span>
          </div>
        </div>

        {/* Due Date & Time Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-due-date" className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" aria-hidden="true" />
              Due Date
            </label>
            <input
              id="task-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={today}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div>
            <label htmlFor="task-due-time" className="block text-sm font-medium text-gray-700 mb-1">
              <Clock className="w-4 h-4 inline mr-1" aria-hidden="true" />
              Due Time
            </label>
            <input
              id="task-due-time"
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Priority Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </label>
          <div className="flex gap-2" role="radiogroup" aria-label="Task priority">
            {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p)}
                disabled={isSubmitting}
                className={`
                  flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-offset-1
                  ${priority === p 
                    ? p === 'high'
                      ? 'bg-red-100 text-red-700 ring-2 ring-red-500'
                      : p === 'medium'
                        ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500'
                        : 'bg-gray-100 text-gray-700 ring-2 ring-gray-500'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
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

        {/* Status Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <div className="flex gap-2" role="radiogroup" aria-label="Task status">
            {([
              { value: 'pending', label: 'Pending', color: 'yellow' },
              { value: 'in-progress', label: 'In Progress', color: 'blue' },
              { value: 'completed', label: 'Completed', color: 'green' }
            ] as const).map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                disabled={isSubmitting}
                className={`
                  flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-offset-1
                  ${status === s.value 
                    ? s.color === 'yellow'
                      ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500'
                      : s.color === 'blue'
                        ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                        : 'bg-green-100 text-green-700 ring-2 ring-green-500'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                  }
                `}
                role="radio"
                aria-checked={status === s.value}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center gap-2"
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
