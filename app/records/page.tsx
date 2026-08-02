"use client";

import { useEffect, useMemo, useState } from "react";
import { AchievementRecord } from "@/types/mission";
import { loadAchievements, updateAchievement } from "@/lib/storage";
import { savePhoto, deletePhoto } from "@/lib/photos";
import Calendar from "@/components/Calendar";
import RecordPhoto from "@/components/RecordPhoto";
import PhotoCapture from "@/components/PhotoCapture";
import styles from "./page.module.css";

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

export default function RecordsPage() {
  const [records, setRecords] = useState<AchievementRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    // IndexedDBはサーバーに存在しないため、マウント後に読み込む
    (async () => {
      const loaded = await loadAchievements();
      setRecords(loaded);
    })();
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
    setRecords(await updateAchievement(recordId, { hasPhoto: true }));
  }

  async function handleDeletePhoto(recordId: string) {
    await deletePhoto(recordId);
    setRecords(await updateAchievement(recordId, { hasPhoto: false }));
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>記録</h1>
        <div className={styles.calendarSection}>
          <Calendar markedDates={markedDates} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </div>

        <div className={styles.scrollArea}>
          {selectedDate ? (
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
          ) : (
            <p className={styles.hint}>日付を選択すると記録が表示されます</p>
          )}
        </div>
      </main>
    </div>
  );
}
