# AIミッション提案機能 & IndexedDB移行 仕様書

> 補足: セクション1〜3（背景・現状・既存API仕様の前置き部分）は本ファイル作成時点で
> 未取得です。以下はユーザーから直接共有された4章以降の内容をそのまま記録したものです。

- AI関連APIキー（`GEMINI_API_KEY`）はサーバー側の環境変数（Railway Variables）にのみ置き、クライアントには渡さない
- 既存の `POST /api/gacha` はロジック変更なし。呼び出し元（`GachaButton.tsx`）が同期の `loadMissions()` から `await loadMissions()` に変わる点のみ影響を受ける

## 4. IndexedDB設計

### 4.1 データベース定義

- DB名: `hakkitDB`
- バージョン: `1`
- ライブラリ: [`idb`](https://www.npmjs.com/package/idb)（Jake Archibald製の薄いラッパー。素のIndexedDB APIのコールバック地獄を避けるため採用。~1.2KB）

### 4.2 オブジェクトストア

| ストア名 | keyPath | インデックス | 用途 |
|---|---|---|---|
| `meta` | `key` | - | ローカルユーザーIDなどの単一値を保持 |
| `missions` | `id` | `userId`, `rarity` | カスタムミッション一覧（既存 `hakkit:custom-missions` の移行先） |
| `achievements` | `id` | `userId`, `completedAt`, `missionId` | 達成履歴（既存 `hakkit:achievements` の移行先） |
| `aiDrafts` | `id` | `userId`, `createdAt` | AI生成1回分の入力・候補・採用結果を記録 |

### 4.3 型定義（追加・変更）

`types/mission.ts` に以下を追加する（既存の `Mission` / `AchievementRecord` はフィールド追加のみで後方互換）:

```ts
// 既存の Mission はそのまま維持しつつ、保存時は以下でラップする
export type StoredMission = Mission & {
  userId: string;
  source: "default" | "manual" | "ai";
  createdAt: string; // ISO 8601
};

export type StoredAchievementRecord = AchievementRecord & {
  userId: string;
};

export type MissionFormAnswers = {
  mood: string;
  timeAvailable: "5min" | "15min" | "30min" | "60min+";
  location: "indoor" | "outdoor" | "either";
  theme?: string;
};

export type AiMissionCandidate = {
  text: string;
  rarity: Rarity;
  reason?: string; // AIが付けた提案理由（UI上のヒント表示に使用、任意）
};

export type AiDraft = {
  id: string;
  userId: string;
  createdAt: string;
  formAnswers: MissionFormAnswers;
  candidates: AiMissionCandidate[];
  adoptedMissionIds: string[]; // 実際に missions ストアへ採用されたMissionのid
};
```

`data/missions.ts` のデフォルトミッションはこれまで通りTSファイルのままとし、IndexedDBには複製しない（`missions` ストアが空のときはこれまで同様デフォルトにフォールバックする）。

### 4.4 ローカルユーザーIDの扱い

- 初回DBオープン時、`meta` ストアに `key: "localUserId"` が無ければ `crypto.randomUUID()` で発行して保存
- 以降、`missions` / `achievements` / `aiDrafts` の各レコードにこのIDを `userId` として付与する
- **現時点ではこのIDによるフィルタリングは行わない**（1ブラウザ=1ユーザーなので実質不要）。将来ログイン機能を作る際に、このIDをサーバー側アカウントに紐付ける移行パスとして温存する目的のみ

## 5. `lib/storage.ts` の再設計

すべて非同期（`Promise`を返す）関数に変更する。関数名・役割は極力維持し、呼び出し側の変更を最小化する。

```ts
// 内部
function getDB(): Promise<IDBPDatabase>;
function getLocalUserId(): Promise<string>;

// ミッション
export async function loadMissions(): Promise<Mission[]>;
export async function saveMissions(missions: Mission[]): Promise<Mission[]>;
export async function resetMissions(): Promise<Mission[]>;

// 実績
export async function loadAchievements(): Promise<AchievementRecord[]>;
export async function saveAchievement(record: AchievementRecord): Promise<AchievementRecord[]>;
export async function deleteAchievement(id: string): Promise<AchievementRecord[]>;
export async function clearAchievements(): Promise<void>;

// AI下書き
export async function saveAiDraft(draft: AiDraft): Promise<void>;
export async function loadAiDrafts(): Promise<AiDraft[]>;
```

`typeof window === "undefined"` によるSSRガードは `typeof indexedDB === "undefined"` に置き換える（Route HandlerやServer Componentからは呼ばれない想定なので実質到達しないが、既存コードの安全策を踏襲）。

### 5.1 影響範囲（同期→非同期化に伴う既存呼び出し箇所の変更）

| ファイル | 現在の呼び出し | 変更内容 |
|---|---|---|
| [app/missions/edit/page.tsx](../../app/missions/edit/page.tsx) | `loadMissions()` (useEffect内), `saveMissions()`, `resetMissions()` | 各ハンドラを `async` 化し `await` を付与 |
| [components/GachaButton.tsx](../../components/GachaButton.tsx) | `fetch(..., { body: JSON.stringify({ missions: loadMissions() }) })` | `handleClick` 冒頭で `const missions = await loadMissions();` を先に取得してから `fetch` する |
| [components/AchievementList.tsx](../../components/AchievementList.tsx) | `useEffect(() => { setRecords(loadAchievements()); }, [])` | `useEffect` 内で async IIFE化: `useEffect(() => { (async () => setRecords(await loadAchievements()))(); }, [])` |
| [app/page.tsx](../../app/page.tsx) | `saveAchievement(...)` (同期呼び出し) | `handleComplete` を `async` 化し `await saveAchievement(...)` |

> 実装時の追加確認: [components/HamburgerMenu.tsx](../../components/HamburgerMenu.tsx) でも `clearAchievements()` を同期呼び出ししており、上表に無い5箇所目の影響範囲として同様にasync対応が必要。

## 6. AIミッション提案機能

### 6.1 フォーム項目（`missions/edit` に追加するUI）

| 項目 | 種別 | 選択肢 |
|---|---|---|
| 今の気分 | 選択チップ | だるい / 普通 / やる気あり / リフレッシュしたい |
| 使える時間 | 選択チップ | 5分 / 15分 / 30分 / 1時間以上 |
| 場所 | 選択チップ | 屋内 / 屋外 / どちらでも |
| テーマ（任意） | テキスト入力 | 自由入力（例: 「運動」「人と話す」） |

生成件数は固定3件（選択肢化せずシンプルに）。

### 6.2 API Route: `POST /api/ai/generate-missions`

```ts
type GenerateMissionsRequest = {
  mood: string;
  timeAvailable: "5min" | "15min" | "30min" | "60min+";
  location: "indoor" | "outdoor" | "either";
  theme?: string;
  existingMissionTexts?: string[]; // 重複回避のため、現在のミッション文の一部を渡す（任意）
};

type GenerateMissionsResponse =
  | { ok: true; candidates: AiMissionCandidate[] }
  | { ok: false; error: "RATE_LIMIT" | "UPSTREAM_ERROR" | "INVALID_REQUEST" };
```

処理フロー:
1. リクエストボディをバリデーション（不正なら `INVALID_REQUEST`）
2. `GEMINI_API_KEY` を使いGemini APIへプロンプトを送信（`responseMimeType: "application/json"` + `responseSchema` で構造化出力を強制）
3. Gemini側のエラー（429など）は `RATE_LIMIT`、その他失敗は `UPSTREAM_ERROR` として返す
4. 返却されたJSONを検証し、`rarity` が `N/R/SR` のいずれでもない、または `text` が空の候補は除外
5. 有効な候補が0件になった場合は `UPSTREAM_ERROR` を返す

### 6.3 プロンプト設計方針

- システムプロンプトで以下を指定:
  - 「大学生が休み時間・空き時間に気軽に挑戦できる、20〜40文字程度の一言ミッションを日本語で提案する」
  - 前置き・説明文なしで、ミッション文とレアリティのみ出力する
  - レアリティの目安を明文化: `N`=1分程度でできる気軽なもの／`R`=少し勇気や時間が要るもの／`SR`=普段は避けがちだけど挑戦する価値のあるもの
- `data/missions.ts` の既存ミッションから3〜5件をfew-shot例としてプロンプトに含め、既存のトーン・文体に揃える
- `existingMissionTexts` が渡された場合は「以下と似た内容は避ける」という指示に使う（重複防止）

`responseSchema` の例:

```json
{
  "type": "array",
  "minItems": 3,
  "maxItems": 3,
  "items": {
    "type": "object",
    "properties": {
      "text": { "type": "string" },
      "rarity": { "type": "string", "enum": ["N", "R", "SR"] },
      "reason": { "type": "string" }
    },
    "required": ["text", "rarity"]
  }
}
```

### 6.4 UI/画面仕様（`app/missions/edit`）

1. 既存の手動追加フォームの下（または上部タブ）に「AIにおまかせ」セクションを追加
2. フォーム入力後「提案してもらう」ボタン押下→ローディング表示→候補カード3件を表示（ミッション文＋レアリティバッジ＋任意でreasonをヒント表示）
3. 各候補カードに「採用」ボタン→押すと既存の `Mission` 形式に変換し `saveMissions()` へ追加（既存の手動編集リストにそのまま反映され、レアリティもそこで調整可能）
4. 「作り直す」ボタンでフォーム値を保持したまま再生成
5. 生成結果（フォーム回答＋候補＋採用結果）は `aiDrafts` ストアに `saveAiDraft()` で保存する（履歴閲覧UIは今回は作らない。データ層のみ用意）
6. API失敗時は「AIが少し混み合っています。時間を置いて試すか、手動で追加してください」を表示し、既存の手動追加フォームは常に使用可能な状態を維持する

## 7. 環境変数 / Railway設定

| 変数名 | 用途 | スコープ |
|---|---|---|
| `GEMINI_API_KEY` | Gemini API認証キー | サーバーのみ（`NEXT_PUBLIC_` を付けない） |
| `GEMINI_MODEL` | 使用モデル名（省略時 `gemini-flash-latest`。`gemini-2.5-flash-lite`は新規利用者向け提供終了のため変更） | サーバーのみ（任意） |

Railwayの対象サービスの Variables に設定する。ビルド・デプロイ手順自体の変更は不要（既存の `next build` / `next start` のまま）。

## 8. 実装タスクチェックリスト

- [ ] `idb` を依存関係に追加
- [ ] `types/mission.ts` に `StoredMission` / `StoredAchievementRecord` / `MissionFormAnswers` / `AiMissionCandidate` / `AiDraft` を追加
- [ ] `lib/storage.ts` をIndexedDB版に書き換え（`getDB` / `getLocalUserId` を新設、既存関数を非同期化）
- [ ] 呼び出し側4箇所（5章の表）を非同期対応に修正
- [ ] `app/api/ai/generate-missions/route.ts` を新設し、Gemini API呼び出し・バリデーション・エラーハンドリングを実装
- [ ] `app/missions/edit` にAI提案フォーム・候補カードUIを追加
- [ ] Railwayに `GEMINI_API_KEY` を設定
- [ ] 動作確認: 手動追加フロー / AI提案→採用フロー / API失敗時のフォールバック表示

## 9. 将来の拡張（今回は着手しない）

- ログイン機能＋サーバー側DBを追加し、`userId` を実アカウントに紐付けて複数端末同期を実現する
- 既存localStorageユーザー向けのワンタイム移行処理（初回起動時にlocalStorageを読み取りIndexedDBへコピー）
- AI生成APIへのレート制限・乱用対策
- `aiDrafts` の履歴閲覧・再利用UI
