import { CSSProperties } from "react";
import styles from "./AnimatedBackground.module.css";

type CapsuleRarity = "N" | "R" | "SR" | "SSR";

type CapsuleConfig = {
  top: number;
  right: number;
  size: number;
  duration: number;
  delay: number;
  rotate: number;
  rarity: CapsuleRarity;
};

// top/right はアニメーション開始位置(画面外含む)、delay は負値にして
// マウント時点で既に流れの途中にいるように見せている
const CAPSULES: CapsuleConfig[] = [
  { top: -8, right: 78, size: 30, duration: 19, delay: -3, rotate: 220, rarity: "N" },
  { top: 4, right: 20, size: 22, duration: 15, delay: -9, rotate: -180, rarity: "R" },
  { top: -12, right: 45, size: 44, duration: 24, delay: -14, rotate: 260, rarity: "SR" },
  { top: 10, right: 92, size: 18, duration: 13, delay: -5, rotate: -150, rarity: "N" },
  { top: -4, right: 8, size: 26, duration: 21, delay: -18, rotate: 200, rarity: "R" },
  { top: 22, right: 60, size: 34, duration: 18, delay: -2, rotate: -220, rarity: "N" },
  { top: -16, right: 30, size: 20, duration: 16, delay: -11, rotate: 180, rarity: "R" },
  { top: 30, right: 5, size: 50, duration: 26, delay: -20, rotate: -260, rarity: "SSR" },
  { top: 0, right: 70, size: 24, duration: 14, delay: -7, rotate: 240, rarity: "N" },
  { top: 15, right: 38, size: 16, duration: 12, delay: -4, rotate: -190, rarity: "N" },
  { top: -10, right: 55, size: 38, duration: 22, delay: -16, rotate: 210, rarity: "SR" },
  { top: 8, right: 12, size: 28, duration: 17, delay: -10, rotate: -230, rarity: "R" },
  { top: -6, right: 85, size: 20, duration: 15, delay: -6, rotate: 190, rarity: "N" },
  { top: 25, right: 25, size: 32, duration: 20, delay: -13, rotate: -210, rarity: "R" },
  { top: -14, right: 65, size: 24, duration: 16, delay: -1, rotate: 250, rarity: "N" },
  { top: 18, right: 48, size: 42, duration: 23, delay: -19, rotate: -240, rarity: "SR" },
];

const RARITY_COLOR_VAR: Record<CapsuleRarity, string> = {
  N: "var(--rarity-n)",
  R: "var(--rarity-r)",
  SR: "var(--rarity-sr)",
  SSR: "var(--rarity-ssr)",
};

type CapsuleStyle = CSSProperties & {
  "--capsule-rotate": string;
  "--capsule-color": string;
};

export default function AnimatedBackground() {
  return (
    <div className={styles.layer} aria-hidden="true">
      {CAPSULES.map((capsule, index) => {
        const style: CapsuleStyle = {
          top: `${capsule.top}%`,
          right: `${capsule.right}%`,
          width: capsule.size,
          height: capsule.size,
          animationDuration: `${capsule.duration}s`,
          animationDelay: `${capsule.delay}s`,
          "--capsule-rotate": `${capsule.rotate}deg`,
          "--capsule-color": RARITY_COLOR_VAR[capsule.rarity],
        };
        return <span key={index} className={styles.capsule} style={style} />;
      })}
    </div>
  );
}
