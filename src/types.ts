export interface FeedbackRow {
  timestamp: string;
  companyName: string;
  name: string;
  position: string;
  job: string;
  ratings: number[]; // F~Q (12 Qs, 7-point scale)
  q13_helpful: string; // R 컬럼
  q14_improvements: string; // S 컬럼
  q15_freetext: string; // T 컬럼
}

export interface AverageByGroup {
  groupName: string;
  count: number;
  average: number;
}

export interface ImprovementFreq {
  keyword: string;
  count: number;
}

export interface RatingDistribution {
  score: number; // 1 to 7
  count: number;
}

export interface ComputedStats {
  companyName: string;
  totalResponses: number;
  responsePeriod: { start: string; end: string };
  overallAverage: number;
  dimensionAverages: {
    quality: number;      // F,G,H (교육품질)
    instructor: number;   // I,J,K (강사역량)
    relevance: number;    // L,M,N (실무적용성)
    satisfaction: number; // O,P,Q (전반만족도)
  };
  dimensionStdDev: number; // 4개 요소 평균의 분산/표준편차
  questionAverages: number[]; // 12 elements
  lowestScoresPerDimension: {
    quality: { qIdx: number; score: number };
    instructor: { qIdx: number; score: number };
    relevance: { qIdx: number; score: number };
    satisfaction: { qIdx: number; score: number };
  };
  straightLining: {
    count: number;
    ratioPercentage: number;
  };
  ratingDistribution: RatingDistribution[]; // 7 elements (1..7)
  positionStats: AverageByGroup[];
  jobStats: AverageByGroup[];
  improvementKeywordFreq: ImprovementFreq[];
  q14ItemAnalysis: { item: string; count: number; ratioPercentage: number }[];
  rawTextQuestions: {
    q13: string[]; // R 13번 주관식 원문 (도움된 점)
    q14: string[]; // S 14번 개선요구 원문 (개선요구)
    q15: string[]; // T 15번 자유응답 원문
  };
}

export interface CatalogRow {
  courseName: string; // 과정명
  category: string; // 카테고리
  difficulty: string; // 난이도
  summary: string; // 한줄소개
  coreContent: string; // 핵심내용
  targetJob: string; // 대상직무
  targetRank: string; // 대상직급
  hours: string; // 차시
  format: string; // 교육형식
  prerequisite: string; // 선수과정
  weaknessTag: string; // 대응약점태그
  remarks: string; // 비고
}

// AI Output JSON Schema Matching the Korean Spec exactly
export interface GeminiReportResponse {
  methodology_note: string;
  executive_summary: string;
  overall_grade: "우수" | "양호" | "보통" | "개선필요";
  grade_rationale: string;
  strengths: {
    title: string;
    description: string;
    evidence: string;
  }[];
  weaknesses: {
    title: string;
    description: string;
    evidence: string;
  }[];
  demographic_insight: string;
  most_helpful: {
    summary: string;
    themes: {
      theme: string;
      mentions: string;
      example: string;
    }[];
  };
  improvement: {
    summary: string;
    top_need: string;
    ranked_items: {
      item: string;
      count: string;
      share: string;
    }[];
  };
  freetext_analysis: {
    summary: string;
    themes: {
      theme: string;
      sentiment: "긍정" | "중립" | "부정";
      quote: string;
    }[];
  };
  recommendations: {
    course_name: string;
    priority: number;
    linked_weakness: string;
    linked_evidence: string;
    rationale: string;
    expected_effect: string;
    target: string;
  }[];
  limitations: string;
  closing_remarks: string;
}
