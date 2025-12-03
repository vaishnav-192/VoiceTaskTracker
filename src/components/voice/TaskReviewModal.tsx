'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Flag, CheckCircle, Mic } from 'lucide-react';
import { ParsedTaskData, TaskPriority, TaskStatus } from '@/types';

interface TaskReviewModalProps {
  isOpen: boolean;
  parsedTask: ParsedTaskData;
  onConfirm: (task: ParsedTaskData) => void;
  onCancel: () => void;
}

// Helper function to format date for input field (YYYY-MM-DD) without timezone issues
function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function TaskReviewModal({ isOpen, parsedTask, onConfirm, onCancel }: TaskReviewModalProps) {
  const [title, setTitle] = useState(parsedTask.title);
  const [priority, setPriority] = useState<TaskPriority>(parsedTask.priority);
  const [status, setStatus] = useState<TaskStatus>(parsedTask.status);
  const [dueDate, setDueDate] = useState<string>(
    parsedTask.dueDate ? formatDateForInput(parsedTask.dueDate) : ''
  );
  const [dueTime, setDueTime] = useState<string>(parsedTask.dueTime || '');

  // Update state when parsedTask changes
  useEffect(() => {
    setTitle(parsedTask.title);
    setPriority(parsedTask.priority);
    setStatus(parsedTask.status);
    setDueDate(parsedTask.dueDate ? formatDateForInput(parsedTask.dueDate) : '');
    setDueTime(parsedTask.dueTime || '');
  }, [parsedTask]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse date properly to avoid timezone issues
    let parsedDueDate: Date | undefined;
    if (dueDate) {
      const [year, month, day] = dueDate.split('-').map(Number);
      parsedDueDate = new Date(year, month - 1, day);
    }
    
    onConfirm({
      title,
      priority,
      status,
      dueDate: parsedDueDate,
      dueTime: dueTime || undefined,
      originalTranscript: parsedTask.originalTranscript,
    });
  };

  // Only selected buttons get colored backgrounds
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

  // Unselected buttons are neutral/white
  const unselectedStyle = 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-white/30">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white">Review Task</h2>
            </div>
            <button
              onClick={onCancel}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Original transcript */}
          <p className="mt-2 text-sm text-white/90 italic bg-white/10 rounded-lg px-3 py-2 backdrop-blur-sm">
            &ldquo;{parsedTask.originalTranscript}&rdquo;
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label htmlFor="task-title" className="block text-sm font-semibold text-gray-800 mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-gray-400 bg-white/70 backdrop-blur-sm"
              placeholder="Enter task title"
              required
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

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="due-date" className="block text-sm font-semibold text-gray-800 mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1" />
                Due Date
              </label>
              <input
                type="date"
                id="due-date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white/70 backdrop-blur-sm"
              />
            </div>
            <div>
              <label htmlFor="due-time" className="block text-sm font-semibold text-gray-800 mb-1.5">
                <Clock className="w-4 h-4 inline mr-1" />
                Due Time
              </label>
              <input
                type="time"
                id="due-time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-gray-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white/70 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Parsed info hint */}
          {(parsedTask.dueDate || parsedTask.dueTime || parsedTask.priority !== 'medium') && (
            <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-xl p-4 border border-indigo-200/50 backdrop-blur-sm">
              <p className="font-semibold text-indigo-800 mb-2 flex items-center gap-1">
                <span>✨</span> Extracted from your voice:
              </p>
              <ul className="space-y-1">
                {parsedTask.priority !== 'medium' && (
                  <li className="flex items-center gap-2 text-sm">
                    <span className={`px-2 py-0.5 rounded-lg font-medium ${parsedTask.priority === 'high' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                      {parsedTask.priority.charAt(0).toUpperCase() + parsedTask.priority.slice(1)} Priority
                    </span>
                  </li>
                )}
                {parsedTask.dueDate && (
                  <li className="flex items-center gap-2 text-sm text-indigo-800 font-medium">
                    <Calendar className="w-4 h-4" />
                    Due: {parsedTask.dueDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
                  </li>
                )}
                {parsedTask.dueTime && (
                  <li className="flex items-center gap-2 text-sm text-indigo-800 font-medium">
                    <Clock className="w-4 h-4" />
                    Time: {parsedTask.dueTime}
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100/80 hover:bg-gray-200/80 rounded-xl font-semibold transition-colors border border-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 px-4 py-2.5 text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
