import { TaskItem, Course } from '../types';

export function formatRelativeDueDate(dueDateStr: string): { label: string; isUrgent: boolean; isOverdue: boolean } {
  const now = new Date();
  const due = new Date(dueDateStr);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const absHours = Math.abs(diffHours);
    if (absHours < 24) {
      return { label: `Overdue by ${absHours}h`, isUrgent: true, isOverdue: true };
    }
    const absDays = Math.abs(diffDays);
    return { label: `Overdue by ${absDays}d`, isUrgent: true, isOverdue: true };
  }

  if (diffHours < 1) {
    const diffMins = Math.max(1, Math.round(diffMs / (1000 * 60)));
    return { label: `Due in ${diffMins}m`, isUrgent: true, isOverdue: false };
  }

  if (diffHours < 24) {
    return { label: `Due in ${diffHours}h`, isUrgent: true, isOverdue: false };
  }

  if (diffDays === 1) {
    const timeStr = due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return { label: `Tomorrow at ${timeStr}`, isUrgent: true, isOverdue: false };
  }

  if (diffDays <= 7) {
    const dayName = due.toLocaleDateString([], { weekday: 'short' });
    const timeStr = due.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return { label: `${dayName} at ${timeStr}`, isUrgent: diffDays <= 3, isOverdue: false };
  }

  const monthDay = due.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return { label: monthDay, isUrgent: false, isOverdue: false };
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m < 10 ? `0${m}` : m;
  return `${displayH}:${displayM} ${period}`;
}

export interface CrunchAlert {
  isCrunch: boolean;
  count: number;
  startDate: string;
  endDate: string;
  items: TaskItem[];
  highWeightTotal: number;
  advice: string;
}

export function detectHellWeek(tasks: TaskItem[]): CrunchAlert | null {
  const activeTasks = tasks.filter((t) => t.status !== 'graded' && t.status !== 'submitted');
  if (activeTasks.length < 2) return null;

  // Sort by dueDate
  const sorted = [...activeTasks].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Find any 72-hour sliding window with >= 3 tasks or >= 2 high weight items (weight >= 15%)
  for (let i = 0; i < sorted.length; i++) {
    const windowStart = new Date(sorted[i].dueDate).getTime();
    const windowEnd = windowStart + 72 * 60 * 60 * 1000;

    const cluster = sorted.filter((t) => {
      const time = new Date(t.dueDate).getTime();
      return time >= windowStart && time <= windowEnd;
    });

    const highWeightItems = cluster.filter((t) => t.weightPercentage >= 15 || t.type === 'midterm' || t.type === 'final');

    if (cluster.length >= 3 || highWeightItems.length >= 2) {
      const highWeightTotal = cluster.reduce((sum, t) => sum + (t.weightPercentage || 0), 0);
      const startStr = new Date(windowStart).toLocaleDateString([], { month: 'short', day: 'numeric' });
      const endStr = new Date(windowEnd).toLocaleDateString([], { month: 'short', day: 'numeric' });

      let advice = 'Heavy academic crunch ahead. We recommend breaking down studying into 90-minute blocks today.';
      if (highWeightItems.length >= 2) {
        advice = 'Exam clash warning: multiple high-stakes tests are scheduled within 72 hours. Prioritize review notes immediately.';
      }

      return {
        isCrunch: true,
        count: cluster.length,
        startDate: startStr,
        endDate: endStr,
        items: cluster,
        highWeightTotal,
        advice,
      };
    }
  }

  return null;
}

export function calculateAverageGrade(courses: Course[]): number {
  if (courses.length === 0) return 0;
  const total = courses.reduce((acc, c) => acc + (c.currentGrade || 0), 0);
  return Math.round((total / courses.length) * 10) / 10;
}
