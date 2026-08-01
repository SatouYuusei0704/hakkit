import { NextResponse } from "next/server";
import { missions } from "@/data/missions";
import { GachaResult, Rarity } from "@/types/mission";

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

function pickMissionByRarity(rarity: Rarity) {
  const candidates = missions.filter((mission) => mission.rarity === rarity);
  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }
  return missions[Math.floor(Math.random() * missions.length)];
}

export async function POST() {
  const rarity = pickRarity();
  const mission = pickMissionByRarity(rarity);

  const result: GachaResult = {
    rarity,
    mission,
    timestamp: Date.now(),
  };

  return NextResponse.json(result);
}
