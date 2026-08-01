import { AchievementRecord, Rarity } from "@/types/mission";

const STORAGE_KEY = "hakkit:achievements";
const RARITIES: Rarity[] = ["N", "R", "SR", "SSR"];

function isAchievementRecord(value: unknown): value is AchievementRecord {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.missionId === "string" &&
    typeof r.missionText === "string" &&
    typeof r.rarity === "string" &&
    RARITIES.includes(r.rarity as Rarity) &&
    typeof r.completedAt === "string" &&
    !Number.isNaN(Date.parse(r.completedAt))
  );
}

export function loadAchievements(): AchievementRecord[] {
  if (typeof window === "undefined") return [];

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // プライベートブラウジング等でlocalStorageにアクセスできない場合
    return [];
  }
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // 手動編集や旧スキーマ由来の不正なレコードは除外する
    return parsed.filter(isAchievementRecord);
  } catch {
    return [];
  }
}

export function saveAchievement(record: AchievementRecord): AchievementRecord[] {
  const updated = [...loadAchievements(), record];
  if (typeof window === "undefined") return updated;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // 容量超過等で保存に失敗しても、呼び出し元にはメモリ上の結果を返す
  }
  return updated;
}

export function deleteAchievement(id: string): AchievementRecord[] {
  const updated = loadAchievements().filter((record) => record.id !== id);
  if (typeof window === "undefined") return updated;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // 容量超過等で保存に失敗しても、呼び出し元にはメモリ上の結果を返す
  }
  return updated;
}

export function clearAchievements(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
