"use client";

import Link from "next/link";
import { useBgm } from "@/components/BgmProvider";
import styles from "./BgmConsentModal.module.css";

export default function BgmConsentModal() {
  const { showConsentPrompt, confirmPlay, declinePlay } = useBgm();

  if (!showConsentPrompt) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="bgm-consent-title">
      <div className={styles.modal}>
        <p id="bgm-consent-title" className={styles.title}>
          BGMを再生しますか？
        </p>
        <p className={styles.description}>ブラウザの設定により、音声はユーザー操作後にのみ再生できます。</p>
        <div className={styles.actions}>
          <button type="button" className={styles.declineButton} onClick={declinePlay}>
            鳴らさない
          </button>
          <button type="button" className={styles.confirmButton} onClick={confirmPlay}>
            鳴らす
          </button>
        </div>
        <p className={styles.laterNote}>
          設定はあとから
          <Link href="/bgm" className={styles.laterLink} onClick={declinePlay}>
            BGM設定
          </Link>
          で変更できます。
        </p>
      </div>
    </div>
  );
}
