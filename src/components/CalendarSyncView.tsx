import React, { useState } from 'react';
import { ProfessorCalendar, Course, CalendarEvent, TaskItem } from '../types';
import { formatTime } from '../utils/dateUtils';
import {
  RefreshCw,
  Plus,
  Calendar,
  CheckCircle,
  ExternalLink,
  Trash2,
  Filter,
  Layers,
  ArrowRight,
  Sparkles,
  Link2,
  Clock,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CalendarSyncViewProps {
  calendars: ProfessorCalendar[];
  courses: Course[];
  tasks: TaskItem[];
  onSyncAll: () => void;
  onSyncSingle: (calendarId: string) => void;
  onDeleteCalendar: (calendarId: string) => void;
  onToggleAutoSync: (calendarId: string) => void;
  onOpenAddCalendarModal: () => void;
  onConvertEventToTask: (event: CalendarEvent, courseId: string) => void;
  isSyncing: boolean;
}

export const CalendarSyncView: React.FC<CalendarSyncViewProps> = ({
  calendars,
  courses,
  tasks,
  onSyncAll,
  onSyncSingle,
  onDeleteCalendar,
  onToggleAutoSync,
  onOpenAddCalendarModal,
  onConvertEventToTask,
  isSyncing,
}) => {
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('all');
  const [activeSyncingId, setActiveSyncingId] = useState<string | null>(null);

  const handleSyncIndividual = (calId: string) => {
    setActiveSyncingId(calId);
    onSyncSingle(calId);
    setTimeout(() => setActiveSyncingId(null), 800);
  };

  // Aggregate all events across calendars
  const allEvents: { event: CalendarEvent; calendar: ProfessorCalendar; course?: Course }[] = [];
  for (const cal of calendars) {
    if (selectedCalendarId !== 'all' && cal.id !== selectedCalendarId) continue;
    const course = courses.find((c) => c.id === cal.courseId);
    for (const ev of cal.events) {
      allEvents.push({ event: ev, calendar: cal, course });
    }
  }

  // Sort events by startTime
  allEvents.sort((a, b) => new Date(a.event.startTime).getTime() - new Date(b.event.startTime).getTime());

  // Check if an event is already converted to a task
  const isEventImported = (ev: CalendarEvent) => {
    return tasks.some((t) => t.syncedFromCalendarId === ev.calendarId && t.title.toLowerCase().includes(ev.title.toLowerCase().substring(0, 10)));
  };

  const handleImportAllEvents = () => {
    let imported = 0;
    for (const item of allEvents) {
      if (!isEventImported(item.event) && (item.event.category === 'assignment' || item.event.category === 'quiz' || item.event.category === 'exam' || item.event.category === 'deadline')) {
        onConvertEventToTask(item.event, item.calendar.courseId);
        imported++;
      }
    }
    if (imported > 0) {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Professor Academic Calendar Feeds
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sync Canvas, Blackboard, or Google Calendar feeds directly with your assignment deadlines
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onSyncAll}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync All Feeds'}</span>
          </button>

          <button
            onClick={onOpenAddCalendarModal}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Connect Feed</span>
          </button>
        </div>
      </div>

      {/* Synced Feeds Grid */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Active Connected Calendars ({calendars.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {calendars.map((cal) => {
            const course = courses.find((c) => c.id === cal.courseId);
            const isLocalSyncing = activeSyncingId === cal.id || isSyncing;

            return (
              <div
                key={cal.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: course?.color || '#4f46e5' }}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 truncate">
                        {course?.code || 'Course'}
                      </div>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {cal.name}
                      </h4>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteCalendar(cal.id)}
                    title="Remove calendar subscription"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <div className="flex items-center justify-between">
                    <span>Instructor:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-sans font-medium">{cal.professor}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Synced Events:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{cal.events.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Synced:</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(cal.lastSyncedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {cal.feedUrl && (
                  <div className="text-[11px] text-indigo-600 dark:text-indigo-400 truncate flex items-center gap-1">
                    <Link2 className="w-3 h-3 shrink-0" />
                    <span className="truncate">{cal.feedUrl}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={cal.autoSync}
                      onChange={() => onToggleAutoSync(cal.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-0"
                    />
                    <span>Auto-sync (every {cal.syncIntervalHours}h)</span>
                  </label>

                  <button
                    onClick={() => handleSyncIndividual(cal.id)}
                    disabled={isLocalSyncing}
                    className="p-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
                    title="Sync this feed now"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLocalSyncing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Synced Events Feed & Conversion Center */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Synced Feed Events Stream
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assignments, quiz dates, and office hours extracted from connected professor feeds
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCalendarId}
              onChange={(e) => setSelectedCalendarId(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200"
            >
              <option value="all">All Connected Feeds</option>
              {calendars.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleImportAllEvents}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Import All Deadlines to Tasks</span>
            </button>
          </div>
        </div>

        {/* Table of Events */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                <th className="pb-2.5 font-semibold">Course &amp; Title</th>
                <th className="pb-2.5 font-semibold">Date &amp; Time</th>
                <th className="pb-2.5 font-semibold">Feed Source</th>
                <th className="pb-2.5 font-semibold">Category</th>
                <th className="pb-2.5 font-semibold text-right">To-Do Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {allEvents.map(({ event, calendar, course }) => {
                const dateObj = new Date(event.startTime);
                const dateStr = dateObj.toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  weekday: 'short',
                });
                const timeStr = event.allDay ? 'All Day' : dateObj.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                const imported = isEventImported(event);

                return (
                  <tr key={event.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-bold font-mono px-1.5 py-0.5 rounded text-[11px]"
                          style={{
                            backgroundColor: `${course?.color}15`,
                            color: course?.color || '#4f46e5',
                          }}
                        >
                          {course?.code}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {event.title}
                          </div>
                          {event.description && (
                            <div className="text-[11px] text-slate-500 line-clamp-1 max-w-md">
                              {event.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-mono text-slate-800 dark:text-slate-200">{dateStr}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{timeStr}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                      <div>{calendar.name}</div>
                      <div className="text-[10px] text-slate-400">{calendar.professor}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="capitalize font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {event.category.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 pl-3 text-right whitespace-nowrap">
                      {imported ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>In To-Do List</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => onConvertEventToTask(event, calendar.courseId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/60 rounded-md transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add to To-Dos</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {allEvents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-slate-400">
                    No events found in connected calendars. Connect a feed above to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
