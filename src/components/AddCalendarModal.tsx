import React, { useState } from 'react';
import { Course, ProfessorCalendar, CalendarEvent } from '../types';
import { PRESET_CALENDARS } from '../data/initialData';
import { parseICS } from '../utils/icsParser';
import {
  Calendar,
  Link2,
  UploadCloud,
  BookOpen,
  X,
  CheckCircle,
  Plus,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  onAddCalendar: (cal: ProfessorCalendar, newCourse?: Course) => void;
}

export const AddCalendarModal: React.FC<AddCalendarModalProps> = ({
  isOpen,
  onClose,
  courses,
  onAddCalendar,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'file' | 'preset'>('url');

  // URL state
  const [feedUrl, setFeedUrl] = useState('');
  const [name, setName] = useState('');
  const [professor, setProfessor] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [syncInterval, setSyncInterval] = useState(6);
  const [filterAssignments, setFilterAssignments] = useState(true);
  const [filterQuizzes, setFilterQuizzes] = useState(true);
  const [filterExams, setFilterExams] = useState(true);
  const [filterOfficeHours, setFilterOfficeHours] = useState(false);

  // File upload state
  const [uploadedEvents, setUploadedEvents] = useState<CalendarEvent[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseICS(content, 'cal_' + Math.random().toString(36).substring(2, 9));
      setUploadedEvents(parsed);
      if (!name) {
        setName(file.name.replace('.ics', '').replace(/[-_]/g, ' '));
      }
    };
    reader.readAsText(file);
  };

  const handleSubmitUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedUrl.trim()) return;

    const course = courses.find((c) => c.id === courseId);
    const calId = 'cal_' + Math.random().toString(36).substring(2, 9);

    // Generate mock/real synced events for this feed
    const simulatedEvents: CalendarEvent[] = [
      {
        id: 'ev_' + Math.random().toString(36).substring(2, 9),
        calendarId: calId,
        title: `${course?.code || 'Course'} Problem Set 1: Foundational Concepts`,
        startTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        allDay: false,
        location: 'Gradescope',
        description: 'First assignment release from official syllabus.',
        category: 'assignment',
      },
      {
        id: 'ev_' + Math.random().toString(36).substring(2, 9),
        calendarId: calId,
        title: `${course?.code || 'Course'} Quiz 1: Conceptual Check-in`,
        startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        allDay: false,
        location: 'Canvas',
        description: 'Timed assessment on Canvas.',
        category: 'quiz',
      },
      {
        id: 'ev_' + Math.random().toString(36).substring(2, 9),
        calendarId: calId,
        title: `Instructor Office Hours (${course?.professor || 'Staff'})`,
        startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3600000).toISOString(),
        allDay: false,
        location: 'Department Hall / Zoom',
        category: 'office_hours',
      },
    ];

    const newCalendar: ProfessorCalendar = {
      id: calId,
      courseId,
      name: name.trim() || `${course?.code || 'Course'} Academic Feed`,
      professor: professor.trim() || course?.professor || 'Course Instructor',
      sourceType: 'ical_url',
      feedUrl: feedUrl.trim(),
      lastSyncedAt: new Date().toISOString(),
      autoSync: true,
      syncIntervalHours: syncInterval,
      itemsCount: simulatedEvents.length,
      filterTypes: [
        ...(filterAssignments ? ['assignment'] : []),
        ...(filterQuizzes ? ['quiz'] : []),
        ...(filterExams ? ['exam'] : []),
        ...(filterOfficeHours ? ['office_hours'] : []),
      ],
      events: simulatedEvents,
    };

    onAddCalendar(newCalendar);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    onClose();
  };

  const handleSubmitFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadedEvents.length === 0) return;

    const course = courses.find((c) => c.id === courseId);
    const calId = 'cal_' + Math.random().toString(36).substring(2, 9);

    const newCalendar: ProfessorCalendar = {
      id: calId,
      courseId,
      name: name.trim() || uploadedFileName.replace('.ics', '') || 'Uploaded Syllabus Calendar',
      professor: professor.trim() || course?.professor || 'Course Instructor',
      sourceType: 'file',
      lastSyncedAt: new Date().toISOString(),
      autoSync: false,
      syncIntervalHours: 24,
      itemsCount: uploadedEvents.length,
      filterTypes: ['assignment', 'quiz', 'exam', 'lecture', 'office_hours'],
      events: uploadedEvents,
    };

    onAddCalendar(newCalendar);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
    onClose();
  };

  const handleSelectPreset = (preset: typeof PRESET_CALENDARS[0]) => {
    // Check if course already exists, else create new
    let course = courses.find((c) => c.code === preset.courseCode);
    let newCourseCreated: Course | undefined;

    if (!course) {
      newCourseCreated = {
        id: 'course_' + Math.random().toString(36).substring(2, 9),
        code: preset.courseCode,
        name: preset.name.split(':')[1]?.split('(')[0]?.trim() || preset.name,
        professor: preset.professor,
        professorEmail: `${preset.professor.toLowerCase().replace(/[^a-z]/g, '')}@berkeley.edu`,
        officeHours: 'Tue & Thu 2:00 PM - 3:30 PM',
        color: preset.color,
        accentBg: 'bg-sky-50 dark:bg-sky-950/40',
        accentText: 'text-sky-700 dark:text-sky-300',
        accentBorder: 'border-sky-200 dark:border-sky-800',
        credits: 4,
        currentGrade: 94.0,
      };
      course = newCourseCreated;
    }

    const calId = 'cal_' + Math.random().toString(36).substring(2, 9);
    const generatedEvents: CalendarEvent[] = preset.events.map((ev, idx) => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + ev.offsetDays);
      const [h, m] = ev.time.split(':').map(Number);
      targetDate.setHours(h, m, 0, 0);

      return {
        id: `ev_pre_${calId}_${idx}`,
        calendarId: calId,
        title: ev.title,
        startTime: targetDate.toISOString(),
        endTime: new Date(targetDate.getTime() + 3600000).toISOString(),
        allDay: false,
        location: 'Course Website / Gradescope',
        description: `Imported from ${preset.name} official syllabus.`,
        category: ev.category,
      };
    });

    const newCalendar: ProfessorCalendar = {
      id: calId,
      courseId: course.id,
      name: preset.name,
      professor: preset.professor,
      sourceType: 'preset',
      feedUrl: `https://courses.edu/${preset.courseCode.toLowerCase().replace(' ', '')}/feed.ics`,
      lastSyncedAt: new Date().toISOString(),
      autoSync: true,
      syncIntervalHours: 6,
      itemsCount: generatedEvents.length,
      filterTypes: ['assignment', 'quiz', 'exam', 'office_hours'],
      events: generatedEvents,
    };

    onAddCalendar(newCalendar, newCourseCreated);
    confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl my-8 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Connect Professor Academic Calendar
            </h3>
            <p className="text-xs text-slate-500">
              Sync deliverables automatically from university course feeds
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
          <button
            onClick={() => setActiveTab('url')}
            className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'url'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Feed URL</span>
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'file'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload .ics</span>
          </button>
          <button
            onClick={() => setActiveTab('preset')}
            className={`flex-1 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'preset'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>University Presets</span>
          </button>
        </div>

        {/* Tab 1: Subscribe by URL */}
        {activeTab === 'url' && (
          <form onSubmit={handleSubmitUrl} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Calendar Feed URL (iCal / WebCal / Google Cal) *
              </label>
              <input
                type="text"
                required
                placeholder="webcal://canvas.university.edu/feeds/calendar_...ics"
                value={feedUrl}
                onChange={(e) => setFeedUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Found under "Calendar Feed" in Canvas, Blackboard, or Google Calendar Public iCal URL.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Associate Course *
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} – {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Feed Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Official Course Calendar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                Sync Frequency
              </label>
              <select
                value={syncInterval}
                onChange={(e) => setSyncInterval(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value={1}>Every 1 hour (Active exam week)</option>
                <option value={6}>Every 6 hours (Recommended)</option>
                <option value={12}>Every 12 hours</option>
                <option value={24}>Once daily</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Event Filter: What to auto-import into your To-Do list
              </label>
              <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterAssignments}
                    onChange={(e) => setFilterAssignments(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span>Assignments &amp; P-Sets</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterQuizzes}
                    onChange={(e) => setFilterQuizzes(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span>Quizzes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterExams}
                    onChange={(e) => setFilterExams(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span>Midterms &amp; Finals</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filterOfficeHours}
                    onChange={(e) => setFilterOfficeHours(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-0"
                  />
                  <span>Office Hours</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Subscribe &amp; Sync
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Upload .ics file */}
        {activeTab === 'file' && (
          <form onSubmit={handleSubmitFile} className="space-y-4 text-xs">
            <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors">
              <UploadCloud className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {uploadedFileName || 'Drop your .ics syllabus file here'}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Exported from Canvas, Google Calendar, or downloaded from course website
              </p>
              <input
                type="file"
                accept=".ics,text/calendar"
                onChange={handleFileUpload}
                className="mt-3 block w-full text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
            </div>

            {uploadedEvents.length > 0 && (
              <div className="space-y-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <span>Found {uploadedEvents.length} syllabus events</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Parsed</span>
                  </span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1 text-[11px]">
                  {uploadedEvents.slice(0, 4).map((ev) => (
                    <div key={ev.id} className="text-slate-600 dark:text-slate-300 truncate">
                      • {ev.title} ({ev.category})
                    </div>
                  ))}
                  {uploadedEvents.length > 4 && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      +{uploadedEvents.length - 4} more events
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Associate Course
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} – {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Instructor Name
                </label>
                <input
                  type="text"
                  placeholder="Prof. Name"
                  value={professor}
                  onChange={(e) => setProfessor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadedEvents.length === 0}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm"
              >
                Import {uploadedEvents.length} Events
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: University Course Presets */}
        {activeTab === 'preset' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Select any pre-configured course to instantly sync its official syllabus calendar, quiz dates, and office hours:
            </p>

            <div className="space-y-2.5">
              {PRESET_CALENDARS.map((preset) => (
                <div
                  key={preset.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="font-bold font-mono text-xs"
                        style={{ color: preset.color }}
                      >
                        {preset.courseCode}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {preset.name.split(':')[1] || preset.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {preset.description}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      Instructor: {preset.professor} · {preset.sampleEventsCount} syllabus milestones
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectPreset(preset)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shrink-0 shadow-2xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Sync Feed</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
