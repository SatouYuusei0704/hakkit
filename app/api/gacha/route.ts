import { NextResponse } from "next/server";
import { missions } from "@/data/missions";
import { GachaResult, Rarity } from "@/types/mission";

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

export async function POST() {
  const rarity = pickRarity();
  const candidates = missions.filter((m) => m.rarity === rarity);

  // 該当レアリティのミッションが無い場合は全体からフォールバック
  const pool = candidates.length > 0 ? candidates : missions;
  const mission = pool[Math.floor(Math.random() * pool.length)];

  const result: GachaResult = { mission };
  return NextResponse.json(result);
}
