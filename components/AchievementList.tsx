"use client";

import { useEffect, useState } from "react";
import { AchievementRecord } from "@/types/mission";
import { loadAchievements } from "@/lib/storage";
import { summarizeAchievements } from "@/lib/achievements";
import styles from "./AchievementList.module.css";

// TODO(フロント担当): バッジ表示やレアリティ別の見た目を追加してください
export default function AchievementList() {
  const [records, setRecords] = useState<AchievementRecord[]>([]);

  useEffect(() => {
    // localStorageはサーバーに存在しないため、マウント後に読み込む
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecords(loadAchievements());
  }, []);

  const summary = summarizeAchievements(records);

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        <p>達成数: {summary.total}</p>
        <p>連続達成日数: {summary.streakDays}</p>
        <p>
          N:{summary.byRarity.N} / R:{summary.byRarity.R} / SR:
          {summary.byRarity.SR}
        </p>
      </div>
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
