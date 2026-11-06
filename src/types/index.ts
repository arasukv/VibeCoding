export type TaskType = 'assignment' | 'quiz' | 'midterm' | 'final' | 'lab' | 'project' | 'reading';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'submitted' | 'graded';
export type SubmissionPlatform = 'Canvas' | 'Gradescope' | 'Blackboard' | 'Turnitin' | 'In-Person' | 'GitHub' | 'Moodle';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  courseId: string;
  type: TaskType;
  dueDate: string; // ISO string YYYY-MM-DDTHH:mm:ss
  priority: TaskPriority;
  weightPercentage: number; // e.g. 15 for 15% of course grade
  status: TaskStatus;
  score?: number;
  maxScore?: number;
  submissionPlatform: SubmissionPlatform;
  submissionUrl?: string;
  notes?: string;
  subtasks: Subtask[];
  estimatedMinutes: number;
  syncedFromCalendarId?: string;
  isSyllabusItem?: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface Course {
  id: string;
  code: string; // e.g. "CS 189"
  name: string; // e.g. "Intro to Machine Learning"
  professor: string; // e.g. "Prof. Anant Sahai"
  professorEmail: string;
  officeHours: string; // e.g. "Tue & Thu 3:00 - 4:30 PM (Soda 511)"
  color: string; // hex or Tailwind color token
  accentBg: string;
  accentText: string;
  accentBorder: string;
  credits: number;
  currentGrade: number; // e.g. 94.2
  syllabusUrl?: string;
  zoomUrl?: string;
}

export type ClassType = 'lecture' | 'lab' | 'discussion' | 'office_hours';

export interface ClassSession {
  id: string;
  courseId: string;
  dayOfWeek: 1 | 2 | 3 | 4 | 5; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri
  startTime: string; // "09:30"
  endTime: string; // "11:00"
  type: ClassType;
  location: string; // "Dwinelle 145"
  room?: string;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  startTime: string; // ISO string
  endTime: string; // ISO string
  allDay: boolean;
  location?: string;
  description?: string;
  category: 'assignment' | 'quiz' | 'exam' | 'office_hours' | 'lecture' | 'deadline';
  importedAsTaskId?: string;
}

export interface ProfessorCalendar {
  id: string;
  courseId: string;
  name: string; // e.g. "CS 189 Official Syllabus Feed"
  professor: string;
  sourceType: 'ical_url' | 'file' | 'preset';
  feedUrl?: string;
  lastSyncedAt: string;
  autoSync: boolean;
  syncIntervalHours: number;
  itemsCount: number;
  filterTypes: string[];
  events: CalendarEvent[];
}

export type ActiveTab = 'dashboard' | 'tasks' | 'schedule' | 'calendars' | 'matrix';
