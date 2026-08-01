import { ReactNode } from "react";
import { Rarity } from "@/types/mission";
import styles from "./RarityEffect.module.css";

type Props = {
  rarity: Rarity | null;
  children: ReactNode;
};

export default function RarityEffect({ rarity, children }: Props) {
  return (
    <div className={styles.wrapper} data-rarity={rarity ?? undefined}>
      {children}
    </div>
  );
}
