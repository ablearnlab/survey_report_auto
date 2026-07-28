import React, { useState } from 'react';
import { OrgSummaryData, LevelName } from '../types';
import RadarChart from './RadarChart';
import { toCanvas, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

const OrgSummary: React.FC<{ data: OrgSummaryData }> = ({ data }) => {
  const [isExporting, setIsExporting] = useState(false);

  const downloadPdf = async () => {
    if (isExporting) return;
    const element = document.getElementById('org-summary-report');
    if (!element) {
      alert("Element not found");
      return;
    }
    
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 100)); // allow UI update

    try {
      const originalBorder = element.style.border;
      const originalShadow = element.style.boxShadow;
      element.style.border = 'none';
      element.style.boxShadow = 'none';

      // Capture using html-to-image directly from the live DOM
      const imgData = await toJpeg(element, {
        quality: 1.0,
        pixelRatio: 4,
        backgroundColor: '#ffffff',
        skipFonts: true
      });

      // Restore original styling
      element.style.border = originalBorder;
      element.style.boxShadow = originalShadow;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = element.offsetWidth || 794;
      const canvasHeight = element.offsetHeight || 1122;
      
      const imgWidthInMm = pdfWidth; 
      const imgHeightInMm = (canvasHeight * pdfWidth) / canvasWidth;
      
      let heightLeft = imgHeightInMm;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidthInMm, imgHeightInMm);
      heightLeft -= pdfHeight;

      // Add subsequent pages
      while (heightLeft > 5) {
        position = heightLeft - imgHeightInMm;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidthInMm, imgHeightInMm);
        heightLeft -= pdfHeight;
      }

      pdf.save(`AI역량진단_조직전략보고서.pdf`);
    } catch (err: any) {
      console.error('PDF manual export error:', err);
      alert('PDF 생성 중 오류가 발생했습니다: ' + (err.message || String(err)));
    } finally {
      setIsExporting(false);
    }
  };

  const radarData = Object.entries(data.areaAverages).map(([area, percentage]) => ({
    area: area as any,
    percentage,
    score: 0, max: 0
  }));

  const areaMap: Record<string, string> = {
    Understanding: "기초이해",
    Prompting: "프롬프팅",
    Evaluation: "결과검증",
    Practical: "실무활용",
    Ethics: "윤리보안",
    Automation: "업무자동화"
  };

  const trackLabels: Record<string, string> = {
    "AI Literacy & Prompt": "T1",
    "Data & Analysis x AI": "T2",
    "Automation x AI": "T3",
    "Domain/Business x AI": "T4",
    "Dev/Platform/Cloud": "T5"
  };

  return (
    <div className="space-y-10 py-10">
      <div className="flex justify-between items-center no-print px-4">
        <div className="flex flex-col">
          <h2 className="text-3xl font-black text-indigo-900">전략적 조직 분석 리포트</h2>
          <p className="text-slate-400 text-sm font-bold mt-1">* 업로드된 CSV 데이터의 통계적 분석 결과입니다.</p>
        </div>
        <button 
          onClick={downloadPdf} 
          disabled={isExporting}
          className={`px-8 py-3 rounded-2xl font-black text-sm cursor-pointer transition shadow-lg flex items-center gap-2 ${isExporting ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
        >
          {isExporting ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              PDF 저장 중...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              조직 보고서 PDF 저장
            </>
          )}
        </button>
      </div>

      <div className="flex justify-center">
        <div id="org-summary-report" className="flex flex-col items-center bg-white text-slate-900 shadow-2xl print:shadow-none" style={{ width: '210mm' }}>
        
        {/* PAGE 1: 조직 AI 역량 진단 보고서 */}
        <div className="bg-white p-[15mm] relative flex flex-col overflow-hidden" style={{ width: '210mm', height: '296.8mm', boxSizing: 'border-box', fontSize: 'initial' }}>
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50/50 rounded-full -mr-40 -mt-40"></div>
          
          {/* Header - Increased Hierarchy */}
          <div className="border-b-[5px] border-indigo-600 pb-6 mb-8 relative z-10">
            <div className="flex justify-between items-end gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-1.5 text-indigo-950 whitespace-nowrap">조직 AI 역량 진단 보고서</h1>
                <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-[0.25em] whitespace-nowrap">Diagnostic Overview & Competency Gap</p>
              </div>
              <div className="text-right flex flex-col items-end gap-1.5 whitespace-nowrap">
                <div className="bg-slate-900 text-white px-3 py-1 rounded-xl text-center shadow-lg mb-1 flex items-center gap-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Samples</span>
                  <span className="text-[13px] font-black">{data.totalCount}<span className="text-[9px] ml-0.5 font-bold opacity-80">명</span></span>
                </div>
                <p className="text-[9px] font-bold text-slate-500"><span className="text-slate-400 mr-1.5 uppercase tracking-wider">진단기간</span> 2026. 06 (기본)</p>
                <p className="text-[9px] font-bold text-slate-500"><span className="text-slate-400 mr-1.5 uppercase tracking-wider">발행일자</span> {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Section 1: Level & Radar - Increased gap and font */}
          <div className="mb-6 relative z-10">
            <div className="flex items-center gap-2.5 mb-3 whitespace-nowrap">
              <span className="bg-indigo-600 text-white w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px]">01</span>
              <h3 className="text-base font-black text-slate-800 tracking-tight whitespace-nowrap">역량 수준 분포 및 6대 영역 성취도</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6 items-center bg-slate-50/50 p-5 rounded-[2rem] border border-slate-100">
              <div className="space-y-1.5">
                {(Object.entries(data.levelDistribution) as [LevelName, { count: number; percentage: number; description: string }][]).map(([level, info]) => (
                  <div key={level} className={`p-3 rounded-2xl border transition-all ${info.percentage > 30 ? 'bg-white border-indigo-200 shadow-sm' : 'bg-white/50 border-slate-100'}`}>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[11px] font-black text-slate-700">{level}</span>
                      <span className="text-[13px] font-black text-indigo-600">{info.percentage}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-1">
                      <div className="h-full bg-indigo-600" style={{ width: `${info.percentage}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-tight line-clamp-1">{info.description}</p>
                  </div>
                ))}
              </div>
              <div className="h-44 flex items-center justify-center relative">
                 <RadarChart data={radarData} />
              </div>
            </div>
          </div>

          {/* Section 2: Top Missed - Larger body text */}
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="flex items-center gap-2.5 mb-3 whitespace-nowrap">
              <span className="bg-rose-600 text-white w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px]">02</span>
              <h3 className="text-base font-black text-slate-800 tracking-tight whitespace-nowrap">취약 포인트 분석 (오답률 TOP 3)</h3>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {data.topMissedQuestions.slice(0, 3).map((q, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-[1.2rem]">
                  <div className="flex flex-col items-center justify-center w-[56px] h-[56px] bg-white border border-rose-100 rounded-xl shadow-sm flex-shrink-0">
                    <span className="text-[12px] font-black text-rose-600 leading-none mb-1">Q{q.id.replace('Q','')}</span>
                    <span className="text-[12px] font-black text-slate-400 leading-none">{q.missRate}%</span>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="mb-1.5 leading-tight">
                      <span className="inline-block align-middle text-[9.5px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded uppercase tracking-tighter shadow-sm mr-2 -mt-0.5 whitespace-nowrap">{areaMap[q.area]}</span>
                      <h4 className="inline align-middle text-[13px] font-black text-slate-900 break-keep">{q.intent}</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 font-bold leading-relaxed break-keep">
                      <span className="text-rose-500 font-black mr-1">[!]</span> {q.insight}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer 1 */}
          <div className="mt-auto pt-4 flex justify-between items-center opacity-40 border-t border-slate-100 gap-4">
            <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase whitespace-nowrap">2026 Ablearn AI Diagnostic</p>
            <p className="text-[9px] font-black text-slate-400 tracking-tighter whitespace-nowrap">Part 1. Diagnostic Summary</p>
          </div>
        </div>

        {/* PAGE 2: 조직 맞춤형 교육 전략 제안 */}
        <div className="bg-white p-[15mm] relative flex flex-col overflow-hidden" style={{ width: '210mm', height: '296.8mm', boxSizing: 'border-box', fontSize: 'initial' }}>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-50/50 rounded-full -ml-40 -mb-40"></div>

          <div className="flex justify-between items-end border-b-[5px] border-indigo-600 pb-6 mb-7 relative z-10 gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-1.5 text-indigo-950 whitespace-nowrap">조직 맞춤형 교육 전략 제안</h1>
              <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-[0.25em] whitespace-nowrap">Education Roadmap & Strategy</p>
            </div>
            <div className="text-right flex flex-col items-end gap-1 whitespace-nowrap">
              <p className="text-[9px] font-bold text-slate-500"><span className="text-slate-400 mr-1 uppercase tracking-wider">진단기간</span> 2026. 06 (기본)</p>
              <p className="text-[9px] font-bold text-slate-500"><span className="text-slate-400 mr-1 uppercase tracking-wider">발행일자</span> {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* Section 3: Priority Areas - Larger labels */}
          <div className="mb-8 relative z-10">
            <div className="flex items-center gap-2.5 mb-4 whitespace-nowrap">
              <span className="bg-indigo-600 text-white w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px]">01</span>
              <h3 className="text-base font-black text-slate-800 tracking-tight whitespace-nowrap">우선 강화 대상 역량</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {data.priorityAreas.map((pa, idx) => (
                <div key={idx} className="bg-white p-5 rounded-[1.8rem] border border-indigo-100 shadow-sm flex items-center gap-5">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-indigo-100 flex-shrink-0">
                    <span className="text-[8px] font-bold opacity-70 mb-0.5">RANK</span>
                    <span className="text-xl font-black leading-none">{idx + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-black text-indigo-950 mb-1">{areaMap[pa.area]} 영역</h4>
                    <p className="text-[11px] font-bold text-slate-500">
                      평균 성취도: <span className="text-rose-500 font-black">{pa.percentage}%</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Education Roadmap - Hierarchy within cards */}
          <div className="relative z-10 mb-2 overflow-hidden">
            <div className="flex items-center gap-2.5 mb-4 whitespace-nowrap">
              <span className="bg-indigo-600 text-white w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px]">02</span>
              <h3 className="text-base font-black text-slate-800 tracking-tight whitespace-nowrap">핵심 연계 교육 트랙 및 추천 과정</h3>
            </div>
            <div className="space-y-3">
              {data.recommendations.commonTracks.map((rec, i) => (
                <div key={i} className="bg-white border border-slate-200 p-5 rounded-[2rem] shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-4 relative z-10">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-[13px] flex-shrink-0">
                      {trackLabels[rec.track]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-black text-indigo-900 leading-tight mb-1.5 break-keep">{rec.track}</h4>
                      <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black uppercase whitespace-nowrap inline-block">Target: {rec.targetLevel}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 mb-3 relative z-10">
                    {rec.courses.map((c, j) => (
                      <div key={j} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <h5 className="text-[11px] font-black text-slate-900 leading-tight break-keep">{c.courseTitle}</h5>
                        </div>
                        <span className="text-[9px] font-black bg-white text-indigo-600 px-2 py-0.5 rounded border border-indigo-50 ml-4 whitespace-nowrap">LV.{c.level}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-indigo-50/50 px-5 py-4 rounded-2xl border border-indigo-100 relative z-10 flex flex-col md:flex-row gap-2 md:gap-3 items-start md:items-center">
                    <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded uppercase whitespace-nowrap">Reason</span> 
                    <p className="text-[11.5px] text-indigo-950 font-bold leading-relaxed break-keep flex-1">
                      {rec.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Roles - High visibility and spacing */}
          <div className="relative z-10 mt-2 grid grid-cols-2 gap-4">
            {data.recommendations.roleBased.map((role, i) => (
              <div key={i} className="p-6 bg-slate-900 text-white rounded-[1.8rem] shadow-xl">
                <h4 className="text-[12.5px] font-black text-indigo-400 mb-2.5 flex items-center gap-2.5 uppercase tracking-tight">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  {role.group}
                </h4>
                <p className="text-[11.5px] text-slate-300 font-bold leading-relaxed break-keep line-clamp-2">{role.reason}</p>
              </div>
            ))}
          </div>

          {/* Footer 2 */}
          <div className="mt-auto pt-5 flex justify-between items-center opacity-40 border-t border-slate-100 gap-4">
            <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase whitespace-nowrap">2026 Ablearn AI Diagnostic</p>
            <p className="text-[9px] font-black text-slate-400 tracking-tighter whitespace-nowrap">Part 2. Education Roadmap</p>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
};

export default OrgSummary;
