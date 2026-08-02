"use client";

import { useEffect, useRef, useState } from "react";
import { AiDraft, AiMissionCandidate, Mission, MissionFormAnswers, Rarity } from "@/types/mission";
import { getLocalUserId, loadMissions, saveAiDraft, saveMissions, resetMissions } from "@/lib/storage";
import pageStyles from "../../page.module.css";
import styles from "./page.module.css";

const RARITIES: Rarity[] = ["N", "R", "SR"];
const MOODS = ["だるい", "普通", "やる気あり", "リフレッシュしたい"];
const TIME_OPTIONS: { value: MissionFormAnswers["timeAvailable"]; label: string }[] = [
  { value: "5min", label: "5分" },
  { value: "15min", label: "15分" },
  { value: "30min", label: "30分" },
  { value: "60min+", label: "1時間以上" },
];
const LOCATION_OPTIONS: { value: MissionFormAnswers["location"]; label: string }[] = [
  { value: "indoor", label: "屋内" },
  { value: "outdoor", label: "屋外" },
  { value: "either", label: "どちらでも" },
];
const AI_ERROR_MESSAGE = "AIが少し混み合っています。時間を置いて試すか、手動で追加してください";

export default function EditMissionsPage() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [text, setText] = useState("");
  const [rarity, setRarity] = useState<Rarity>("N");

  const [formAnswers, setFormAnswers] = useState<MissionFormAnswers>({
    mood: "",
    timeAvailable: "15min",
    location: "either",
    theme: "",
  });
  const [candidates, setCandidates] = useState<AiMissionCandidate[] | null>(null);
  const [currentDraft, setCurrentDraft] = useState<AiDraft | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // IndexedDBはサーバーに存在しないため、マウント後に読み込む
    (async () => {
      const loaded = await loadMissions();
      setMissions(loaded);
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  function showToast(message: string) {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 2500);
  }

  async function persist(next: Mission[]) {
    setMissions(next);
    await saveMissions(next);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const newMission: Mission = { id: crypto.randomUUID(), text: text.trim(), rarity };
    await persist([...missions, newMission]);
    setText("");
    setRarity("N");
  }

  async function handleTextChange(id: string, newText: string) {
    await persist(missions.map((m) => (m.id === id ? { ...m, text: newText } : m)));
  }

  async function handleRarityChange(id: string, newRarity: Rarity) {
    await persist(missions.map((m) => (m.id === id ? { ...m, rarity: newRarity } : m)));
  }

  async function handleDelete(id: string) {
    await persist(missions.filter((m) => m.id !== id));
  }

  async function handleReset() {
    const defaults = await resetMissions();
    setMissions(defaults);
  }

  async function handleGenerate() {
    if (!formAnswers.mood || aiLoading) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch("/api/ai/generate-missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: formAnswers.mood,
          timeAvailable: formAnswers.timeAvailable,
          location: formAnswers.location,
          theme: formAnswers.theme || undefined,
          existingMissionTexts: missions.slice(0, 10).map((m) => m.text),
        }),
      });
      const data = await res.json();

      if (!res.ok || data.ok !== true) {
        setCandidates(null);
        setCurrentDraft(null);
        setAiError(AI_ERROR_MESSAGE);
        return;
      }

      const newCandidates = data.candidates as AiMissionCandidate[];
      setCandidates(newCandidates);

      const userId = await getLocalUserId();
      const draft: AiDraft = {
        id: crypto.randomUUID(),
        userId,
        createdAt: new Date().toISOString(),
        formAnswers,
        candidates: newCandidates,
        adoptedMissionIds: [],
      };
      setCurrentDraft(draft);
      await saveAiDraft(draft);
    } catch {
      setCandidates(null);
      setCurrentDraft(null);
      setAiError(AI_ERROR_MESSAGE);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleAdopt(candidate: AiMissionCandidate, index: number) {
    const newMission: Mission = { id: crypto.randomUUID(), text: candidate.text, rarity: candidate.rarity };

    // 採用済みの候補は選び直せないよう、リストから即座に取り除く
    setCandidates((prev) => (prev ? prev.filter((_, i) => i !== index) : prev));
    showToast(`「${candidate.text}」を追加しました`);

    await persist([...missions, newMission]);

    if (currentDraft) {
      const updated: AiDraft = {
        ...currentDraft,
        adoptedMissionIds: [...currentDraft.adoptedMissionIds, newMission.id],
      };
      setCurrentDraft(updated);
      await saveAiDraft(updated);
    }
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

        <section className={styles.aiSection}>
          <h2>AIにおまかせ</h2>

          <div className={styles.chipGroup}>
            <span className={styles.chipGroupLabel}>今の気分</span>
            {MOODS.map((m) => (
              <button
                key={m}
                type="button"
                className={`${styles.chip} ${formAnswers.mood === m ? styles.chipSelected : ""}`}
                onClick={() => setFormAnswers((f) => ({ ...f, mood: m }))}
              >
                {m}
              </button>
            ))}
          </div>

          <div className={styles.chipGroup}>
            <span className={styles.chipGroupLabel}>使える時間</span>
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.chip} ${formAnswers.timeAvailable === opt.value ? styles.chipSelected : ""}`}
                onClick={() => setFormAnswers((f) => ({ ...f, timeAvailable: opt.value }))}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className={styles.chipGroup}>
            <span className={styles.chipGroupLabel}>場所</span>
            {LOCATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`${styles.chip} ${formAnswers.location === opt.value ? styles.chipSelected : ""}`}
                onClick={() => setFormAnswers((f) => ({ ...f, location: opt.value }))}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            className={styles.themeInput}
            value={formAnswers.theme ?? ""}
            onChange={(e) => setFormAnswers((f) => ({ ...f, theme: e.target.value }))}
            placeholder="テーマ（任意・例: 運動、人と話す）"
          />

          <div className={styles.aiActions}>
            <button type="button" onClick={handleGenerate} disabled={!formAnswers.mood || aiLoading}>
              {aiLoading ? "考え中..." : "提案してもらう"}
            </button>
            {candidates && (
              <button type="button" onClick={handleGenerate} disabled={aiLoading}>
                作り直す
              </button>
            )}
          </div>

          {aiError && <p className={styles.aiError}>{aiError}</p>}

          {candidates && candidates.length > 0 && (
            <ul className={styles.candidateList}>
              {candidates.map((candidate, i) => (
                <li key={i} className={styles.candidateCard}>
                  <span className={styles.candidateRarity}>{candidate.rarity}</span>
                  <p className={styles.candidateText}>{candidate.text}</p>
                  {candidate.reason && <p className={styles.candidateReason}>{candidate.reason}</p>}
                  <button type="button" onClick={() => handleAdopt(candidate, i)}>
                    採用
                  </button>
                </li>
              ))}
            </ul>
          )}

          {candidates && candidates.length === 0 && (
            <p className={styles.aiEmpty}>候補はすべて追加しました。「作り直す」でさらに提案を生成できます</p>
          )}
        </section>

        <button type="button" className={styles.resetButton} onClick={handleReset}>
          デフォルトに戻す
        </button>
      </main>

      {toast && (
        <div className={styles.toast} role="status">
          {toast}
        </div>
      )}
    </div>
  );
}
