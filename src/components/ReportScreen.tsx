import React, { useState, useEffect } from "react";
import { 
  FileText, ArrowLeft, Printer, RefreshCw, Cpu, Brain,
  ChevronRight, Award, AlertCircle, Quote, Compass, BookOpen, 
  Clock, Users, BarChart2, Star, CheckCircle, HelpCircle
} from "lucide-react";
import { ComputedStats, CatalogRow, GeminiReportResponse } from "../types";
import { Bar, Doughnut, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  ArcElement
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ReportScreenProps {
  companyName: string;
  stats: ComputedStats;
  catalog: CatalogRow[];
  courseTitle: string;
  courseDate: string;
  maxPoints: number;
  onBack: () => void;
  initialReport?: any;
}

export default function ReportScreen({
  companyName,
  stats,
  catalog,
  courseTitle,
  courseDate,
  maxPoints,
  onBack,
  initialReport,
}: ReportScreenProps) {
  const [loading, setLoading] = useState(!initialReport);
  const [loadingStep, setLoadingStep] = useState(0);
  const [errorWord, setErrorWord] = useState<string | null>(null);
  const [report, setReport] = useState<GeminiReportResponse | null>(initialReport || null);

  // Progressive loading step animation
  const steps = [
    "정량 설문 데이터 수치 매핑 검증 중...",
    "에이블런 45개 전문 교육 카탈로그 문맥 동기화 중...",
    "AI 교육 컨설턴트 네트워크 지식망 활성화 중...",
    "약점 대응태그 기반 역량 보완 과목 매칭 모델 연산 중...",
    "타겟 회사 전용 진단 및 컨설팅 보고서 초안 작성 중...",
  ];

  useEffect(() => {
    let stepInterval: NodeJS.Timeout;
    if (loading) {
      stepInterval = setInterval(() => {
        setLoadingStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 2500);
    }
    return () => clearInterval(stepInterval);
  }, [loading]);

  const generateReport = async () => {
    setLoading(true);
    setErrorWord(null);
    setLoadingStep(0);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stats,
          courseTitle,
          courseDate,
          catalog,
        }),
      });

      if (!response.ok) {
        let errorMessage = `서버 오류 (${response.status}): 리포트 생성 API 호출이 실패하였습니다.`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Response body is not valid JSON (e.g., Vercel timeout HTML page, empty body)
          try {
            const textBody = await response.text();
            if (textBody.includes("FUNCTION_INVOCATION_TIMEOUT") || response.status === 504) {
              errorMessage = "서버 함수 실행 시간이 초과되었습니다. 데이터 크기를 줄이거나 다시 시도해 주세요.";
            }
          } catch {
            // ignore secondary parse failures
          }
        }
        throw new Error(errorMessage);
      }

      // Safely parse the success response body
      let data;
      try {
        const rawText = await response.text();
        data = JSON.parse(rawText);
      } catch {
        throw new Error("서버 응답 데이터를 처리할 수 없습니다. 다시 시도해 주세요.");
      }

      setReport(data);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setErrorWord(err.message || "보고서를 생성하는 도중 일시적인 서버 지연이 발생했습니다. 다시 시도해 주세요.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialReport) {
      generateReport();
    }
  }, [companyName, initialReport]);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  // Modern print handler that ensures we don't break mid-element
  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center" id="loading_overlay">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full border-4 border-[#E8EAF6] border-t-[#3A40B5] animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#3A40B5]">
            <Brain className="w-10 h-10 animate-pulse" />
          </div>
        </div>
        <div className="max-w-md">
          <h2 className="text-xl font-bold text-[#1A1D36] mb-2 font-sans">
            AI 교육 진단 분석 가동 중
          </h2>
          <div className="h-1.5 bg-[#E8EAF6] w-full rounded-full overflow-hidden mb-4">
            <div 
              className="bg-[#3A40B5] h-full transition-all duration-700" 
              style={{ width: `${((loadingStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm font-semibold text-[#3A40B5] animate-pulse">
            {steps[loadingStep]}
          </p>
          <p className="text-xs text-[#727796] mt-4">
            최초 리포트 셋업 및 카탈로그 우선순위 매핑 연산에는 최대 15초가 소요될 수 있습니다.
          </p>
        </div>
      </div>
    );
  }

  if (errorWord) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-[#C6C9E8] rounded-3xl text-center shadow-md">
        <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-[#1A1D36] mb-2">분석에 진입하지 못했습니다</h3>
        <p className="text-xs text-[#727796] mb-6 whitespace-pre-wrap">{errorWord}</p>
        <div className="flex gap-4">
          <button
            onClick={onBack}
            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-all"
          >
            뒤로 가기
          </button>
          <button
            onClick={generateReport}
            className="flex-1 py-2.5 bg-[#3A40B5] hover:bg-[#1A1D36] text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  // Question headers list (12 questions) in Korean
  const questionTexts = [
    "Q1. 교육의 전체적인 구성이 체계적이었습니까?",
    "Q2. 교육 시간의 배분은 적절했습니까?",
    "Q3. 제공된 교재와 교육 환경에 만족하십니까?",
    "Q4. 강사의 전달력과 강의 역량에 만족하십니까?",
    "Q5. 강사는 교육생의 피드백에 성실히 답변했습니까?",
    "Q6. 강사의 도메인 및 전문 지식 수준은 우수했습니까?",
    "Q7. 교육 내용이 실제 업무에 적용 가능합니까?",
    "Q8. 교육을 통해 실습하며 역량이 향상되었습니까?",
    "Q9. 교육이 향후 커리어 발전에 도움을 줍니다.",
    "Q10. 이 교육 과정을 다른 동료에게 추천하시겠습니까?",
    "Q11. 전반적으로 이번 에이블런 교육에 만족하십니까?",
    "Q12. 에이블런의 교육 운영 지원 서비스에 만족하십니까?"
  ];

  const dimensionLabels = ["교육품질", "강사역량", "실무적용성", "전반만족도"];
  const dimensionScores = [
    stats.dimensionAverages.quality,
    stats.dimensionAverages.instructor,
    stats.dimensionAverages.relevance,
    stats.dimensionAverages.satisfaction,
  ];

  // Radar/Bar chart data for 4 core elements
  const coreDimensionsChartData = {
    labels: dimensionLabels,
    datasets: [
      {
        label: "핵심 지표 만족도 평균 (7점 만점)",
        data: dimensionScores,
        backgroundColor: [
          "rgba(58, 64, 181, 0.75)",
          "rgba(26, 29, 54, 0.75)",
          "rgba(114, 119, 150, 0.75)",
          "rgba(212, 215, 244, 0.8)",
        ],
        borderColor: [
          "#3A40B5",
          "#1A1D36",
          "#727796",
          "#C6C9E8",
        ],
        borderWidth: 1.5,
      },
    ],
  };

  // Score distribution data
  const scoreDistributionLabels = stats.ratingDistribution.map((d) => `${d.score}점`);
  const scoreDistributionValues = stats.ratingDistribution.map((d) => d.count);
  const scoreDistributionChartData = {
    labels: scoreDistributionLabels,
    datasets: [
      {
        label: "응답자 빈도수",
        data: scoreDistributionValues,
        backgroundColor: "rgba(58, 64, 181, 0.8)",
        borderColor: "#3A40B5",
        borderRadius: 6,
        borderWidth: 1,
      },
    ],
  };

  // Q14 Keyword frequency data
  const keywordLabels = stats.q14ItemAnalysis.map((k) => k.item).slice(0, 5);
  const keywordValues = stats.q14ItemAnalysis.map((k) => k.count).slice(0, 5);
  const keywordChartData = {
    labels: keywordLabels,
    datasets: [
      {
        label: "중복 언급 빈도",
        data: keywordValues,
        backgroundColor: "rgba(26, 29, 54, 0.75)",
        borderColor: "#1A1D36",
        borderRadius: 6,
        borderWidth: 1,
      },
    ],
  };

  // Helper calculation for custom UI widgets (overall grade text styles)
  const gradeStyles: Record<string, { bg: string; text: string; label: string }> = {
    우수: { bg: "bg-emerald-50", text: "text-emerald-700", label: "EXCELLENT" },
    양호: { bg: "bg-blue-50", text: "text-blue-700", label: "GOOD" },
    보통: { bg: "bg-[#E8EAF6]", text: "text-[#3A40B5]", label: "MODERATE" },
    "개선 필요": { bg: "bg-red-50", text: "text-red-700", label: "NEEDS ACTION" },
    개선필요: { bg: "bg-red-50", text: "text-red-700", label: "NEEDS ACTION" },
  };

  const currentGradeStyle = gradeStyles[report.overall_grade] || gradeStyles["우수"];

  return (
    <div className="max-w-[210mm] mx-auto py-6 px-4" id="report_screen_wrapper">
      {/* Control bar - Hidden when printing */}
      <div className="flex flex-wrap justify-between items-center bg-white p-4 border border-[#C6C9E8] rounded-2xl mb-8 gap-3 print:hidden shadow-sm">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 bg-white hover:bg-gray-50 text-gray-700 border border-[#C6C9E8] px-4 py-2 rounded-xl text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          대상 설정화면으로 돌아가기
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={generateReport}
            className="inline-flex items-center gap-1.5 bg-[#E8EAF6] hover:bg-[#D4D7F4] text-[#3A40B5] border border-[#C6C9E8] px-4 py-2 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            AI 다시 진단하기
          </button>
          <button
            onClick={handlePrint}
            disabled={isGeneratingPdf}
            className="inline-flex items-center gap-1.5 bg-[#3A40B5] hover:bg-[#1A1D36] disabled:bg-gray-400 text-white px-5 py-2 rounded-xl text-xs font-bold transition shadow-md"
          >
            {isGeneratingPdf ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
            {isGeneratingPdf ? "PDF 생성 중..." : "PDF로 바로 다운로드"}
          </button>
        </div>
      </div>

      {/* A4 REPORT CONTAINER FOR PRINT SIMULATION */}
      <div id="report_printable_area" className="report-printable-area space-y-12 select-text text-justify">
        
        {/* PAGE 1: COVER */}
        <div className="a4-page bg-white p-[15mm] border border-gray-100 shadow-xl relative flex flex-col justify-between overflow-hidden">
          
          {/* Cover Header Logo Area */}
          <div className="flex justify-between items-center border-b border-[#3A40B5]/20 pb-4 mb-4">
            <img src="https://cdn.imweb.me/upload/S202101041a4e45576971e/f9f2d57513b3c.png" alt="ABLEARN" className="h-6 object-contain" />
            <div className="text-right font-mono text-[9px] text-[#727796] space-y-0.5">
              <p>교육 만족도 결과 분석 시스템</p>
            </div>
          </div>

          {/* Cover Titles */}
          <div className="my-auto space-y-6">
            <div className="w-20 h-1.5 bg-[#3A40B5]"></div>
            
            <div className="space-y-3">
              <span className="text-[11px] tracking-[0.2em] text-[#3A40B5] uppercase font-bold block">
                상세 교육 진단 및 사후 만족도 결과 보고서
              </span>
              <h1 className="text-4xl sm:text-[42px] font-extrabold text-[#1A1D36] font-sans tracking-tight leading-[1.2] uppercase">
                [{courseTitle}] <br />
                <span className="text-[#3A40B5]">교육 만족도 진단 리포트</span>
              </h1>
            </div>

            <p className="text-xs text-[#727796] max-w-xl leading-relaxed">
              본 만족도 진단 보고서는 에이블런 교육 사후 설문의 정량적 평점 통계를 수학적으로 즉각 해석하여 도출된 정합 결과를 기반으로 작성되었습니다. 수강 기업의 특장점 보완을 위한 후속 카탈로그 맞춤 연동 컨설팅 내용이 수집되어 있습니다.
            </p>
          </div>

          {/* Cover Footer Metadata */}
          <div className="border-t border-[#C6C9E8] pt-8 space-y-6">
            <div className="bg-gray-50 border border-[#C6C9E8] p-5 rounded-xl print:break-inside-avoid">
              <h3 className="text-xs font-bold text-[#1A1D36] mb-3">조사 개요</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div>
                    <span className="text-[#727796] block text-[10px] tracking-wider">진단 대상 과정</span>
                    <span className="font-extrabold text-[#1A1D36] text-sm">{courseTitle}</span>
                  </div>
                  <div>
                    <span className="text-[#727796] block text-[10px] tracking-wider">대상 기업</span>
                    <span className="font-semibold text-[#272A42]">{companyName}</span>
                  </div>
                  <div>
                    <span className="text-[#727796] block text-[10px] tracking-wider">교육 시행 일자</span>
                    <span className="font-semibold text-[#272A42]">{courseDate}</span>
                  </div>
                </div>

                <div className="space-y-2 text-right">
                  <div>
                    <span className="text-[#727796] block text-[10px] tracking-wider">조사 응답자 수</span>
                    <span className="font-bold text-[#1A1D36]">{stats.totalResponses}명</span>
                  </div>
                  <div>
                    <span className="text-[#727796] block text-[10px] tracking-wider">리포트 발간 일자</span>
                    <span className="font-mono text-[#272A42]">{new Date().toISOString().split("T")[0]}</span>
                  </div>
                </div>
              </div>
              {report.methodology_note && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <span className="text-[#1A1D36] block text-[11px] font-bold tracking-wider mb-1">교육 만족도 전반에 대한 종합</span>
                  <p className="text-[#272A42] text-[11px] leading-relaxed break-keep">{report.methodology_note}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PAGE 2: EXECUTIVE SUMMARY */}
        <div className="a4-page bg-white p-[15mm] border border-gray-100 shadow-xl flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex justify-between items-center text-[10px] font-mono text-[#727796] border-b border-gray-100 pb-3 mb-6 uppercase tracking-wider">
              <span>{courseTitle}</span>
              <span>{companyName} &bull; PAGE 2</span>
            </div>

            {/* Section Title */}
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1.5 h-6 bg-[#3A40B5]"></span>
              <span className="text-xs font-bold text-[#3A40B5] tracking-widest">종합 성과 지표</span>
              <h2 className="text-xl font-extrabold text-[#1A1D36]">전체 과정 종합 해석</h2>
            </div>

            {/* Key Metrics row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Overall Satisfaction Card */}
              <div className="bg-[#1A1D36] text-white p-5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] tracking-widest block text-gray-400">과정 종합 평점</span>
                <div className="my-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold">{stats.overallAverage}</span>
                  <span className="text-xs text-gray-400">/ {maxPoints.toFixed(2)} 점</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-gray-300">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>전체 표본 평균 정량 평점</span>
                </div>
              </div>

              {/* Assessment Grade Card */}
              <div className={`${currentGradeStyle.bg} ${currentGradeStyle.text} p-5 rounded-2xl border border-current bg-opacity-20 flex flex-col justify-center items-center text-center relative`}>
                <span className="text-[11px] tracking-widest block opacity-85 font-bold mb-3">종합 진단 등급</span>
                <span className="text-4xl font-extrabold mb-3">{report.overall_grade}</span>
                <p className="text-[10px] opacity-70 font-medium px-4 break-keep mt-2">
                  *기준: 우수(6.5+), 양호(6.0+), 보통(5.5+), 개선필요(5.5미만)
                </p>
              </div>

              {/* Responder Count Card */}
              <div className="bg-[#E8EAF6] text-[#3A40B5] p-5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] tracking-widest block text-gray-600">설문 응답 규모</span>
                <div className="my-3 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold">{stats.totalResponses}</span>
                  <span className="text-xs text-gray-600">명 완료</span>
                </div>
                <p className="text-[11px] font-semibold text-[#1A1D36]">유효 설문 수거 표본</p>
              </div>
            </div>

            {/* Core 4 Metrics Horizontal gauges */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-6">
              <h3 className="text-xs font-bold text-[#1A1D36] mb-3 uppercase tracking-wider">
                교육효과 4대 차원 분석 지표
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Quality */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span className="text-[#272A42]">교육 품질 평가</span>
                    <span className="text-[#3A40B5]">{stats.dimensionAverages.quality} / {maxPoints.toFixed(2)} 점</span>
                  </div>
                  <div className="w-full bg-[#E8EAF6] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#3A40B5] h-full" style={{ width: `${(stats.dimensionAverages.quality / maxPoints) * 100}%` }}></div>
                  </div>
                </div>

                {/* 2. Instructor */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span className="text-[#272A42]">강사 역량 평가</span>
                    <span className="text-[#3A40B5]">{stats.dimensionAverages.instructor} / {maxPoints.toFixed(2)} 점</span>
                  </div>
                  <div className="w-full bg-[#E8EAF6] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#3A40B5] h-full" style={{ width: `${(stats.dimensionAverages.instructor / maxPoints) * 100}%` }}></div>
                  </div>
                </div>

                {/* 3. Relevance */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span className="text-[#272A42]">실무 적용 및 현업 연계성</span>
                    <span className="text-[#3A40B5]">{stats.dimensionAverages.relevance} / {maxPoints.toFixed(2)} 점</span>
                  </div>
                  <div className="w-full bg-[#E8EAF6] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#3A40B5] h-full" style={{ width: `${(stats.dimensionAverages.relevance / maxPoints) * 100}%` }}></div>
                  </div>
                </div>

                {/* 4. Satisfaction */}
                <div>
                  <div className="flex justify-between text-xs mb-1 font-semibold">
                    <span className="text-[#272A42]">전반 만족도</span>
                    <span className="text-[#3A40B5]">{stats.dimensionAverages.satisfaction} / {maxPoints.toFixed(2)} 점</span>
                  </div>
                  <div className="w-full bg-[#E8EAF6] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#3A40B5] h-full" style={{ width: `${(stats.dimensionAverages.satisfaction / maxPoints) * 100}%` }}></div>
                  </div>
                </div>

              </div>
            </div>

            {/* Comprehensive AI Summary Section */}
            <div className="bg-[#E8EAF6]/40 p-6 rounded-2xl border border-[#C6C9E8]">
              <h3 className="text-xs font-bold text-[#3A40B5] mb-2 tracking-widest flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#3A40B5]" />
                종합 만족도 진단 해석
              </h3>
              <p className="text-sm text-[#272A42] leading-relaxed font-semibold">
                {report.executive_summary}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-[9px] text-[#727796] border-t border-gray-100 pt-3">
            <span>ABLEARN 교육 만족도 분석 시스템</span>
            <span>에이블런(ABLEARN)</span>
          </div>
        </div>

        {/* PAGE 3: 01 QUANTITATIVE ANALYTICS */}
        <div className="a4-page bg-white p-[15mm] border border-gray-100 shadow-xl flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex justify-between items-center text-[10px] font-mono text-[#727796] border-b border-gray-100 pb-3 mb-6 uppercase tracking-wider">
              <span>{courseTitle}</span>
              <span>{companyName} &bull; PAGE 3</span>
            </div>

            {/* Section Title */}
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1.5 h-6 bg-[#3A40B5]"></span>
              <span className="text-xs font-bold text-[#3A40B5] tracking-widest">제 1 장</span>
              <h2 className="text-xl font-extrabold text-[#1A1D36]">01 정량 지표 분석</h2>
            </div>
            
            <div className="mb-6 bg-gradient-to-r from-[#F2F4FC] to-white border-l-4 border-[#3A40B5] p-5 rounded-r-xl">
              <div className="flex items-center gap-3">
                <span className="text-xl font-extrabold text-[#3A40B5]">{companyName}</span>
                <span className="text-sm font-bold text-[#1A1D36]">수강생 대상 교육 만족도 정량 평가 결과입니다.</span>
              </div>
            </div>

            {/* Quantitative Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white border border-[#C6C9E8] rounded-xl p-4">
                <h3 className="text-xs font-extrabold text-[#1A1D36] mb-3 text-center uppercase">
                  교육효과 4대 차원 다변량 비교
                </h3>
                <div className="h-44 flex items-center justify-center">
                  <Bar
                    data={coreDimensionsChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      animation: { duration: 0 },
                      plugins: { legend: { display: false } },
                      scales: { y: { min: 0, max: maxPoints, grid: { color: "#E8EAF6" } } },
                    }}
                  />
                </div>
              </div>

              <div className="bg-white border border-[#C6C9E8] rounded-xl p-4">
                <h3 className="text-xs font-extrabold text-[#1A1D36] mb-1 text-center uppercase">
                  7점 척도 평점수 분포도 (전표본)
                </h3>
                <div className="flex justify-center mb-2">
                  <span className="bg-gray-50 border border-gray-100 px-2 py-0.5 rounded text-[9px] font-bold text-[#727796]">
                    Straight-lining 비율: {stats.straightLining.ratioPercentage}% ({stats.straightLining.count}명)
                  </span>
                </div>
                <div className="h-44 flex items-center justify-center">
                  <Bar
                    data={scoreDistributionChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      animation: { duration: 0 },
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true, grid: { color: "#E8EAF6" } } },
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 12 Question matrix Table */}
            <div className="border border-[#C6C9E8] rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1A1D36] text-white text-[10px] font-mono tracking-wider uppercase">
                    <th className="py-2.5 px-3">교육 평가 문항 일람</th>
                    <th className="py-2.5 px-3 border-l border-gray-700">차원 분류</th>
                    <th className="py-2.5 px-3 border-l border-gray-700 text-right">점수 (7.00)</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-[#272A42] divide-y divide-gray-100">
                  {stats.questionAverages.map((avgVal, idx) => {
                    let catLabel = "교육품질";
                    if (idx >= 3 && idx < 6) catLabel = "강사역량";
                    else if (idx >= 6 && idx < 9) catLabel = "실무적용성";
                    else if (idx >= 9) catLabel = "전반만족도";

                    let valColor = "text-[#3A40B5] font-bold";
                    if (avgVal >= 6) valColor = "text-emerald-600 font-extrabold";
                    else if (avgVal < 4) valColor = "text-red-500 font-extrabold";

                    return (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="py-2 px-3 font-semibold text-[11px] truncate">{questionTexts[idx]}</td>
                        <td className="py-2 px-3 text-[#727796] text-[10px]">{catLabel}</td>
                        <td className={`py-2 px-3 text-right border-l border-gray-100 font-mono ${valColor}`}>{avgVal} 점</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-[9px] text-[#727796] border-t border-gray-100 pt-3">
            <span>ABLEARN 교육 만족도 분석 시스템</span>
            <span>에이블런(ABLEARN)</span>
          </div>
        </div>

        {/* PAGE 4: 02 DEMOGRAPHICS SEGMENT ANALYSIS */}
        <div className="a4-page bg-white p-[15mm] border border-gray-100 shadow-xl flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex justify-between items-center text-[10px] font-mono text-[#727796] border-b border-gray-100 pb-3 mb-6 uppercase tracking-wider">
              <span>{courseTitle}</span>
              <span>{companyName} &bull; PAGE 4</span>
            </div>

            {/* Section Title */}
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1.5 h-6 bg-[#3A40B5]"></span>
              <span className="text-xs font-bold text-[#3A40B5] tracking-widest">제 2 장</span>
              <h2 className="text-xl font-extrabold text-[#1A1D36]">02 응답자 구성 분석</h2>
            </div>

            <p className="text-xs text-[#727796] mb-4 leading-relaxed">
              본 과정의 회사 응답자 분포를 직급 및 직무별 집단으로 세분화한 뒤 각 집단이 체감한 전반 만족도 평균과의 편차를 진단하여 세부 인사이트를 분석합니다.
            </p>

            {/* Demographics chart panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              
              {/* Position Distribution Panel */}
              <div className="bg-white border border-[#C6C9E8] rounded-xl p-4 flex flex-col">
                <h3 className="text-xs font-extrabold text-[#1A1D36] mb-3 border-b border-gray-100 pb-2">
                  직급별 참여자 비중 & 직급 만족도 평점
                </h3>
                <div className="space-y-3 my-auto">
                  {stats.positionStats.map((item) => (
                    <div key={item.groupName} className="text-xs">
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-gray-700">{item.groupName} ({item.count}명)</span>
                        <span className="text-[#3A40B5]">{item.average} / {maxPoints.toFixed(2)} 점</span>
                      </div>
                      <div className="w-full bg-[#E8EAF6] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#1A1D36] h-full" style={{ width: `${(item.average / maxPoints) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                  {stats.positionStats.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-6">직위 관련 데이터가 집계되지 않았습니다.</p>
                  )}
                </div>
              </div>

              {/* Job Distribution Panel */}
              <div className="bg-white border border-[#C6C9E8] rounded-xl p-4 flex flex-col">
                <h3 className="text-xs font-extrabold text-[#1A1D36] mb-3 border-b border-gray-100 pb-2">
                  직무군별 참여자 비중 & 직무 만족도 평점
                </h3>
                <div className="space-y-3 my-auto">
                  {stats.jobStats.map((item) => (
                    <div key={item.groupName} className="text-xs">
                      <div className="flex justify-between font-bold mb-1">
                        <span className="text-gray-700">{item.groupName} ({item.count}명)</span>
                        <span className="text-[#3A40B5]">{item.average} / {maxPoints.toFixed(2)} 점</span>
                      </div>
                      <div className="w-full bg-[#E8EAF6] h-2 rounded-full overflow-hidden">
                        <div className="bg-[#3A40B5] h-full" style={{ width: `${(item.average / maxPoints) * 100}%` }}></div>
                      </div>
                    </div>
                  ))}
                  {stats.jobStats.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-6">직무 관련 데이터가 집계되지 않았습니다.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Demographic Interpretation From AI */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h3 className="text-xs font-bold text-[#1A1D36] mb-2 uppercase tracking-wide flex items-center gap-1">
                <Users className="w-4 h-4 text-[#3A40B5]" />
                집단 간 만족도 편차 정성적 진단
              </h3>
              <p className="text-xs text-[#272A42] leading-relaxed font-semibold">
                {report.demographic_insight}
              </p>
            </div>

          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-[9px] text-[#727796] border-t border-gray-100 pt-3">
            <span>ABLEARN 교육 만족도 분석 시스템</span>
            <span>에이블런(ABLEARN)</span>
          </div>
        </div>

        {/* PAGE 5: 03 INSIGHTS - STRENGTHS & WEAKNESSES */}
        <div className="a4-page bg-white p-[15mm] border border-gray-100 shadow-xl flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex justify-between items-center text-[10px] font-mono text-[#727796] border-b border-gray-100 pb-3 mb-6 uppercase tracking-wider">
              <span>{courseTitle}</span>
              <span>{companyName} &bull; PAGE 5</span>
            </div>

            {/* Section Title */}
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1.5 h-6 bg-[#3A40B5]"></span>
              <span className="text-xs font-bold text-[#3A40B5] tracking-widest">제 3 장</span>
              <h2 className="text-xl font-extrabold text-[#1A1D36]">03 교육 만족 영역 및 개선 과제</h2>
            </div>

            {/* STRENGTHS BLOCK */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                <Award className="w-4.5 h-4.5" />
                교육 만족 핵심 강점 영역
              </div>

              {report.strengths.map((str, idx) => (
                <div key={idx} className="bg-emerald-50 bg-opacity-25 border-l-4 border-emerald-500 rounded-r-2xl p-4 text-xs">
                  <h4 className="font-bold text-[#1A1D36] text-[13px] mb-1">{idx + 1}. {str.title}</h4>
                  <p className="text-gray-700 leading-relaxed font-normal mb-2">{str.description}</p>
                  <div className="text-[10px] font-mono font-semibold text-emerald-800 bg-emerald-100 bg-opacity-50 px-2 py-1 inline-block rounded">
                    데이터 근거: {str.evidence}
                  </div>
                </div>
              ))}
            </div>

            {/* WEAKNESS BLOCK */}
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-red-700 text-xs font-bold uppercase tracking-wider">
                <AlertCircle className="w-4.5 h-4.5" />
                향후 보완 및 개선 과제
              </div>

              {report.weaknesses.map((wea, idx) => (
                <div key={idx} className="bg-red-50 bg-opacity-25 border-l-4 border-red-500 rounded-r-2xl p-4 text-xs">
                  <h4 className="font-bold text-[#1A1D36] text-[13px] mb-1">{idx + 1}. {wea.title}</h4>
                  <p className="text-gray-700 leading-relaxed font-normal mb-2">{wea.description}</p>
                  <div className="text-[10px] font-mono font-semibold text-red-800 bg-red-100 bg-opacity-50 px-2 py-1 inline-block rounded">
                    상관관계 및 지표 근거: {wea.evidence}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-[9px] text-[#727796] border-t border-gray-100 pt-3">
            <span>ABLEARN 교육 만족도 분석 시스템</span>
            <span>에이블런(ABLEARN)</span>
          </div>
        </div>

        {/* PAGE 6: 04 SUBJECTIVE TEXT ANALYSIS */}
        <div className="a4-page bg-white p-[15mm] border border-gray-100 shadow-xl flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex justify-between items-center text-[10px] font-mono text-[#727796] border-b border-gray-100 pb-3 mb-6 uppercase tracking-wider">
              <span>{courseTitle}</span>
              <span>{companyName} &bull; PAGE 6</span>
            </div>

            {/* Section Title */}
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1.5 h-6 bg-[#3A40B5]"></span>
              <span className="text-xs font-bold text-[#3A40B5] tracking-widest">제 4 장</span>
              <h2 className="text-xl font-extrabold text-[#1A1D36]">04 주관식 정성 텍스트 심층 분석</h2>
            </div>

            {/* Keyword frequencies in Q14 Improvements */}
            <div className="mb-6">
              {/* R13 Most Helpful Themes */}
              <div className="bg-[#F2F4FC] border border-[#C6C9E8] rounded-xl p-5 text-xs flex flex-col justify-between print:break-inside-avoid">
                <div>
                  <h3 className="text-xs font-bold text-[#3A40B5] mb-2 tracking-wider flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    교육 만족 요인 핵심 분석 결과
                  </h3>
                  <p className="font-semibold text-[#1A1D36] mb-4 text-[11px] leading-relaxed break-keep">
                    {report.most_helpful.summary}
                  </p>
                </div>
                <div className="space-y-3">
                  {report.most_helpful.themes.slice(0, 3).map((t, i) => (
                    <div key={i} className="bg-white p-3 rounded-lg border border-[#D4D7F4]">
                      <div className="flex justify-between items-center mb-1 font-bold">
                        <span className="text-[#3A40B5]">{t.theme}</span>
                        <span className="text-[#727796] text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">{t.mentions}</span>
                      </div>
                      <p className="text-[#727796] italic text-[10px] break-keep break-words whitespace-normal text-wrap">"{t.example}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Freetext analysis (Q15) */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 print:break-inside-avoid">
              <h3 className="text-xs font-bold text-[#1A1D36] mb-2 tracking-wide flex items-center gap-1">
                <Quote className="w-4.5 h-4.5 text-[#3A40B5]" />
                추가 개선 의견 분석
              </h3>
              <p className="text-xs text-[#272A42] leading-relaxed mb-4 font-semibold">
                {report.freetext_analysis.summary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {report.freetext_analysis.themes.slice(0, 2).map((t, idx) => {
                  let sentimentBadge = "bg-green-100 text-green-800";
                  if (t.sentiment === "부정") sentimentBadge = "bg-red-100 text-red-800";
                  else if (t.sentiment === "중립") sentimentBadge = "bg-gray-100 text-gray-800";

                  return (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 text-xs flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-[#1A1D36]">{t.theme}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${sentimentBadge}`}>{t.sentiment}</span>
                      </div>
                      <p className="text-[#727796] italic text-[11px] leading-relaxed">
                        &ldquo;{t.quote}&rdquo;
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-[9px] text-[#727796] border-t border-gray-100 pt-3">
            <span>ABLEARN 교육 만족도 분석 시스템</span>
            <span>에이블런(ABLEARN)</span>
          </div>
        </div>

        {/* PAGE 7: 05 NEXT COURSE RECOMMENDATION */}
        <div className="a4-page bg-white p-[15mm] border border-gray-100 shadow-xl flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex justify-between items-center text-[10px] font-mono text-[#727796] border-b border-gray-100 pb-3 mb-6 uppercase tracking-wider">
              <span>{courseTitle}</span>
              <span>{companyName} &bull; PAGE 7</span>
            </div>

            {/* Section Title */}
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1.5 h-6 bg-[#3A40B5]"></span>
              <span className="text-xs font-bold text-[#3A40B5] tracking-widest">제 5 장</span>
              <h2 className="text-xl font-extrabold text-[#1A1D36]">05 후속 교육 추천 교육과정</h2>
            </div>

            <p className="text-xs text-[#727796] mb-6 leading-relaxed">
              만족도 진단 데이터에서 관측된 정량적 약점 영역과 정성 요구사항 태그를 에이블런 교육 카탈로그의 '대응 약점 태그' 필드와 논리 매칭하여 추천 과정을 선별하였습니다.
            </p>

            {/* Recommendation Process Cards */}
            <div className="space-y-4">
              {report.recommendations.slice(0, 2).map((rec, i) => {
                // Find matching course in our catalog to fetch additional parameters like targets and hour
                const courseMeta = catalog.find((c) => c.courseName === rec.course_name);

                return (
                  <div key={i} className="bg-[#E8EAF6]/30 border border-[#C6C9E8] rounded-2xl p-5 text-xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#1A1D36] text-white font-mono px-2 py-0.5 rounded-md text-[10px] font-bold">
                          우선순위 &bull; P{rec.priority}
                        </span>
                        <h4 className="font-extrabold text-[#1A1D36] text-[14px]">
                          {rec.course_name}
                        </h4>
                      </div>
                      
                      {courseMeta && (
                        <div className="flex gap-1.5 text-[9px] font-bold">
                          <span className="bg-white border border-[#C6C9E8] text-[#3A40B5] px-2 py-0.5 rounded-full">
                            {courseMeta.difficulty}
                          </span>
                          <span className="bg-white border border-[#C6C9E8] text-[#3A40B5] px-2 py-0.5 rounded-full">
                            {courseMeta.targetRank} 대상
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1 leading-relaxed text-gray-700">
                      <div>
                        <p className="text-[10px] font-bold text-[#727796] uppercase mb-0.5">매칭된 약점 지표 및 근거</p>
                        <p className="font-semibold text-red-700 text-[11px] mb-1">{rec.linked_weakness}</p>
                        <p className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block mb-2 text-wrap">{rec.linked_evidence}</p>

                        <p className="text-[10px] font-bold text-[#727796] uppercase mb-0.5">추천 목적과 방향</p>
                        <p className="text-[11px] break-keep">{rec.rationale}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-bold text-[#727796] uppercase mb-0.5">교육 이수 후 기대 효과</p>
                        <p className="text-[11px] mb-2 break-keep">{rec.expected_effect}</p>

                        <p className="text-[10px] font-bold text-[#727796] uppercase mb-0.5">권장 수강 대상</p>
                        <p className="text-[10px] text-[#272A42] font-semibold">{rec.target}</p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {report.recommendations.length === 0 && (
                <div className="p-8 border border-[#C6C9E8] border-dashed rounded-2xl text-center text-[#727796]">
                  현 카탈로그에 해당 약점 영역을 보완할 수 있는 적정 결합 과정이 부족합니다.
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-[9px] text-[#727796] border-t border-gray-100 pt-3">
            <span>ABLEARN 교육 만족도 분석 시스템</span>
            <span>에이블런(ABLEARN)</span>
          </div>
        </div>

        {/* PAGE 8: 06 GENERAL CONSULTANT REMARKS */}
        <div className="a4-page bg-white p-[15mm] border border-gray-100 shadow-xl flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex justify-between items-center text-[10px] font-mono text-[#727796] border-b border-gray-100 pb-3 mb-6 uppercase tracking-wider">
              <span>{courseTitle}</span>
              <span>{companyName} &bull; PAGE 8</span>
            </div>

            {/* Section Title */}
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1.5 h-6 bg-[#3A40B5]"></span>
              <span className="text-xs font-bold text-[#3A40B5] tracking-widest">제 6 장</span>
              <h2 className="text-xl font-extrabold text-[#1A1D36]">06 교육 효과성 인증 및 제언</h2>
            </div>

            {/* Final closure speech card */}
            <div className="bg-[#1A1D36] text-[#E8EAF6] rounded-2xl p-8 mb-6 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 text-gray-800 opacity-20 pointer-events-none">
                <Brain className="w-44 h-44" />
              </div>

              <h3 className="text-sm font-bold tracking-widest text-[#D4D7F4] mb-3 flex items-center gap-1.5">
                <Compass className="w-5 h-5" />
                종합 결과 및 실행 로드맵
              </h3>
              
              <div className="space-y-4 text-xs font-sans text-gray-300 leading-relaxed">
                <p className="whitespace-pre-wrap leading-relaxed text-[13px] text-justify">
                  {report.closing_remarks}
                </p>
                <p className="text-gray-400">
                  수강사 임직원의 적극적인 리터러시 함양과 현업 실무 연계를 위하여, 기획 전선에서 제시된 후속 과정 추천 로드맵에 맞추어 연계 제안을 검토하시는 것을 강력히 제언드립니다.
                </p>
              </div>
            </div>

            {/* Limitations Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs mt-4 print:break-inside-avoid">
              <h3 className="font-bold text-[#1A1D36] tracking-widest text-[10px] mb-2 uppercase flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                분석의 한계 사항
              </h3>
              <p className="text-[#727796] leading-relaxed break-keep">
                {report.limitations}
              </p>
            </div>

            {/* ABLEARN Signoff Stamp visual */}
            <div className="flex justify-end items-center gap-10 mt-8 bg-gray-50 border border-gray-200 rounded-2xl p-6 print:break-inside-avoid">
              <div className="text-right text-xs">
                <p className="text-[#727796] block text-[10px] tracking-wider">주요 검수 컨설팅 위원</p>
                <p className="font-extrabold text-[#1A1D36] tracking-tight">수석 교육컨설팅 전문가 위원단</p>
                <p className="text-[#727796] text-[10px] mt-0.5">에이블런(ABLEARN) HRD 사업본부</p>
              </div>
              <div className="w-16 h-16 flex items-center justify-center flex-shrink-0 select-none">
                <img src="https://cdn.imweb.me/upload/S202101041a4e45576971e/f9f2d57513b3c.png" alt="ABLEARN APPROVED" className="w-full object-contain opacity-80" />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="flex justify-between items-center text-[9px] text-[#727796] border-t border-gray-100 pt-3">
            <span>ABLEARN 교육 만족도 분석 시스템 &bull; 종합 진단 완료</span>
            <span>에이블런(ABLEARN)</span>
          </div>
        </div>

      </div>
    </div>
  );
}
