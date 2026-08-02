import { AchievementRecord, Mission, Rarity } from "@/types/mission";
import { missions as defaultMissions } from "@/data/missions";

const STORAGE_KEY = "hakkit:achievements";
const MISSIONS_STORAGE_KEY = "hakkit:custom-missions";
const RARITIES: Rarity[] = ["N", "R", "SR"];

export function isMission(value: unknown): value is Mission {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.id === "string" &&
    typeof m.text === "string" &&
    typeof m.rarity === "string" &&
    RARITIES.includes(m.rarity as Rarity)
  );
}

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

export function loadMissions(): Mission[] {
  if (typeof window === "undefined") return defaultMissions;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(MISSIONS_STORAGE_KEY);
  } catch {
    return defaultMissions;
  }
  if (!raw) return defaultMissions;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultMissions;
    const valid = parsed.filter(isMission);
    // 保存されているカスタムミッションが全て不正な場合はデフォルトにフォールバックする
    return valid.length > 0 ? valid : defaultMissions;
  } catch {
    return defaultMissions;
  }
}

export function saveMissions(missions: Mission[]): Mission[] {
  if (typeof window === "undefined") return missions;

  try {
    window.localStorage.setItem(MISSIONS_STORAGE_KEY, JSON.stringify(missions));
  } catch {
    // 容量超過等で保存に失敗しても、呼び出し元にはメモリ上の結果を返す
  }
  return missions;
}

const BGM_TRACK_STORAGE_KEY = "hakkit:bgm-track";
const BGM_VOLUME_STORAGE_KEY = "hakkit:bgm-volume";

export function loadBgmTrackId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(BGM_TRACK_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveBgmTrackId(trackId: string): string {
  if (typeof window === "undefined") return trackId;

  try {
    window.localStorage.setItem(BGM_TRACK_STORAGE_KEY, trackId);
  } catch {
    // no-op
  }
  return trackId;
}

export function loadBgmVolume(): number | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(BGM_VOLUME_STORAGE_KEY);
    if (raw === null) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : null;
  } catch {
    return null;
  }
}

export function saveBgmVolume(volume: number): number {
  const normalized = Math.min(1, Math.max(0, volume));
  if (typeof window === "undefined") return normalized;

  try {
    window.localStorage.setItem(BGM_VOLUME_STORAGE_KEY, String(normalized));
  } catch {
    // no-op
  }
  return normalized;
}

export function resetMissions(): Mission[] {
  if (typeof window === "undefined") return defaultMissions;

  try {
    window.localStorage.removeItem(MISSIONS_STORAGE_KEY);
  } catch {
    // no-op
  }
  return defaultMissions;
}
