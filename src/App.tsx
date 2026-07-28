/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import EduReportApp from "./EduReportApp";
import AiTestApp from "./AiTestApp";
import { ExternalLink, BookOpen, BrainCircuit } from "lucide-react";

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const appType = urlParams.get("app");

  // Check if we are inside an iframe
  let isEmbedded = false;
  try {
    isEmbedded = window.self !== window.top;
  } catch (e) {
    isEmbedded = true;
  }

  // Initial Report Data for Print Window is for the AI app maybe or Edu app, but we moved it. 
  // Oh wait, for Edu report, we removed the print query string handler earlier to just use window.print() natively? Let's check what it currently was... Actually we removed it in a previous step!

  if (isEmbedded) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-[#C6C9E8]">
          <h1 className="text-2xl text-center font-bold text-[#1A1D36] mb-3">에이블런 진단 리포트 시스템</h1>
          <p className="text-sm text-center text-[#727796] mb-8 leading-relaxed break-keep">
            AI Studio 보안 정책으로 인해 브라우저 내부창에서는 파일 업로드 및 PDF 저장이 제한될 수 있습니다.<br/>
            원활한 사용을 위해 원하시는 서비스의 <strong>새 창으로 열기</strong> 버튼을 눌러주세요.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => window.open(window.location.href.split('?')[0] + "?app=edu", "_blank")}
              className="flex flex-col items-center justify-center gap-4 p-6 bg-white border-2 border-[#3A40B5]/20 hover:border-[#3A40B5] rounded-xl transition group"
            >
              <div className="w-16 h-16 bg-[#3A40B5]/10 flex items-center justify-center rounded-2xl group-hover:bg-[#3A40B5] transition">
                <BookOpen className="w-8 h-8 text-[#3A40B5] group-hover:text-white transition" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-[#1A1D36] mb-1">교육 만족도 진단 리포트</h3>
                <p className="text-xs text-[#727796]">과정 사후 만족도 평점 분석</p>
              </div>
              <div className="mt-2 text-[#3A40B5] text-xs font-bold flex items-center gap-1">
                새 창으로 열기 <ExternalLink className="w-3 h-3" />
              </div>
            </button>

            <button
              onClick={() => window.open(window.location.href.split('?')[0] + "?app=ai", "_blank")}
              className="flex flex-col items-center justify-center gap-4 p-6 bg-white border-2 border-emerald-500/20 hover:border-emerald-500 rounded-xl transition group"
            >
              <div className="w-16 h-16 bg-emerald-50 flex items-center justify-center rounded-2xl group-hover:bg-emerald-500 transition">
                <BrainCircuit className="w-8 h-8 text-emerald-600 group-hover:text-white transition" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-[#1A1D36] mb-1">생성형 AI 레벨 테스트</h3>
                <p className="text-xs text-[#727796]">개인별 AI 활용 역량 진단</p>
              </div>
               <div className="mt-2 text-emerald-600 text-xs font-bold flex items-center gap-1">
                새 창으로 열기 <ExternalLink className="w-3 h-3" />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not embedded but app type isn't selected? Still show the same UI to route them.
  if (!appType) {
    return (
      <div className="min-h-screen bg-[#F8F9FD] flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full border border-[#C6C9E8]">
          <h1 className="text-2xl text-center font-bold text-[#1A1D36] mb-8">에이블런 진단 리포트 시스템</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => window.location.href = "?app=edu"}
              className="flex flex-col items-center justify-center gap-4 p-6 bg-white border-2 border-[#3A40B5]/20 hover:border-[#3A40B5] rounded-xl transition group"
            >
              <div className="w-16 h-16 bg-[#3A40B5]/10 flex items-center justify-center rounded-2xl group-hover:bg-[#3A40B5] transition">
                <BookOpen className="w-8 h-8 text-[#3A40B5] group-hover:text-white transition" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-[#1A1D36] mb-1">교육 만족도 진단 리포트</h3>
                <p className="text-xs text-[#727796]">과정 사후 만족도 평점 분석</p>
              </div>
            </button>

            <button
              onClick={() => window.location.href = "?app=ai"}
              className="flex flex-col items-center justify-center gap-4 p-6 bg-white border-2 border-emerald-500/20 hover:border-emerald-500 rounded-xl transition group"
            >
              <div className="w-16 h-16 bg-emerald-50 flex items-center justify-center rounded-2xl group-hover:bg-emerald-500 transition">
                <BrainCircuit className="w-8 h-8 text-emerald-600 group-hover:text-white transition" />
              </div>
              <div className="text-center">
                <h3 className="font-bold text-[#1A1D36] mb-1">생성형 AI 레벨 테스트</h3>
                <p className="text-xs text-[#727796]">개인별 AI 활용 역량 진단</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appType === "edu") {
    return <EduReportApp />;
  }

  if (appType === "ai") {
    return <AiTestApp />;
  }

  return null;
}
