import React from 'react';
import { IndividualResult } from '../types';
import RadarChart from './RadarChart';

interface ReportCardProps {
  result: IndividualResult;
  id: string;
}

const ReportCard: React.FC<ReportCardProps> = ({ result, id }) => {
  const levelText = [
    "준비 단계",
    "입문자 (Level 1)",
    "사용자 (Level 2)",
    "활용자 (Level 3)",
    "전문가 (Level 4)",
  ];

  return (
    <div 
      id={id} 
      className="bg-white p-[20mm] mx-auto shadow-2xl border border-gray-100 relative overflow-hidden" 
      style={{ width: '210mm', height: '297mm', boxSizing: 'border-box' }}
    >
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
      
      {/* Header */}
      <div className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-10 relative z-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 mb-2">AI 역량 진단 결과 리포트</h1>
          <div className="flex gap-4 text-slate-500 text-sm font-bold uppercase tracking-widest">
            <span>Name: {result.name}</span>
            <span>•</span>
            <span>Email: {result.email}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 mb-1">Diagnosis Date</p>
          <p className="text-sm font-black text-slate-900 tracking-tight">{result.timestamp || new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Main Score & Level Card */}
      <div className="grid grid-cols-12 gap-6 mb-12">
        <div className="col-span-8 bg-slate-900 rounded-3xl p-8 text-white flex justify-between items-center">
          <div>
            <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-2">Current Proficiency</p>
            <h2 className="text-4xl font-black">{levelText[result.level]}</h2>
            <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${result.isGatePassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
              <span className="w-2 h-2 rounded-full bg-current"></span>
              {result.isGatePassed ? "GATE 필성 문항 모두 통과" : "GATE 문항 오답 포함 (인증 보류)"}
            </div>
          </div>
          <div className="text-right">
            <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-1">Total Score</p>
            <div className="text-6xl font-black tracking-tighter">
              {result.percentage}<span className="text-2xl text-slate-500 ml-1">%</span>
            </div>
          </div>
        </div>
        <div className="col-span-4 bg-indigo-50 rounded-3xl p-8 flex flex-col justify-center items-center border border-indigo-100">
          <p className="text-indigo-600 text-xs font-black uppercase tracking-widest mb-4">Rank Indicator</p>
          <div className="relative w-24 h-24 flex items-center justify-center">
             <svg className="w-full h-full transform -rotate-90">
               <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-indigo-100" />
               <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * result.percentage / 100)} className="text-indigo-600" />
             </svg>
             <span className="absolute text-xl font-black text-indigo-900">Lv.{result.level}</span>
          </div>
        </div>
      </div>

      {/* Competency Chart */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-slate-900 font-black text-xl italic uppercase">01</span>
          <h3 className="text-xl font-black text-slate-900">영역별 AI 역량 분석</h3>
          <div className="flex-1 h-[1px] bg-slate-200"></div>
        </div>
        <div className="grid grid-cols-12 gap-12 items-center">
          <div className="col-span-5 relative h-full">
            <RadarChart data={result.categoryResults} />
          </div>
          <div className="col-span-7 space-y-5">
            {result.categoryResults.map((cat) => (
              <div key={cat.category}>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-black text-slate-700">{cat.category}</span>
                  <span className="text-xs font-bold text-indigo-600">{cat.percentage}%</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Improvement Strategy */}
      <div>
        <div className="flex items-center gap-3 mb-8">
          <span className="text-slate-900 font-black text-xl italic uppercase">02</span>
          <h3 className="text-xl font-black text-slate-900">맞춤형 역량 강화 전략 (집중 학습 영역)</h3>
          <div className="flex-1 h-[1px] bg-slate-200"></div>
        </div>
        <div className="grid grid-cols-2 gap-8">
          {result.reinforcementAreas.map((area, idx) => (
            <div key={area.category} className="relative p-8 rounded-3xl bg-slate-50 border border-slate-200 overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl text-slate-900 select-none">
                0{idx + 1}
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-black text-slate-900">{area.category}</h4>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-line">
                {area.feedback}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-[20mm] left-[20mm] right-[20mm] border-t-2 border-slate-100 pt-8 flex justify-between items-center gap-4">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-[10px]">AI</div>
           <span className="text-xs font-black text-slate-400 tracking-tighter uppercase whitespace-nowrap">Professional Competency Diagnostic Report</span>
        </div>
        <div className="text-[10px] font-bold text-slate-300 text-right">
          This document is an automated assessment based on provided user data.
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
