"use client";

import { useState } from "react";
import Link from "next/link";
import { Mission } from "@/types/mission";
import { saveAchievement } from "@/lib/storage";
import { savePhoto } from "@/lib/photos";
import GachaButton from "@/components/GachaButton";
import MissionCard from "@/components/MissionCard";
import HamburgerMenu from "@/components/HamburgerMenu";
import CameraCapture from "@/components/CameraCapture";
import styles from "./page.module.css";

export default function Home() {
  const [mission, setMission] = useState<Mission | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

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
    setShowCamera(true);
  }

  async function handleCameraCapture(file: File) {
    setShowCamera(false);
    if (!mission) return;
    await finishCompletion(mission, file);
  }

  function handleCameraCancel() {
    setShowCamera(false);
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

      {showCamera && mission && (
        <CameraCapture onCapture={handleCameraCapture} onCancel={handleCameraCancel} />
      )}
    </div>
  );
}
