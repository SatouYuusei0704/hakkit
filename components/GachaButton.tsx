"use client";

import { useState } from "react";
import { Mission } from "@/types/mission";
import { loadMissions } from "@/lib/storage";
import styles from "./GachaButton.module.css";

type Props = {
  onResult: (mission: Mission) => void;
};

export default function GachaButton({ onResult }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/gacha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missions: loadMissions() }),
      });
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
