import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { DiagnosticResult, OrgSummaryData } from './types';
import { sanitizeHeader, normalizeRow } from './utils/csv';
import { calculateScores } from './utils/scoring';
import { generateOrgSummary } from './utils/recommend';
import OrgSummary from './components/OrgSummary';
import IndividualReport from './components/IndividualReport';
import DiagnosticForm from './components/DiagnosticForm';
import { ITEM_MASTER } from './data/itemMaster';

const App: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [orgSummary, setOrgSummary] = useState<OrgSummaryData | null>(null);
  const [activeTab, setActiveTab] = useState<"form" | "org" | "indiv">("form");
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [maxPoints, setMaxPoints] = useState<number>(4);
  const zipCancelRef = useRef<boolean>(false);

  const downloadAllAsZip = async () => {
    if (results.length === 0) return;
    setIsZipping(true);
    zipCancelRef.current = false;
    
    try {
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');
      const { toJpeg } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const total = results.length;
      const zip = new JSZip();

      for (let i = 0; i < total; i++) {
        if (zipCancelRef.current) {
          setIsZipping(false);
          setZipProgress(null);
          return;
        }

        const current = results[i];
        
        // Show progress UI and render ONLY this person's report
        setZipProgress({
          current: i + 1,
          total,
          name: current.name
        });

        // Wait a small moment (70ms) to let React mount/render the report
        // and Chart.JS do its layout (it's instant with animation: false)
        await new Promise(r => setTimeout(r, 70));

        if (zipCancelRef.current) {
          setIsZipping(false);
          setZipProgress(null);
          return;
        }

        const safeEmail = current.email.replace(/[^a-zA-Z0-9]/g, '');
        const element = document.getElementById(`individual-report-${safeEmail}`);
        if (!element) {
          // Fallback retry with a bit longer delay
          await new Promise(r => setTimeout(r, 120));
        }
        
        const el = document.getElementById(`individual-report-${safeEmail}`);
        if (!el) {
          console.warn(`Element not found for ${current.name} (${current.email})`);
          continue;
        }

        const originalBorder = el.style.border;
        const originalShadow = el.style.boxShadow;
        el.style.border = 'none';
        el.style.boxShadow = 'none';

        // pixelRatio: 2 is sharp, and since we render only ONE DOM element at a time, 
        // memory usage is tiny and it's extremely fast!
        const imgData = await toJpeg(el, { quality: 0.95, pixelRatio: 2, backgroundColor: '#ffffff', skipFonts: true });
        
        el.style.border = originalBorder;
        el.style.boxShadow = originalShadow;
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const elWidth = el.offsetWidth * 2;
        const elHeight = el.offsetHeight * 2;
        
        let imgWidthInMm = pdfWidth; 
        let imgHeightInMm = (elHeight * pdfWidth) / elWidth;
        
        if (imgHeightInMm > pdfHeight && imgHeightInMm < pdfHeight * 1.3) {
          const ratio = pdfHeight / imgHeightInMm;
          imgHeightInMm = imgHeightInMm * ratio;
          imgWidthInMm = imgWidthInMm * ratio;
        }

        let heightLeft = imgHeightInMm;
        let position = 0;
        const xOffset = (pdfWidth - imgWidthInMm) / 2;

        pdf.addImage(imgData, 'JPEG', xOffset, position, imgWidthInMm, imgHeightInMm);
        heightLeft -= pdfHeight;

        while (heightLeft > 5) { 
          position = heightLeft - imgHeightInMm;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', xOffset, position, imgWidthInMm, imgHeightInMm);
          heightLeft -= pdfHeight;
        }

        const pdfBlob = pdf.output('blob');
        zip.file(`AI역량진단_${current.name}_리포트.pdf`, pdfBlob);
      }

      if (zipCancelRef.current) {
        setIsZipping(false);
        setZipProgress(null);
        return;
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `개인별리포트_일괄다운로드.zip`);
      
    } catch (err: any) {
      console.error(err);
      alert('ZIP 파일 생성 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setIsZipping(false);
      setZipProgress(null);
    }
  };

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (csv) => {
        try {
          const cleaned = csv.data.map((row: any) => {
            const newRow: any = {};
            Object.keys(row).forEach(k => { newRow[sanitizeHeader(k)] = row[k]; });
            return newRow;
          });

          const processed = cleaned.map(row => {
            const norm = normalizeRow(row);
            return calculateScores(norm, maxPoints);
          });

          const summary = generateOrgSummary(processed);
          const missCounts: Record<string, number> = {};
          processed.forEach(p => {
            Object.entries(p.questionCorrectness).forEach(([qId, ok]) => {
              if (!ok) missCounts[qId] = (missCounts[qId] || 0) + 1;
            });
          });

          const areaMap: Record<string, string> = {
            Understanding: "기초이해",
            Prompting: "프롬프팅",
            Evaluation: "결과검증",
            Practical: "실무활용",
            Ethics: "윤리보안",
            Automation: "업무자동화"
          };

          // 상위 5개 오답 문항 추출
          const topMissed = Object.entries(missCounts)
            .map(([id, count]) => {
              const item = ITEM_MASTER.find((m: any) => m.questionId === id);
              const areaName = item ? areaMap[item.area] : "기타";
              
              let insight = `${areaName} 영역의 핵심 개념 보완이 필요합니다.`;
              if (item) {
                switch(item.area) {
                  case "Understanding":
                    insight = `[${areaName}] 생성형 AI의 확률적 작동 원리와 기술적 한계에 대한 정확한 인지가 부족합니다. 모델의 '예측' 특성을 고려한 검증 역량 강화가 필요합니다.`;
                    break;
                  case "Prompting":
                    insight = `[${areaName}] 구체적인 페르소나 설정 및 제약 조건을 활용한 프롬프트 구조화 능력이 낮습니다. 결과물의 품질을 결정짓는 핵심 지시문 설계 실습이 권장됩니다.`;
                    break;
                  case "Evaluation":
                    insight = `[${areaName}] AI 출력물의 할루시네이션(환각) 및 논리적 오류를 식별하는 비판적 검토 능력이 보완되어야 합니다. 교차 검증 프로세스 학습이 필요합니다.`;
                    break;
                  case "Practical":
                    insight = `[${areaName}] 실무 시나리오에 AI를 적절히 배치하고 업무 흐름에 통합하는 적용 역량이 낮습니다. 직무별 베스트 프랙티스 학습을 통한 활용도 제고가 시급합니다.`;
                    break;
                  case "Ethics":
                    insight = `[${areaName}] 사내 보안 가이드라인 및 저작권 준수 등 AI 윤리 의식의 실무 적용이 미흡합니다. 데이터 유출 방지를 위한 기술적/윤리적 조치 습득이 필요합니다.`;
                    break;
                  case "Automation":
                    insight = `[${areaName}] 반복 업무를 자동화하기 위한 데이터 구조화 및 예외 처리 설계 로직이 부족합니다. 안정적인 자동화 파이프라인 구축을 위한 기술 교육이 필요합니다.`;
                    break;
                }
                if (item.gate) insight = `(핵심/필수) ${insight} 이 문항은 인증을 위한 필수 항목으로 최우선 보완 대상입니다.`;
              }

              return {
                id,
                missRate: Math.round((count / processed.length) * 100),
                intent: item?.intent || "역량 평가 항목",
                area: item?.area || "Understanding",
                insight
              };
            })
            .sort((a, b) => b.missRate - a.missRate)
            .slice(0, 5);

          summary.topMissedQuestions = topMissed;

          setResults(processed);
          setOrgSummary(summary);
          setError(null);
          setActiveTab("org");
        } catch (err: any) {
          setError(err.message || "파일 처리 중 오류가 발생했습니다.");
        }
      }
    });
  };

  const handleTestComplete = (result: DiagnosticResult) => {
    setResults([result]);
    setActiveTab("indiv");
    setSelectedIdx(0);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Global Header to switch apps */}
      <header className="sticky top-0 z-50 bg-indigo-900 text-white px-6 py-4 flex items-center justify-between no-print shadow-md">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 px-3 py-1.5 rounded-lg text-xs font-black tracking-widest text-white shadow-md font-mono">
            ABLEARN
          </div>
          <h2 className="text-sm font-bold tracking-wider opacity-80 hidden sm:block">AI 역량 진단 시스템</h2>
          <button onClick={() => window.location.href = '/'} className="ml-4 text-xs bg-indigo-800 hover:bg-indigo-700 px-3 py-1.5 rounded border border-indigo-700 transition">← 메인으로</button>
        </div>
        <button 
          onClick={() => window.location.href = "?app=edu"}
          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
           교육 만족도 진단 리포트로 이동
        </button>
      </header>

      <div className="max-w-5xl mx-auto pt-10 px-4 no-print">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-100 mb-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-10">
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-black text-indigo-900 mb-2 tracking-tight">AI Competency Insight</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Diagnostic Pro & Online Testing</p>
            </div>
            <div className="flex gap-4 items-center">
              <button 
                onClick={() => setActiveTab("form")}
                className={`px-8 py-3 rounded-2xl font-black text-sm transition-all ${activeTab === 'form' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}
              >
                직접 진단하기
              </button>
              <div className="flex items-center bg-slate-900 rounded-2xl p-1 shadow-lg">
                <select 
                  className="bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl outline-none border-none cursor-pointer hover:bg-slate-700 transition appearance-none"
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(Number(e.target.value))}
                >
                  <option value={4}>4점 만점</option>
                  <option value={5}>5점 만점</option>
                  <option value={7}>7점 만점</option>
                </select>
                <div className="w-px h-5 bg-slate-700 mx-1"></div>
                <input 
                  id="csv-upload" type="file" accept=".csv" onChange={onFileUpload} className="hidden"
                />
                <label htmlFor="csv-upload" className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-sm cursor-pointer hover:bg-slate-800 transition">
                  CSV 업로드
                </label>
              </div>
            </div>
          </div>

          {error && <div className="mb-8 p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold border border-rose-100">{error}</div>}

          {results.length > 0 && (
            <div className="flex flex-col md:flex-row items-center gap-6 pt-6 border-t border-slate-50">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
                {results.length > 1 && (
                  <button 
                    onClick={() => setActiveTab("org")}
                    className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === "org" ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    조직 전략 요약
                  </button>
                )}
                <button 
                  onClick={() => setActiveTab("indiv")}
                  className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === "indiv" ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {results.length > 1 ? '개인별 리포트' : '진단 결과 리포트'}
                </button>
              </div>

              {activeTab === "indiv" && results.length > 1 && (
                <div className="flex-1 flex items-center gap-4 w-full">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap hidden sm:inline">Target:</span>
                  <select 
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                    onChange={(e) => setSelectedIdx(Number(e.target.value))}
                    value={selectedIdx}
                  >
                    {results.map((r, i) => <option key={i} value={i}>{r.name} ({r.email})</option>)}
                  </select>
                  <button 
                    onClick={downloadAllAsZip}
                    disabled={isZipping}
                    className={`ml-auto px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${isZipping ? 'bg-slate-300 text-white cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'}`}
                  >
                    {isZipping ? '압축 중...' : '전체 ZIP 다운로드'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <main className="max-w-5xl mx-auto pb-20 px-4">
        {activeTab === "form" ? (
          <DiagnosticForm onComplete={handleTestComplete} />
        ) : (
          results.length > 0 ? (
            activeTab === "org" && orgSummary ? (
              <OrgSummary data={orgSummary} />
            ) : (
              results[selectedIdx] && <IndividualReport current={results[selectedIdx]} />
            )
          ) : (
            <div className="max-w-2xl mx-auto mt-20 p-24 border-[4px] border-dashed border-slate-200 rounded-[4rem] bg-white flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center text-4xl mb-8">📊</div>
              <h2 className="text-2xl font-black text-slate-300 mb-3 tracking-tight">시작하려면 메뉴를 선택하세요</h2>
              <p className="text-slate-200 font-bold max-w-xs leading-relaxed">직접 진단을 받거나, 구글폼 응답 데이터를 업로드하여 분석 리포트를 생성할 수 있습니다.</p>
            </div>
          )
        )}
      </main>
      
      {/* Hidden container for rendering ONE report at a time to export as ZIP */}
      {zipProgress && (
        <div style={{ position: 'absolute', top: -9999, left: -9999, pointerEvents: 'none', opacity: 0 }}>
          {results[zipProgress.current - 1] && (
            <IndividualReport 
              key={zipProgress.current}
              current={results[zipProgress.current - 1]} 
              isHiddenMode={true} 
            />
          )}
        </div>
      )}

      {/* ZIP Progress Modal */}
      {zipProgress && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner animate-bounce">
              📦
            </div>
            
            <h3 className="text-xl font-black text-slate-800 mb-2">개인별 리포트 ZIP 일괄 변환</h3>
            <p className="text-xs text-slate-400 font-bold mb-6 leading-relaxed">
              한 번에 하나씩 고화질 PDF로 변환하여 실시간으로 압축파일에 추가합니다. (브라우저 중단 방지 기술 가동 중)
            </p>
            
            {/* Progress Bar Container */}
            <div className="w-full bg-slate-100 h-3 rounded-full mb-3 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${Math.round((zipProgress.current / zipProgress.total) * 100)}%` }}
              ></div>
            </div>
            
            {/* Detailed Info */}
            <div className="flex justify-between w-full text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
              <span>진행률</span>
              <span className="text-indigo-600 font-bold">
                {Math.round((zipProgress.current / zipProgress.total) * 100)}%
              </span>
            </div>
            
            <p className="text-sm font-black text-indigo-950 mb-1">
              {zipProgress.name} 님의 리포트 변환 중...
            </p>
            <p className="text-xs text-slate-400 font-bold mb-6">
              ( {zipProgress.current} / {zipProgress.total}명 처리 중 )
            </p>
            
            <button 
              onClick={() => { zipCancelRef.current = true; }}
              className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-black transition-all cursor-pointer"
            >
              변환 취소 (Cancel)
            </button>
          </div>
        </div>
      )}

      <footer className="max-w-5xl mx-auto py-10 px-4 border-t border-slate-200 no-print">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 opacity-50">
          <p className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase text-center md:text-left whitespace-nowrap">AI Competency Insight Report</p>
          <p className="text-[10px] font-bold text-slate-400 text-center md:text-right whitespace-nowrap">© 2026 Ablearn AI Diagnostic</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
