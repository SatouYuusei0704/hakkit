"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AchievementRecord } from "@/types/mission";
import { loadAchievements, updateAchievement } from "@/lib/storage";
import { savePhoto, deletePhoto } from "@/lib/photos";
import Calendar from "@/components/Calendar";
import RecordPhoto from "@/components/RecordPhoto";
import PhotoCapture from "@/components/PhotoCapture";
import pageStyles from "../page.module.css";
import styles from "./page.module.css";

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

export default function RecordsPage() {
  const [records, setRecords] = useState<AchievementRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    // localStorageはサーバーに存在しないため、マウント後に読み込む
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecords(loadAchievements());
  }, []);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, AchievementRecord[]>();
    for (const record of records) {
      const key = toDateKey(record.completedAt);
      const list = map.get(key) ?? [];
      list.push(record);
      map.set(key, list);
    }
    return map;
  }, [records]);

  const markedDates = useMemo(() => new Set(recordsByDate.keys()), [recordsByDate]);
  const selectedRecords = selectedDate ? (recordsByDate.get(selectedDate) ?? []) : [];

  async function handleAddPhoto(recordId: string, file: File) {
    await savePhoto(recordId, file);
    setRecords(updateAchievement(recordId, { hasPhoto: true }));
  }

  async function handleDeletePhoto(recordId: string) {
    await deletePhoto(recordId);
    setRecords(updateAchievement(recordId, { hasPhoto: false }));
  }

  return (
    <div className={pageStyles.page}>
      <main className={pageStyles.main}>
        <h1>記録</h1>
        <Calendar markedDates={markedDates} selectedDate={selectedDate} onSelectDate={setSelectedDate} />

        {selectedDate && (
          <div className={styles.dayRecords}>
            <h2>{selectedDate}</h2>
            {selectedRecords.length === 0 && <p className={styles.empty}>この日の記録はありません</p>}
            <ul className={styles.list}>
              {selectedRecords.map((record) => (
                <li key={record.id} className={styles.item}>
                  <div className={styles.itemHeader}>
                    <span className={styles.rarity}>{record.rarity}</span>
                    <span>{record.missionText}</span>
                  </div>

                  {record.hasPhoto ? (
                    <div className={styles.photoRow}>
                      <RecordPhoto recordId={record.id} />
                      <button
                        type="button"
                        className={styles.deletePhotoButton}
                        onClick={() => handleDeletePhoto(record.id)}
                      >
                        写真を削除
                      </button>
                    </div>
                  ) : (
                    <PhotoCapture
                      value={null}
                      onChange={(file) => file && handleAddPhoto(record.id, file)}
                    />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link href="/">ガチャに戻る</Link>
      </main>
    </div>
  );
}
