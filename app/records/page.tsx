import Link from "next/link";
import styles from "../page.module.css";

export default function RecordsPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>記録</h1>
        <p>このページは現在準備中です。</p>
        <Link className={styles.achievementsLink} href="/">
          ガチャに戻る
        </Link>
      </main>
    </div>
  );
}
