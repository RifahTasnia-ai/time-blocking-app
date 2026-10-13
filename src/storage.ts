import { Entry, formatDateToYYYYMMDD, getNowMinutes } from './types';

const STORAGE_KEY = 'blocks_entries_v1';

export function getTodayDateString(): string {
  return formatDateToYYYYMMDD(new Date());
}

export function getYesterdayDateString(currentDateStr: string): string {
  const [y, m, d] = currentDateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return formatDateToYYYYMMDD(date);
}

export function getInitialSeedData(): Entry[] {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString(today);
  const now = Date.now();

  return [
    // Yesterday's sample entries
    {
      id: 'y-1',
      date: yesterday,
      startMin: 0,
      endMin: 420, // 00:00 - 07:00
      title: 'Sleeping',
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
    },
    {
      id: 'y-2',
      date: yesterday,
      startMin: 420,
      endMin: 510, // 07:00 - 08:30
      title: 'Morning Routine & Read',
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
    },
    {
      id: 'y-3',
      date: yesterday,
      startMin: 510,
      endMin: 720, // 08:30 - 12:00
      title: 'Deep Work',
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
    },
    {
      id: 'y-4',
      date: yesterday,
      startMin: 720,
      endMin: 1440, // 12:00 - 24:00 auto-closed
      title: '',
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
    },

    // Today's entries exactly matching the screenshots
    {
      id: 't-1',
      date: today,
      startMin: 0,
      endMin: 360, // 00:00 - 06:00
      title: 'Sleeping',
      createdAt: now - 36000000,
      updatedAt: now - 36000000,
    },
    {
      id: 't-2',
      date: today,
      startMin: 360,
      endMin: 443, // 06:00 - 07:23
      title: 'Studying',
      createdAt: now - 28000000,
      updatedAt: now - 28000000,
    },
    {
      id: 't-3',
      date: today,
      startMin: 443,
      endMin: 480, // 07:23 - 08:00
      title: 'Walking',
      createdAt: now - 22000000,
      updatedAt: now - 22000000,
    },
    {
      id: 't-4',
      date: today,
      startMin: 480,
      endMin: 530, // 08:00 - 08:50
      title: '', // Untitled
      createdAt: now - 18000000,
      updatedAt: now - 18000000,
    },
  ];
}

export function loadAllEntries(): Entry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = getInitialSeedData();
      saveAllEntries(seeded);
      return seeded;
    }
    const entries: Entry[] = JSON.parse(raw);
    return runDayAutoClose(entries);
  } catch {
    const seeded = getInitialSeedData();
    saveAllEntries(seeded);
    return seeded;
  }
}

export function saveAllEntries(entries: Entry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/**
 * Day auto-close rule:
 * If a past date has entries and the last entry ends before 1440,
 * the remainder is saved as an Untitled entry up to 1440 (23:59).
 */
export function runDayAutoClose(entries: Entry[]): Entry[] {
  const today = getTodayDateString();
  const dateGroups: { [date: string]: Entry[] } = {};

  for (const entry of entries) {
    if (!dateGroups[entry.date]) {
      dateGroups[entry.date] = [];
    }
    dateGroups[entry.date].push(entry);
  }

  let modified = false;
  const result: Entry[] = [];

  for (const date of Object.keys(dateGroups)) {
    const sorted = [...dateGroups[date]].sort((a, b) => a.startMin - b.startMin);
    if (date < today && sorted.length > 0) {
      const last = sorted[sorted.length - 1];
      if (last.endMin < 1440) {
        sorted.push({
          id: `autoclose-${date}-${Date.now()}`,
          date,
          startMin: last.endMin,
          endMin: 1440,
          title: '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        modified = true;
      }
    }
    result.push(...sorted);
  }

  if (modified) {
    saveAllEntries(result);
  }
  return result;
}

export interface AddEntryResult {
  updatedEntries: Entry[];
  trimmedCount: number;
  gapFilled: boolean;
  previousEntriesSnapshot: Entry[];
}

export function addEntry(
  allEntries: Entry[],
  targetDate: string,
  startMin: number,
  endMin: number,
  title: string
): AddEntryResult {
  const previousEntriesSnapshot = [...allEntries];
  const dayEntries = allEntries
    .filter((e) => e.date === targetDate)
    .sort((a, b) => a.startMin - b.startMin);
  const otherEntries = allEntries.filter((e) => e.date !== targetDate);

  let trimmedCount = 0;
  let gapFilled = false;
  const newDayEntries: Entry[] = [];

  if (dayEntries.length === 0) {
    // If no entries today, and startMin > 0, do we gap fill from 0?
    if (startMin > 0) {
      gapFilled = true;
      newDayEntries.push({
        id: `gap-${Date.now()}-0`,
        date: targetDate,
        startMin: 0,
        endMin: startMin,
        title: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  } else {
    const lastEntry = dayEntries[dayEntries.length - 1];

    if (startMin > lastEntry.endMin) {
      // Gap auto-fill: skipped interval is saved as an Untitled entry
      gapFilled = true;
      newDayEntries.push(...dayEntries);
      newDayEntries.push({
        id: `gap-${Date.now()}-${lastEntry.endMin}`,
        date: targetDate,
        startMin: lastEntry.endMin,
        endMin: startMin,
        title: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else if (startMin < lastEntry.endMin) {
      // Overlap auto-trim: trim or remove earlier entries ending after startMin
      for (const entry of dayEntries) {
        if (entry.endMin <= startMin) {
          // completely before
          newDayEntries.push(entry);
        } else if (entry.startMin < startMin && entry.endMin > startMin) {
          // partly overlaps, trim its endMin
          newDayEntries.push({
            ...entry,
            endMin: startMin,
            updatedAt: Date.now(),
          });
          trimmedCount++;
        } else {
          // entry completely after startMin, trimmed out
          trimmedCount++;
        }
      }
    } else {
      // Exactly matches lastEntry.endMin
      newDayEntries.push(...dayEntries);
    }
  }

  // Add the new entry
  newDayEntries.push({
    id: `entry-${Date.now()}`,
    date: targetDate,
    startMin,
    endMin,
    title: title.trim(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  newDayEntries.sort((a, b) => a.startMin - b.startMin);
  const finalEntries = [...otherEntries, ...newDayEntries];
  saveAllEntries(finalEntries);

  return {
    updatedEntries: finalEntries,
    trimmedCount,
    gapFilled,
    previousEntriesSnapshot,
  };
}

export function updateEntryEdges(
  allEntries: Entry[],
  targetEntry: Entry,
  newStartMin: number,
  newEndMin: number,
  newTitle: string
): Entry[] {
  const dayEntries = allEntries
    .filter((e) => e.date === targetEntry.date)
    .sort((a, b) => a.startMin - b.startMin);
  const otherEntries = allEntries.filter((e) => e.date !== targetEntry.date);

  const idx = dayEntries.findIndex((e) => e.id === targetEntry.id);
  if (idx === -1) return allEntries;

  // Clone day entries
  const updatedDayEntries = dayEntries.map((e) => ({ ...e }));
  const curr = updatedDayEntries[idx];

  curr.title = newTitle.trim();
  curr.startMin = Math.max(0, Math.min(newStartMin, newEndMin - 1));
  curr.endMin = Math.min(1440, Math.max(newEndMin, newStartMin + 1));
  curr.updatedAt = Date.now();

  // If touched previous neighbor, move its endMin to touch curr.startMin
  if (idx > 0) {
    const prev = updatedDayEntries[idx - 1];
    prev.endMin = curr.startMin;
    if (prev.startMin >= prev.endMin) {
      prev.startMin = Math.max(0, prev.endMin - 1);
    }
    prev.updatedAt = Date.now();
  }

  // If touched next neighbor, move its startMin to touch curr.endMin
  if (idx < updatedDayEntries.length - 1) {
    const next = updatedDayEntries[idx + 1];
    next.startMin = curr.endMin;
    if (next.endMin <= next.startMin) {
      next.endMin = Math.min(1440, next.startMin + 1);
    }
    next.updatedAt = Date.now();
  }

  const finalEntries = [...otherEntries, ...updatedDayEntries].sort(
    (a, b) => a.startMin - b.startMin
  );
  saveAllEntries(finalEntries);
  return finalEntries;
}

export function splitEntry(
  allEntries: Entry[],
  targetEntryId: string,
  splitMin: number
): Entry[] {
  const target = allEntries.find((e) => e.id === targetEntryId);
  if (!target) return allEntries;

  if (splitMin <= target.startMin || splitMin >= target.endMin) {
    return allEntries;
  }

  const firstPart: Entry = {
    ...target,
    id: `${target.id}-1`,
    endMin: splitMin,
    updatedAt: Date.now(),
  };

  const secondPart: Entry = {
    id: `split-${Date.now()}`,
    date: target.date,
    startMin: splitMin,
    endMin: target.endMin,
    title: '', // default to Untitled or empty
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const remaining = allEntries.filter((e) => e.id !== targetEntryId);
  const updated = [...remaining, firstPart, secondPart].sort(
    (a, b) => a.startMin - b.startMin
  );
  saveAllEntries(updated);
  return updated;
}

export function deleteEntry(allEntries: Entry[], targetEntryId: string): Entry[] {
  const updated = allEntries.filter((e) => e.id !== targetEntryId);
  saveAllEntries(updated);
  return updated;
}
