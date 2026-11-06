import React, { useState } from 'react';
import { TaskItem, Course, TaskType, TaskStatus } from '../types';
import { formatRelativeDueDate } from '../utils/dateUtils';
import {
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Timer,
  MoreVertical,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  List,
  Kanban,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TasksViewProps {
  tasks: TaskItem[];
  courses: Course[];
  onToggleTaskStatus: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onOpenTaskModal: (task?: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onStartFocus: (task?: TaskItem) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  courses,
  onToggleTaskStatus,
  onToggleSubtask,
  onOpenTaskModal,
  onDeleteTask,
  onStartFocus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'completed'>('active');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const toggleExpand = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const handleComplete = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#4f46e5', '#0284c7', '#10b981'],
    });
    onToggleTaskStatus(taskId);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    if (selectedCourse !== 'all' && task.courseId !== selectedCourse) return false;
    if (selectedType !== 'all' && task.type !== selectedType) return false;
    if (selectedStatus === 'active' && (task.status === 'submitted' || task.status === 'graded')) return false;
    if (selectedStatus === 'completed' && task.status !== 'submitted' && task.status !== 'graded') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const course = courses.find((c) => c.id === task.courseId);
      const matchesTitle = task.title.toLowerCase().includes(q);
      const matchesCourse = course ? (course.code.toLowerCase().includes(q) || course.name.toLowerCase().includes(q)) : false;
      const matchesNotes = task.notes ? task.notes.toLowerCase().includes(q) : false;
      if (!matchesTitle && !matchesCourse && !matchesNotes) return false;
    }
    return true;
  });

  // Sort: active tasks by due date ascending; completed by due date descending
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const columns: { status: TaskStatus; label: string; bg: string }[] = [
    { status: 'todo', label: 'To Do', bg: 'bg-slate-100 dark:bg-slate-800' },
    { status: 'in_progress', label: 'In Progress', bg: 'bg-indigo-50 dark:bg-indigo-950/40' },
    { status: 'submitted', label: 'Submitted', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
    { status: 'graded', label: 'Graded', bg: 'bg-slate-50 dark:bg-slate-900' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Assignments, Quizzes &amp; Exams
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track weighted grade percentages, subtasks, and submission requirements
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Segmented View Mode */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          <button
            onClick={() => onOpenTaskModal()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search assignments, quiz topics, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Course Filter */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} – {c.name}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="assignment">Assignments</option>
            <option value="quiz">Quizzes</option>
            <option value="midterm">Midterms</option>
            <option value="final">Finals</option>
            <option value="lab">Labs</option>
            <option value="project">Projects</option>
            <option value="reading">Readings</option>
          </select>

          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
            <button
              onClick={() => setSelectedStatus('active')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                selectedStatus === 'active'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setSelectedStatus('completed')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                selectedStatus === 'completed'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Done
            </button>
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {sortedTasks.map((task) => {
            const course = courses.find((c) => c.id === task.courseId);
            const rel = formatRelativeDueDate(task.dueDate);
            const isDone = task.status === 'submitted' || task.status === 'graded';
            const isExpanded = !!expandedTasks[task.id];
            const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

            return (
              <div
                key={task.id}
                onClick={() => onOpenTaskModal(task)}
                className={`bg-white dark:bg-slate-900 border rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer ${
                  isDone
                    ? 'border-slate-200 dark:border-slate-800 opacity-70 bg-slate-50/50 dark:bg-slate-900/50'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Complete checkbox */}
                  <button
                    onClick={(e) => handleComplete(task.id, e)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
                    title={isDone ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                      }`}
                    >
                      {isDone && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                  </button>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                      <span
                        className="font-bold text-xs px-2 py-0.5 rounded font-mono"
                        style={{
                          backgroundColor: course?.color ? `${course.color}15` : '#e0e7ff',
                          color: course?.color || '#4f46e5',
                        }}
                      >
                        {course?.code}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                        {task.type}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="font-mono text-slate-500">
                        {task.weightPercentage}% grade weight
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-slate-500">
                        Platform: {task.submissionPlatform}
                      </span>
                      {task.isSyllabusItem && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="text-indigo-600 dark:text-indigo-400 text-[11px]">
                            Professor Syllabus
                          </span>
                        </>
                      )}
                    </div>

                    <h3
                      className={`text-sm font-semibold text-slate-900 dark:text-slate-100 ${
                        isDone ? 'line-through text-slate-400 dark:text-slate-500' : ''
                      }`}
                    >
                      {task.title}
                    </h3>

                    {task.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {task.notes}
                      </p>
                    )}

                    {/* Subtasks Progress Bar & Expand toggle */}
                    {task.subtasks.length > 0 && (
                      <div className="mt-2.5 flex items-center gap-3">
                        <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                          <div className="h-1.5 flex-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all"
                              style={{
                                width: `${(completedSubtasks / task.subtasks.length) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-slate-500 shrink-0">
                            {completedSubtasks}/{task.subtasks.length}
                          </span>
                        </div>

                        <button
                          onClick={(e) => toggleExpand(task.id, e)}
                          className="text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          <span>{isExpanded ? 'Hide Subtasks' : 'View Checklist'}</span>
                        </button>
                      </div>
                    )}

                    {/* Expanded Subtasks Checklist */}
                    {isExpanded && task.subtasks.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                        {task.subtasks.map((st) => (
                          <div
                            key={st.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleSubtask(task.id, st.id);
                            }}
                            className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 cursor-pointer py-1 px-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <input
                              type="checkbox"
                              checked={st.completed}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                            />
                            <span className={st.completed ? 'line-through text-slate-400' : ''}>
                              {st.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right side due info & actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span
                      className={`text-xs font-mono font-medium px-2 py-1 rounded ${
                        isDone
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          : rel.isOverdue
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                          : rel.isUrgent
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {isDone ? 'Completed' : rel.label}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {!isDone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartFocus(task);
                          }}
                          title="Start study focus timer"
                          className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-md transition-colors"
                        >
                          <Timer className="w-4 h-4" />
                        </button>
                      )}
                      {task.submissionUrl && (
                        <a
                          href={task.submissionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Open submission portal"
                          className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {sortedTasks.length === 0 && (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
              <CheckSquare className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                No tasks match your filters
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Try clearing search terms or selecting a different course.
              </p>
              <button
                onClick={() => onOpenTaskModal()}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Task</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {columns.map((col) => {
            const colTasks = sortedTasks.filter((t) => t.status === col.status);
            return (
              <div
                key={col.status}
                className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-3 min-h-[400px]"
              >
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {col.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">
                      ({colTasks.length})
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {colTasks.map((task) => {
                    const course = courses.find((c) => c.id === task.courseId);
                    const rel = formatRelativeDueDate(task.dueDate);

                    return (
                      <div
                        key={task.id}
                        onClick={() => onOpenTaskModal(task)}
                        className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-lg p-3 shadow-2xs hover:border-indigo-400 transition-all cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span
                            className="font-bold font-mono"
                            style={{ color: course?.color || '#4f46e5' }}
                          >
                            {course?.code}
                          </span>
                          <span className="font-mono text-slate-500">
                            {task.weightPercentage}%
                          </span>
                        </div>

                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                          {task.title}
                        </h4>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-700/50">
                          <span className="font-mono">{rel.label}</span>
                          <span className="capitalize">{task.type}</span>
                        </div>
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No items
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
