"use client";

import { useEffect, useState } from "react";
import { AchievementRecord } from "@/types/mission";
import { loadAchievements } from "@/lib/storage";
import { summarizeAchievements } from "@/lib/achievements";
import { buildCollection } from "@/lib/collection";
import { missions } from "@/data/missions";
import styles from "./AchievementList.module.css";

export default function AchievementList() {
  const [records, setRecords] = useState<AchievementRecord[]>([]);

  useEffect(() => {
    // localStorageはサーバーに存在しないため、マウント後に読み込む
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecords(loadAchievements());
  }, []);

  const summary = summarizeAchievements(records);
  const collection = buildCollection(missions, records);

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        <p>達成数: {summary.total}</p>
        <p>連続達成日数: {summary.streakDays}</p>
        <p>
          N:{summary.byRarity.N} / R:{summary.byRarity.R} / SR:
          {summary.byRarity.SR} / SSR:{summary.byRarity.SSR}
        </p>
      </div>

      <h2 className={styles.heading}>ミッション図鑑</h2>
      <div className={styles.grid}>
        {collection.map((entry) => (
          <div
            key={entry.id}
            className={styles.tile}
            data-rarity={entry.rarity}
            data-unlocked={entry.unlocked}
          >
            {entry.timesCompleted > 1 && (
              <span className={styles.tileCount}>×{entry.timesCompleted}</span>
            )}
            <span className={styles.tileIconWrap}>
              <span className={styles.tileIcon} aria-hidden="true" />
              {!entry.unlocked && (
                <span className={styles.tileLock} aria-hidden="true">
                  🔒
                </span>
              )}
            </span>
            <span className={styles.tileRarity}>{entry.rarity}</span>
            <p className={styles.tileText}>{entry.unlocked ? entry.text : "？？？"}</p>
          </div>
        ))}
      </div>

      <h2 className={styles.heading}>達成履歴</h2>
      <ul className={styles.list}>
        {records.length === 0 && <li className={styles.empty}>まだ達成記録がありません</li>}
        {[...records].reverse().map((record) => (
          <li key={record.id} className={styles.item}>
            <span className={styles.rarity}>{record.rarity}</span>
            <span>{record.missionText}</span>
            <span className={styles.date}>
              {new Date(record.completedAt).toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
