import AsyncStorage from '@react-native-async-storage/async-storage';

const QURAN_PROGRESS_KEY = '@muslim_ummah_quran_progress';
const QURAN_DAILY_ACTIVITY_KEY = '@muslim_ummah_quran_daily_activity';
const QURAN_DAILY_GOAL_KEY = '@muslim_ummah_quran_daily_goal';

export type QuranReadingProgress = {
  surahNumber: number;
  ayahNumber: number;
};

export type QuranDailyActivity = Record<string, string[]>;

export type QuranInsights = {
  todayCount: number;
  dailyGoal: number;
  currentStreak: number;
  longestStreak: number;
  goalCompletedToday: boolean;
};

export type QuranReadingHistoryDay = {
  date: string;
  count: number;
  goal: number;
  goalCompleted: boolean;
};

export type QuranReadingSummary = {
  last7Days: number;
  last30Days: number;
  last90Days: number;
  activeDaysLast30: number;
  totalUniqueAyahsLast90: number;
  averagePerActiveDayLast30: number;
};

export async function saveQuranProgress(
  surahNumber: number,
  ayahNumber: number
): Promise<void> {
  const progress: QuranReadingProgress = {
    surahNumber,
    ayahNumber,
  };

  await AsyncStorage.setItem(
    QURAN_PROGRESS_KEY,
    JSON.stringify(progress)
  );

  await recordQuranAyahActivity(
    surahNumber,
    ayahNumber
  );
}

export async function getQuranProgress(): Promise<QuranReadingProgress | null> {
  const storedProgress = await AsyncStorage.getItem(QURAN_PROGRESS_KEY);

  if (!storedProgress) {
    return null;
  }

  try {
    const parsed = JSON.parse(storedProgress);

    if (
      typeof parsed?.surahNumber !== 'number' ||
      typeof parsed?.ayahNumber !== 'number'
    ) {
      return null;
    }

    return {
      surahNumber: parsed.surahNumber,
      ayahNumber: parsed.ayahNumber,
    };
  } catch {
    return null;
  }
}

export async function clearQuranProgress(): Promise<void> {
  await AsyncStorage.removeItem(QURAN_PROGRESS_KEY);
}

function getTodayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return year + '-' + month + '-' + day;
}

function getAyahKey(
  surahNumber: number,
  ayahNumber: number
): string {
  return surahNumber + ':' + ayahNumber;
}

async function getDailyActivity(): Promise<QuranDailyActivity> {
  try {
    const raw = await AsyncStorage.getItem(
      QURAN_DAILY_ACTIVITY_KEY
    );

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as QuranDailyActivity;

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

async function saveDailyActivity(
  activity: QuranDailyActivity
): Promise<void> {
  await AsyncStorage.setItem(
    QURAN_DAILY_ACTIVITY_KEY,
    JSON.stringify(activity)
  );
}

async function recordQuranAyahActivity(
  surahNumber: number,
  ayahNumber: number
): Promise<void> {
  const activity = await getDailyActivity();
  const today = getTodayKey();
  const ayahKey = getAyahKey(
    surahNumber,
    ayahNumber
  );

  const todayItems = Array.isArray(activity[today])
    ? activity[today]
    : [];

  if (!todayItems.includes(ayahKey)) {
    activity[today] = [
      ...todayItems,
      ayahKey,
    ];
  }

  const keys = Object.keys(activity)
    .sort()
    .slice(-90);

  const trimmed: QuranDailyActivity = {};

  for (const key of keys) {
    trimmed[key] = activity[key];
  }

  await saveDailyActivity(trimmed);
}

export async function getQuranDailyGoal(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(
      QURAN_DAILY_GOAL_KEY
    );

    const value = Number(raw);

    if (Number.isFinite(value)) {
      return Math.min(100, Math.max(1, Math.round(value)));
    }
  } catch {
    // Use the default below.
  }

  return 10;
}

export async function setQuranDailyGoal(
  goal: number
): Promise<void> {
  const safeGoal = Math.min(
    100,
    Math.max(1, Math.round(goal))
  );

  await AsyncStorage.setItem(
    QURAN_DAILY_GOAL_KEY,
    String(safeGoal)
  );
}

function getPreviousDateKey(
  dateKey: string
): string {
  const date = new Date(
    dateKey + 'T12:00:00'
  );

  date.setDate(date.getDate() - 1);

  return getTodayKey(date);
}

function calculateStreak(
  activity: QuranDailyActivity,
  todayKey: string
): number {
  let streak = 0;
  let key = todayKey;

  while (
    Array.isArray(activity[key]) &&
    activity[key].length > 0
  ) {
    streak += 1;
    key = getPreviousDateKey(key);
  }

  return streak;
}

function calculateLongestStreak(
  activity: QuranDailyActivity
): number {
  const activeDays = Object.keys(activity)
    .filter(
      (key) =>
        Array.isArray(activity[key]) &&
        activity[key].length > 0
    )
    .sort();

  let longest = 0;
  let current = 0;
  let previous: string | null = null;

  for (const key of activeDays) {
    if (
      previous &&
      getPreviousDateKey(key) === previous
    ) {
      current += 1;
    } else {
      current = 1;
    }

    longest = Math.max(longest, current);
    previous = key;
  }

  return longest;
}

export async function getQuranInsights(): Promise<QuranInsights> {
  const activity = await getDailyActivity();
  const dailyGoal = await getQuranDailyGoal();
  const todayKey = getTodayKey();
  const todayCount = Array.isArray(activity[todayKey])
    ? activity[todayKey].length
    : 0;

  return {
    todayCount,
    dailyGoal,
    currentStreak: calculateStreak(
      activity,
      todayKey
    ),
    longestStreak: calculateLongestStreak(
      activity
    ),
    goalCompletedToday:
      todayCount >= dailyGoal,
  };
}


export async function getQuranReadingHistory(
  days = 30
): Promise<QuranReadingHistoryDay[]> {
  const safeDays = Math.min(90, Math.max(1, Math.round(days)));
  const activity = await getDailyActivity();
  const goal = await getQuranDailyGoal();
  const result: QuranReadingHistoryDay[] = [];

  for (let offset = safeDays - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - offset);

    const dateKey = getTodayKey(date);
    const count = Array.isArray(activity[dateKey])
      ? activity[dateKey].length
      : 0;

    result.push({
      date: dateKey,
      count,
      goal,
      goalCompleted: count >= goal,
    });
  }

  return result;
}

export async function getQuranReadingSummary(): Promise<QuranReadingSummary> {
  const activity = await getDailyActivity();
  const keys = Object.keys(activity)
    .filter(
      (key) =>
        Array.isArray(activity[key]) &&
        activity[key].length > 0
    )
    .sort();

  const countSince = (days: number): number => {
    const cutoff = new Date();
    cutoff.setHours(12, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (days - 1));
    const cutoffKey = getTodayKey(cutoff);

    return keys
      .filter((key) => key >= cutoffKey)
      .reduce(
        (total, key) =>
          total + activity[key].length,
        0
      );
  };

  const activeDaysLast30 = keys.filter((key) => {
    const cutoff = new Date();
    cutoff.setHours(12, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - 29);
    return key >= getTodayKey(cutoff);
  }).length;

  const totalUniqueAyahsLast90 = keys.reduce(
    (total, key) => total + activity[key].length,
    0
  );

  return {
    last7Days: countSince(7),
    last30Days: countSince(30),
    last90Days: countSince(90),
    activeDaysLast30,
    totalUniqueAyahsLast90,
    averagePerActiveDayLast30:
      activeDaysLast30 > 0
        ? Math.round(
            (countSince(30) / activeDaysLast30) * 10
          ) / 10
        : 0,
  };
}
