import { AchievementRecord, Rarity } from "@/types/mission";

const RARITIES: Rarity[] = ["N", "R", "SR", "SSR"];

export type Badge = {
  id: string;
  label: string;
  description: string;
};

export type AchievementSummary = {
  total: number;
  byRarity: Record<Rarity, number>;
  streakDays: number;
  badges: Badge[];
};

type BadgeStats = Omit<AchievementSummary, "badges">;

// TODO(フロント担当): AchievementList側でこのbadgesを見た目付きで表示してください
const BADGE_DEFINITIONS: (Badge & { isEarned: (stats: BadgeStats) => boolean })[] = [
  {
    id: "first-clear",
    label: "はじめの一歩",
    description: "はじめてミッションを達成した",
    isEarned: (s) => s.total >= 1,
  },
  {
    id: "clear-5",
    label: "駆け出し",
    description: "ミッションを5回達成した",
    isEarned: (s) => s.total >= 5,
  },
  {
    id: "clear-10",
    label: "常連",
    description: "ミッションを10回達成した",
    isEarned: (s) => s.total >= 10,
  },
  {
    id: "clear-30",
    label: "マンネリ突破の達人",
    description: "ミッションを30回達成した",
    isEarned: (s) => s.total >= 30,
  },
  {
    id: "ssr-hunter",
    label: "SSRハンター",
    description: "SSRミッションを達成した",
    isEarned: (s) => s.byRarity.SSR >= 1,
  },
  {
    id: "sr-collector",
    label: "SRコレクター",
    description: "SRミッションを5回達成した",
    isEarned: (s) => s.byRarity.SR >= 5,
  },
  {
    id: "streak-3",
    label: "3日坊主卒業",
    description: "3日連続でミッションを達成した",
    isEarned: (s) => s.streakDays >= 3,
  },
  {
    id: "streak-7",
    label: "週間チャレンジャー",
    description: "7日連続でミッションを達成した",
    isEarned: (s) => s.streakDays >= 7,
  },
  {
    id: "all-rounder",
    label: "オールラウンダー",
    description: "N/R/SR/SSRすべてのレアリティを達成した",
    isEarned: (s) => RARITIES.every((r) => s.byRarity[r] >= 1),
  },
];

export function summarizeAchievements(records: AchievementRecord[]): AchievementSummary {
  const byRarity: Record<Rarity, number> = { N: 0, R: 0, SR: 0, SSR: 0 };
  for (const record of records) {
    byRarity[record.rarity] += 1;
  }

  const stats: BadgeStats = {
    total: records.length,
    byRarity,
    streakDays: calculateStreakDays(records),
  };

  const badges = BADGE_DEFINITIONS.filter((badge) => badge.isEarned(stats)).map(
    ({ id, label, description }) => ({ id, label, description })
  );

  return { ...stats, badges };
}

function calculateStreakDays(records: AchievementRecord[]): number {
  if (records.length === 0) return 0;

  const uniqueDays = Array.from(
    new Set(records.map((r) => r.completedAt.slice(0, 10)))
  ).sort()
    .reverse();

  let streak = 0;
  const cursor = new Date();

  for (const day of uniqueDays) {
    const expected = cursor.toISOString().slice(0, 10);
    if (day !== expected) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
