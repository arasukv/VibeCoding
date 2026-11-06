import React, { useState, useEffect } from 'react';
import { Course, ClassSession, TaskItem, ProfessorCalendar, CalendarEvent, ActiveTab } from './types';
import { INITIAL_COURSES, INITIAL_TIMETABLE, INITIAL_TASKS, INITIAL_CALENDARS } from './data/initialData';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TasksView } from './components/TasksView';
import { TimetableView } from './components/TimetableView';
import { CalendarSyncView } from './components/CalendarSyncView';
import { DeadlinesMatrixView } from './components/DeadlinesMatrixView';
import { TaskModal } from './components/TaskModal';
import { FocusTimerModal } from './components/FocusTimerModal';
import { AddCalendarModal } from './components/AddCalendarModal';
import { AddClassModal } from './components/AddClassModal';
import { formatRelativeDueDate } from './utils/dateUtils';
import confetti from 'canvas-confetti';

const STORAGE_KEY_COURSES = 'campuspulse_courses_v1';
const STORAGE_KEY_TIMETABLE = 'campuspulse_timetable_v1';
const STORAGE_KEY_TASKS = 'campuspulse_tasks_v1';
const STORAGE_KEY_CALENDARS = 'campuspulse_calendars_v1';
const STORAGE_KEY_THEME = 'campuspulse_theme_v1';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved !== null) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  }, [isDarkMode]);

  // Tab State
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Core Data States with LocalStorage Persistence
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COURSES);
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  const [timetable, setTimetable] = useState<ClassSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TIMETABLE);
    return saved ? JSON.parse(saved) : INITIAL_TIMETABLE;
  });

  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TASKS);
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [calendars, setCalendars] = useState<ProfessorCalendar[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CALENDARS);
    return saved ? JSON.parse(saved) : INITIAL_CALENDARS;
  });

  // Sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskItem | null>(null);

  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [focusActiveTask, setFocusActiveTask] = useState<TaskItem | null>(null);

  const [isAddCalendarModalOpen, setIsAddCalendarModalOpen] = useState(false);
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TIMETABLE, JSON.stringify(timetable));
  }, [timetable]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CALENDARS, JSON.stringify(calendars));
  }, [calendars]);

  // Handlers for Tasks
  const handleToggleTaskStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const isDone = t.status === 'submitted' || t.status === 'graded';
          const nextStatus = isDone ? 'todo' : 'submitted';
          return {
            ...t,
            status: nextStatus,
            completedAt: !isDone ? new Date().toISOString() : undefined,
          };
        }
        return t;
      })
    );
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const updatedSubtasks = t.subtasks.map((st) =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
          );
          return { ...t, subtasks: updatedSubtasks };
        }
        return t;
      })
    );
  };

  const handleSaveTask = (taskItem: TaskItem) => {
    setTasks((prev) => {
      const idx = prev.findIndex((t) => t.id === taskItem.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = taskItem;
        return copy;
      }
      return [taskItem, ...prev];
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Focus Timer trigger
  const handleStartFocus = (task?: TaskItem) => {
    setFocusActiveTask(task || null);
    setIsFocusModalOpen(true);
  };

  // Timetable Handlers
  const handleAddClassSession = (session: ClassSession) => {
    setTimetable((prev) => [...prev, session]);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
  };

  // Calendar Sync Handlers
  const handleSyncAllCalendars = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const now = new Date().toISOString();
      setCalendars((prev) =>
        prev.map((c) => ({
          ...c,
          lastSyncedAt: now,
        }))
      );
      setIsSyncing(false);
      confetti({
        particleCount: 35,
        spread: 55,
        origin: { y: 0.6 },
      });
    }, 1000);
  };

  const handleSyncSingleCalendar = (calendarId: string) => {
    setCalendars((prev) =>
      prev.map((c) => (c.id === calendarId ? { ...c, lastSyncedAt: new Date().toISOString() } : c))
    );
  };

  const handleDeleteCalendar = (calendarId: string) => {
    if (confirm('Unsubscribe and remove this professor calendar feed?')) {
      setCalendars((prev) => prev.filter((c) => c.id !== calendarId));
    }
  };

  const handleToggleAutoSync = (calendarId: string) => {
    setCalendars((prev) =>
      prev.map((c) => (c.id === calendarId ? { ...c, autoSync: !c.autoSync } : c))
    );
  };

  const handleAddCalendar = (newCal: ProfessorCalendar, newCourse?: Course) => {
    if (newCourse) {
      setCourses((prev) => [...prev, newCourse]);
    }
    setCalendars((prev) => [newCal, ...prev]);

    // Also auto-convert deadlines/quizzes into tasks if filter matched
    const newTasksToCreate: TaskItem[] = [];
    for (const ev of newCal.events) {
      if (
        ev.category === 'assignment' ||
        ev.category === 'quiz' ||
        ev.category === 'exam' ||
        ev.category === 'deadline'
      ) {
        newTasksToCreate.push({
          id: 'task_' + Math.random().toString(36).substring(2, 9),
          title: ev.title,
          courseId: newCal.courseId,
          type: ev.category === 'exam' ? 'midterm' : ev.category === 'quiz' ? 'quiz' : 'assignment',
          dueDate: ev.startTime,
          priority: ev.category === 'exam' ? 'high' : 'medium',
          weightPercentage: ev.category === 'exam' ? 25 : ev.category === 'quiz' ? 5 : 10,
          status: 'todo',
          submissionPlatform: 'Gradescope',
          notes: ev.description,
          subtasks: [],
          estimatedMinutes: 90,
          syncedFromCalendarId: newCal.id,
          isSyllabusItem: true,
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (newTasksToCreate.length > 0) {
      setTasks((prev) => [...newTasksToCreate, ...prev]);
    }
  };

  const handleConvertEventToTask = (event: CalendarEvent, courseId: string) => {
    const newTask: TaskItem = {
      id: 'task_' + Math.random().toString(36).substring(2, 9),
      title: event.title,
      courseId,
      type: event.category === 'exam' ? 'midterm' : event.category === 'quiz' ? 'quiz' : 'assignment',
      dueDate: event.startTime,
      priority: event.category === 'exam' ? 'high' : 'medium',
      weightPercentage: event.category === 'exam' ? 25 : event.category === 'quiz' ? 5 : 8,
      status: 'todo',
      submissionPlatform: 'Gradescope',
      notes: event.description,
      subtasks: [],
      estimatedMinutes: 60,
      syncedFromCalendarId: event.calendarId,
      isSyllabusItem: true,
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
  };

  const handleResetData = () => {
    if (confirm('Reset to initial Fall 2026 university demo courses, syllabus tasks, and timetable?')) {
      setCourses(INITIAL_COURSES);
      setTimetable(INITIAL_TIMETABLE);
      setTasks(INITIAL_TASKS);
      setCalendars(INITIAL_CALENDARS);
      localStorage.clear();
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.5 } });
    }
  };

  const overdueCount = tasks.filter(
    (t) => t.status !== 'graded' && t.status !== 'submitted' && formatRelativeDueDate(t.dueDate).isOverdue
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Bar Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenNewTask={() => {
          setTaskToEdit(null);
          setIsTaskModalOpen(true);
        }}
        onOpenFocus={() => handleStartFocus()}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        overdueCount={overdueCount}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            courses={courses}
            timetable={timetable}
            tasks={tasks}
            calendars={calendars}
            onToggleTaskStatus={handleToggleTaskStatus}
            onOpenTaskModal={(t) => {
              setTaskToEdit(t || null);
              setIsTaskModalOpen(true);
            }}
            onStartFocus={handleStartFocus}
            onNavigateTab={setActiveTab}
            onSyncAllCalendars={handleSyncAllCalendars}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksView
            tasks={tasks}
            courses={courses}
            onToggleTaskStatus={handleToggleTaskStatus}
            onToggleSubtask={handleToggleSubtask}
            onOpenTaskModal={(t) => {
              setTaskToEdit(t || null);
              setIsTaskModalOpen(true);
            }}
            onDeleteTask={handleDeleteTask}
            onStartFocus={handleStartFocus}
          />
        )}

        {activeTab === 'schedule' && (
          <TimetableView
            timetable={timetable}
            courses={courses}
            onOpenAddClass={() => setIsAddClassModalOpen(true)}
          />
        )}

        {activeTab === 'calendars' && (
          <CalendarSyncView
            calendars={calendars}
            courses={courses}
            tasks={tasks}
            onSyncAll={handleSyncAllCalendars}
            onSyncSingle={handleSyncSingleCalendar}
            onDeleteCalendar={handleDeleteCalendar}
            onToggleAutoSync={handleToggleAutoSync}
            onOpenAddCalendarModal={() => setIsAddCalendarModalOpen(true)}
            onConvertEventToTask={handleConvertEventToTask}
            isSyncing={isSyncing}
          />
        )}

        {activeTab === 'matrix' && (
          <DeadlinesMatrixView
            tasks={tasks}
            courses={courses}
            timetable={timetable}
            onOpenTaskModal={(t) => {
              setTaskToEdit(t || null);
              setIsTaskModalOpen(true);
            }}
          />
        )}
      </main>

      {/* Clean quiet footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">CampusPulse</span>
            <span>·</span>
            <span>Student Academic Planner &amp; Professor Calendar Sync</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={handleResetData}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              Reset Sample Courses &amp; Data
            </button>
            <span>·</span>
            <span>RFC 5545 iCalendar Compatible</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSaveTask={handleSaveTask}
        onDeleteTask={handleDeleteTask}
        taskToEdit={taskToEdit}
        courses={courses}
      />

      <FocusTimerModal
        isOpen={isFocusModalOpen}
        onClose={() => setIsFocusModalOpen(false)}
        tasks={tasks}
        courses={courses}
        activeTask={focusActiveTask}
      />

      <AddCalendarModal
        isOpen={isAddCalendarModalOpen}
        onClose={() => setIsAddCalendarModalOpen(false)}
        courses={courses}
        onAddCalendar={handleAddCalendar}
      />

      <AddClassModal
        isOpen={isAddClassModalOpen}
        onClose={() => setIsAddClassModalOpen(false)}
        courses={courses}
        onAddClassSession={handleAddClassSession}
      />
    </div>
  );
}
