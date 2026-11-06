import { CalendarEvent } from '../types';

/**
 * Parses raw iCalendar (.ics) text into structured CalendarEvent objects.
 * Supports line unfolding, standard UTC & local time, and smart academic categorization.
 */
export function parseICS(icsContent: string, calendarId: string): CalendarEvent[] {
  // 1. Unfold lines (RFC 5545: lines beginning with whitespace are unfolded)
  const unfolded = icsContent.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const lines = unfolded.split(/\r\n|\n|\r/);

  const events: CalendarEvent[] = [];
  let inEvent = false;
  let currentEvent: Partial<CalendarEvent> = {};
  let currentKey = '';
  let currentValue = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {
        calendarId,
        id: 'event_' + Math.random().toString(36).substring(2, 9),
        allDay: false,
      };
      continue;
    }

    if (line === 'END:VEVENT') {
      inEvent = false;
      if (currentEvent.title && currentEvent.startTime) {
        // Default endTime if not provided
        if (!currentEvent.endTime) {
          const start = new Date(currentEvent.startTime);
          currentEvent.endTime = new Date(start.getTime() + 60 * 60 * 1000).toISOString();
        }

        // Categorize event
        currentEvent.category = categorizeEventTitle(
          currentEvent.title,
          currentEvent.description || ''
        );

        events.push(currentEvent as CalendarEvent);
      }
      currentEvent = {};
      continue;
    }

    if (!inEvent) continue;

    // Split by first colon (key:value)
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    currentKey = line.substring(0, colonIdx);
    currentValue = line.substring(colonIdx + 1);

    // Normalize keys (e.g., DTSTART;VALUE=DATE:20261110 -> DTSTART)
    const baseKey = currentKey.split(';')[0].toUpperCase();

    switch (baseKey) {
      case 'UID':
        currentEvent.id = currentValue || currentEvent.id;
        break;

      case 'SUMMARY':
        currentEvent.title = unescapeICS(currentValue);
        break;

      case 'DESCRIPTION':
        currentEvent.description = unescapeICS(currentValue);
        break;

      case 'LOCATION':
        currentEvent.location = unescapeICS(currentValue);
        break;

      case 'DTSTART':
        currentEvent.startTime = parseICSDate(currentValue, currentKey);
        if (currentKey.includes('VALUE=DATE') || currentValue.length === 8) {
          currentEvent.allDay = true;
        }
        break;

      case 'DTEND':
        currentEvent.endTime = parseICSDate(currentValue, currentKey);
        break;
    }
  }

  return events;
}

function parseICSDate(dateStr: string, keyParam: string): string {
  // Handle formats:
  // 1) 20261110T170000Z (UTC)
  // 2) 20261110T170000 (Local / floating)
  // 3) 20261110 (All day date)
  const cleaned = dateStr.replace(/[^0-9TZ]/g, '');

  if (cleaned.length === 8) {
    // YYYYMMDD
    const y = parseInt(cleaned.substring(0, 4), 10);
    const m = parseInt(cleaned.substring(4, 6), 10) - 1;
    const d = parseInt(cleaned.substring(6, 8), 10);
    return new Date(y, m, d, 23, 59, 0).toISOString();
  }

  if (cleaned.includes('T')) {
    const [datePart, timePart] = cleaned.split('T');
    const y = parseInt(datePart.substring(0, 4), 10);
    const m = parseInt(datePart.substring(4, 6), 10) - 1;
    const d = parseInt(datePart.substring(6, 8), 10);

    const hh = parseInt(timePart.substring(0, 2), 10) || 0;
    const mm = parseInt(timePart.substring(2, 4), 10) || 0;
    const ss = parseInt(timePart.substring(4, 6), 10) || 0;

    if (timePart.endsWith('Z')) {
      return new Date(Date.UTC(y, m, d, hh, mm, ss)).toISOString();
    }
    return new Date(y, m, d, hh, mm, ss).toISOString();
  }

  // Fallback to Date parser
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function unescapeICS(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\N/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

export function categorizeEventTitle(
  title: string,
  desc: string = ''
): 'assignment' | 'quiz' | 'exam' | 'office_hours' | 'lecture' | 'deadline' {
  const combined = (title + ' ' + desc).toLowerCase();

  if (/\b(final|midterm|exam)\b/i.test(combined)) {
    return 'exam';
  }
  if (/\b(quiz|test|check-in|assessment)\b/i.test(combined)) {
    return 'quiz';
  }
  if (/\b(office hours?|oh|consultation|advising)\b/i.test(combined)) {
    return 'office_hours';
  }
  if (/\b(homework|hw|pset|problem set|assignment|deliverable|project|paper|essay|milestone)\b/i.test(combined)) {
    return 'assignment';
  }
  if (/\b(lecture|class|discussion|seminar|recitation|colloquium)\b/i.test(combined)) {
    return 'lecture';
  }
  return 'deadline';
}

/**
 * Generates an RFC 5545 .ics calendar string for exporting schedule & tasks
 */
export function exportToICS(calendarName: string, events: { title: string; description?: string; startTime: string; endTime: string; location?: string }[]): string {
  const formatICSDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CampusPulse//Student Academic Planner//EN',
    `X-WR-CALNAME:${calendarName}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const ev of events) {
    ics.push('BEGIN:VEVENT');
    ics.push(`UID:campuspulse-${Math.random().toString(36).substring(2, 9)}@campuspulse.edu`);
    ics.push(`DTSTAMP:${formatICSDate(new Date().toISOString())}`);
    ics.push(`DTSTART:${formatICSDate(ev.startTime)}`);
    ics.push(`DTEND:${formatICSDate(ev.endTime)}`);
    ics.push(`SUMMARY:${ev.title.replace(/\n/g, ' ')}`);
    if (ev.description) ics.push(`DESCRIPTION:${ev.description.replace(/\n/g, '\\n')}`);
    if (ev.location) ics.push(`LOCATION:${ev.location}`);
    ics.push('END:VEVENT');
  }

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}
