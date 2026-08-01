import { AchievementRecord, Mission } from "@/types/mission";

export type CollectionEntry = Mission & {
  unlocked: boolean;
  timesCompleted: number;
};

export function buildCollection(
  missions: Mission[],
  records: AchievementRecord[]
): CollectionEntry[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    counts.set(record.missionId, (counts.get(record.missionId) ?? 0) + 1);
  }

  return missions.map((mission) => ({
    ...mission,
    unlocked: counts.has(mission.id),
    timesCompleted: counts.get(mission.id) ?? 0,
  }));
}
