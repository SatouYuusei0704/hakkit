import { AchievementRecord, Rarity } from "@/types/mission";

export type AchievementSummary = {
  total: number;
  byRarity: Record<Rarity, number>;
  streakDays: number;
};

// TODO(バックエンド担当B): streak計算やバッジ判定などをここに実装してください
export function summarizeAchievements(records: AchievementRecord[]): AchievementSummary {
  const byRarity: Record<Rarity, number> = { N: 0, R: 0, SR: 0 };
  for (const record of records) {
    byRarity[record.rarity] += 1;
  }

  return {
    total: records.length,
    byRarity,
    streakDays: calculateStreakDays(records),
  };
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
