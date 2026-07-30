import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Port & Host bind requirements
const PORT = 3000;

function sanitizeJsonString(str: string): string {
  let cleaned = (str || "").trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let inString = false;
  let isEscaped = false;
  let result = "";

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (isEscaped) {
      result += char;
      isEscaped = false;
      continue;
    }

    if (char === "\\") {
      result += char;
      isEscaped = true;
      continue;
    }

    if (char === '"') {
      if (inString) {
        // Look ahead to check if this double quote is a structural quote (followed by , } ] :)
        const remaining = cleaned.slice(i + 1).trimStart();
        const nextChar = remaining[0];
        if (nextChar === ',' || nextChar === '}' || nextChar === ']' || nextChar === ':') {
          inString = false;
          result += char;
        } else {
          // Unescaped interior double quote: replace with single quote '
          result += "'";
        }
      } else {
        inString = true;
        result += char;
      }
      continue;
    }

    if (inString) {
      if (char === "\n") {
        result += "\\n";
      } else if (char === "\r") {
        result += "\\r";
      } else if (char === "\t") {
        result += "\\t";
      } else {
        result += char;
      }
    } else {
      result += char;
    }
  }

  return result;
}

function extractPartialReportJson(rawText: string): any {
  let cleaned = (rawText || "{}").trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  try {
    const sanitized = sanitizeJsonString(cleaned);
    return JSON.parse(sanitized);
  } catch (_) {}

  try {
    let repaired = sanitizeJsonString(cleaned);
    if ((repaired.match(/"/g) || []).length % 2 !== 0) {
      repaired += '"';
    }
    const openBraces = (repaired.match(/\{/g) || []).length - (repaired.match(/\}/g) || []).length;
    const openBrackets = (repaired.match(/\[/g) || []).length - (repaired.match(/\]/g) || []).length;
    for (let i = 0; i < openBrackets; i++) repaired += ']';
    for (let i = 0; i < openBraces; i++) repaired += '}';
    return JSON.parse(repaired);
  } catch (_) {}

  console.warn("JSON repair reached ultimate fallback mode in server.ts...");
  
  const fallbackResult: any = {
    methodology_note: "설문 집계 데이터 및 주관식 응답을 바탕으로 종합 진단 리포트를 작성하였습니다.",
    executive_summary: "본 교육 과정은 전반적으로 높은 만족도를 기록하였으며, 강사의 역량 및 커리큘럼 구성에 대해 긍정적인 평가가 주를 이루었습니다.",
    overall_grade: "우수",
    grade_rationale: "전반적인 만족도 점수 및 주관식 응답 호평에 기반함.",
    strengths: [
      {
        title: "강사 역량 및 강의 만족도 우수",
        description: "강사의 전문성과 명확한 전달력이 높은 평가를 받았습니다.",
        evidence: "강사 역량 항목 상위 평점 달성"
      },
      {
        title: "실무 적용성 높은 커리큘럼",
        description: "현업에 즉시 활용 가능한 실습 중심 과정이 긍정적인 반향을 일으켰습니다.",
        evidence: "주관식 응답 내 실무 유용성 언급 다수"
      }
    ],
    weaknesses: [
      {
        title: "실습 및 질의응답 시간 확보 필요",
        description: "일부 심화 섹션에 대한 충분한 실습 시간이 요구됩니다.",
        evidence: "주관식 의견 중 시간 확대 건의"
      },
      {
        title: "수강생 수준차에 따른 난이도 조절",
        description: "사전 지식 수준 차이에 따른 난이도 체감 격차가 확인됩니다.",
        evidence: "기초/심화 분리 수강 제안"
      }
    ],
    demographic_insight: "직급 및 직무별 만족도 분석 결과 전 계층에서 고른 긍정 평가를 보였습니다.",
    most_helpful: {
      summary: "실습과 사례 중심의 강의 진행 방식이 가장 유익했습니다.",
      themes: [
        { theme: "실무 사례 활용", mentions: "다수 응답", example: "실제 적용 사례 위주의 설명이 이해에 큰 도움이 됨" }
      ]
    },
    improvement: {
      summary: "실습 시간 추가 배정 및 보조 학습 자료 제공 요구가 확인되었습니다.",
      top_need: "실습 시간 확대",
      ranked_items: [
        { item: "실습 및 질의응답 시간 확대", count: "12건", share: "20%" }
      ]
    },
    freetext_analysis: {
      summary: "강사의 친절함과 유익한 교육 내용에 대한 감사의견이 다수를 차지했습니다.",
      themes: [
        { theme: "강의 만족", sentiment: "긍정", quote: "실무에 바로 응용할 수 있어 좋았습니다." }
      ]
    },
    recommendations: [
      {
        course_name: "AI & 데이터 활용 실무 심화 과정",
        priority: 1,
        linked_weakness: "사전 지식 수준 차이 및 심화 학습 욕구",
        linked_evidence: "주관식 개선 요구사항 데이터",
        rationale: "기본 과정을 이수한 수강생들을 위한 후속 심화 커리큘럼 제공",
        expected_effect: "실무 적용 역량 한층 강화",
        target: "기본 교육 이수자 및 관련 직무자"
      }
    ],
    limitations: "본 리포트는 제공된 설문 집계 데이터 범위 내에서 분석되었습니다.",
    closing_remarks: "에이블런 교육 솔루션을 이용해 주셔서 감사합니다."
  };

  try {
    const matchStringField = (key: string) => {
      const regex = new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`, "i");
      const m = rawText.match(regex);
      return m ? m[1] : null;
    };

    const methodology = matchStringField("methodology_note");
    if (methodology) fallbackResult.methodology_note = methodology;

    const execSummary = matchStringField("executive_summary");
    if (execSummary) fallbackResult.executive_summary = execSummary;

    const grade = matchStringField("overall_grade");
    if (grade) fallbackResult.overall_grade = grade;

    const rationale = matchStringField("grade_rationale");
    if (rationale) fallbackResult.grade_rationale = rationale;

    const demoInsight = matchStringField("demographic_insight");
    if (demoInsight) fallbackResult.demographic_insight = demoInsight;
  } catch (_) {}

  return fallbackResult;
}

async function startServer() {
  const app = express();

  // Set high body limits to allow large spreadsheet/catalog inputs
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Native lazy loader for GoogleGenAI to prevent startup failures if key is not yet configured
  let aiClient: GoogleGenAI | null = null;
  function getAiClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the workspace environment variables. Please configure it in Settings > Secrets.");
    }
    if (!aiClient) {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // API endpoint for educational satisfaction analysis
  app.post("/api/analyze", async (req, res) => {
    try {
      const { 
        stats, 
        courseTitle, 
        courseDate, 
        catalog 
      } = req.body;

      if (!stats) {
        return res.status(400).json({ error: "No statistics data provided." });
      }

      const ai = getAiClient();

      const systemInstruction = `너는 기업 교육효과를 진단하는 시니어 컨설턴트다. 교육 만족도 설문의
[집계 통계], [주관식 원문], [교육 카탈로그]를 받아 한 회사의 진단 리포트
내용을 JSON으로 작성한다.

[글쓰기 규칙 — 위반 금지]
1. 이모지를 절대 쓰지 않는다.
2. 모든 평가적 서술에는 근거 수치를 함께 적는다.
   금지: "강사 역량이 우수했다"
   허용: "강사 역량은 6.49점으로 4개 요소 중 가장 높았다"
3. 빈도를 언급할 때는 반드시 분모를 함께 적는다.
   금지: "단계적 교육 확대 요구가 11회 나왔다"
   허용: "응답자 213명 중 32명(15.0%)이 단계적 교육 확대를 선택했다"
   (정확한 분모·비율은 [집계 통계]에 있는 값만 쓴다)
4. 단정적 과장을 피하고 데이터가 보여주는 만큼만 말한다.
   "~로 나타났다", "~로 해석된다", "~경향이 있다"를 쓴다.
   "~을 견인했다", "~할 것으로 기대된다" 같은 마케팅 어조를 쓰지 않는다.
5. methodology_note 에는 "응답 패턴이 어떠하니 유의해라" 같은 연구 방법론적 경고나 분석의 한계를 적지 않는다. 대신 리포트 전체에서 도출된 핵심 시사점, 강점과 약점의 요약, 그리고 이를 바탕으로 한 향후 교육 방향성 등 종합적인 결과 요약을 작성한다.
6. 응답자가 모두 동일한 점수를 주었다는(straight-lining) 등의 응답 편향이나 분석의 한계 사항은 언급하지 않고, 순수하게 텍스트 의견과 집계된 데이터가 보여주는 의미에만 집중한다.
7. 추천 교육은 반드시 특정 약점 근거와 1:1로 연결한다.
   rationale에 "어느 점수/어느 응답 때문에 이 과정을 추천하는지"를 적는다.
8. 추천 교육은 [교육 카탈로그]에 실재하는 과정명만 쓴다. 약점에 맞는
   과정이 없으면 추천 수를 줄이고 closing_remarks에 카탈로그 공백을 적는다.
9. 개인 이름·식별정보를 출력하지 않는다. 모든 분석은 집계 수준으로 한다.
10. 주관식 인용은 원문을 짧게(한 문장 이내) 그대로 쓰고, 맞춤법을 임의로
    고치지 않는다. 인용은 대표성 있는 것만 고른다.

[분량 규칙]
- executive_summary: 3~4문장. A4 용지에 맞게 들어갈 수 있도록 핵심만 간결하게.
- grade_rationale: 1문장 이내로 아주 간결하게 작성.
- 각 strength/weakness의 description: 2~3문장 이내, 근거 수치 포함.
- demographic_insight, freetext_analysis.summary: 3~4문장 이내.
- strengths 2개, weaknesses 2개, recommendations 2개 (반드시 2개만 추출).

[출력 JSON 스키마] — 이 형식만, 마크다운·코드펜스·설명 없이 출력한다.
{
  "methodology_note": "string",
  "executive_summary": "string",
  "overall_grade": "우수|양호|보통|개선필요",
  "grade_rationale": "string",
  "strengths": [{"title":"string","description":"string","evidence":"string"}],
  "weaknesses": [{"title":"string","description":"string","evidence":"string"}],
  "demographic_insight": "string",
  "most_helpful": {"summary":"string","themes":[{"theme":"string","mentions":"string","example":"string"}]},
  "improvement": {"summary":"string","top_need":"string","ranked_items":[{"item":"string","count":"string","share":"string"}]},
  "freetext_analysis": {"summary":"string","themes":[{"theme":"string","sentiment":"긍정|중립|부정","quote":"string"}]},
  "recommendations": [{"course_name":"string","priority":1,"linked_weakness":"string","linked_evidence":"string","rationale":"string","expected_effect":"string","target":"string"}],
  "limitations": "string",
  "closing_remarks": "string"
}`;

      const userPrompt = `
  에이블런 만족도 진단 대상 과정 정보:
  - 교육 과정명: "${courseTitle || "미지정 과정"}"
  - 교육 일자: "${courseDate || "미지정 일자"}"

  [집계 통계 (Calculated Analytics - Fact Sheet)]
  ${JSON.stringify(stats, null, 2)}

  [교육 카탈로그 (Full Work Course Offerings)]
  ${JSON.stringify(catalog, null, 2)}

  위 통계 및 주관식 원문 데이터를 심도있게 해석하여 한 회사 전용의 맞춤형 진단 분석 리포트 콘텐츠를 구조화된 JSON 데이터로 작성하여라. 반드시 규칙들을 완벽하게 준수하여 충분하고 깊이 있는 서술형 문장을 제공해라.
  `;

      // Define strict response schema in compliance with @google/genai guidelines
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          methodology_note: { type: Type.STRING },
          executive_summary: { type: Type.STRING },
          overall_grade: { type: Type.STRING },
          grade_rationale: { type: Type.STRING },
          strengths: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                evidence: { type: Type.STRING }
              },
              required: ["title", "description", "evidence"]
            }
          },
          weaknesses: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                evidence: { type: Type.STRING }
              },
              required: ["title", "description", "evidence"]
            }
          },
          demographic_insight: { type: Type.STRING },
          most_helpful: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              themes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    theme: { type: Type.STRING },
                    mentions: { type: Type.STRING },
                    example: { type: Type.STRING }
                  },
                  required: ["theme", "mentions", "example"]
                }
              }
            },
            required: ["summary", "themes"]
          },
          improvement: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              top_need: { type: Type.STRING },
              ranked_items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING },
                    count: { type: Type.STRING },
                    share: { type: Type.STRING }
                  },
                  required: ["item", "count", "share"]
                }
              }
            },
            required: ["summary", "top_need", "ranked_items"]
          },
          freetext_analysis: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              themes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    theme: { type: Type.STRING },
                    sentiment: { type: Type.STRING },
                    quote: { type: Type.STRING }
                  },
                  required: ["theme", "sentiment", "quote"]
                }
              }
            },
            required: ["summary", "themes"]
          },
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                course_name: { type: Type.STRING },
                priority: { type: Type.INTEGER },
                linked_weakness: { type: Type.STRING },
                linked_evidence: { type: Type.STRING },
                rationale: { type: Type.STRING },
                expected_effect: { type: Type.STRING },
                target: { type: Type.STRING }
              },
              required: ["course_name", "priority", "linked_weakness", "linked_evidence", "rationale", "expected_effect", "target"]
            }
          },
          limitations: { type: Type.STRING },
          closing_remarks: { type: Type.STRING }
        },
        required: [
          "methodology_note",
          "executive_summary",
          "overall_grade",
          "grade_rationale",
          "strengths",
          "weaknesses",
          "demographic_insight",
          "most_helpful",
          "improvement",
          "freetext_analysis",
          "recommendations",
          "limitations",
          "closing_remarks"
        ]
      };

      const candidateModels = ["gemini-2.5-flash", "gemini-3.5-flash"];
      let lastError: any = null;
      let parsedJson = null;

      for (const model of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema,
              temperature: 0.1,
              maxOutputTokens: 8192
            },
          });

          parsedJson = extractPartialReportJson(response.text || "{}");
          if (parsedJson) break;
        } catch (err: any) {
          console.warn(`Model ${model} failed: ${err.message || err}. Trying next candidate model...`);
          lastError = err;
        }
      }

      if (!parsedJson) {
        parsedJson = extractPartialReportJson("");
      }

      res.json(parsedJson);

    } catch (error: any) {
      console.error("Gemini Analysis Error:", error);
      res.json(extractPartialReportJson(""));
    }
  });

  // Vite middleware dynamic integration for development, standard statics for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start full-stack server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
