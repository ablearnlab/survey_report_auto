import { Category, Question } from './types';

export const QUESTION_MASTER: Question[] = [
  // Understanding (5 items)
  { id: "Q1", category: Category.Understanding, points: 4, isGate: true, correctAnswer: "Option A" },
  { id: "Q2", category: Category.Understanding, points: 4, isGate: false, correctAnswer: "Option B" },
  { id: "Q3", category: Category.Understanding, points: 4, isGate: false, correctAnswer: "Option C" },
  { id: "Q4", category: Category.Understanding, points: 4, isGate: false, correctAnswer: "Option A" },
  { id: "Q5", category: Category.Understanding, points: 4, isGate: false, correctAnswer: "Option B" },
  
  // Prompting (5 items)
  { id: "Q6", category: Category.Prompting, points: 4, isGate: true, correctAnswer: "Option C" },
  { id: "Q7", category: Category.Prompting, points: 4, isGate: false, correctAnswer: "Option A" },
  { id: "Q8", category: Category.Prompting, points: 4, isGate: false, correctAnswer: "Option B" },
  { id: "Q9", category: Category.Prompting, points: 4, isGate: false, correctAnswer: "Option C" },
  { id: "Q10", category: Category.Prompting, points: 4, isGate: false, correctAnswer: "Option A" },

  // Evaluation (5 items)
  { id: "Q11", category: Category.Evaluation, points: 4, isGate: false, correctAnswer: "Option B" },
  { id: "Q12", category: Category.Evaluation, points: 4, isGate: true, correctAnswer: "Option C" },
  { id: "Q13", category: Category.Evaluation, points: 4, isGate: false, correctAnswer: "Option A" },
  { id: "Q14", category: Category.Evaluation, points: 4, isGate: false, correctAnswer: "Option B" },
  { id: "Q15", category: Category.Evaluation, points: 4, isGate: false, correctAnswer: "Option C" },

  // Practical (5 items)
  { id: "Q16", category: Category.Practical, points: 4, isGate: false, correctAnswer: "Option A" },
  { id: "Q17", category: Category.Practical, points: 4, isGate: false, correctAnswer: "Option B" },
  { id: "Q18", category: Category.Practical, points: 4, isGate: true, correctAnswer: "Option C" },
  { id: "Q19", category: Category.Practical, points: 4, isGate: false, correctAnswer: "Option A" },
  { id: "Q20", category: Category.Practical, points: 4, isGate: false, correctAnswer: "Option B" },

  // Ethics (5 items)
  { id: "Q21", category: Category.Ethics, points: 4, isGate: true, correctAnswer: "Option C" },
  { id: "Q22", category: Category.Ethics, points: 4, isGate: false, correctAnswer: "Option A" },
  { id: "Q23", category: Category.Ethics, points: 4, isGate: false, correctAnswer: "Option B" },
  { id: "Q24", category: Category.Ethics, points: 4, isGate: false, correctAnswer: "Option C" },
  { id: "Q25", category: Category.Ethics, points: 4, isGate: false, correctAnswer: "Option A" },
];

export const IMPROVEMENT_SUGGESTIONS: Record<Category, string> = {
  [Category.Understanding]: "AI의 기본 작동 원리와 LLM의 구조적 특징을 학습하세요.\n다양한 생성형 AI 모델의 차이점과 한계를 이해하는 것이 중요합니다.",
  [Category.Prompting]: "페르소나 설정과 Few-shot 프롬프팅 기법을 심화 연습하세요.\n명확한 제약 조건과 맥락을 제공하여 모델의 출력 품질을 높여보세요.",
  [Category.Evaluation]: "AI 결과물의 할루시네이션(환각) 여부를 판단하는 검증 기준을 세우세요.\n도메인 지식을 바탕으로 사실 관계와 논리적 타당성을 분석하는 습관이 필요합니다.",
  [Category.Practical]: "업무 자동화 도구와 API 연동 방식을 익혀 실무 적용력을 높이세요.\n반복적인 업무 흐름을 AI 프롬프트 체인으로 설계해보는 연습을 추천합니다.",
  [Category.Ethics]: "데이터 보안 가이드라인과 저작권 침해 방지 대책을 숙지하세요.\nAI 사용 시 발생할 수 있는 편향성과 사회적 책임을 고려한 활용이 필수적입니다.",
  [Category.Automation]: "개별 작업을 넘어 전체 프로세스를 자동화하는 설계 능력이 필요합니다.\nAPI 및 자동화 솔루션을 활용한 프롬프트 체이닝 구현을 연습하세요."
};
