"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Mission } from "@/types/mission";
import { saveAchievement } from "@/lib/storage";
import { savePhoto } from "@/lib/photos";
import GachaButton from "@/components/GachaButton";
import MissionCard from "@/components/MissionCard";
import HamburgerMenu from "@/components/HamburgerMenu";
import styles from "./page.module.css";

export default function Home() {
  const [mission, setMission] = useState<Mission | null>(null);
  const [saving, setSaving] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function handleResult(newMission: Mission) {
    setMission(newMission);
  }

  async function finishCompletion(target: Mission, photo: File | null) {
    setSaving(true);
    const id = crypto.randomUUID();
    if (photo) {
      await savePhoto(id, photo);
    }
    saveAchievement({
      id,
      missionId: target.id,
      missionText: target.text,
      rarity: target.rarity,
      completedAt: new Date().toISOString(),
      hasPhoto: photo !== null,
    });
    setMission(null);
    setSaving(false);
  }

  function handleTakePhoto() {
    photoInputRef.current?.click();
  }

  async function handlePhotoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (!mission || !file) return;
    await finishCompletion(mission, file);
  }

  async function handleSkipPhoto() {
    if (!mission) return;
    await finishCompletion(mission, null);
  }

  return (
    <div className={styles.page}>
      <HamburgerMenu />
      <main className={styles.main}>
        <h1>マンネリ突破ガチャ</h1>
        {!mission && <MissionCard mission={null} />}
        <GachaButton mission={mission} onResult={handleResult} />
        {mission && (
          <div className={styles.completeActions}>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className={styles.hiddenInput}
              onChange={handlePhotoSelected}
            />
            <button className={styles.completeButton} onClick={handleTakePhoto} disabled={saving}>
              写真を撮って完了
            </button>
            <button className={styles.skipButton} onClick={handleSkipPhoto} disabled={saving}>
              あとで追加する(完了)
            </button>
          </div>
        )}
        <Link className={styles.achievementsLink} href="/achievements">
          実績を見る
        </Link>
      </main>
    </div>
  );
}
