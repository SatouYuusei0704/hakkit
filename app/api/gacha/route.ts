import { NextResponse } from "next/server";
import { missions as defaultMissions } from "@/data/missions";
import { GachaResult, Mission, Rarity } from "@/types/mission";
import { isMission } from "@/lib/storage";

const RARITY_WEIGHTS: Record<Rarity, number> = {
  N: 70,
  R: 22,
  SR: 8,
};

function pickRarity(): Rarity {
  const roll = Math.random() * 100;
  let cumulative = 0;

  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS) as [
    Rarity,
    number
  ][]) {
    cumulative += weight;
    if (roll < cumulative) {
      return rarity;
    }
  }

  return "N";
}

function pickMissionByRarity(rarity: Rarity, pool: Mission[]): Mission {
  const candidates = pool.filter((mission) => mission.rarity === rarity);
  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  return pool[Math.floor(Math.random() * pool.length)];
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
  const mission = pickMissionByRarity(rarity, missions);

  const result: GachaResult = {
    rarity,
    mission,
    timestamp: Date.now(),
  };

  return NextResponse.json(result);
}
