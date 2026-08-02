"use client";

import { useEffect, useMemo } from "react";
import styles from "./PhotoCapture.module.css";

type Props = {
  value: File | null;
  onChange: (file: File | null) => void;
};

export default function PhotoCapture({ value, onChange }: Props) {
  const previewUrl = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(e.target.files?.[0] ?? null);
  }

  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>
        写真を追加(任意)
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className={styles.input}
        />
      </label>
      {previewUrl && (
        <div className={styles.previewRow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="選択した写真のプレビュー" className={styles.preview} />
          <button type="button" onClick={() => onChange(null)} className={styles.removeButton}>
            削除
          </button>
        </div>
      )}
    </div>
  );
}
