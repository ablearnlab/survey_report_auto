import { RoadmapCourse } from '../types';

export const ROADMAP_COURSES: RoadmapCourse[] = [
  // T1: AI 리터러시 & 프롬프트
  { track: "AI Literacy & Prompt", level: 1, courseTitle: "생성형 AI 이해와 활용", description: "개념, 한계, 위험 인지 및 기초 리터러시 확보", tags: ["입문", "이해"] },
  { track: "AI Literacy & Prompt", level: 2, courseTitle: "ChatGPT 업무 효율화 과정", description: "개인 업무에 적용해 실제 결과물 생산 및 향상", tags: ["실무", "적용"] },
  { track: "AI Literacy & Prompt", level: 2, courseTitle: "AI 활용 보고서·PPT 작성", description: "문서 작성 시간을 획기적으로 단축하는 프롬프트 기술", tags: ["보고서", "PPT"] },
  { track: "AI Literacy & Prompt", level: 3, courseTitle: "프롬프트 엔지니어링 실무", description: "해석 경계 설정 및 고도화된 출력 통제 기술", tags: ["고급", "통제"] },
  { track: "AI Literacy & Prompt", level: 3, courseTitle: "GPT 활용 전략 도출 워크숍", description: "조직의 의사결정에 AI 결과를 통합하는 방법", tags: ["전략", "판단"] },
  { track: "AI Literacy & Prompt", level: 4, courseTitle: "조직 맞춤형 GPTs 설계 과정", description: "사내 표준 프롬프트 및 템플릿 운영 방식 설계", tags: ["설계", "확산"] },

  // T2: 데이터 & 분석 x AI
  { track: "Data & Analysis x AI", level: 1, courseTitle: "데이터 리터러시(Basic)", description: "데이터 기반 의사결정의 기초와 AI 분석 도구 이해", tags: ["데이터", "기초"] },
  { track: "Data & Analysis x AI", level: 2, courseTitle: "노코드 데이터 분석 실습", description: "엑셀 및 노코드 도구를 활용한 데이터 시각화", tags: ["분석", "시각화"] },
  { track: "Data & Analysis x AI", level: 3, courseTitle: "생성형 AI 데이터 분석(SQL+GPT)", description: "SQL과 LLM을 결합한 데이터 전처리 및 모델링", tags: ["고급분석", "SQL"] },
  // Added missing description
  { track: "Data & Analysis x AI", level: 4, courseTitle: "BigQuery 기반 대규모 데이터 분석 설계", description: "엔터프라이즈급 대용량 데이터 처리 및 AI 분석 파이프라인 구축", tags: ["빅데이터", "아키텍처"] },

  // T3: 업무 자동화 x AI
  { track: "Automation x AI", level: 2, courseTitle: "MS Copilot 활용 업무 효율화", description: "오피스 제품군과 결합된 일상적 업무 자동화", tags: ["코파일럿", "자동화"] },
  { track: "Automation x AI", level: 2, courseTitle: "RPA 기반 반복 업무 자동화", description: "단순 반복 업무를 AI와 RPA로 제거하는 실습", tags: ["RPA", "루틴"] },
  { track: "Automation x AI", level: 3, courseTitle: "GPT + Python 업무 자동화", description: "파이썬 코딩과 AI를 결합한 지능형 자동화", tags: ["파이썬", "지능형"] },
  // Added missing description
  { track: "Automation x AI", level: 4, courseTitle: "Agent 기반 업무 자동화 아키텍처", description: "멀티 에이전트 시스템을 활용한 자율적 업무 프로세스 설계", tags: ["에이전트", "최적화"] },

  // T4: 도메인 / 비즈니스 x AI
  // Added missing descriptions
  { track: "Domain/Business x AI", level: 1, courseTitle: "비개발자를 위한 IT·AI 비즈니스 이해", description: "AI 기술 트렌드와 산업별 비즈니스 적용 사례 기초", tags: ["비즈니스", "트렌드"] },
  { track: "Domain/Business x AI", level: 2, courseTitle: "데이터 드리븐 디자인 씽킹", description: "사용자 경험 중심의 데이터 기반 문제 해결 방법론 실습", tags: ["디자인", "문제해결"] },
  { track: "Domain/Business x AI", level: 3, courseTitle: "직무별 생성형 AI 활용(마케팅/인사/영업)", description: "각 직무별 실전 적용 시나리오 및 품질 통제", tags: ["직무특화", "품질"] },
  // Added missing description
  { track: "Domain/Business x AI", level: 4, courseTitle: "AI 기반 조직 전략 수립 워크숍", description: "AI 도입 로드맵 수립 및 조직적 대응 전략 도출", tags: ["리더십", "의사결정"] },

  // T5: 개발 / 플랫폼 / 클라우드
  // Added missing descriptions
  { track: "Dev/Platform/Cloud", level: 2, courseTitle: "Azure 기반 AI 활용 실습", description: "클라우드 인프라를 활용한 AI 모델 배포 및 서비스 연동 기초", tags: ["클라우드", "인프라"] },
  { track: "Dev/Platform/Cloud", level: 3, courseTitle: "RAG·LLM 기반 AI 서비스 구현", description: "벡터 데이터베이스를 활용한 검색 증강 생성 시스템 구축", tags: ["RAG", "서비스구현"] },
  { track: "Dev/Platform/Cloud", level: 4, courseTitle: "생성형 AI 서비스 아키텍처 설계", description: "확장 가능하고 안정적인 대규모 LLM 서비스 인프라 설계", tags: ["설계", "플랫폼"] }
];

