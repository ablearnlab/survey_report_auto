import { DiagnosticResult, OrgSummaryData, TrackType, LevelName, AreaType } from '../types';
import { ROADMAP_COURSES } from '../data/roadmapCourses';

const TRACK_DEFINITION: Record<TrackType, AreaType[]> = {
  "AI Literacy & Prompt": ["Understanding", "Prompting", "Ethics"],
  "Data & Analysis x AI": ["Evaluation", "Practical"],
  "Automation x AI": ["Automation"],
  "Domain/Business x AI": ["Evaluation", "Practical", "Ethics"],
  "Dev/Platform/Cloud": ["Practical", "Automation", "Understanding"]
};

const LEVEL_DESC: Record<LevelName, string> = {
  Beginner: "기초 개념 및 한계 이해 단계 (Lv.1 중심)",
  Competent: "실무 도구 활용 및 결과물 생산 단계 (Lv.2 중심)",
  Proficient: "결과 검토 및 품질 통제 단계 (Lv.3 중심)",
  Expert: "조직 내 기준 수립 및 설계 확산 단계 (Lv.4 중심)"
};

const AREA_MAP_KR: Record<AreaType, string> = {
  Understanding: "기초이해",
  Prompting: "프롬프팅",
  Evaluation: "결과검증",
  Practical: "실무활용",
  Ethics: "윤리보안",
  Automation: "업무자동화"
};

export const generateOrgSummary = (results: DiagnosticResult[]): OrgSummaryData => {
  const totalCount = results.length;
  
  // 1. Level Distribution
  const levelOrder: LevelName[] = ["Beginner", "Competent", "Proficient", "Expert"];
  const levelCounts: Record<LevelName, number> = { Beginner: 0, Competent: 0, Proficient: 0, Expert: 0 };
  results.forEach(r => {
    if (levelCounts[r.levelName] !== undefined) {
      levelCounts[r.levelName]++;
    } else {
      levelCounts["Beginner"]++; // fallback
    }
  });
  
  const levelDistribution = levelOrder.reduce((acc, lvl) => {
    acc[lvl] = {
      count: levelCounts[lvl],
      percentage: totalCount > 0 ? Math.round((levelCounts[lvl] / totalCount) * 100) : 0,
      description: LEVEL_DESC[lvl]
    };
    return acc;
  }, {} as Record<LevelName, { count: number; percentage: number; description: string }>);

  // 2. Area Averages
  const areaOrder: AreaType[] = ["Understanding", "Prompting", "Evaluation", "Practical", "Ethics", "Automation"];
  const areaScoreTotals: Record<AreaType, number> = { Understanding: 0, Prompting: 0, Evaluation: 0, Practical: 0, Ethics: 0, Automation: 0 };
  const areaMaxTotals: Record<AreaType, number> = { Understanding: 0, Prompting: 0, Evaluation: 0, Practical: 0, Ethics: 0, Automation: 0 };
  
  results.forEach(r => {
    r.areaResults.forEach(ar => {
      if (areaScoreTotals[ar.area] !== undefined) {
        areaScoreTotals[ar.area] += ar.score;
        areaMaxTotals[ar.area] += ar.max;
      }
    });
  });
  
  const areaAverages = {} as Record<AreaType, number>;
  const priorityData: Array<{ area: AreaType; score: number; max: number; percentage: number }> = [];

  areaOrder.forEach(area => {
    const avgScore = totalCount > 0 ? areaScoreTotals[area] / totalCount : 0;
    const avgMax = totalCount > 0 ? areaMaxTotals[area] / totalCount : 0;
    const percentage = avgMax === 0 ? 0 : Math.round((avgScore / avgMax) * 100);
    areaAverages[area] = percentage;
    priorityData.push({
      area,
      score: parseFloat(avgScore.toFixed(1)),
      max: parseFloat(avgMax.toFixed(1)),
      percentage
    });
  });

  // 3. Priority Areas (Lowest achievement percentage)
  const priorityAreas = [...priorityData]
    .sort((a, b) => a.percentage - b.percentage || areaOrder.indexOf(a.area) - areaOrder.indexOf(b.area))
    .slice(0, 2);

  const priorityAreaNames = priorityAreas.map(pa => pa.area);

  // 4. Track Averages
  const trackOrder: TrackType[] = ["AI Literacy & Prompt", "Data & Analysis x AI", "Automation x AI", "Domain/Business x AI", "Dev/Platform/Cloud"];
  const trackAverages = {} as Record<TrackType, number>;
  trackOrder.forEach(track => {
    const areas = TRACK_DEFINITION[track];
    const sum = areas.reduce((acc, area) => acc + areaAverages[area], 0);
    trackAverages[track] = Math.round(sum / areas.length);
  });

  // 5. Strategy Generation
  const targetLevelName = (Object.entries(levelCounts).sort((a, b) => b[1] - a[1])[0][0]) as LevelName || "Beginner";
  const targetLevelMap: Record<LevelName, number> = { Beginner: 1, Competent: 2, Proficient: 3, Expert: 4 };
  const targetLevel = targetLevelMap[targetLevelName];

  const relevantTracks = trackOrder
    .filter(track => TRACK_DEFINITION[track].some(area => priorityAreaNames.includes(area)))
    .sort((a, b) => trackAverages[a] - trackAverages[b])
    .slice(0, 2);

  const commonTracks = relevantTracks.map(track => {
    const trackCourses = ROADMAP_COURSES
      .filter(c => c.track === track)
      .filter(c => c.level === targetLevel || c.level === targetLevel + 1)
      .slice(0, 3);
    
    const weakAreasInTrack = TRACK_DEFINITION[track]
      .filter(a => priorityAreaNames.includes(a))
      .map(a => AREA_MAP_KR[a]);
      
    return {
      track,
      targetLevel: `Lv.${targetLevel}~${targetLevel + 1}`,
      courses: trackCourses,
      reason: `진단 결과, 조직 전반적으로 [${weakAreasInTrack.join(", ")}] 영역의 숙련도가 낮게 분석되었습니다. 이를 보완하기 위해 ${track} 트랙 교육을 통해 실무 프로세스에 즉시 적용 가능한 지식을 확보해야 합니다.`
    };
  });

  return {
    totalCount,
    levelDistribution,
    areaAverages,
    trackAverages,
    priorityAreas,
    topMissedQuestions: [],
    recommendations: {
      commonTracks,
      roleBased: [] // Optional: Can be enhanced if role data is available
    }
  } as OrgSummaryData;
};

