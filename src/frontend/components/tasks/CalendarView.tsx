'use client';

import { useState, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/shared/types';
import { 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  Calendar as CalendarIcon,
  ClipboardList,
  Mic,
  Plus
} from 'lucide-react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths
} from 'date-fns';
import { EditTaskModal } from './EditTaskModal';

interface CalendarViewProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

interface DayTasksPopupProps {
  date: Date;
  tasks: Task[];
  onClose: () => void;
  onEditTask: (task: Task) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
}

function DayTasksPopup({ date, tasks, onClose, onEditTask, onUpdateTask }: DayTasksPopupProps) {
  const priorityStyles: Record<TaskPriority, string> = {
    low: 'border-l-gray-400',
    medium: 'border-l-amber-400',
    high: 'border-l-red-400',
  };

  const statusStyles: Record<TaskStatus, string> = {
    pending: 'bg-amber-100 text-amber-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    await onUpdateTask(task.id, { status: newStatus });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-indigo-500 to-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-white/80" />
              <h3 className="text-lg font-semibold text-white">
                {format(date, 'EEEE, MMMM d')}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-white/70 mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Tasks List */}
        <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-3 rounded-lg border-l-4 bg-gray-50 hover:bg-gray-100 transition-colors ${priorityStyles[task.priority]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium text-gray-900 ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </h4>
                  {task.dueTime && (
                    <p className="text-sm text-gray-500 mt-1">@ {task.dueTime}</p>
                  )}
                </div>
                <button
                  onClick={() => onEditTask(task)}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Edit
                </button>
              </div>
              
              {/* Status selector */}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-500">Status:</span>
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                  className={`text-xs px-2 py-1 rounded-full font-medium ${statusStyles[task.status]} border-0 cursor-pointer`}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CalendarView({ tasks, onUpdateTask, onDeleteTask }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Get all days to display in the calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    
    tasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = format(task.dueDate, 'yyyy-MM-dd');
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, task]);
      }
    });
    
    return map;
  }, [tasks]);

  const getTasksForDate = (date: Date): Task[] => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return tasksByDate.get(dateKey) || [];
  };

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const priorityColors: Record<TaskPriority, string> = {
    low: 'bg-gray-400',
    medium: 'bg-amber-400',
    high: 'bg-red-500',
  };

  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  // Calculate tasks without due date
  const tasksWithoutDueDate = tasks.filter(t => !t.dueDate);

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
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-3 glass-subtle rounded-xl">
        <button
          onClick={goToPreviousMonth}
          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors font-medium"
          >
            Today
          </button>
        </div>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="glass rounded-xl overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-gray-200/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="p-3 text-center text-sm font-semibold text-gray-600 bg-gray-50/50"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayTasks = getTasksForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);
            const hasHighPriority = dayTasks.some(t => t.priority === 'high' && t.status !== 'completed');
            
            return (
              <div
                key={index}
                onClick={() => dayTasks.length > 0 && setSelectedDate(day)}
                className={`
                  min-h-[100px] p-2 border-b border-r border-gray-100/50
                  ${isCurrentMonth ? 'bg-white/50' : 'bg-gray-50/30'}
                  ${dayTasks.length > 0 ? 'cursor-pointer hover:bg-indigo-50/50' : ''}
                  ${isCurrentDay ? 'ring-2 ring-inset ring-indigo-400' : ''}
                  transition-colors
                `}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`
                    text-sm font-medium
                    ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                    ${isCurrentDay ? 'bg-indigo-600 text-white w-7 h-7 rounded-full flex items-center justify-center' : ''}
                  `}>
                    {format(day, 'd')}
                  </span>
                  {hasHighPriority && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>

                {/* Task Indicators */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={`
                        text-xs p-1 rounded truncate
                        ${task.status === 'completed' 
                          ? 'bg-gray-100 text-gray-500 line-through' 
                          : task.priority === 'high'
                            ? 'bg-red-100 text-red-700'
                            : task.priority === 'medium'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-700'
                        }
                      `}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-indigo-600 font-medium">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tasks without due date notice */}
      {tasksWithoutDueDate.length > 0 && (
        <div className="p-4 glass-subtle rounded-xl">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CalendarIcon className="w-4 h-4" />
            <span>
              <strong>{tasksWithoutDueDate.length}</strong> task{tasksWithoutDueDate.length !== 1 ? 's' : ''} without due date (not shown on calendar)
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-3 glass-subtle rounded-xl text-sm">
        <span className="text-gray-600 font-medium">Priority:</span>
        <div className="flex items-center gap-1">
          <span className={`w-3 h-3 rounded ${priorityColors.high}`}></span>
          <span className="text-gray-600">High</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`w-3 h-3 rounded ${priorityColors.medium}`}></span>
          <span className="text-gray-600">Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`w-3 h-3 rounded ${priorityColors.low}`}></span>
          <span className="text-gray-600">Low</span>
        </div>
      </div>

      {/* Day Tasks Popup */}
      {selectedDate && selectedDateTasks.length > 0 && (
        <DayTasksPopup
          date={selectedDate}
          tasks={selectedDateTasks}
          onClose={() => setSelectedDate(null)}
          onEditTask={(task) => {
            setSelectedDate(null);
            setEditingTask(task);
          }}
          onUpdateTask={onUpdateTask}
        />
      )}

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
