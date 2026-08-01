"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./HamburgerMenu.module.css";

export default function HamburgerMenu() {
  const [open, setOpen] = useState(false);

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
            <Link href="/missions/edit" onClick={() => setOpen(false)}>
              ガチャ内容を編集
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}
