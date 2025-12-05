'use client';

import { useState, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/shared/types';
import { 
  Trash2, 
  Clock, 
  AlertCircle, 
  Loader2,
  Calendar,
  Pencil,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Circle,
  Clock4,
  ClipboardList,
  Mic,
  Plus,
  ArrowUpDown
} from 'lucide-react';
import { formatDistanceToNow, format, isPast, isToday } from 'date-fns';
import { ConfirmDialog } from '@/frontend/components/ui/ConfirmDialog';
import { EditTaskModal } from './EditTaskModal';

interface ListViewProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

type SortField = 'title' | 'priority' | 'status' | 'dueDate' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const priorityOrder: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

const statusOrder: Record<TaskStatus, number> = {
  'in-progress': 3,
  'pending': 2,
  'completed': 1,
};

export function ListView({ tasks, onUpdateTask, onDeleteTask }: ListViewProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Sort tasks (filtering is now done globally in dashboard)
  const sortedTasks = useMemo(() => {
    const sorted = [...tasks];
    
    sorted.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'status':
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
        case 'dueDate':
          const aDate = a.dueDate?.getTime() ?? Infinity;
          const bDate = b.dueDate?.getTime() ?? Infinity;
          comparison = aDate - bDate;
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [tasks, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    
    setDeletingTaskId(taskToDelete.id);
    setShowDeleteConfirm(false);
    
    try {
      await onDeleteTask(taskToDelete.id);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeletingTaskId(null);
      setTaskToDelete(null);
    }
  };

  const handleStatusToggle = async (task: Task) => {
    const nextStatus: Record<TaskStatus, TaskStatus> = {
      'pending': 'in-progress',
      'in-progress': 'completed',
      'completed': 'pending',
    };
    await onUpdateTask(task.id, { status: nextStatus[task.status] });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4" /> 
      : <ChevronDown className="w-4 h-4" />;
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'in-progress':
        return <Clock4 className="w-5 h-5 text-blue-500" />;
      default:
        return <Circle className="w-5 h-5 text-amber-500" />;
    }
  };

  const priorityStyles: Record<TaskPriority, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
  };

  const statusStyles: Record<TaskStatus, string> = {
    pending: 'bg-amber-100 text-amber-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 px-4 glass rounded-2xl">
        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
          <ClipboardList className="w-8 h-8 text-white" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 mb-2">No tasks yet</h3>
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">
          Get started by adding your first task. You can use voice commands or add tasks manually.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm text-gray-600">
          <span className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-indigo-500" aria-hidden="true" />
            Use voice commands
          </span>
          <span className="hidden sm:inline text-gray-400">or</span>
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            Click &quot;Add task manually&quot;
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-600">Sort by:</span>
        
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          className="
            h-9 px-3 pr-8
            bg-white border border-gray-300 rounded-lg
            text-sm text-gray-700
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
            cursor-pointer transition-colors
            appearance-none
            bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20viewBox%3d%220%200%2020%2020%22%20fill%3d%22%236b7280%22%3e%3cpath%20fill-rule%3d%22evenodd%22%20d%3d%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3d%22evenodd%22%2f%3e%3c%2fsvg%3e')]
            bg-[length:20px_20px] bg-[right_8px_center] bg-no-repeat
          "
        >
          <option value="createdAt">Created Date</option>
          <option value="title">Title</option>
          <option value="priority">Priority</option>
          <option value="status">Status</option>
          <option value="dueDate">Due Date</option>
        </select>

        <button
          onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
          className="
            h-9 px-3
            flex items-center gap-1.5 
            bg-white border border-gray-300 rounded-lg
            text-sm text-gray-700
            hover:bg-gray-50 
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
            transition-colors
          "
        >
          {sortDirection === 'asc' ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Ascending
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Descending
            </>
          )}
        </button>

        <span className="text-sm text-gray-500 ml-auto">
          {sortedTasks.length} task{sortedTasks.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto glass rounded-xl">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200/50">
              <th className="text-left p-4 w-12"></th>
              <th 
                className="text-left p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  Task <SortIcon field="title" />
                </div>
              </th>
              <th 
                className="text-left p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  Priority <SortIcon field="priority" />
                </div>
              </th>
              <th 
                className="text-left p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  Status <SortIcon field="status" />
                </div>
              </th>
              <th 
                className="text-left p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => handleSort('dueDate')}
              >
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  Due Date <SortIcon field="dueDate" />
                </div>
              </th>
              <th 
                className="text-left p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                  Created <SortIcon field="createdAt" />
                </div>
              </th>
              <th className="text-right p-4 w-24">
                <span className="text-sm font-semibold text-gray-700">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.map((task) => {
              const isOverdue = task.dueDate && isPast(task.dueDate) && task.status !== 'completed';
              const isDueToday = task.dueDate && isToday(task.dueDate);
              const isDeleting = deletingTaskId === task.id;

              return (
                <tr 
                  key={task.id}
                  className={`
                    border-b border-gray-100/50 hover:bg-white/50 transition-colors
                    ${task.status === 'completed' ? 'opacity-60' : ''}
                    ${isDeleting ? 'opacity-50 animate-pulse' : ''}
                  `}
                >
                  {/* Status Toggle */}
                  <td className="p-4">
                    <button
                      onClick={() => handleStatusToggle(task)}
                      className="hover:scale-110 transition-transform"
                      title={`Current: ${task.status}. Click to change.`}
                    >
                      {getStatusIcon(task.status)}
                    </button>
                  </td>

                  {/* Title */}
                  <td className="p-4">
                    <span className={`font-medium text-gray-900 ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                      {task.title}
                    </span>
                  </td>

                  {/* Priority */}
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${priorityStyles[task.priority]}`}>
                      {task.priority === 'high' && <AlertCircle className="w-3 h-3" />}
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyles[task.status]}`}>
                      {task.status === 'in-progress' ? 'In Progress' : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                  </td>

                  {/* Due Date */}
                  <td className="p-4">
                    {task.dueDate ? (
                      <span className={`
                        inline-flex items-center gap-1 text-sm
                        ${isOverdue ? 'text-red-600 font-medium' : isDueToday ? 'text-orange-600 font-medium' : 'text-gray-600'}
                      `}>
                        <Calendar className="w-4 h-4" />
                        {isDueToday ? 'Today' : format(task.dueDate, 'MMM d, yyyy')}
                        {task.dueTime && <span className="text-gray-500">@ {task.dueTime}</span>}
                        {isOverdue && <span className="text-red-600 font-bold">!</span>}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">No due date</span>
                    )}
                  </td>

                  {/* Created */}
                  <td className="p-4">
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {formatDistanceToNow(task.createdAt, { addSuffix: true })}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingTask(task)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit task"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(task)}
                        disabled={isDeleting}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete task"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedTasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No tasks found. Try adjusting your search or filters.
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setTaskToDelete(null);
        }}
        variant="danger"
      />

      {/* Edit Task Modal */}
      {editingTask && (
        <EditTaskModal
          task={editingTask}
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          onSave={onUpdateTask}
        />
      )}
    </div>
  );
}
