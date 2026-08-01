"use client";

import { useState } from "react";
import Link from "next/link";
import { Mission } from "@/types/mission";
import { saveAchievement } from "@/lib/storage";
import GachaButton from "@/components/GachaButton";
import MissionCard from "@/components/MissionCard";
import HamburgerMenu from "@/components/HamburgerMenu";
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
    setMission(null);
    setCompleted(false);
  }

  return (
    <div className={styles.page}>
      <HamburgerMenu />
      <main className={styles.main}>
        <h1>マンネリ突破ガチャ</h1>
        {!mission && <MissionCard mission={null} />}
        <GachaButton mission={mission} onResult={handleResult} />
        {mission && (
          <button className={styles.completeButton} onClick={handleComplete} disabled={completed}>
            {completed ? "達成済み!" : "完了"}
          </button>
        )}
        <Link className={styles.achievementsLink} href="/achievements">
          実績を見る
        </Link>
      </main>
    </div>
  );
}