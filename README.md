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

## 🌐 Vercel 배포 및 설정 가이드

### 1. Google AI Studio에서 API 키 발급받기
1. [Google AI Studio](https://aistudio.google.com/)에 접속하여 구글 계정으로 로그인합니다.
2. 좌측 상단 메뉴의 **`Get API key`** ➔ **`Create API key`** 버튼을 클릭합니다.
3. 생성된 키(문자열)를 복사해 둡니다.

---

### 2. Vercel 배포 및 API 키 등록/수정하기
1. [Vercel](https://vercel.com/) 대시보드에 접속합니다.
2. 배포할 프로젝트(또는 신규 프로젝트 **Import**)를 선택합니다.
3. 프로젝트 상단 메뉴의 **`Settings`** ➔ **`Environment Variables`** 탭으로 이동합니다.
4. 아래와 같이 입력하고 **`Save`** (또는 `Add`) 버튼을 클릭합니다:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `[Google AI Studio에서 복사한 API Key]`

---

### 🛠️ 오류 발생 시 Vercel에서 새로 재배포(Redeploy)하는 방법

분석 오류나 API 키 변경 후 웹사이트에 반영이 필요한 경우, 다음 절차로 재배포를 진행할 수 있습니다.

1. **Vercel 프로젝트 페이지 접속**
   Vercel 대시보드에서 `survey_report_auto` (또는 해당 프로젝트)를 클릭합니다.

2. **Deployments 탭 이동**
   상단 메뉴에서 **`Deployments`** 탭을 클릭하여 전체 배포 내역 목록을 확인합니다.

3. **새로 재배포 실행 (Redeploy)**
   - 가장 최근 배포 항목 우측의 **`...` (더보기)** 버튼을 클릭합니다.
   - 메뉴 중 **`Redeploy`** 를 선택합니다.
   - 팝업창이 나타나면 **`Redeploy`** 버튼을 눌러 캐시 없이 최신 상태로 재배포를 시작합니다.
   - 약 30초 후 배포 완료 상태가 되면 웹사이트를 새로고침하여 이용합니다.


