import { ComputedStats, FeedbackRow, RatingDistribution, AverageByGroup, ImprovementFreq } from "../types";

// Unified processing from dry row grid (works on Google Sheet values AND SheetJS array-of-arrays)
export function processRawDataGrid(grid: any[][], maxPoints: number = 7): Record<string, ComputedStats> {
  const responses: FeedbackRow[] = [];

  // Assuming grid[0] is Header. Iterating from index 1.
  for (let i = 1; i < grid.length; i++) {
    const row = grid[i];
    if (!row || row.length === 0) continue;

    // Must have at least a company name to be meaningful
    const companyName = String(row[1] || "").trim();
    if (!companyName) continue;

    // Parse ratings F~Q (Indices 5 to 16)
    const ratings: number[] = [];
    for (let colIdx = 5; colIdx <= 16; colIdx++) {
      const rawVal = row[colIdx];
      let val = 0;
      if (typeof rawVal === "number") {
        val = rawVal;
      } else if (rawVal) {
        val = parseInt(String(rawVal).replace(/[^0-9]/g, ""), 10) || 0;
      }
      // Clamping to standard 1-max points
      if (val < 1) val = 1;
      if (val > maxPoints) val = maxPoints;
      ratings.push(val);
    }

    responses.push({
      timestamp: String(row[0] || ""),
      companyName,
      name: String(row[2] || "").trim(),
      position: String(row[3] || "미지정").trim(),
      job: String(row[4] || "미지정").trim(),
      ratings,
      q13_helpful: String(row[17] || "").trim(),
      q14_improvements: String(row[18] || "").trim(),
      q15_freetext: String(row[19] || "").trim(),
    });
  }

  // Group responses by company name
  const grouped: Record<string, FeedbackRow[]> = {};
  for (const resp of responses) {
    if (!grouped[resp.companyName]) {
      grouped[resp.companyName] = [];
    }
    grouped[resp.companyName].push(resp);
  }

  const companyStats: Record<string, ComputedStats> = {};

  for (const [companyName, list] of Object.entries(grouped)) {
    const totalResponses = list.length;

    // Averages helper
    const questionSums = new Array(12).fill(0);
    let dimensionQualitySum = 0;
    let dimensionInstructorSum = 0;
    let dimensionRelevanceSum = 0;
    let dimensionSatisfactionSum = 0;

    // Rating distribution frequencies (1 to maxPoints)
    const freqMap: Record<number, number> = {};
    for (let p = 1; p <= maxPoints; p++) freqMap[p] = 0;

    // Demographic calculations
    const positionGroups: Record<string, { sum: number; count: number }> = {};
    const jobGroups: Record<string, { sum: number; count: number }> = {};

    // S14 Keyword triggers
    const improvementKeywords = ["실습 위주", "현업 적용", "단계적", "난이도", "속도"];
    const keywordFreq: Record<string, number> = {
      "실습 위주": 0,
      "현업 적용": 0,
      "단계적": 0,
      "난이도": 0,
      "속도": 0,
    };

    const q13Raw: string[] = [];
    const q14Raw: string[] = [];
    const q15Raw: string[] = [];
    
    let straightLineCount = 0;
    let minTimestampStr = "";
    let maxTimestampStr = "";
    const q14ItemCounts: Record<string, number> = {};

    for (const resp of list) {
      if (resp.timestamp) {
        if (!minTimestampStr || resp.timestamp < minTimestampStr) minTimestampStr = resp.timestamp;
        if (!maxTimestampStr || resp.timestamp > maxTimestampStr) maxTimestampStr = resp.timestamp;
      }

      // Check for straight-lining (all 12 ratings are exactly the same)
      const firstRating = resp.ratings[0];
      const isStraightLine = resp.ratings.every(r => r === firstRating);
      if (isStraightLine) {
        straightLineCount++;
      }

      // Questions sum
      resp.ratings.forEach((score, qIdx) => {
        questionSums[qIdx] += score;
        freqMap[score] = (freqMap[score] || 0) + 1;
      });

      // Dimension mappings
      // 교육품질 = Q1, Q2, Q3 (indices 0, 1, 2)
      // 강사역량 = Q4, Q5, Q6 (indices 3, 4, 5)
      // 실무적용성 = Q7, Q8, Q9 (indices 6, 7, 8)
      // 전반만족도 = Q10, Q11, Q12 (indices 9, 10, 11)
      const qualityScore = (resp.ratings[0] + resp.ratings[1] + resp.ratings[2]) / 3;
      const instructorScore = (resp.ratings[3] + resp.ratings[4] + resp.ratings[5]) / 3;
      const relevanceScore = (resp.ratings[6] + resp.ratings[7] + resp.ratings[8]) / 3;
      const satisfactionScore = (resp.ratings[9] + resp.ratings[10] + resp.ratings[11]) / 3;

      dimensionQualitySum += qualityScore;
      dimensionInstructorSum += instructorScore;
      dimensionRelevanceSum += relevanceScore;
      dimensionSatisfactionSum += satisfactionScore;

      // Demographics: group by position (전반 만족도 평균 O, P, Q)
      const overallSatisfactionAvg = (resp.ratings[9] + resp.ratings[10] + resp.ratings[11]) / 3;
      
      const pos = resp.position || "미지정";
      if (!positionGroups[pos]) {
        positionGroups[pos] = { sum: 0, count: 0 };
      }
      positionGroups[pos].sum += overallSatisfactionAvg;
      positionGroups[pos].count += 1;

      const j = resp.job || "미지정";
      if (!jobGroups[j]) {
        jobGroups[j] = { sum: 0, count: 0 };
      }
      jobGroups[j].sum += overallSatisfactionAvg;
      jobGroups[j].count += 1;

      // Q14 mapping - split by comma if multiple options, or just tally
      const q14Text = resp.q14_improvements;
      if (q14Text) {
        // Collect for AI keyword mapping backwards compatibility
        improvementKeywords.forEach((keyword) => {
          if (q14Text.includes(keyword)) {
            keywordFreq[keyword] += 1;
          }
        });
        
        // Exact tally for exact item counts
        const items = q14Text.split(/\s*,\s*/);
        items.forEach(item => {
          const trimmed = item.trim();
          if (trimmed) {
            q14ItemCounts[trimmed] = (q14ItemCounts[trimmed] || 0) + 1;
          }
        });
      }

      // Collect raw text questions
      if (resp.q13_helpful) q13Raw.push(resp.q13_helpful);
      if (resp.q14_improvements) q14Raw.push(resp.q14_improvements);
      if (resp.q15_freetext) q15Raw.push(resp.q15_freetext);
    }

    // Averages calculation (round to 2 decimal places)
    const overallAverageRaw = questionSums.reduce((a, b) => a + b, 0) / (totalResponses * 12);
    const overallAverage = Math.round(overallAverageRaw * 100) / 100;

    const dimensionAverages = {
      quality: Math.round((dimensionQualitySum / totalResponses) * 100) / 100,
      instructor: Math.round((dimensionInstructorSum / totalResponses) * 100) / 100,
      relevance: Math.round((dimensionRelevanceSum / totalResponses) * 100) / 100,
      satisfaction: Math.round((dimensionSatisfactionSum / totalResponses) * 100) / 100,
    };

    const questionAverages = questionSums.map((sum) => Math.round((sum / totalResponses) * 100) / 100);

    // Standard deviation of the 4 dimension averages
    const dims = [dimensionAverages.quality, dimensionAverages.instructor, dimensionAverages.relevance, dimensionAverages.satisfaction];
    const dimsMean = dims.reduce((a, b) => a + b, 0) / 4;
    const dimsVariance = dims.reduce((sum, val) => sum + Math.pow(val - dimsMean, 2), 0) / 4;
    const dimensionStdDev = Math.round(Math.sqrt(dimsVariance) * 100) / 100;

    // Find the lowest question per dimension
    // quality: indices 0, 1, 2
    let lowestQualityQIdx = 0;
    for(let k=1; k<=2; k++) { if (questionAverages[k] < questionAverages[lowestQualityQIdx]) lowestQualityQIdx = k; }
    // instructor: indices 3, 4, 5
    let lowestInstructorQIdx = 3;
    for(let k=4; k<=5; k++) { if (questionAverages[k] < questionAverages[lowestInstructorQIdx]) lowestInstructorQIdx = k; }
    // relevance: indices 6, 7, 8
    let lowestRelevanceQIdx = 6;
    for(let k=7; k<=8; k++) { if (questionAverages[k] < questionAverages[lowestRelevanceQIdx]) lowestRelevanceQIdx = k; }
    // satisfaction: indices 9, 10, 11
    let lowestSatisfactionQIdx = 9;
    for(let k=10; k<=11; k++) { if (questionAverages[k] < questionAverages[lowestSatisfactionQIdx]) lowestSatisfactionQIdx = k; }
    
    const lowestScoresPerDimension = {
      quality: { qIdx: lowestQualityQIdx, score: questionAverages[lowestQualityQIdx] },
      instructor: { qIdx: lowestInstructorQIdx, score: questionAverages[lowestInstructorQIdx] },
      relevance: { qIdx: lowestRelevanceQIdx, score: questionAverages[lowestRelevanceQIdx] },
      satisfaction: { qIdx: lowestSatisfactionQIdx, score: questionAverages[lowestSatisfactionQIdx] }
    };

    const ratingDistribution: RatingDistribution[] = Array.from({ length: maxPoints }, (_, i) => i + 1).map((score) => ({
      score,
      count: freqMap[score] || 0,
    }));

    const positionStats: AverageByGroup[] = Object.entries(positionGroups).map(([groupName, g]) => ({
      groupName,
      count: g.count,
      average: Math.round((g.sum / g.count) * 100) / 100,
    }));

    const jobStats: AverageByGroup[] = Object.entries(jobGroups).map(([groupName, g]) => ({
      groupName,
      count: g.count,
      average: Math.round((g.sum / g.count) * 100) / 100,
    }));

    const improvementKeywordFreq: ImprovementFreq[] = Object.entries(keywordFreq).map(([keyword, count]) => ({
      keyword,
      count,
    }));

    const q14ItemAnalysis = Object.entries(q14ItemCounts)
      .map(([item, count]) => ({ item, count, ratioPercentage: Math.round((count / totalResponses) * 1000) / 10 }))
      .sort((a, b) => b.count - a.count);

    companyStats[companyName] = {
      companyName,
      totalResponses,
      responsePeriod: { start: minTimestampStr, end: maxTimestampStr },
      overallAverage,
      dimensionAverages,
      dimensionStdDev,
      lowestScoresPerDimension,
      straightLining: { count: straightLineCount, ratioPercentage: Math.round((straightLineCount / totalResponses) * 1000) / 10 },
      questionAverages,
      ratingDistribution,
      positionStats,
      jobStats,
      improvementKeywordFreq,
      q14ItemAnalysis,
      rawTextQuestions: {
        q13: q13Raw,
        q14: q14Raw,
        q15: q15Raw,
      },
    };
  }

  return companyStats;
}
