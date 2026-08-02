import Link from "next/link";
import styles from "./Footer.module.css";

const navItems = [
  { href: "/", label: "ガチャ" },
  { href: "/achievements", label: "実績" },
  { href: "/records", label: "記録" },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <nav className={styles.nav} aria-label="サイトナビゲーション">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={styles.link}>
            {item.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}
