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
};

// IndexedDBの missions ストアに保存する形式
export type StoredMission = Mission & {
  userId: string;
  source: "default" | "manual" | "ai";
  createdAt: string; // ISO 8601
};

// IndexedDBの achievements ストアに保存する形式
export type StoredAchievementRecord = AchievementRecord & {
  userId: string;
};

// AIミッション提案フォームの回答
export type MissionFormAnswers = {
  mood: string;
  timeAvailable: "5min" | "15min" | "30min" | "60min+";
  location: "indoor" | "outdoor" | "either";
  theme?: string;
};

// AIが提案するミッション候補
export type AiMissionCandidate = {
  text: string;
  rarity: Rarity;
  reason?: string; // AIが付けた提案理由（UI上のヒント表示に使用、任意）
};

// AI生成1回分の入力・候補・採用結果を記録する下書き
export type AiDraft = {
  id: string;
  userId: string;
  createdAt: string;
  formAnswers: MissionFormAnswers;
  candidates: AiMissionCandidate[];
  adoptedMissionIds: string[]; // 実際に missions ストアへ採用されたMissionのid
};
