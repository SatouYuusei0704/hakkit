import { NextResponse } from "next/server";
import { missions as defaultMissions } from "@/data/missions";
import { AiMissionCandidate, MissionFormAnswers, Rarity } from "@/types/mission";

const RARITIES: Rarity[] = ["N", "R", "SR"];
const TIME_VALUES: MissionFormAnswers["timeAvailable"][] = ["5min", "15min", "30min", "60min+"];
const LOCATION_VALUES: MissionFormAnswers["location"][] = ["indoor", "outdoor", "either"];

const TIME_LABELS: Record<MissionFormAnswers["timeAvailable"], string> = {
  "5min": "5分",
  "15min": "15分",
  "30min": "30分",
  "60min+": "1時間以上",
};

const LOCATION_LABELS: Record<MissionFormAnswers["location"], string> = {
  indoor: "屋内",
  outdoor: "屋外",
  either: "どちらでも",
};

function pickFewShotTexts(): string[] {
  const byRarity = (rarity: Rarity) => defaultMissions.filter((m) => m.rarity === rarity);
  return [...byRarity("N").slice(0, 2), ...byRarity("R").slice(0, 2), ...byRarity("SR").slice(0, 1)].map(
    (m) => m.text
  );
}

type ValidatedRequest = MissionFormAnswers & { existingMissionTexts: string[] };

type GenerateMissionsResponse =
  | { ok: true; candidates: AiMissionCandidate[] }
  | { ok: false; error: "RATE_LIMIT" | "UPSTREAM_ERROR" | "INVALID_REQUEST" };

function validateRequest(body: unknown): ValidatedRequest | null {
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;

  if (typeof b.mood !== "string" || !b.mood.trim()) return null;
  if (typeof b.timeAvailable !== "string" || !TIME_VALUES.includes(b.timeAvailable as MissionFormAnswers["timeAvailable"])) {
    return null;
  }
  if (typeof b.location !== "string" || !LOCATION_VALUES.includes(b.location as MissionFormAnswers["location"])) {
    return null;
  }
  if (b.theme !== undefined && typeof b.theme !== "string") return null;

  const existingMissionTexts =
    Array.isArray(b.existingMissionTexts) && b.existingMissionTexts.every((t) => typeof t === "string")
      ? (b.existingMissionTexts as string[])
      : [];

  return {
    mood: b.mood,
    timeAvailable: b.timeAvailable as MissionFormAnswers["timeAvailable"],
    location: b.location as MissionFormAnswers["location"],
    theme: typeof b.theme === "string" ? b.theme.trim() || undefined : undefined,
    existingMissionTexts,
  };
}

function isValidCandidate(value: unknown): value is AiMissionCandidate {
  if (typeof value !== "object" || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.text === "string" &&
    c.text.trim().length > 0 &&
    typeof c.rarity === "string" &&
    RARITIES.includes(c.rarity as Rarity) &&
    (c.reason === undefined || typeof c.reason === "string")
  );
}

function buildPrompt(input: ValidatedRequest): string {
  const fewShot = pickFewShotTexts()
    .map((text) => `- ${text}`)
    .join("\n");
  const avoidLine =
    input.existingMissionTexts.length > 0
      ? `\n以下と似た内容は避けてください:\n${input.existingMissionTexts.map((t) => `- ${t}`).join("\n")}`
      : "";
  const themeLine = input.theme ? `\nテーマ: ${input.theme}` : "";

  return `あなたは大学生向けの「Gachaly」アプリのミッション作家です。
大学生が休み時間・空き時間に気軽に挑戦できる、20〜40文字程度の一言ミッションを日本語で3件提案してください。

条件:
- 今の気分: ${input.mood}
- 使える時間: ${TIME_LABELS[input.timeAvailable]}
- 場所: ${LOCATION_LABELS[input.location]}${themeLine}${avoidLine}

レアリティの目安:
- N: 1分程度でできる気軽なもの
- R: 少し勇気や時間が要るもの
- SR: 普段は避けがちだけど挑戦する価値のあるもの

既存ミッションの例（トーン・文体の参考。そのまま使わないこと）:
${fewShot}

前置きや説明文は不要です。ミッション文とレアリティ（と任意で簡潔な提案理由）のみを出力してください。`;
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const validated = validateRequest(body);
  if (!validated) {
    return NextResponse.json<GenerateMissionsResponse>({ ok: false, error: "INVALID_REQUEST" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return NextResponse.json<GenerateMissionsResponse>({ ok: false, error: "UPSTREAM_ERROR" }, { status: 502 });
  }

  const model = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const prompt = buildPrompt(validated);

  let geminiResponse: Response;
  try {
    geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "ARRAY",
              minItems: 3,
              maxItems: 3,
              items: {
                type: "OBJECT",
                properties: {
                  text: { type: "STRING" },
                  rarity: { type: "STRING", enum: RARITIES },
                  reason: { type: "STRING" },
                },
                required: ["text", "rarity"],
              },
            },
          },
        }),
      }
    );
  } catch {
    return NextResponse.json<GenerateMissionsResponse>({ ok: false, error: "UPSTREAM_ERROR" }, { status: 502 });
  }

  if (geminiResponse.status === 429) {
    return NextResponse.json<GenerateMissionsResponse>({ ok: false, error: "RATE_LIMIT" }, { status: 429 });
  }
  if (!geminiResponse.ok) {
    console.error("Gemini API error", geminiResponse.status, await geminiResponse.text().catch(() => ""));
    return NextResponse.json<GenerateMissionsResponse>({ ok: false, error: "UPSTREAM_ERROR" }, { status: 502 });
  }

  const payload: unknown = await geminiResponse.json().catch(() => null);
  const text =
    payload !== null && typeof payload === "object"
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload as any)?.candidates?.[0]?.content?.parts?.[0]?.text
      : undefined;

  let parsedCandidates: unknown;
  try {
    parsedCandidates = typeof text === "string" ? JSON.parse(text) : null;
  } catch {
    parsedCandidates = null;
  }

  const candidates = Array.isArray(parsedCandidates) ? parsedCandidates.filter(isValidCandidate) : [];

  if (candidates.length === 0) {
    console.error("Gemini API returned no valid candidates", payload);
    return NextResponse.json<GenerateMissionsResponse>({ ok: false, error: "UPSTREAM_ERROR" }, { status: 502 });
  }

  return NextResponse.json<GenerateMissionsResponse>({ ok: true, candidates });
}
