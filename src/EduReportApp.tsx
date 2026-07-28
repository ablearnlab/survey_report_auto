import React, { useState } from "react";
import InputScreen from "./components/InputScreen";
import CompanySelectionScreen from "./components/CompanySelectionScreen";
import ReportScreen from "./components/ReportScreen";
import { ComputedStats, CatalogRow } from "./types";
import { Star, FileBarChart2 } from "lucide-react";

export default function EduReportApp() {
  // Screen state routing
  const [viewState, setViewState] = useState<"input" | "company_select" | "report">("input");

  // General course metadata
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDate, setCourseDate] = useState("");
  
  // Custom Google sheet Catalog URL
  const [catalogUrl, setCatalogUrl] = useState("");

  const [maxPoints, setMaxPoints] = useState(7);

  // Processed feedback data stats
  const [companyStats, setCompanyStats] = useState<Record<string, ComputedStats> | null>(null);
  
  // Loaded education course catalog
  const [catalog, setCatalog] = useState<CatalogRow[] | null>(null);

  // Selected company name for analysis
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);

  // Callback when sheets/file is parsed
  const handleDataLoaded = (stats: Record<string, ComputedStats>, parsedCatalog: CatalogRow[]) => {
    setCompanyStats(stats);
    setCatalog(parsedCatalog);
    setViewState("company_select");
  };

  // Callback when company is selected
  const handleSelectCompany = (companyName: string) => {
    setSelectedCompanyName(companyName);
    setViewState("report");
  };

  const handleReset = () => {
    setCompanyStats(null);
    setCatalog(null);
    setSelectedCompanyName(null);
    setViewState("input");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FD] text-[#272A42] font-sans">
      {/* Dynamic top header - Hide when printing */}
      <header className="h-16 flex items-center justify-between px-6 bg-[#1A1D36] text-white border-b border-[#3A40B5]/30 print:hidden shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleReset}>
          <div className="bg-[#3A40B5] px-3 py-1.5 rounded text-xs font-black tracking-widest text-white shadow-md shadow-[#3A40B5]/20 font-mono">
            ABLEARN
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-base font-bold font-sans tracking-tight text-[#F8F9FD]">
              교육 만족도 진단 리포트 생성기
            </h1>
            <span className="text-xs text-[#727796] font-mono font-medium hidden sm:inline">v2.0</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.location.href = window.location.pathname}
            className="text-xs text-[#D4D7F4] hover:text-white underline underline-offset-2"
          >
            ← 메인 메뉴로 돌아가기
          </button>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 bg-[#1B2133] border border-[#3A40B5]/30 px-3 py-1 rounded-lg text-[10px] font-mono font-semibold tracking-wider text-[#D4D7F4] uppercase">
              <span>Stage: Analytical Audit</span>
            </div>
            <div className="flex items-center gap-1 bg-[#3A40B5]/20 border border-[#3A40B5]/50 px-3 py-1 rounded-lg text-xs font-bold text-[#E8EAF6]">
              <Star className="w-3.5 h-3.5 text-amber-350 fill-amber-300" />
              <span>BD팀 내부 도구</span>
            </div>
          </div>
        </div>
      </header>

      <main className="py-6 px-4">
        {viewState === "input" && (
          <InputScreen
            onDataLoaded={handleDataLoaded}
            courseTitle={courseTitle}
            setCourseTitle={setCourseTitle}
            courseDate={courseDate}
            setCourseDate={setCourseDate}
            catalogUrl={catalogUrl}
            setCatalogUrl={setCatalogUrl}
            maxPoints={maxPoints}
            setMaxPoints={setMaxPoints}
          />
        )}

        {viewState === "company_select" && companyStats && (
          <CompanySelectionScreen
            companyStats={companyStats}
            onSelectCompany={handleSelectCompany}
            onReset={handleReset}
            courseTitle={courseTitle}
          />
        )}

        {viewState === "report" && selectedCompanyName && companyStats && catalog && (
          <ReportScreen
            companyName={selectedCompanyName}
            stats={companyStats[selectedCompanyName]}
            catalog={catalog}
            courseTitle={courseTitle}
            courseDate={courseDate}
            maxPoints={maxPoints}
            onBack={() => setViewState("company_select")}
          />
        )}
      </main>
    </div>
  );
}
