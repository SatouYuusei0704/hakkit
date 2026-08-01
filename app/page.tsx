"use client";

import { useState } from "react";
import Link from "next/link";
import { Mission } from "@/types/mission";
import { saveAchievement } from "@/lib/storage";
import GachaButton from "@/components/GachaButton";
import MissionCard from "@/components/MissionCard";
import RarityEffect from "@/components/RarityEffect";
import HamburgerMenu from "@/components/HamburgerMenu";
import CompletionReminder from "@/components/CompletionReminder";
import styles from "./page.module.css";

export default function Home() {
  const [mission, setMission] = useState<Mission | null>(null);
  const [completed, setCompleted] = useState(false);

  function handleResult(newMission: Mission) {
    setMission(newMission);
    setCompleted(false);
  }

  function handleComplete() {
    if (!mission) return;
    saveAchievement({
      id: crypto.randomUUID(),
      missionId: mission.id,
      missionText: mission.text,
      rarity: mission.rarity,
      completedAt: new Date().toISOString(),
    });
    setCompleted(true);
  }

  return (
    <div className={styles.page}>
      <HamburgerMenu />
      <main className={styles.main}>
        <h1>マンネリ突破ガチャ</h1>
        <CompletionReminder missionId={mission?.id ?? null} completed={completed} />
        <RarityEffect rarity={mission?.rarity ?? null}>
          <MissionCard mission={mission} />
        </RarityEffect>
        <GachaButton onResult={handleResult} />
        {mission && (
          <button onClick={handleComplete} disabled={completed}>
            {completed ? "達成済み!" : "完了"}
          </button>
        )}
        <Link href="/achievements">実績を見る</Link>
      </main>
    </div>
  );
}