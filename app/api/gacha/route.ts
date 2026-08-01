import { NextResponse } from "next/server";
import { missions as defaultMissions } from "@/data/missions";
import { GachaResult, Rarity } from "@/types/mission";
import { isMission } from "@/lib/storage";

// TODO(バックエンド担当A): 排出率を調整してください（合計が100になるようにする）
const RARITY_WEIGHTS: Record<Rarity, number> = {
  N: 70,
  R: 20,
  SR: 8,
  SSR: 2,
};

function pickRarity(): Rarity {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS) as [Rarity, number][]) {
    cumulative += weight;
    if (roll <= cumulative) {
      return rarity;
    }
  }
  return "N";
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const requestedMissions =
    body !== null && typeof body === "object" && Array.isArray((body as { missions?: unknown }).missions)
      ? (body as { missions: unknown[] }).missions.filter(isMission)
      : [];

  // クライアントから有効なカスタムミッションが送られてきた場合はそちらを使う
  const missions = requestedMissions.length > 0 ? requestedMissions : defaultMissions;

  const rarity = pickRarity();
  const candidates = missions.filter((m) => m.rarity === rarity);

  // 該当レアリティのミッションが無い場合は全体からフォールバック
  const pool = candidates.length > 0 ? candidates : missions;
  const mission = pool[Math.floor(Math.random() * pool.length)];

  const result: GachaResult = { mission };
  return NextResponse.json(result);
}
