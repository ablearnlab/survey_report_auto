import { ItemMaster } from '../types';

export const ITEM_MASTER: ItemMaster[] = [
  // Section 1: AI 개념·기능 이해
  {"questionId":"Q1","area":"Understanding","weight":4,"gate":false,"correctOption":2,"correctAnswerText":"문장을 숫자 형태로 이해한 뒤, 앞뒤 흐름을 보고 자연스럽게 이어질 단어를 하나씩 예측해 문장을 만든다.", "intent": "생성형 AI의 원리 이해"},
  {"questionId":"Q2","area":"Understanding","weight":4,"gate":false,"correctOption":1,"correctAnswerText":"내부 데이터와 외부 정보를 종합해 원인과 결론을 내리는 판단", "intent": "AI 판단의 한계 인지"},
  {"questionId":"Q3","area":"Understanding","weight":4,"gate":false,"correctOption":3,"correctAnswerText":"해당 판단은 모델이 학습한 패턴 특성상 안정적으로 수행하기 어려운 영역일 수 있다.", "intent": "모델 학습 패턴의 한계 이해"},
  
  // Section 2: 프롬프트 설계
  {"questionId":"Q4","area":"Prompting","weight":4,"gate":false,"correctOption":3,"correctAnswerText":"고객 불만 이메일을 '문제 원인, 감정 톤, 고객 기대, 추가 확인 필요 요소' 기준으로 분석가 관점에서 요약하고, 표 형식으로 정리해줘. 단, 이메일에 실제로 명시된 정보만 사용하고 추정은 하지 말아줘.", "intent": "구조화된 프롬프트 설계"},
  {"questionId":"Q5","area":"Prompting","weight":4,"gate":false,"correctOption":2,"correctAnswerText":"아래 자료에 명시된 정보만 사용해 요약하라. 추가 해석이나 일반화가 필요한 경우에는 해당 판단이 자료에 근거하지 않음을 표시하라.", "intent": "출력 통제 프롬프트"},
  {"questionId":"Q6","area":"Prompting","weight":4,"gate":false,"correctOption":3,"correctAnswerText":"결과물이 보다 완성도 있게 보이도록, 문맥상 필요한 부분은 적절히 보완해 작성하라.", "intent": "부적절한 템플릿 식별"},
  {"questionId":"Q7","area":"Prompting","weight":4,"gate":false,"correctOption":4,"correctAnswerText":"경영진 보고용으로, 내부 실적 데이터와 업계 사례를 함께 정리한 초안 작성", "intent": "데이터 혼합 리스크 인지"},

  // Section 3: 출력 검증·편향·환각 탐지
  {"questionId":"Q8","area":"Evaluation","weight":4,"gate":true,"correctOption":4,"correctAnswerText":"GPT 모델은 항상 최신 정보를 반영하므로, 최근에 바뀐 정책도 자동으로 정확히 알려준다.", "intent": "정보 최신성 한계 인지"},
  {"questionId":"Q9","area":"Evaluation","weight":4,"gate":false,"correctOption":1,"correctAnswerText":"문장이 단정적으로 작성됨", "intent": "단정적 리스크 감지"},
  {"questionId":"Q10","area":"Evaluation","weight":4,"gate":true,"correctOption":1,"correctAnswerText":"내부 데이터에 기반한 내용과 일반적 경향에 따른 서술을 구분해 표시한 뒤 활용한다.", "intent": "정보 출처 구분 및 검증"},
  {"questionId":"Q11","area":"Evaluation","weight":4,"gate":false,"correctOption":3,"correctAnswerText":"고령층 전체를 '디지털을 잘 못 쓰는 집단'으로 일반화한 편향적 표현", "intent": "AI 편향성 감지"},

  // Section 4: 업무 적용·해석 판단
  {"questionId":"Q12","area":"Practical","weight":4,"gate":false,"correctOption":2,"correctAnswerText":"고객별 맞춤 제안 문구 대량 생성", "intent": "비용 효율적 업무 선정"},
  {"questionId":"Q13","area":"Automation","weight":4,"gate":false,"correctOption":4,"correctAnswerText":"클레임 응답 초안 작성", "intent": "자동화 적합 단계 식별"},
  {"questionId":"Q14","area":"Practical","weight":4,"gate":false,"correctOption":3,"correctAnswerText":"교육팀의 사내 교육자료 초안 제작 및 요약 작업", "intent": "ROI 기반 도입 우선순위"},
  {"questionId":"Q15","area":"Practical","weight":4,"gate":false,"correctOption":2,"correctAnswerText":"GDP와 기대수명의 관계를 설명하는 데 있어, 인과관계로 단정한 부분은 보완이 필요하다.", "intent": "인과관계 추론 오류 감지"},
  {"questionId":"Q16","area":"Practical","weight":4,"gate":false,"correctOption":2,"correctAnswerText":"분석 결과가 정책 효과를 직접적으로 입증하는지 여부", "intent": "데이터 기반 입증 책임 검토"},

  // Section 5: 윤리·보안·저작권
  {"questionId":"Q17","area":"Ethics","weight":4,"gate":true,"correctOption":1,"correctAnswerText":"외부 유료 콘텐츠를 참고해, 구성과 흐름이 유사한 자료 생성을 요청하는 경우", "intent": "저작권 침해 리스크 인지"},
  {"questionId":"Q18","area":"Ethics","weight":4,"gate":true,"correctOption":2,"correctAnswerText":"AI 판단의 근거를 설명하거나 책임 주체를 특정하기 어려워진다.", "intent": "Human-in-the-loop 중요성 이해"},

  // Section 6: 자동화·에이전트 운영역량
  {"questionId":"Q19","area":"Automation","weight":4,"gate":false,"correctOption":4,"correctAnswerText":"입력 데이터 구조, 예외 처리 규칙, 출력 형식을 먼저 고정한 뒤 자동화를 설계한다.", "intent": "에이전트 설계 프로세스"},
  {"questionId":"Q20","area":"Automation","weight":4,"gate":false,"correctOption":2,"correctAnswerText":"컬럼 목록을 출력해 실제 헤더를 확인하고, 공백/대소문자 등 가능성을 점검한다.", "intent": "트러블슈팅 역량"},
  {"questionId":"Q21","area":"Automation","weight":4,"gate":true,"correctOption":4,"correctAnswerText":"결과와 원문 간 불일치를 자동으로 감지하고, 임계치 초과 시 사람 검토로 전환한다.", "intent": "리스크 완화 자동화 설계"},
  {"questionId":"Q22","area":"Automation","weight":4,"gate":false,"correctOption":1,"correctAnswerText":"내부 문서는 문서 내 검색으로, 최신 정보는 공식 소스를, LLM은 요약·설명만 담당한다.", "intent": "RAG 구조 이해"},
  {"questionId":"Q23","area":"Automation","weight":4,"gate":false,"correctOption":3,"correctAnswerText":"입력과 출력의 형식을 고정하고, 누락·불확실한 값은 명시적으로 표시하도록 요청한다.", "intent": "모듈형 프롬프트 설계"},
  {"questionId":"Q24","area":"Automation","weight":4,"gate":false,"correctOption":2,"correctAnswerText":"문의에서 이름·연락처는 기호(ID)로 바꿔 AI에 보내고, ID와 실제 정보는 별도 저장한다.", "intent": "보안 및 개인정보 보호 설계"},
  {"questionId":"Q25","area":"Automation","weight":4,"gate":false,"correctOption":3,"correctAnswerText":"고위험 유형을 따로 정의하고, 그 유형은 사람 검토로 보내거나 구버전을 쓰게 한다.", "intent": "운영 안정성 관리"}
];

