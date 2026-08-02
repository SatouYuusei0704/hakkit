"use client";

import { useState } from "react";
import styles from "./Calendar.module.css";

type Props = {
  markedDates: Set<string>;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function toDateKey(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export default function Calendar({ markedDates, selectedDate, onSelectDate }: Props) {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const now = new Date();
  const todayKey = toDateKey(now.getFullYear(), now.getMonth(), now.getDate());

  function goPrevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }

  function goNextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <button type="button" onClick={goPrevMonth} aria-label="前の月" className={styles.navButton}>
          ‹
        </button>
        <span className={styles.monthLabel}>
          {year}年{month + 1}月
        </span>
        <button type="button" onClick={goNextMonth} aria-label="次の月" className={styles.navButton}>
          ›
        </button>
      </div>
      <div className={styles.weekdays}>
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className={styles.grid}>
        {cells.map((day, index) => {
          if (day === null) {
            return <span key={`empty-${index}`} className={styles.empty} />;
          }

          const dateKey = toDateKey(year, month, day);
          const hasRecord = markedDates.has(dateKey);

          return (
            <button
              key={dateKey}
              type="button"
              className={styles.day}
              data-selected={dateKey === selectedDate ? "" : undefined}
              data-today={dateKey === todayKey ? "" : undefined}
              onClick={() => onSelectDate(dateKey)}
            >
              {day}
              {hasRecord && <span className={styles.dot} aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
