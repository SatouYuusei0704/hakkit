import { Mission } from "@/types/mission";
import styles from "./MissionCard.module.css";

type Props = {
  mission: Mission | null;
};

export default function MissionCard({ mission }: Props) {
  if (!mission) {
    return (
      <div className={styles.card}>
        <p className={styles.placeholder}>ガチャを引いてミッションを手に入れよう</p>
      </div>
    );
  }

  return (
    <div className={styles.card} data-rarity={mission.rarity}>
      <span className={styles.capsuleIcon} aria-hidden="true" />
      <span className={styles.rarity}>{mission.rarity}</span>
      <p className={styles.text}>{mission.text}</p>
    </div>
  );
}
