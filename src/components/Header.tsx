import React from 'react';
import { ActiveTab } from '../types';
import { Plus, Moon, Sun, Timer } from 'lucide-react';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenNewTask: () => void;
  onOpenFocus: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  overdueCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenNewTask,
  onOpenFocus,
  isDarkMode,
  onToggleDarkMode,
  overdueCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onTabChange('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white font-bold text-base shadow-sm">
              C
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              CampusPulse
            </span>
          </button>
        </div>

        {/* Zone 2: Nav Links (4-5 single-line clean text links) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => onTabChange('dashboard')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'dashboard'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Dashboard
          </button>

          <button
            onClick={() => onTabChange('tasks')}
            className={`whitespace-nowrap transition-colors py-1 flex items-center gap-1.5 ${
              activeTab === 'tasks'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Tasks &amp; Quizzes
            {overdueCount > 0 && (
              <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-semibold">
                ({overdueCount})
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('schedule')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'schedule'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Class Schedule
          </button>

          <button
            onClick={() => onTabChange('calendars')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'calendars'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Professor Calendars
          </button>

          <button
            onClick={() => onTabChange('matrix')}
            className={`whitespace-nowrap transition-colors py-1 ${
              activeTab === 'matrix'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Deadlines Matrix
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenFocus}
            title="Open Focus & Study Timer"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Timer className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between overflow-x-auto text-xs font-medium text-slate-600 dark:text-slate-300">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/50' : ''
          }`}
        >
          Dashboard
        </button>
        <button
          onClick={() => onTabChange('tasks')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'tasks' ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/50' : ''
          }`}
        >
          Tasks
        </button>
        <button
          onClick={() => onTabChange('schedule')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'schedule' ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/50' : ''
          }`}
        >
          Schedule
        </button>
        <button
          onClick={() => onTabChange('calendars')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'calendars' ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/50' : ''
          }`}
        >
          Prof. Feeds
        </button>
        <button
          onClick={() => onTabChange('matrix')}
          className={`px-2 py-1 rounded whitespace-nowrap ${
            activeTab === 'matrix' ? 'text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/50' : ''
          }`}
        >
          Matrix
        </button>
      </div>
    </header>
  );
};
