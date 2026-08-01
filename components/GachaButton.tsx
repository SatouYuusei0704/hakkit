"use client";

import { useState } from "react";
import Image from "next/image";
import { Mission, Rarity } from "@/types/mission";
import MissionCard from "@/components/MissionCard";
import RarityEffect from "@/components/RarityEffect";
import { loadMissions } from "@/lib/storage";
import styles from "./GachaButton.module.css";

type Props = {
  mission: Mission | null;
  onResult: (mission: Mission) => void;
};

// タイミングはGachaButton.module.cssの ballHalfLeft/Right, burstPop の
// animation-duration (1.7s) と REVEAL_MS の位置(76%地点)に合わせてある
const DISMISS_MS = 220;
const REVEAL_MS = 1300;
const ANIM_TOTAL_MS = 1700;

export default function GachaButton({ mission, onResult }: Props) {
  const [loading, setLoading] = useState(false);
  const [ballRarity, setBallRarity] = useState<Rarity | null>(null);
  const [rollIndex, setRollIndex] = useState(0);
  const [displayMission, setDisplayMission] = useState<Mission | null>(mission);
  const [dismissing, setDismissing] = useState(false);

  if (mission === null && displayMission !== null && !dismissing) {
    // 親側（完了ボタンなど）から結果がクリアされたら、こちらの表示も追従する
    setDisplayMission(null);
  }

  async function handleClick() {
    setLoading(true);
    setBallRarity(null);

    if (displayMission) {
      setDismissing(true);
      await new Promise((resolve) => setTimeout(resolve, DISMISS_MS));
      setDismissing(false);
      setDisplayMission(null);
    }

    setRollIndex((i) => i + 1);

    const fetchPromise = fetch("/api/gacha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ missions: loadMissions() }),
    }).then((res) => res.json());
    const revealTimer = new Promise<void>((resolve) => setTimeout(resolve, REVEAL_MS));
    const [data] = await Promise.all([fetchPromise, revealTimer]);

    const newMission = data.mission as Mission;
    setBallRarity(newMission.rarity);
    setDisplayMission(newMission);
    onResult(newMission);

    setTimeout(() => setLoading(false), ANIM_TOTAL_MS - REVEAL_MS);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.machine}>
        <div className={styles.illustration}>
          <Image
            src="/gacha-machine-v2.png"
            alt=""
            fill
            sizes="(max-width: 480px) 80vw, 320px"
            className={styles.illustrationImage}
            priority
          />
          <button
            type="button"
            className={styles.hitArea}
            onClick={handleClick}
            disabled={loading}
            aria-label="ガチャを回す"
          />
          {loading && !dismissing && !displayMission && (
            <div key={rollIndex} className={styles.ballFx} aria-hidden="true">
              <span className={styles.ballHalf} data-side="left" data-color={ballRarity ?? "neutral"} />
              <span className={styles.ballHalf} data-side="right" data-color={ballRarity ?? "neutral"} />
              <span className={styles.burst} />
            </div>
          )}
          {displayMission && (
            <div
              key={`card-${rollIndex}`}
              className={`${styles.resultOverlay} ${dismissing ? styles.dismissing : ""}`}
            >
              <RarityEffect rarity={displayMission.rarity}>
                <MissionCard mission={displayMission} />
              </RarityEffect>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
