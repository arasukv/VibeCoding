import React, { useState } from 'react';
import { TaskItem, Course, ClassSession } from '../types';
import { formatTime, formatRelativeDueDate } from '../utils/dateUtils';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Layers,
} from 'lucide-react';

interface DeadlinesMatrixViewProps {
  tasks: TaskItem[];
  courses: Course[];
  timetable: ClassSession[];
  onOpenTaskModal: (task?: TaskItem) => void;
}

export const DeadlinesMatrixView: React.FC<DeadlinesMatrixViewProps> = ({
  tasks,
  courses,
  timetable,
  onOpenTaskModal,
}) => {
  // November 2026 default
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(10); // 0-indexed: 10 = November
  const [selectedDay, setSelectedDay] = useState<number>(6); // Friday Nov 6

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sun

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Get tasks for a given day in current month
  const getTasksForDay = (day: number) => {
    return tasks.filter((t) => {
      const d = new Date(t.dueDate);
      return (
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth &&
        d.getDate() === day
      );
    });
  };

  // Selected day items
  const selectedDateTasks = getTasksForDay(selectedDay);
  const selectedDateObj = new Date(currentYear, currentMonth, selectedDay);
  const selectedDayOfWeek = (selectedDateObj.getDay() === 0 ? 7 : selectedDateObj.getDay()) as 1 | 2 | 3 | 4 | 5;
  const selectedDayClasses = timetable.filter((s) => s.dayOfWeek === selectedDayOfWeek);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Deadlines &amp; Workload Matrix
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualize peak academic crunch days, exam conflicts, and course weight distribution
          </p>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
          <button
            onClick={handlePrevMonth}
            className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-xs font-mono text-slate-800 dark:text-slate-200 px-2 min-w-[120px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank leading slots */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank_${i}`} className="min-h-[85px] bg-slate-50/50 dark:bg-slate-950/20 rounded-lg border border-transparent" />
            ))}

            {/* Days of Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayTasks = getTasksForDay(day);
              const isSelected = selectedDay === day;
              const isToday = currentYear === 2026 && currentMonth === 10 && day === 6;
              const hasHighStakes = dayTasks.some((t) => t.type === 'midterm' || t.type === 'final' || t.weightPercentage >= 20);

              return (
                <div
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[85px] p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/20'
                      : isToday
                      ? 'border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-800/80 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-indigo-600 text-white'
                          : isSelected
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day}
                    </span>

                    {/* Crunch load indicator */}
                    {dayTasks.length > 0 && (
                      <span
                        className={`text-[10px] font-mono px-1 rounded ${
                          hasHighStakes || dayTasks.length >= 3
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 font-bold'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Micro Task List */}
                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayTasks.slice(0, 2).map((t) => {
                      const course = courses.find((c) => c.id === t.courseId);
                      return (
                        <div
                          key={t.id}
                          className="text-[10px] font-medium truncate px-1 py-0.5 rounded leading-tight"
                          style={{
                            backgroundColor: course?.color ? `${course.color}15` : '#e0e7ff',
                            color: course?.color || '#4f46e5',
                          }}
                          title={t.title}
                        >
                          {course?.code}: {t.title}
                        </div>
                      );
                    })}
                    {dayTasks.length > 2 && (
                      <div className="text-[9px] text-slate-400 font-mono">
                        +{dayTasks.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Inspector (1 Col) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
            <div>
              <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-semibold uppercase">
                Day Inspector
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {monthNames[currentMonth]} {selectedDay}, {currentYear}
              </h3>
            </div>

            {/* Deliverables on this day */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase">
                Assignments &amp; Exams ({selectedDateTasks.length})
              </h4>

              {selectedDateTasks.map((task) => {
                const course = courses.find((c) => c.id === task.courseId);
                const rel = formatRelativeDueDate(task.dueDate);

                return (
                  <div
                    key={task.id}
                    onClick={() => onOpenTaskModal(task)}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-400 transition-colors cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold font-mono" style={{ color: course?.color }}>
                        {course?.code}
                      </span>
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">
                        {task.weightPercentage}% grade
                      </span>
                    </div>

                    <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {task.title}
                    </h5>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="capitalize">{task.type}</span>
                      <span className="font-mono">{rel.label}</span>
                    </div>
                  </div>
                );
              })}

              {selectedDateTasks.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                  No deliverables scheduled for this day
                </div>
              )}
            </div>

            {/* Scheduled Classes on this day */}
            {selectedDayClasses.length > 0 && (
              <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-500 uppercase">
                  Classes &amp; Sessions
                </h4>
                <div className="space-y-2">
                  {selectedDayClasses.map((s) => {
                    const course = courses.find((c) => c.id === s.courseId);
                    return (
                      <div
                        key={s.id}
                        className="text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                            {course?.code}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {s.location} ({s.type.replace('_', ' ')})
                          </div>
                        </div>
                        <div className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                          {formatTime(s.startTime)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Grade Weight Distribution Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-3">
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Course Weight Distribution</span>
            </h4>
            <p className="text-xs text-slate-500">
              Breakdown of tracked deliverable weights by enrolled course
            </p>

            <div className="space-y-2.5 pt-2">
              {courses.map((course) => {
                const courseTasks = tasks.filter((t) => t.courseId === course.id);
                const totalWeight = courseTasks.reduce((acc, t) => acc + (t.weightPercentage || 0), 0);
                const completedWeight = courseTasks
                  .filter((t) => t.status === 'submitted' || t.status === 'graded')
                  .reduce((acc, t) => acc + (t.weightPercentage || 0), 0);

                return (
                  <div key={course.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        {course.code}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">
                        {completedWeight}% / {totalWeight}% tracked
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          backgroundColor: course.color,
                          width: `${Math.min(100, (completedWeight / Math.max(1, totalWeight)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
