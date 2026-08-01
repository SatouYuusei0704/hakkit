"use client";

import { useEffect, useState } from "react";
import { checkInactivity } from "@/lib/reminder";
import styles from "./InactivityReminder.module.css";

export default function InactivityReminder() {
  const [daysSinceLastActive, setDaysSinceLastActive] = useState<number | null>(null);

  useEffect(() => {
    const { shouldRemind, daysSinceLastActive } = checkInactivity();
    if (shouldRemind) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDaysSinceLastActive(daysSinceLastActive);
    }
  }, []);

  if (daysSinceLastActive === null) return null;

  return (
    <p className={styles.banner}>
      {daysSinceLastActive}日ぶりですね!また新しいミッションに挑戦してみましょう。
    </p>
  );
}
