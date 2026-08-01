import { loadLastActiveDate, recordActiveToday } from "@/lib/storage";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export type InactivityCheck = {
  shouldRemind: boolean;
  daysSinceLastActive: number | null;
};

// 前回起動日との差(日数)を見て、1日以上アプリを開いていなかった場合にリマインドする
export function checkInactivity(): InactivityCheck {
  const lastActive = loadLastActiveDate();
  const today = new Date().toISOString().slice(0, 10);

  const daysSinceLastActive = lastActive
    ? Math.round((Date.parse(today) - Date.parse(lastActive)) / MS_PER_DAY)
    : null;

  const shouldRemind = daysSinceLastActive !== null && daysSinceLastActive >= 2;

  recordActiveToday();

  return { shouldRemind, daysSinceLastActive };
}
