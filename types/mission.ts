// レアリティ: ガチャの排出率に対応する
export type Rarity = "N" | "R" | "SR";

export type Mission = {
  id: string;
  text: string;
  rarity: Rarity;
};

// ガチャを引いた結果としてAPIが返す型
export type GachaResult = {
  mission: Mission;
  rarity: Rarity;
  timestamp: number;
};

// 端末に保存する達成履歴1件分
export type AchievementRecord = {
  id: string;
  missionId: string;
  missionText: string;
  rarity: Rarity;
  completedAt: string; // ISO 8601形式
  hasPhoto?: boolean; // 写真本体はIndexedDBに保存し、このidで紐づける
};
