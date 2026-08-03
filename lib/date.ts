// completedAt(UTC基準のISO文字列)をそのままslice(0, 10)すると、
// 日本時間の深夜0:00〜8:59台はUTCではまだ前日のため、カレンダー上の日付がずれる。
// ローカルのカレンダー日で扱いたい箇所は必ずこの関数を通す。
export function toLocalDateKey(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
