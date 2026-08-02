import Link from "next/link";
import AchievementList from "@/components/AchievementList";
import styles from "../page.module.css";

export default function AchievementsPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>実績</h1>
        <AchievementList />
        <Link className={styles.achievementsLink} href="/">
          ガチャに戻る
        </Link>
      </main>
    </div>
  );
}
