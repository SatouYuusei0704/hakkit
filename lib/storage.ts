import { AchievementRecord } from "@/types/mission";

const STORAGE_KEY = "hakkit:achievements";

// TODO(バックエンド担当B): 必要に応じてエラーハンドリングやスキーマ検証を追加してください

export function loadAchievements(): AchievementRecord[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as AchievementRecord[];
  } catch {
    return [];
  }
}

export function saveAchievement(record: AchievementRecord): AchievementRecord[] {
  const current = loadAchievements();
  const updated = [...current, record];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearAchievements(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}
