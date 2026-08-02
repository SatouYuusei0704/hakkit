import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import {
  AchievementRecord,
  AiDraft,
  Mission,
  Rarity,
  StoredAchievementRecord,
  StoredMission,
} from "@/types/mission";
import { missions as defaultMissions } from "@/data/missions";

const DB_NAME = "hakkitDB";
const DB_VERSION = 1;
const LOCAL_USER_ID_KEY = "localUserId";
const RARITIES: Rarity[] = ["N", "R", "SR"];

interface MetaRecord {
  key: string;
  value: string;
}

// IndexedDBのgetAll()はkeyPath(id)順で返り挿入順を保らないため、
// 表示順を復元できるよう保存時の並び位置を明示的に持たせる
type MissionRecord = StoredMission & { order: number };

interface HakkitDB extends DBSchema {
  meta: {
    key: string;
    value: MetaRecord;
  };
  missions: {
    key: string;
    value: MissionRecord;
    indexes: { userId: string; rarity: string };
  };
  achievements: {
    key: string;
    value: StoredAchievementRecord;
    indexes: { userId: string; completedAt: string; missionId: string };
  };
  aiDrafts: {
    key: string;
    value: AiDraft;
    indexes: { userId: string; createdAt: string };
  };
}

const DB_OPEN_TIMEOUT_MS = 3000;

let dbPromise: Promise<IDBPDatabase<HakkitDB>> | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function getDB(): Promise<IDBPDatabase<HakkitDB>> {
  if (!dbPromise) {
    dbPromise = withTimeout(
      openDB<HakkitDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("meta")) {
            db.createObjectStore("meta", { keyPath: "key" });
          }
          if (!db.objectStoreNames.contains("missions")) {
            const store = db.createObjectStore("missions", { keyPath: "id" });
            store.createIndex("userId", "userId");
            store.createIndex("rarity", "rarity");
          }
          if (!db.objectStoreNames.contains("achievements")) {
            const store = db.createObjectStore("achievements", { keyPath: "id" });
            store.createIndex("userId", "userId");
            store.createIndex("completedAt", "completedAt");
            store.createIndex("missionId", "missionId");
          }
          if (!db.objectStoreNames.contains("aiDrafts")) {
            const store = db.createObjectStore("aiDrafts", { keyPath: "id" });
            store.createIndex("userId", "userId");
            store.createIndex("createdAt", "createdAt");
          }
        },
      }),
      DB_OPEN_TIMEOUT_MS
    ).catch((err) => {
      // 接続がスタックした場合、次回呼び出し時に再度openDBを試せるようにする
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

// 将来ログイン機能を追加する際に、このIDをサーバー側アカウントへ紐付ける移行パスとして温存する
export async function getLocalUserId(): Promise<string> {
  const db = await getDB();
  const existing = await db.get("meta", LOCAL_USER_ID_KEY);
  if (existing) return existing.value;

  const id = crypto.randomUUID();
  await db.put("meta", { key: LOCAL_USER_ID_KEY, value: id });
  return id;
}

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

export async function loadMissions(): Promise<Mission[]> {
  if (typeof indexedDB === "undefined") return defaultMissions;

  try {
    const db = await getDB();
    const stored = await db.getAll("missions");
    const sorted = [...stored].sort((a, b) => a.order - b.order);
    const valid = sorted.filter(isMission);
    // 保存されているカスタムミッションが全て不正な場合はデフォルトにフォールバックする
    return valid.length > 0 ? valid : defaultMissions;
  } catch {
    return defaultMissions;
  }
}

export async function saveMissions(missions: Mission[]): Promise<Mission[]> {
  if (typeof indexedDB === "undefined") return missions;

  try {
    const db = await getDB();
    const userId = await getLocalUserId();
    const existing = await db.getAll("missions");
    const existingById = new Map(existing.map((m) => [m.id, m]));
    const now = new Date().toISOString();

    const tx = db.transaction("missions", "readwrite");
    await tx.store.clear();
    await Promise.all(
      missions.map((mission, order) => {
        const prev = existingById.get(mission.id);
        const stored: MissionRecord = {
          ...mission,
          userId,
          source: prev?.source ?? "manual",
          createdAt: prev?.createdAt ?? now,
          order,
        };
        return tx.store.put(stored);
      })
    );
    await tx.done;
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

export async function resetMissions(): Promise<Mission[]> {
  if (typeof indexedDB === "undefined") return defaultMissions;

  try {
    const db = await getDB();
    await db.clear("missions");
  } catch {
    // no-op
  }
  return defaultMissions;
}

export async function loadAchievements(): Promise<AchievementRecord[]> {
  if (typeof indexedDB === "undefined") return [];

  try {
    const db = await getDB();
    const stored = await db.getAll("achievements");
    // 手動編集や旧スキーマ由来の不正なレコードは除外する
    return stored.filter(isAchievementRecord);
  } catch {
    return [];
  }
}

export async function saveAchievement(record: AchievementRecord): Promise<AchievementRecord[]> {
  if (typeof indexedDB === "undefined") return [...(await loadAchievements()), record];

  try {
    const db = await getDB();
    const userId = await getLocalUserId();
    const stored: StoredAchievementRecord = { ...record, userId };
    await db.put("achievements", stored);
  } catch {
    // 容量超過等で保存に失敗しても、呼び出し元にはメモリ上の結果を返す
  }
  return loadAchievements();
}

export async function deleteAchievement(id: string): Promise<AchievementRecord[]> {
  if (typeof indexedDB !== "undefined") {
    try {
      const db = await getDB();
      await db.delete("achievements", id);
    } catch {
      // 容量超過等で保存に失敗しても、呼び出し元にはメモリ上の結果を返す
    }
  }
  return (await loadAchievements()).filter((record) => record.id !== id);
}

export async function updateAchievement(
  id: string,
  updates: Partial<Omit<AchievementRecord, "id">>
): Promise<AchievementRecord[]> {
  if (typeof indexedDB !== "undefined") {
    try {
      const db = await getDB();
      const existing = await db.get("achievements", id);
      if (existing) {
        await db.put("achievements", { ...existing, ...updates });
      }
    } catch {
      // 容量超過等で保存に失敗しても、呼び出し元にはメモリ上の結果を返す
    }
  }
  return loadAchievements();
}

export async function clearAchievements(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await getDB();
    await db.clear("achievements");
  } catch {
    // no-op
  }
}

export async function saveAiDraft(draft: AiDraft): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  try {
    const db = await getDB();
    await db.put("aiDrafts", draft);
  } catch {
    // no-op
  }
}

export async function loadAiDrafts(): Promise<AiDraft[]> {
  if (typeof indexedDB === "undefined") return [];
  try {
    const db = await getDB();
    return await db.getAll("aiDrafts");
  } catch {
    return [];
  }
}
