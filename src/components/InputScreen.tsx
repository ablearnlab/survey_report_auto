import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, Link, Settings, Database, UploadCloud, Info, Lock } from "lucide-react";
import { ComputedStats, CatalogRow } from "../types";
import { processRawDataGrid } from "../utils/dataProcessor";
import { DEFAULT_CATALOG } from "../data/defaultCatalog";
import { googleSignIn, initAuth, logout } from "../utils/auth"; // We will create auth.ts
import { User } from "firebase/auth";

interface InputScreenProps {
  onDataLoaded: (companyStats: Record<string, ComputedStats>, catalog: CatalogRow[]) => void;
  courseTitle: string;
  setCourseTitle: (v: string) => void;
  courseDate: string;
  setCourseDate: (v: string) => void;
  catalogUrl: string;
  setCatalogUrl: (v: string) => void;
  maxPoints: number;
  setMaxPoints: (v: number) => void;
}

export default function InputScreen({
  onDataLoaded,
  courseTitle,
  setCourseTitle,
  courseDate,
  setCourseDate,
  catalogUrl,
  setCatalogUrl,
  maxPoints,
  setMaxPoints,
}: InputScreenProps) {
  const [activeTab, setActiveTab] = useState<"excel" | "gsheets">("excel");
  const [sheetUrl, setSheetUrl] = useState("");
  const [catalogFile, setCatalogFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [gridData, setGridData] = useState<any[][] | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (startDate && endDate) {
      if (startDate === endDate) setCourseDate(startDate.replace(/-/g, '.'));
      else setCourseDate(`${startDate.replace(/-/g, '.')} ~ ${endDate.replace(/-/g, '.')}`);
    } else if (startDate) {
      setCourseDate(startDate.replace(/-/g, '.'));
    } else if (endDate) {
      setCourseDate(endDate.replace(/-/g, '.'));
    } else {
      setCourseDate("");
    }
  }, [startDate, endDate]);

  // GSheets OAuth States
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    // Check local storage for persistent form data
    const savedCatalogUrl = localStorage.getItem("ablearn_catalog_url");
    if (savedCatalogUrl) {
      setCatalogUrl(savedCatalogUrl);
    }
    const savedSheetUrl = localStorage.getItem("ablearn_sheet_url");
    if (savedSheetUrl) {
      setSheetUrl(savedSheetUrl);
    }

    try {
      initAuth(
        (u, token) => {
          setUser(u);
          setAccessToken(token);
          setAuthInitialized(true);
        },
        () => {
          setUser(null);
          setAccessToken(null);
          setAuthInitialized(true);
        }
      );
    } catch (e) {
      console.warn("Auth config is unavailable or not yet set up.", e);
      setAuthInitialized(true);
    }
  }, []);

  const handleLoginGoogle = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("구글 로그인에 실패했습니다. 공유가 잘 되어있다면 로그인 없이도 자동 진행이 가능합니다.");
    }
  };

  const handleLogoutGoogle = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  const processExcelFile = (file: File) => {
    setLoading(true);
    setErrorMsg(null);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        
        // Parse into 2D Array of arrays
        const json: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        if (json.length < 2) {
          throw new Error("엑셀 파일에 분석 가능한 응답 행이 부족합니다 (헤더 제외 1행 이상 필요).");
        }
        setGridData(json);
      } catch (err: any) {
        setErrorMsg(err.message || "엑셀 파일 파싱에 실패했습니다.");
        setGridData(null);
        setUploadedFileName(null);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  // Helper to extract spreadsheetId from GSheets URL
  const extractSpreadsheetId = (url: string): string | null => {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const matches = url.match(regex);
    return matches ? matches[1] : null;
  };

  // Loads catalog from Google Sheet or fallback
  const fetchGoogleSheetData = async (url: string, isCatalog: boolean = false): Promise<any[][] | null> => {
    const sId = extractSpreadsheetId(url);
    if (!sId) return null;

    // First attempt: try public CSV fetch (fast and works without full credentials)
    try {
      const publicCsvUrl = `https://docs.google.com/spreadsheets/d/${sId}/export?format=csv&id=${sId}&gid=0`;
      const response = await fetch(publicCsvUrl);
      if (response.ok) {
        const csvText = await response.text();
        const workbook = XLSX.read(csvText, { type: "string" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        return XLSX.utils.sheet_to_json(sheet, { header: 1 });
      }
    } catch (e) {
      console.log("Failed public CSV fetch, trying Google Sheets API...", e);
    }

    // Second attempt: using Google Auth API with token if logged in
    if (accessToken) {
      try {
        const range = "A1:Z500";
        const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sId}/values/${range}`;
        const response = await fetch(apiUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (response.ok) {
          const resJson = await response.json();
          if (resJson.values) return resJson.values;
        }
      } catch (e) {
        console.error("Authenticated GSheets API fetch failed:", e);
      }
    }

    return null;
  };

  const handleCatalogUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       setCatalogFile(file);
    }
  };

  const parseCatalogFile = async (file: File): Promise<CatalogRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          
          if (rows.length < 2) {
            return resolve(DEFAULT_CATALOG);
          }

          // Parse rows into CatalogRow format
          const catalog: CatalogRow[] = [];
          for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length < 3) continue;
            catalog.push({
              courseName: String(r[0] || "").trim(),
              category: String(r[1] || "").trim(),
              difficulty: String(r[2] || "").trim(),
              summary: String(r[3] || "").trim(),
              coreContent: String(r[4] || "").trim(),
              targetJob: String(r[5] || "").trim(),
              targetRank: String(r[6] || "").trim(),
              hours: String(r[7] || "").trim(),
              format: String(r[8] || "").trim(),
              prerequisite: String(r[9] || "").trim(),
              weaknessTag: String(r[10] || "").trim(),
              remarks: String(r[11] || "").trim(),
            });
          }
          resolve(catalog);
        } catch (err) {
          reject(err);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };

  const startAnalysis = async () => {
    if (!courseTitle.trim()) {
      setErrorMsg("교육 과정명을 입력해 주세요.");
      return;
    }
    if (!courseDate.trim()) {
      setErrorMsg("교육 일자를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      let finalGrid: any[][] | null = gridData;

      // If active tab is GSheets, fetch sheet data
      if (activeTab === "gsheets") {
        if (!sheetUrl.trim()) {
          throw new Error("구글 시트 만족도 설문 URL을 입력해주세요.");
        }
        localStorage.setItem("ablearn_sheet_url", sheetUrl);
        const fetchedGrid = await fetchGoogleSheetData(sheetUrl);
        if (!fetchedGrid || fetchedGrid.length < 2) {
          throw new Error(
            "구글 시트를 읽어오는데 실패했습니다. 시트 권한이 '링크가 있는 모든 사용자'로 설정되어 있는지 확인해 주거나, Google 로그인을 진행해 주세요."
          );
        }
        finalGrid = fetchedGrid;
      }

      if (!finalGrid) {
        throw new Error("분석할 교육 만족도 데이터가 준비되지 않았습니다. 파일을 업로드해 주세요.");
      }

      // Fetch Catalog from sheets or file upload or default
      let parsedCatalog: CatalogRow[] = DEFAULT_CATALOG;
      if (catalogUrl.trim()) {
        localStorage.setItem("ablearn_catalog_url", catalogUrl);
        const catGrid = await fetchGoogleSheetData(catalogUrl, true);
        if (catGrid && catGrid.length >= 2) {
          const catalog: CatalogRow[] = [];
          for (let i = 1; i < catGrid.length; i++) {
            const r = catGrid[i];
            if (!r || r.length < 2) continue;
            catalog.push({
              courseName: String(r[0] || "").trim(),
              category: String(r[1] || "").trim(),
              difficulty: String(r[2] || "").trim(),
              summary: String(r[3] || "").trim(),
              coreContent: String(r[4] || "").trim(),
              targetJob: String(r[5] || "").trim(),
              targetRank: String(r[6] || "").trim(),
              hours: String(r[7] || "").trim(),
              format: String(r[8] || "").trim(),
              prerequisite: String(r[9] || "").trim(),
              weaknessTag: String(r[10] || "").trim(),
              remarks: String(r[11] || "").trim(),
            });
          }
          if (catalog.length > 0) {
            parsedCatalog = catalog;
          }
        }
      } else if (catalogFile) {
        parsedCatalog = await parseCatalogFile(catalogFile);
      }

      // Process raw data using the mathematical helper (running entirely in Javascript)
      const companyStats = processRawDataGrid(finalGrid, maxPoints);

      if (Object.keys(companyStats).length === 0) {
        throw new Error("데이터 내에서 활성화된 회사명(B열)을 찾을 수 없습니다.");
      }

      // Progress to next screen
      onDataLoaded(companyStats, parsedCatalog);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "분석을 실행하는 도중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" id="input_screen_container">
      {/* Title & Brand header */}
      <div className="text-center mb-10 text-[#1A1D36]">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#E8EAF6] text-[#3A40B5] rounded-full text-xs font-mono tracking-wider font-semibold mb-3 uppercase">
          ABLEARN CONSULTING SERVICE
        </div>
        <h1 className="text-4xl font-extrabold font-sans tracking-tight text-[#1A1D36]">
          에이블런 교육 만족도 진단 리포트 생성기
        </h1>
        <p className="mt-2 text-[#727796] max-w-xl mx-auto text-sm">
          교육 사후 설문 데이터를 통계 계산하여, 타겟 회사별 강점 및 개선 사항과 맞춤 카탈로그 연동 AI 진단 리포트를 자동으로 발간합니다.
        </p>
      </div>

      {/* Error Alert Box */}
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3 text-red-700 text-sm">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">작업 오류 발생</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Google Auth Bar for Google Sheet Integrations */}
      <div className="mb-8 p-4 bg-[#F2F4FC] border border-[#C6C9E8] rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#D4D7F4] text-[#3A40B5] rounded-xl">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1D36]">구글 스프레드시트 연동</p>
            <p className="text-xs text-[#727796]">
              구글 스프레드시트 URL 연동 시 로그인 필요
            </p>
          </div>
        </div>
        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-medium text-[#1A1D36]">{user.displayName || user.email}</p>
                <p className="text-[10px] text-green-600 font-mono">연동 활성화됨</p>
              </div>
              <button
                onClick={handleLogoutGoogle}
                className="px-3 py-1.5 border border-[#C6C9E8] hover:bg-white text-xs font-semibold text-red-600 rounded-lg transition-all"
              >
                연동 해제
              </button>
            </div>
          ) : (
            <button
              onClick={handleLoginGoogle}
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold px-4 py-2 border border-gray-300 rounded-xl shadow-sm text-sm transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 12-4.53z"
                />
              </svg>
              Google 계정으로 로그인
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 max-w-3xl mx-auto">
        {/* Core Settings / Inputs (2 Cols) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#C6C9E8] shadow-sm">
            <h2 className="text-lg font-bold text-[#1A1D36] mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-[#3A40B5]" />
              교육 과정 정보 입력
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#727796] mb-1.5">
                  교육 과정명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 생성형 AI를 활용한 기술 엔지니어링 마스터"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full bg-[#E8EAF6]/40 text-[#1A1D36] placeholder:text-gray-400 border border-[#C6C9E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A40B5]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#727796] mb-1.5">
                    교육 시작 일자 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#E8EAF6]/40 text-[#1A1D36] placeholder:text-gray-400 border border-[#C6C9E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A40B5]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#727796] mb-1.5">
                    교육 종료 일자 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#E8EAF6]/40 text-[#1A1D36] placeholder:text-gray-400 border border-[#C6C9E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A40B5]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#727796] mb-1.5">
                  설문 척도 (만점 기준) <span className="text-red-500">*</span>
                </label>
                <select
                  value={maxPoints}
                  onChange={(e) => setMaxPoints(Number(e.target.value))}
                  className="w-full bg-[#E8EAF6]/40 text-[#1A1D36] border border-[#C6C9E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A40B5] appearance-none"
                >
                  <option value={5}>5점 만점 척도</option>
                  <option value={7}>7점 만점 척도</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#C6C9E8] shadow-sm overflow-hidden">
            {/* Input Method Navigation Tabs */}
            <div className="flex border-b border-[#C6C9E8] bg-gray-50/50">
              <button
                type="button"
                onClick={() => setActiveTab("excel")}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  activeTab === "excel"
                    ? "bg-white text-[#3A40B5] border-b-2 border-b-[#3A40B5]"
                    : "text-[#727796] hover:text-[#1A1D36] hover:bg-gray-100/50"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                (A) 엑셀 파일(.xlsx) 업로드
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("gsheets")}
                className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                  activeTab === "gsheets"
                    ? "bg-white text-[#3A40B5] border-b-2 border-b-[#3A40B5]"
                    : "text-[#727796] hover:text-[#1A1D36] hover:bg-gray-100/50"
                }`}
              >
                <Link className="w-4 h-4" />
                (B) 구글 시트 URL 연동
              </button>
            </div>

            <div className="p-6">
              {activeTab === "excel" ? (
                <div>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                      isDragOver
                        ? "border-[#3A40B5] bg-[#E8EAF6]"
                        : "border-[#C6C9E8] hover:border-gray-400 bg-gray-50"
                    }`}
                    onClick={() => document.getElementById("excelFile")?.click()}
                  >
                    <UploadCloud className="w-12 h-12 text-[#3A40B5] mb-3" />
                    <p className="text-sm font-bold text-[#1A1D36]">
                      교육 만족도 설문 엑셀 파일 마우스 드래그 & 드롭
                    </p>
                    <p className="text-xs text-[#727796] mt-1">
                      또는 찾아보기 버튼으로 파일 선택하기 (xlsx, xls 한정)
                    </p>
                    <p className="text-[10px] text-[#727796] bg-white border border-[#C6C9E8] px-2.5 py-1 rounded-full mt-3 font-mono">
                      스키마: A타임스탬프 / B회사명 / C성함 / D직위 / E직무...
                    </p>
                    <input
                      type="file"
                      id="excelFile"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {uploadedFileName && (
                    <div className="mt-4 p-3 bg-[#E8EAF6] border border-[#C6C9E8] rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-[#3A40B5]" />
                        <span className="text-xs font-bold text-[#1A1D36] truncate max-w-xs sm:max-w-md">
                          {uploadedFileName}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-semibold bg-green-100 text-green-800 px-2.5 py-1 rounded-md">
                        가공 완료
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-[#727796]">
                    구글 시트 연동 URL (수정 가능 권한 권장)
                  </label>
                  <input
                    type="url"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    className="w-full bg-[#E8EAF6]/40 text-[#1A1D36] placeholder:text-gray-400 border border-[#C6C9E8] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3A40B5]"
                  />
                  <div className="text-xs bg-[#E8EAF6]/50 p-3 rounded-xl border border-[#C6C9E8] text-[#727796] space-y-1">
                    <p className="font-semibold text-[#1A1D36]">구글 시트 설정 수칙:</p>
                    <p>1. 만족도 시트는 헤더가 1행에 존재하고 응답은 2행부터 로드합니다.</p>
                    <p>2. 원활한 파싱을 위해 컬럼 순서(A:타임스탬프, B:회사명, C:성함 등)가 규격과 맞는지 체크하세요.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={startAnalysis}
            disabled={loading}
            className={`w-full py-4 text-white font-bold rounded-2xl shadow-md tracking-wider flex items-center justify-center transition-all ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#3A40B5] hover:bg-[#1A1D36] hover:scale-[1.01] cursor-pointer"
            }`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                데이터 집계 가공 중...
              </div>
            ) : (
              "진단 및 분석 시작"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
