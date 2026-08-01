import { Mission } from "@/types/mission";

// TODO(初心者担当): ここにミッションを追加・編集してください。
// rarityが高いほど排出率は低くなります（app/api/gacha/route.ts の RARITY_WEIGHTS 参照）。
// id は他と重複しないようにしてください。
export const missions: Mission[] = [
  { id: "n-001", text: "いつもと違う出口から駅を出る", rarity: "N" },
  { id: "n-002", text: "普段通らない道で帰る", rarity: "N" },
  { id: "n-003", text: "3分間片足立ちしてみる", rarity: "N" },
  { id: "r-001", text: "知らないお店でランチを食べる", rarity: "R" },
  { id: "r-002", text: "1駅分歩いてみる", rarity: "R" },
  { id: "sr-001", text: "今日話したことのない人に挨拶する", rarity: "SR" },
  { id: "ssr-001", text: "行ったことのない街へ日帰りで出かける", rarity: "SSR" },
];
