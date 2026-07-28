import React from "react";
import { Building2, Users, Star, ArrowRight, FileText } from "lucide-react";
import { ComputedStats } from "../types";

interface CompanySelectionScreenProps {
  companyStats: Record<string, ComputedStats>;
  onSelectCompany: (companyName: string) => void;
  onReset: () => void;
  courseTitle: string;
}

export default function CompanySelectionScreen({
  companyStats,
  onSelectCompany,
  onReset,
  courseTitle,
}: CompanySelectionScreenProps) {
  const companies = Object.values(companyStats);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4" id="company_selection_container">
      {/* Title & context */}
      <div className="text-center mb-10 text-[#1A1D36]">
        <label className="text-[10px] text-[#3A40B5] uppercase font-mono font-bold tracking-[0.2em] bg-[#E8EAF6] px-3 py-1 rounded-full inline-block mb-3">
          Select Diagnostic Target
        </label>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#1A1D36] font-sans">
          진단 리포트 대상 기업 선택
        </h1>
        <p className="mt-2 text-[#727796] max-w-xl mx-auto text-sm leading-relaxed">
          설문 데이터에서 수강사(회사)가 총 <span className="font-bold text-[#3A40B5]">{companies.length}개</span> 감지되었습니다. 분석과 조사가 필요한 타겟 기업을 선택하여 리포트를 구성해 보세요.
        </p>
        <div className="mt-4 px-4 py-2 bg-[#E8EAF6] border border-[#C6C9E8] inline-block rounded-xl text-xs font-semibold text-[#1A1D36]">
          <span className="text-[#3A40B5] mr-2">과점명:</span> {courseTitle}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {companies.map((stat) => {
          const ratingAvg = stat.overallAverage;
          let ratingColor = "text-amber-500 font-bold";
          if (ratingAvg >= 6) ratingColor = "text-[#3A40B5] font-black";
          else if (ratingAvg < 4) ratingColor = "text-red-500 font-bold";

          return (
            <div
              key={stat.companyName}
              onClick={() => onSelectCompany(stat.companyName)}
              className="bg-white border border-[#C6C9E8] rounded-2xl p-6 shadow-md shadow-slate-100 hover:shadow-xl hover:shadow-[#3A40B5]/5 hover:border-[#3A40B5] hover:-translate-y-0.5 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-[#E8EAF6] text-[#3A40B5] rounded-xl group-hover:bg-[#3A40B5] group-hover:text-white transition-all shadow-inner">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#D4D7F4]/30 px-3 py-1 rounded-full border border-[#C6C9E8]">
                    <Users className="w-3.5 h-3.5 text-[#3A40B5]" />
                    <span className="text-xs font-bold text-[#1A1D36]">{stat.totalResponses}명 응답 완료</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-[#1A1D36] group-hover:text-[#3A40B5] transition-all truncate">
                  {stat.companyName}
                </h3>
                
                <div className="mt-4 grid grid-cols-2 gap-4 text-xs border-t border-b border-[#E8EAF6] py-3.5 my-3">
                  <div>
                    <span className="text-[#727796] block mb-1 uppercase tracking-wider text-[10px] font-semibold">교육품질 평균</span>
                    <span className="font-bold text-[#1A1D36] text-sm">{stat.dimensionAverages.quality}점</span>
                  </div>
                  <div>
                    <span className="text-[#727796] block mb-1 uppercase tracking-wider text-[10px] font-semibold">실무적용성 평균</span>
                    <span className="font-bold text-[#1A1D36] text-sm">{stat.dimensionAverages.relevance}점</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-semibold text-[#727796]">전체 평점:</span>
                  <span className={`text-sm ${ratingColor}`}>{ratingAvg} / 7.00</span>
                </div>
                <div className="text-[#3A40B5] font-bold text-xs inline-flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                  리포트 진단
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-12 pt-6 border-t border-[#C6C9E8]">
        <button
          onClick={onReset}
          className="px-6 py-3 border border-[#C6C9E8] hover:border-[#3A40B5] hover:bg-white text-xs font-bold text-[#727796] hover:text-[#3A40B5] rounded-xl transition-all shadow-sm"
        >
          원천 데이터 다시 업로드하기
        </button>
      </div>
    </div>
  );
}
