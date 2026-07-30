import React, { useState } from 'react';
import { DiagnosticResult, AreaType, TrackType } from '../types';
import RadarChart from './RadarChart';
import { AREA_ADVICE } from '../data/areaAdvice';
import { ROADMAP_COURSES } from '../data/roadmapCourses';
import { toCanvas, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';

const IndividualReport: React.FC<{ current: DiagnosticResult; isHiddenMode?: boolean }> = ({ current, isHiddenMode = false }) => {
  const [isExporting, setIsExporting] = useState(false);

  const downloadPdf = async () => {
    if (isExporting) return;
    const element = document.getElementById(`individual-report-${current.email.replace(/[^a-zA-Z0-9]/g, '')}`);
    if (!element) return;
 
    setIsExporting(true);
    await new Promise(resolve => setTimeout(resolve, 100)); // allow UI update

    try {
      // Create a duplicate wrapper to ensure PDF ignores shadows/borders without destroying original DOM
      const originalBorder = element.style.border;
      const originalShadow = element.style.boxShadow;
      element.style.border = 'none';
      element.style.boxShadow = 'none';

      // Capture using toCanvas for reliable Korean font rendering
      const canvas = await toCanvas(element, {
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      // Restore original styling
      element.style.border = originalBorder;
      element.style.boxShadow = originalShadow;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasWidth = element.offsetWidth || 794;
      const canvasHeight = element.offsetHeight || 1122;
      
      let imgWidthInMm = pdfWidth; 
      let imgHeightInMm = (canvasHeight * pdfWidth) / canvasWidth;
      
      // Prevent slight overflow by scaling down the content to fit exactly on 1 page 
      // if it barely spills over (up to 1.3x height)
      if (imgHeightInMm > pdfHeight && imgHeightInMm < pdfHeight * 1.3) {
        const ratio = pdfHeight / imgHeightInMm;
        imgHeightInMm = imgHeightInMm * ratio;
        imgWidthInMm = imgWidthInMm * ratio;
      }
      
      let heightLeft = imgHeightInMm;
      let position = 0;

      // Center the image if it was scaled down width-wise
      const xOffset = (pdfWidth - imgWidthInMm) / 2;

      // Add first page
      pdf.addImage(imgData, 'JPEG', xOffset, position, imgWidthInMm, imgHeightInMm);
      heightLeft -= pdfHeight;

      // Add subsequent pages (if it's a very long document)
      while (heightLeft > 0.5) { 
        position = heightLeft - imgHeightInMm;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', xOffset, position, imgWidthInMm, imgHeightInMm);
        heightLeft -= pdfHeight;
      }

      pdf.save(`AI역량진단_${current.name}_리포트.pdf`);
    } catch (err: any) {
      console.error('PDF manual export error:', err);
      alert('PDF 생성 중 오류가 발생했습니다: ' + (err.message || String(err)));
    } finally {
      setIsExporting(false);
    }
  };

  const areaToTrack: Record<AreaType, TrackType> = {
    Understanding: "AI Literacy & Prompt",
    Prompting: "AI Literacy & Prompt",
    Evaluation: "Data & Analysis x AI",
    Practical: "Domain/Business x AI",
    Ethics: "AI Literacy & Prompt",
    Automation: "Automation x AI"
  };

  const areaNameKr: Record<string, string> = {
    Understanding: "기초이해",
    Prompting: "프롬프팅",
    Evaluation: "결과검증",
    Practical: "실무활용",
    Ethics: "윤리보안",
    Automation: "업무자동화"
  };

  const getRecommendationReason = (area: AreaType, track: TrackType) => {
    const areaKr = areaNameKr[area];
    switch (track) {
      case "AI Literacy & Prompt":
        return `현재 ${areaKr} 영역의 점수가 낮아, AI의 기본 동작 원리를 재확립하고 정교한 지시문 작성 기법을 습득하여 업무 정확도를 높이는 과정이 필요합니다.`;
      case "Data & Analysis x AI":
        return `진단 결과 ${areaKr} 및 검증 역량이 취약한 것으로 나타났습니다. 데이터 기반의 객관적 의사결정과 AI 결과물에 대한 비판적 평가 능력을 강화해야 합니다.`;
      case "Automation x AI":
        return `${areaKr} 관련 반복 업무의 효율성을 높이기 위해, 개별 활용을 넘어 전체 프로세스를 자동화 체계로 설계하는 기술 습득이 권장됩니다.`;
      case "Domain/Business x AI":
        return `실무 활용성과 비즈니스 가치 창출을 위해, 해당 직무 분야에 특화된 AI 적용 시나리오를 학습하고 결과물의 품질을 제어하는 전략이 필요합니다.`;
      default:
        return `현재 취약한 ${areaKr} 역량을 보완하여 실무 전반의 AI 활용 숙련도를 Lv.${Math.min(current.level + 1, 4)} 수준으로 끌어올리는 것을 목표로 합니다.`;
    }
  };

  const getRecommendedCourses = () => {
    const rawCourses = current.reinforcementAreas.map(area => {
      const targetTrack = areaToTrack[area];
      const course = ROADMAP_COURSES.find(c => 
        c.track === targetTrack && 
        (c.level === current.level || c.level === Math.min(current.level + 1, 4))
      );
      if (!course) return null;
      return {
        ...course,
        reason: getRecommendationReason(area, targetTrack)
      };
    }).filter((c): c is any => c !== null && !!c.courseTitle);

    // 중복 제거 (courseTitle 기준)
    const uniqueCourses: any[] = [];
    const seenTitles = new Set<string>();
    
    for (const c of rawCourses) {
      if (!seenTitles.has(c.courseTitle)) {
        seenTitles.add(c.courseTitle);
        uniqueCourses.push(c);
      }
    }
    
    return uniqueCourses;
  };

  const recommendedCourses = getRecommendedCourses();

  return (
    <div className="space-y-8">
      {!isHiddenMode && (
        <div className="flex justify-end no-print px-4">
          <button 
            onClick={downloadPdf} 
            disabled={isExporting}
            className={`px-8 py-3 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center gap-2 ${isExporting ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'}`}
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
                개인 리포트 PDF 저장
              </>
            )}
          </button>
        </div>
      )}

      <div className="flex justify-center flex-col items-center">
        <div id={`individual-report-${current.email.replace(/[^a-zA-Z0-9]/g, '')}`} className="bg-white p-[15mm] w-[210mm] min-h-[296.8mm] relative border border-slate-100 flex flex-col box-border shadow-none print:shadow-none">
        
        {/* Header - Increased font and border */}
        <div className="flex justify-between items-end border-b-[5px] border-indigo-600 pb-5 mb-6 relative z-10 gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter mb-1.5 whitespace-nowrap">AI 역량 진단 결과 리포트</h2>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest whitespace-nowrap">Individual Competency Assessment Index</p>
          </div>
          <div className="text-right whitespace-nowrap flex flex-col items-end gap-1">
            <p className="text-[10px] font-bold text-slate-600"><span className="text-slate-400 mr-1 uppercase tracking-wider">진단일자</span> {current.timestamp || new Date().toLocaleDateString()}</p>
            <p className="text-[10px] font-bold text-slate-600"><span className="text-slate-400 mr-1 uppercase tracking-wider">발행일자</span> {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Info Grid - Larger text and gaps */}
        <div className="grid grid-cols-12 gap-4 mb-8 relative z-10">
          <div className="col-span-4 bg-slate-50 py-6 px-3 rounded-[1.5rem] border border-slate-100 flex flex-col justify-center items-center text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest whitespace-nowrap">인적 사항</p>
            <h3 className="text-[16px] font-black text-slate-800 leading-none mb-2 truncate w-full px-1">{current.name}</h3>
            <p className="text-[10px] tracking-tight text-slate-500 font-bold break-all leading-tight w-full px-1">{current.email}</p>
          </div>
          <div className="col-span-4 bg-indigo-50 py-6 px-3 rounded-[1.5rem] flex flex-col justify-center items-center text-center">
            <p className="text-[10px] font-black text-indigo-400 uppercase mb-2 tracking-widest whitespace-nowrap">진단 총점</p>
            <p className="text-[34px] font-black text-indigo-700 leading-none whitespace-nowrap">{current.displayTotalScore}<span className="text-[11px] text-indigo-300 ml-1.5 font-bold">/ 100</span></p>
          </div>
          <div className="col-span-4 bg-slate-900 py-6 px-3 rounded-[1.5rem] flex flex-col justify-center items-center text-center shadow-lg">
            <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest whitespace-nowrap">최종 레벨</p>
            <p className="text-[22px] font-black text-white italic tracking-tight leading-none whitespace-nowrap">{current.levelName}</p>
          </div>
        </div>

        {/* 01. Competency Analysis - Increased typography */}
        <div className="mb-8 relative z-10 avoid-page-break">
          <h4 className="text-sm font-black text-slate-900 mb-5 flex items-center gap-2.5 uppercase">
            <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
            01. 영역별 역량 분석
          </h4>
          <div className="h-48 w-full flex items-center justify-center bg-slate-50/50 rounded-[2rem] border border-slate-100 p-6">
            <div className="w-[35%] h-full">
               <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <RadarChart data={current.areaResults} />
               </div>
            </div>
            <div className="w-[65%] pl-10 space-y-3">
              {current.areaResults.map(r => (
                <div key={r.area} className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-600 w-20">{areaNameKr[r.area]}</span>
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full mx-4 overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${r.percentage}%` }}></div>
                  </div>
                  <span className="text-indigo-600 w-8 text-right font-black">{r.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 02. Improvement Strategy - Larger body text */}
        <div className="mb-8 relative z-10 avoid-page-break">
          <h4 className="text-sm font-black text-slate-900 mb-5 flex items-center gap-2.5 uppercase">
            <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
            02. 맞춤형 역량 강화 전략
          </h4>
          <div className="grid grid-cols-2 gap-5">
            {current.reinforcementAreas.map((area, i) => (
              <div key={area} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl relative overflow-hidden avoid-page-break">
                <div className="absolute top-0 right-0 p-3 opacity-5 text-4xl font-black">0{i + 1}</div>
                <h5 className="text-indigo-600 font-black mb-2 text-[11px] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                  {areaNameKr[area]} 핵심 강화
                </h5>
                <p className="text-[10px] font-bold text-slate-700 leading-relaxed break-keep">{AREA_ADVICE[area]?.summary}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 03. Education Roadmap - Refined typography hierarchy */}
        <div className="relative z-10 flex-1 avoid-page-break">
          <h4 className="text-sm font-black text-slate-900 mb-5 flex items-center gap-2.5 uppercase">
            <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
            03. 개인 맞춤형 추천 교육 로드맵
          </h4>
          <div className="grid grid-cols-1 gap-4">
            {recommendedCourses.map((course: any, i) => (
              <div key={i} className="flex flex-col gap-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-[1.8rem] relative overflow-hidden avoid-page-break">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex flex-col items-center justify-center shadow-lg flex-shrink-0">
                    <span className="text-[8px] font-bold opacity-80 leading-none mb-0.5">LEVEL</span>
                    <span className="text-[22px] font-black leading-none">{course.level}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1.5 mb-1.5">
                      <span className="text-[9px] font-black bg-white text-indigo-600 px-2.5 py-1 rounded-full border border-indigo-100 uppercase tracking-tighter shadow-sm w-fit whitespace-nowrap">
                        {course.track}
                      </span>
                      <h5 className="text-[14px] font-black text-slate-900 break-keep leading-tight">{course.courseTitle}</h5>
                    </div>
                    <p className="text-[11px] text-slate-500 font-bold leading-relaxed break-keep pl-1">{course.description}</p>
                  </div>
                </div>
                <div className="bg-white/90 px-5 py-4 rounded-2xl border border-indigo-50 shadow-sm mt-2 mx-1">
                   <div className="flex flex-col md:flex-row gap-1.5 md:gap-3 items-start md:items-center">
                     <span className="text-indigo-600 font-black uppercase text-[10px] whitespace-nowrap">Recommendation:</span>
                     <p className="text-[11.5px] text-indigo-950 font-bold leading-relaxed break-keep flex-1">
                       {course.reason}
                     </p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6 border-t border-slate-100 flex justify-between items-center opacity-40 z-10 gap-4 max-h-min">
          <p className="text-[9px] font-black text-slate-400 tracking-[0.3em] uppercase whitespace-nowrap">AI Competency Insight Report</p>
          <p className="text-[9px] font-bold text-slate-400 whitespace-nowrap">© 2026 Ablearn AI Diagnostic</p>
        </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualReport;
