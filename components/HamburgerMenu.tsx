"use client";

import { useState } from "react";
import Link from "next/link";
import { clearAchievements } from "@/lib/storage";
import styles from "./HamburgerMenu.module.css";

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleResetAchievements() {
    setShowConfirm(true);
  }

  async function confirmResetAchievements() {
    await clearAchievements();
    window.dispatchEvent(new Event("achievements:changed"));
    setShowConfirm(false);
    setOpen(false);
  }

  function cancelResetAchievements() {
    setShowConfirm(false);
  }

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="メニュー"
        aria-expanded={open}
      >
        ☰
      </button>

      {open && (
        <ul className={styles.menu}>
          <li>
            <Link className={styles.menuAction} href="/missions/edit" onClick={() => setOpen(false)}>
              ガチャ内容を編集
            </Link>
          </li>
          <li>
            <button
              type="button"
              className={styles.menuAction}
              onClick={handleResetAchievements}
            >
              実績をリセット
            </button>
          </li>
        </ul>
      )}

      {showConfirm && (
        <div className={styles.confirmOverlay} onClick={cancelResetAchievements}>
          <div
            className={styles.confirmModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <p id="reset-confirm-title" className={styles.confirmTitle}>
              実績を削除します。よろしいですか？
            </p>
            <div className={styles.confirmActions}>
              <button type="button" className={styles.confirmCancelButton} onClick={cancelResetAchievements}>
                キャンセル
              </button>
              <button type="button" className={styles.confirmConfirmButton} onClick={confirmResetAchievements}>
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}