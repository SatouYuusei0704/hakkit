"use client";

import { useEffect, useState } from "react";
import styles from "./CompletionReminder.module.css";

const REMINDER_DELAY_MS = 5 * 1000; // TODO: 動作確認用に5秒に短縮中。確認後5分に戻す

type Props = {
  missionId: string | null;
  completed: boolean;
};

export default function CompletionReminder({ missionId, completed }: Props) {
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    // ミッションが変わった/完了した際は、前のミッションのリマインドを引き継がない
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowReminder(false);

    if (!missionId || completed) return;

    const timer = setTimeout(() => {
      setShowReminder(true);
    }, REMINDER_DELAY_MS);

    return () => clearTimeout(timer);
  }, [missionId, completed]);

  if (!showReminder) return null;

  return (
    <p className={styles.banner}>
      引いたミッション、まだ完了していませんよ!忘れずに挑戦しましょう。
    </p>
  );
}
