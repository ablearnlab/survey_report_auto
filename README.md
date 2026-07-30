# 에이블런 교육 만족도 진단 리포트 생성기

교육 만족도 설문 결과를 토대로 AI(Gemini)가 에이블런 교육 만족도 진단 리포트와 교육 제안을 자동 생성 및 분석하는 내부 컨설팅 지원 도구입니다.

---

## 📌 주요 기능
- **교육 만족도 데이터 분석**: 집계 통계 및 주관식 원문 데이터를 바탕으로 세부 강점/약점 자동 진단
- **AI 리포트 자동 생성**: Gemini 모델을 이용한 정량적·정성적 교육 분석 리포트 생성
- **맞춤형 교육 과정 추천**: 교육 카탈로그 데이터 기반 후속 교육 제안
- **PDF 및 엑셀 다운로드**: 생성된 진단 리포트 결과물 저장 지원

---

## 🚀 로컬 실행 방법

### 사전 준비사항
- [Node.js](https://nodejs.org/) (v18 이상 권장)
- [Google AI Studio](https://aistudio.google.com/)에서 발급받은 Gemini API Key

### 1. 패키지 설치
```bash
npm install
```

### 2. 환경변수 설정
프로젝트 루트 디렉토리에 `.env.local` (또는 `.env`) 파일을 생성하고 발급받은 Gemini API 키를 입력합니다.

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. 개발 서버 실행
```bash
npm run dev
```
실행 후 브라우저에서 `http://localhost:3000` 로 접속합니다.

---

## 🌐 Vercel 배포 방법

1. GitHub 레포지토리를 Vercel과 연동합니다.
2. Vercel 프로젝트 설정의 **Environment Variables**에 `GEMINI_API_KEY`를 추가합니다.
3. 배포를 진행합니다.

