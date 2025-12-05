'use client';

import { Search, X } from 'lucide-react';
import { TaskStatus, TaskPriority } from '@/shared/types';

export interface TaskFiltersState {
  searchQuery: string;
  statusFilter: TaskStatus | 'all';
  priorityFilter: TaskPriority | 'all';
}

interface TaskFiltersProps {
  filters: TaskFiltersState;
  onFiltersChange: (filters: TaskFiltersState) => void;
  totalTasks: number;
  filteredCount: number;
}

export function TaskFilters({ 
  filters, 
  onFiltersChange, 
  totalTasks, 
  filteredCount 
}: TaskFiltersProps) {
  const hasActiveFilters = 
    filters.searchQuery !== '' || 
    filters.statusFilter !== 'all' || 
    filters.priorityFilter !== 'all';

  const clearAllFilters = () => {
    onFiltersChange({
      searchQuery: '',
      statusFilter: 'all',
      priorityFilter: 'all',
    });
  };

  return (
    <div className="space-y-3">
      {/* Search and Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search tasks..."
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            className="
              w-full h-10 pl-10 pr-9
              bg-white border border-gray-300 rounded-lg
              text-sm text-gray-900 placeholder:text-gray-500
              focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
              transition-colors
            "
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFiltersChange({ ...filters, searchQuery: '' })}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={filters.statusFilter}
            onChange={(e) => onFiltersChange({ ...filters, statusFilter: e.target.value as TaskStatus | 'all' })}
            className="
              h-10 px-3 pr-8
              bg-white border border-gray-300 rounded-lg
              text-sm text-gray-700 font-medium
              focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
              cursor-pointer transition-colors
              appearance-none
              bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20viewBox%3d%220%200%2020%2020%22%20fill%3d%22%236b7280%22%3e%3cpath%20fill-rule%3d%22evenodd%22%20d%3d%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3d%22evenodd%22%2f%3e%3c%2fsvg%3e')]
              bg-[length:20px_20px] bg-[right_8px_center] bg-no-repeat
            "
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priorityFilter}
            onChange={(e) => onFiltersChange({ ...filters, priorityFilter: e.target.value as TaskPriority | 'all' })}
            className="
              h-10 px-3 pr-8
              bg-white border border-gray-300 rounded-lg
              text-sm text-gray-700 font-medium
              focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500
              cursor-pointer transition-colors
              appearance-none
              bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg%20xmlns%3d%22http%3a%2f%2fwww.w3.org%2f2000%2fsvg%22%20viewBox%3d%220%200%2020%2020%22%20fill%3d%22%236b7280%22%3e%3cpath%20fill-rule%3d%22evenodd%22%20d%3d%22M5.23%207.21a.75.75%200%20011.06.02L10%2011.168l3.71-3.938a.75.75%200%20111.08%201.04l-4.25%204.5a.75.75%200%2001-1.08%200l-4.25-4.5a.75.75%200%2001.02-1.06z%22%20clip-rule%3d%22evenodd%22%2f%3e%3c%2fsvg%3e')]
              bg-[length:20px_20px] bg-[right_8px_center] bg-no-repeat
            "
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="
                h-10 px-3
                bg-gray-100 hover:bg-gray-200 
                text-gray-600 text-sm font-medium
                rounded-lg border border-gray-300
                transition-colors
                flex items-center gap-1.5
              "
            >
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Results count - only show when filters are active */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span>
            Showing <span className="font-semibold text-gray-900">{filteredCount}</span> of{' '}
            <span className="font-semibold text-gray-900">{totalTasks}</span> tasks
          </span>
          
          {/* Active filter tags */}
          <div className="flex flex-wrap items-center gap-1.5">
            {filters.searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                Search: {filters.searchQuery}
                <button 
                  onClick={() => onFiltersChange({ ...filters, searchQuery: '' })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                {filters.statusFilter === 'in-progress' ? 'In Progress' : filters.statusFilter.charAt(0).toUpperCase() + filters.statusFilter.slice(1)}
                <button 
                  onClick={() => onFiltersChange({ ...filters, statusFilter: 'all' })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {filters.priorityFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                {filters.priorityFilter.charAt(0).toUpperCase() + filters.priorityFilter.slice(1)} Priority
                <button 
                  onClick={() => onFiltersChange({ ...filters, priorityFilter: 'all' })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
