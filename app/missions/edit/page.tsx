"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mission, Rarity } from "@/types/mission";
import { loadMissions, saveMissions, resetMissions } from "@/lib/storage";
import pageStyles from "../../page.module.css";
import styles from "./page.module.css";

const RARITIES: Rarity[] = ["N", "R", "SR"];

export default function EditMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [text, setText] = useState("");
  const [rarity, setRarity] = useState<Rarity>("N");

  useEffect(() => {
    // localStorageはサーバーに存在しないため、マウント後に読み込む
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMissions(loadMissions());
  }, []);

  function persist(next: Mission[]) {
    setMissions(next);
    saveMissions(next);
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const newMission: Mission = { id: crypto.randomUUID(), text: text.trim(), rarity };
    persist([...missions, newMission]);
    setText("");
    setRarity("N");
  }

  function handleTextChange(id: string, newText: string) {
    persist(missions.map((m) => (m.id === id ? { ...m, text: newText } : m)));
  }

  function handleRarityChange(id: string, newRarity: Rarity) {
    persist(missions.map((m) => (m.id === id ? { ...m, rarity: newRarity } : m)));
  }

  function handleDelete(id: string) {
    persist(missions.filter((m) => m.id !== id));
  }

  function handleReset() {
    setMissions(resetMissions());
  }

  return (
    <div className={pageStyles.page}>
      <main className={pageStyles.main}>
        <h1>ガチャ内容の編集</h1>

        <form className={styles.addForm} onSubmit={handleAdd}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="新しいミッションを入力"
          />
          <select value={rarity} onChange={(e) => setRarity(e.target.value as Rarity)}>
            {RARITIES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button type="submit">追加</button>
        </form>

        <ul className={styles.list}>
          {missions.length === 0 && <li className={styles.empty}>ミッションがありません</li>}
          {missions.map((mission) => (
            <li key={mission.id} className={styles.item}>
              <select
                value={mission.rarity}
                onChange={(e) => handleRarityChange(mission.id, e.target.value as Rarity)}
              >
                {RARITIES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={mission.text}
                onChange={(e) => handleTextChange(mission.id, e.target.value)}
              />
              <button type="button" onClick={() => handleDelete(mission.id)}>
                削除
              </button>
            </li>
          ))}
        </ul>

        <button type="button" className={styles.resetButton} onClick={handleReset}>
          デフォルトに戻す
        </button>
        <Link href="/">ガチャに戻る</Link>
      </main>
    </div>
  );
}
