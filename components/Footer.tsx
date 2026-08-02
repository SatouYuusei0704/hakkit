"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Footer.module.css";

const navItems = [
  { href: "/achievements", label: "実績", icon: "🎖️" },
  {
    href: "/",
    label: "ガチャ",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true" className={styles.iconSvg}>
        <path d="M32 10c9.4 0 17 7.6 17 17s-7.6 17-17 17S15 36.4 15 27 22.6 10 32 10Z" fill="#C1E8F9" />
        <path d="M15 27c0 9.4 7.6 17 17 17s17-7.6 17-17H15Z" fill="#8EC8EA" />
        <path d="M13 27H51v5H13z" fill="#E5F6FB" />
        <path d="M13 42h38v8a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3v-8Z" fill="#3B88C5" />
        <path d="M23 48h18v6H23z" fill="#D7EEFA" />
        <path d="M27 31a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" fill="#F9C92E" />
        <path d="M36 30a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" fill="#F1584A" />
        <path d="M30 37a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" fill="#35C85B" />
        <path d="M32 20a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" fill="#FFFFFF" />
        <path d="M24 15c2-2 5-2 7 0" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 28c4 0 8 3 12 3s8-3 12-3" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      </svg>
    ),
  },
  {
    href: "/records",
    label: "記録",
    icon: (
      <svg viewBox="0 0 64 64" aria-hidden="true" className={styles.iconSvg}>
        <rect x="10" y="12" width="44" height="40" rx="6" fill="#F3F7FC" />
        <rect x="14" y="16" width="36" height="28" rx="4" fill="#FFFFFF" />
        <path d="M18 40 L28 26 L36 34 L44 24 L50 34 L50 42 Z" fill="#B7DFF7" />
        <circle cx="24" cy="24" r="4" fill="#F9C92E" />
        <polygon points="50,8 53,14 57,14 53,18 50,24 47,18 43,18 47,14" fill="#F9E16B" opacity="0.95" />
      </svg>
    ),
  },
];

export default function Footer() {
  const pathname = usePathname();

  return (
    <footer className={styles.footer}>
      <nav className={styles.nav} aria-label="サイトナビゲーション">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={styles.link}
              aria-current={isActive ? "page" : undefined}
              data-active={isActive ? "" : undefined}
            >
              <span aria-hidden="true" className={styles.icon}>
                {item.icon}
              </span>
              <span className={styles.label}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}
