import React, { useState } from 'react';
import { ClassSession, Course, ClassType } from '../types';
import { formatTime } from '../utils/dateUtils';
import { exportToICS } from '../utils/icsParser';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Download,
  Filter,
  Users,
  BookOpen,
  Sparkles,
} from 'lucide-react';

interface TimetableViewProps {
  timetable: ClassSession[];
  courses: Course[];
  onOpenAddClass: () => void;
}

const DAYS: { id: 1 | 2 | 3 | 4 | 5; label: string; short: string }[] = [
  { id: 1, label: 'Monday', short: 'Mon' },
  { id: 2, label: 'Tuesday', short: 'Tue' },
  { id: 3, label: 'Wednesday', short: 'Wed' },
  { id: 4, label: 'Thursday', short: 'Thu' },
  { id: 5, label: 'Friday', short: 'Fri' },
];

// Grid spans 08:00 to 18:00 (10 hours)
const START_HOUR = 8;
const END_HOUR = 18;
const TOTAL_HOURS = END_HOUR - START_HOUR;

export const TimetableView: React.FC<TimetableViewProps> = ({
  timetable,
  courses,
  onOpenAddClass,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);

  // Filter sessions
  const filteredSessions = timetable.filter((s) => {
    if (filterType !== 'all' && s.type !== filterType) return false;
    return true;
  });

  const getCourse = (courseId: string) => courses.find((c) => c.id === courseId);

  // Helper to calculate top% and height% in grid
  const getSessionPosition = (startTime: string, endTime: string) => {
    const [sh, sm] = startTime.split(':').map((v) => parseInt(v, 10));
    const [eh, em] = endTime.split(':').map((v) => parseInt(v, 10));

    const startMinutes = (sh - START_HOUR) * 60 + sm;
    const endMinutes = (eh - START_HOUR) * 60 + em;
    const durationMinutes = Math.max(30, endMinutes - startMinutes);

    const totalGridMinutes = TOTAL_HOURS * 60;
    const topPercent = (startMinutes / totalGridMinutes) * 100;
    const heightPercent = (durationMinutes / totalGridMinutes) * 100;

    return {
      top: `${Math.max(0, topPercent)}%`,
      height: `${Math.min(100 - topPercent, heightPercent)}%`,
    };
  };

  const handleExportICS = () => {
    // Generate dummy recurring events for the semester
    const eventsToExport = timetable.map((s) => {
      const course = getCourse(s.courseId);
      // Map day to upcoming date
      const baseDate = new Date();
      const currentDay = baseDate.getDay(); // 0 is Sun
      const distance = (s.dayOfWeek - currentDay + 7) % 7;
      const targetDate = new Date(baseDate);
      targetDate.setDate(baseDate.getDate() + distance);

      const [sh, sm] = s.startTime.split(':').map(Number);
      const [eh, em] = s.endTime.split(':').map(Number);

      const start = new Date(targetDate);
      start.setHours(sh, sm, 0, 0);

      const end = new Date(targetDate);
      end.setHours(eh, em, 0, 0);

      return {
        title: `${course?.code || 'Class'} (${s.type}): ${course?.name || ''}`,
        description: `Instructor: ${course?.professor || 'Staff'}\nRoom: ${s.location}`,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        location: s.location,
      };
    });

    const icsContent = exportToICS('CampusPulse Academic Timetable', eventsToExport);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'class-schedule.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Weekly Class Timetable
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Lectures, discussion sections, labs, and professor office hours
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Types */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All Sessions
            </button>
            <button
              onClick={() => setFilterType('lecture')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterType === 'lecture'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Lectures
            </button>
            <button
              onClick={() => setFilterType('office_hours')}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                filterType === 'office_hours'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Office Hours
            </button>
          </div>

          <button
            onClick={handleExportICS}
            title="Download .ics to add to Apple/Google Calendar"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export .ics</span>
          </button>

          <button
            onClick={onOpenAddClass}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Class</span>
          </button>
        </div>
      </div>

      {/* Main Timetable Visual Canvas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-xs">
        <div className="min-w-[760px] p-4">
          {/* Days Header */}
          <div className="grid grid-cols-6 gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-2 text-center text-xs">
            <div className="text-slate-400 font-mono text-[11px] pt-1">Time</div>
            {DAYS.map((day) => {
              const isToday = day.id === 5; // Friday simulated
              return (
                <div key={day.id} className="text-center">
                  <div
                    className={`font-bold inline-block px-2.5 py-0.5 rounded text-xs ${
                      isToday
                        ? 'bg-indigo-600 text-white font-semibold'
                        : 'text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {day.label}
                  </div>
                  {isToday && (
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                      Today
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Timetable Body Grid */}
          <div className="grid grid-cols-6 gap-2 relative h-[560px]">
            {/* Time labels column */}
            <div className="flex flex-col justify-between py-1 pr-2 text-right font-mono text-[11px] text-slate-400 select-none">
              {Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => {
                const hour = START_HOUR + i;
                const period = hour >= 12 ? 'PM' : 'AM';
                const displayH = hour % 12 === 0 ? 12 : hour % 12;
                return (
                  <div key={hour} className="h-0 flex items-center justify-end">
                    <span>{displayH}:00 {period}</span>
                  </div>
                );
              })}
            </div>

            {/* 5 Day Columns */}
            {DAYS.map((day) => {
              const daySessions = filteredSessions.filter((s) => s.dayOfWeek === day.id);
              const isToday = day.id === 5;

              return (
                <div
                  key={day.id}
                  className={`relative border-l border-slate-100 dark:border-slate-800 rounded-md transition-colors ${
                    isToday ? 'bg-indigo-50/20 dark:bg-indigo-950/10' : ''
                  }`}
                >
                  {/* Horizontal hour guide lines */}
                  {Array.from({ length: TOTAL_HOURS + 1 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-full border-t border-slate-100 dark:border-slate-800/60"
                      style={{ top: `${(i / TOTAL_HOURS) * 100}%` }}
                    />
                  ))}

                  {/* Render Sessions */}
                  {daySessions.map((session) => {
                    const course = getCourse(session.courseId);
                    const pos = getSessionPosition(session.startTime, session.endTime);
                    const isOfficeHours = session.type === 'office_hours';

                    return (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={`absolute left-1 right-1 rounded-lg p-2 overflow-hidden shadow-2xs border transition-all hover:scale-[1.01] hover:z-20 cursor-pointer text-left ${
                          isOfficeHours
                            ? 'border-dashed border-amber-400/80 bg-amber-50/90 dark:bg-amber-950/40'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                        }`}
                        style={{
                          top: pos.top,
                          height: pos.height,
                          borderLeftWidth: '4px',
                          borderLeftColor: course?.color || '#4f46e5',
                        }}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                          <span
                            className="font-bold truncate"
                            style={{ color: course?.color || '#4f46e5' }}
                          >
                            {course?.code}
                          </span>
                          <span className="text-slate-400 text-[9px] shrink-0">
                            {session.startTime}
                          </span>
                        </div>

                        <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                          {isOfficeHours ? `Office Hours` : course?.name}
                        </div>

                        <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                          <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                          <span className="truncate">{session.location}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Session Drawer / Modal Detail */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            {(() => {
              const course = getCourse(selectedSession.courseId);
              return (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className="text-xs font-bold font-mono px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: `${course?.color}20`,
                          color: course?.color || '#4f46e5',
                        }}
                      >
                        {course?.code}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {course?.name}
                      </h3>
                      <p className="text-xs text-slate-500 capitalize">
                        {selectedSession.type.replace('_', ' ')}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedSession(null)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm p-1"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Day &amp; Time:</span>
                      <span className="font-mono font-medium">
                        {DAYS.find((d) => d.id === selectedSession.dayOfWeek)?.label},{' '}
                        {formatTime(selectedSession.startTime)} – {formatTime(selectedSession.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Location:</span>
                      <span className="font-medium">{selectedSession.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Instructor:</span>
                      <span className="font-medium">{course?.professor}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Office Hours:</span>
                      <span className="font-medium">{course?.officeHours}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    {course?.zoomUrl && (
                      <a
                        href={course.zoomUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 rounded-lg hover:bg-indigo-100"
                      >
                        Zoom Link
                      </a>
                    )}
                    {course?.syllabusUrl && (
                      <a
                        href={course.syllabusUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200"
                      >
                        Course Website
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedSession(null)}
                      className="px-4 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-lg"
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
