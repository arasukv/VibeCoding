import React from 'react';
import { Course, ClassSession, TaskItem, ProfessorCalendar, ActiveTab } from '../types';
import { formatRelativeDueDate, detectHellWeek, formatTime, calculateAverageGrade } from '../utils/dateUtils';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Timer,
  RefreshCw,
  Video,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DashboardViewProps {
  courses: Course[];
  timetable: ClassSession[];
  tasks: TaskItem[];
  calendars: ProfessorCalendar[];
  onToggleTaskStatus: (taskId: string) => void;
  onOpenTaskModal: (task?: TaskItem) => void;
  onStartFocus: (task?: TaskItem) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onSyncAllCalendars: () => void;
  isSyncing: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  courses,
  timetable,
  tasks,
  calendars,
  onToggleTaskStatus,
  onOpenTaskModal,
  onStartFocus,
  onNavigateTab,
  onSyncAllCalendars,
  isSyncing,
}) => {
  // Current simulated day: Friday (day 5 of week)
  const todayDayOfWeek = 5;
  const nowTimeStr = '09:15'; // 9:15 AM

  // Filter today's timetable sessions
  const todaySessions = timetable
    .filter((s) => s.dayOfWeek === todayDayOfWeek)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Determine next upcoming class today
  const nextSession = todaySessions.find((s) => s.startTime >= nowTimeStr) || todaySessions[0];
  const nextCourse = nextSession ? courses.find((c) => c.id === nextSession.courseId) : null;

  // Active / urgent tasks (sorted by due date)
  const pendingTasks = tasks
    .filter((t) => t.status !== 'graded' && t.status !== 'submitted')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const completedCount = tasks.filter((t) => t.status === 'submitted' || t.status === 'graded').length;
  const overdueCount = pendingTasks.filter((t) => formatRelativeDueDate(t.dueDate).isOverdue).length;
  const urgentCount = pendingTasks.filter((t) => formatRelativeDueDate(t.dueDate).isUrgent).length;
  const hellWeek = detectHellWeek(tasks);
  const avgGrade = calculateAverageGrade(courses);

  const handleCompleteWithCelebration = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#4f46e5', '#0284c7', '#10b981', '#f59e0b'],
    });
    onToggleTaskStatus(taskId);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Next Class Banner */}
      {nextSession && nextCourse && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center font-bold text-white text-sm shrink-0"
                style={{ backgroundColor: nextCourse.color }}
              >
                {nextCourse.code.split(' ')[0]}
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <span className="uppercase tracking-wide">Next Class Up Today</span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className="font-mono">{formatTime(nextSession.startTime)} – {formatTime(nextSession.endTime)}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mt-0.5">
                  <span>{nextCourse.code}: {nextCourse.name}</span>
                  <span className="text-xs font-normal text-slate-500 capitalize">
                    ({nextSession.type.replace('_', ' ')})
                  </span>
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {nextSession.location}
                  </span>
                  <span>·</span>
                  <span>{nextCourse.professor}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
              {nextCourse.zoomUrl && (
                <a
                  href={nextCourse.zoomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition-colors"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Join Zoom</span>
                </a>
              )}
              {nextCourse.syllabusUrl && (
                <a
                  href={nextCourse.syllabusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Syllabus</span>
                </a>
              )}
              <button
                onClick={() => onNavigateTab('schedule')}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <span>Full Timetable</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 2. Hell Week / Crunch Alert */}
      {hellWeek && (
        <section className="bg-amber-500/10 dark:bg-amber-500/15 border border-amber-300/60 dark:border-amber-700/60 rounded-xl p-5">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-amber-500 text-white rounded-lg shrink-0 mt-0.5 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Academic Crunch Window Detected
                  </h3>
                  <span className="text-xs font-mono font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/70 px-2 py-0.5 rounded">
                    {hellWeek.startDate} – {hellWeek.endDate}
                  </span>
                </div>
                <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
                  {hellWeek.count} deliverables · {hellWeek.highWeightTotal}% of grade at stake
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                {hellWeek.advice}
              </p>

              {/* Items in the crunch window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-800/50">
                {hellWeek.items.slice(0, 3).map((item) => {
                  const course = courses.find((c) => c.id === item.courseId);
                  const rel = formatRelativeDueDate(item.dueDate);
                  return (
                    <div
                      key={item.id}
                      onClick={() => onOpenTaskModal(item)}
                      className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{course?.code}</span>
                        <span className="font-mono text-amber-600 dark:text-amber-400 font-medium">
                          {item.weightPercentage}% grade
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100 line-clamp-1">
                        {item.title}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        <span className="font-mono">{rel.label}</span>
                        <span className="capitalize">{item.type}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. 4-Metric Tabular Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Due Soon (24-48h)</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
            {urgentCount}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            {overdueCount > 0 ? (
              <span className="text-rose-600 dark:text-rose-400 font-semibold font-mono">
                {overdueCount} overdue
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400">All up to date</span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Total Pending</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
            {pendingTasks.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span className="font-mono font-medium">{completedCount}</span> completed this semester
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Average Standing</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            {avgGrade}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Across {courses.length} enrolled courses
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Professor Feeds</span>
            <button
              onClick={onSyncAllCalendars}
              disabled={isSyncing}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 p-0.5"
              title="Sync All Feeds"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-slate-100">
            {calendars.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            All active &amp; auto-syncing
          </div>
        </div>
      </section>

      {/* 4. Two-Column Split: Action Plan (Tasks) + Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Action Plan Tasks */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Action Plan &amp; Immediate Deadlines
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Prioritized by upcoming deadline and course weight percentage
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('tasks')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
            >
              <span>View All Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {pendingTasks.slice(0, 5).map((task) => {
              const course = courses.find((c) => c.id === task.courseId);
              const rel = formatRelativeDueDate(task.dueDate);
              const completedSubtasks = task.subtasks.filter((s) => s.completed).length;

              return (
                <div
                  key={task.id}
                  onClick={() => onOpenTaskModal(task)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => handleCompleteWithCelebration(task.id, e)}
                      title="Mark task completed"
                      className="mt-0.5 text-slate-300 dark:text-slate-600 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shrink-0"
                    >
                      <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 group-hover:border-emerald-500 flex items-center justify-center transition-colors">
                        {task.status === 'submitted' || task.status === 'graded' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : null}
                      </div>
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs mb-1">
                        <span
                          className="font-bold text-xs px-2 py-0.5 rounded font-mono"
                          style={{
                            backgroundColor: course?.color ? `${course.color}15` : '#e0e7ff',
                            color: course?.color || '#4f46e5',
                          }}
                        >
                          {course?.code || 'Course'}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="capitalize text-slate-600 dark:text-slate-400 font-medium">
                          {task.type}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="font-mono text-slate-500">
                          {task.weightPercentage}% final grade
                        </span>
                        {task.isSyllabusItem && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700">·</span>
                            <span className="text-indigo-600 dark:text-indigo-400 text-[11px]">
                              Syllabus Synced
                            </span>
                          </>
                        )}
                      </div>

                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {task.title}
                      </h4>

                      {task.subtasks.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
                              style={{ width: `${(completedSubtasks / task.subtasks.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">
                            {completedSubtasks}/{task.subtasks.length} subtasks
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Due badge & Study launch */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span
                        className={`text-xs font-mono font-medium px-2 py-1 rounded ${
                          rel.isOverdue
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                            : rel.isUrgent
                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {rel.label}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartFocus(task);
                        }}
                        title="Start Pomodoro Focus on this task"
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-md transition-all flex items-center gap-1 text-[11px]"
                      >
                        <Timer className="w-3.5 h-3.5" />
                        <span>Focus</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {pendingTasks.length === 0 && (
              <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  You're all caught up!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  No active assignments or quizzes due. Add a new task or check your professor calendar sync.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Right 1 Col: Today's Schedule & Quick Links */}
        <section className="space-y-6">
          {/* Today's Timetable */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Today's Schedule (Friday)
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {todaySessions.length} sessions
              </span>
            </div>

            <div className="space-y-3">
              {todaySessions.map((session) => {
                const course = courses.find((c) => c.id === session.courseId);
                const isPast = session.endTime < nowTimeStr;
                const isNow = session.startTime <= nowTimeStr && session.endTime >= nowTimeStr;

                return (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      isNow
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                        : isPast
                        ? 'border-slate-100 dark:border-slate-800/60 opacity-60'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {course?.code}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        {formatTime(session.startTime)} – {formatTime(session.endTime)}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-slate-900 dark:text-slate-100">
                      {course?.name}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      <span className="capitalize">{session.type.replace('_', ' ')}</span>
                      <span>{session.location}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enrolled Courses Summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Enrolled Courses ({courses.length})
              </h3>
              <span className="text-xs text-slate-500 font-mono">Fall 2026</span>
            </div>

            <div className="space-y-2.5">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: course.color }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {course.code}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {course.professor}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {course.currentGrade}%
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {course.credits} cred
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
