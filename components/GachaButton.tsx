"use client";

import { useState } from "react";
import { Mission } from "@/types/mission";
import styles from "./GachaButton.module.css";

type Props = {
  onResult: (mission: Mission) => void;
};

export default function GachaButton({ onResult }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/gacha", { method: "POST" });
      const data = await res.json();
      onResult(data.mission as Mission);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className={styles.button} onClick={handleClick} disabled={loading}>
      {loading ? "抽選中..." : "ガチャを引く"}
    </button>
  );
}
