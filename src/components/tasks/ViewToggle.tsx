'use client';

import { LayoutGrid, List, Calendar } from 'lucide-react';

export type ViewType = 'kanban' | 'list' | 'calendar';

interface ViewToggleProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const views: { id: ViewType; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
  { id: 'list', label: 'List', icon: List },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
];

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 p-1 glass-subtle rounded-xl">
      {views.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onViewChange(id)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-200
            ${currentView === id
              ? 'bg-white shadow-sm text-indigo-700'
              : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }
          `}
          aria-label={`Switch to ${label} view`}
          aria-pressed={currentView === id}
        >
          <Icon className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
