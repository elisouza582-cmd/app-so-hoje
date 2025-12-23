export type Priority = {
  id: string;
  text: string;
  done: boolean;
  doneAt?: number;
};

export type DailyEntry = {
  date: string;
  priorities: Priority[];
  createdAt: number;
  updatedAt: number;
};

const STORAGE_KEY = "so-hoje-daily-entry";

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const createEmptyEntry = (): DailyEntry => {
  const now = Date.now();
  return {
    date: getTodayDateString(),
    priorities: [],
    createdAt: now,
    updatedAt: now
  };
};

const safeParseEntry = (raw: string | null): DailyEntry | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as DailyEntry;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

export const getTodayEntry = (): DailyEntry => {
  if (typeof window === "undefined") {
    return createEmptyEntry();
  }

  const stored = safeParseEntry(window.localStorage.getItem(STORAGE_KEY));
  const today = getTodayDateString();

  if (!stored || stored.date !== today) {
    const fresh = createEmptyEntry();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  }

  return stored;
};

export const saveTodayEntry = (entry: DailyEntry): void => {
  if (typeof window === "undefined") return;

  const today = getTodayDateString();
  const now = Date.now();
  const normalized: DailyEntry = {
    ...entry,
    date: today,
    priorities: entry.priorities.slice(0, 3),
    createdAt: entry.createdAt ?? now,
    updatedAt: now
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
};

export const clearToday = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
};
