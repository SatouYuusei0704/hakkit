import Link from "next/link";
import BgmPlayer from "@/components/BgmPlayer";
import pageStyles from "../page.module.css";

export default function BgmSettingsPage() {
  return (
    <div className={pageStyles.page}>
      <main className={pageStyles.main}>
        <h1>BGM設定</h1>
        <BgmPlayer />
        <Link href="/">ホームに戻る</Link>
      </main>
    </div>
  );
}
