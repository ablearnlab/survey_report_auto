import { DiagnosticResult, AreaType, LevelName, AreaResult } from '../types';
import { ITEM_MASTER } from '../data/itemMaster';

export const calculateScores = (answers: Record<string, any>, maxPointsPerQuestion: number = 4): DiagnosticResult => {
  let isGatePassed = true;
  let totalScore = 0;
  let totalMaxScore = 0;
  let gateMessage = "";

  const areaScores: Record<AreaType, { score: number; max: number }> = {
    Understanding: { score: 0, max: 0 },
    Prompting: { score: 0, max: 0 },
    Evaluation: { score: 0, max: 0 },
    Practical: { score: 0, max: 0 },
    Ethics: { score: 0, max: 0 },
    Automation: { score: 0, max: 0 },
  };

  const questionCorrectness: Record<string, boolean> = {};

  ITEM_MASTER.forEach((curItem) => {
    const ansKey = curItem.questionId;
    let rawAns = answers[ansKey];
    
    // Check if the answer exists via dot notation like "Q1. ...", "1. ...", "1) ..."
    if (!rawAns) {
      const numKey = ansKey.replace('Q', '');
      const foundKey = Object.keys(answers).find(k => 
        k.startsWith(ansKey + '.') || 
        k.startsWith(ansKey + ' ') ||
        k.startsWith(numKey + '.') ||
        k.startsWith(numKey + ')') ||
        k.startsWith(numKey + ' ')
      );
      if (foundKey) rawAns = answers[foundKey];
    }
    
    let isCorrect = false;
    if (rawAns) {
      const textAns = rawAns.toString().trim();
      
      // 1. Google Forms Quiz score format inside the question column ("4.00 / 4.00", "0 / 4" etc.)
      const formsScoreMatch = textAns.match(/^([0-9]+(?:\.[0-9]+)?)\s*\/\s*([0-9]+(?:\.[0-9]+)?)/);
      if (formsScoreMatch) {
        const obtained = parseFloat(formsScoreMatch[1]);
        const max = parseFloat(formsScoreMatch[2]);
        if (max > 0) {
          isCorrect = obtained === max;
        }
      } else {
        // 2. High-precision clean text mapping
        const cleanAns = textAns.replace(/\s+/g, '').replace(/[()"'`’‘“”[\]]/g, '');
        const cleanCorrectText = curItem.correctAnswerText.replace(/\s+/g, '').replace(/[()"'`’‘“”[\]]/g, '');
        
        isCorrect = textAns === curItem.correctOption.toString() ||
          textAns.startsWith(`${curItem.correctOption}.`) ||
          textAns.startsWith(`${curItem.correctOption})`) ||
          cleanAns.includes(cleanCorrectText) ||
          cleanCorrectText.includes(cleanAns) ||
          textAns === maxPointsPerQuestion.toString() ||
          textAns === `${maxPointsPerQuestion} / ${maxPointsPerQuestion}`;
      }
    }

    questionCorrectness[curItem.questionId] = isCorrect;
    
    areaScores[curItem.area].max += curItem.weight;
    totalMaxScore += curItem.weight;

    if (isCorrect) {
      areaScores[curItem.area].score += curItem.weight;
      totalScore += curItem.weight;
    }
  });

  // Extract and parse actual recorded score from CSV if available (absolute Source of Truth)
  let actualScore: number | null = null;
  const rawScoreVal = answers['점수'] || answers['score'];
  if (rawScoreVal !== undefined && rawScoreVal !== null) {
    const rawStr = rawScoreVal.toString().trim();
    if (rawStr) {
      if (rawStr.includes('/')) {
        const parts = rawStr.split('/');
        const obtained = parseFloat(parts[0].trim());
        const max = parseFloat(parts[1].trim());
        if (!isNaN(obtained) && !isNaN(max) && max > 0) {
          if (max === 25) { // Question count base (e.g. "18 / 25")
            actualScore = obtained * 4;
          } else { // Direct score base (e.g. "125.00 / 125.00")
            actualScore = Math.round((obtained / max) * 100);
          }
        }
      } else {
        const val = parseFloat(rawStr);
        if (!isNaN(val)) {
          if (val <= 25) { // Question count, convert to scale of 100
            actualScore = val * 4;
          } else {
            // Assume it's a raw score where the max is 25 * maxPointsPerQuestion
            const trueMax = 25 * maxPointsPerQuestion;
            actualScore = Math.round((val / trueMax) * 100);
          }
        }
      }
    }
  }

  // Force computed scores to strictly match the actual CSV score if found
  let finalTotalScore = totalScore;
  if (actualScore !== null) {
    finalTotalScore = actualScore;
  }
  
  const percentage = totalMaxScore > 0 ? Math.round((finalTotalScore / totalMaxScore) * 100) : 0;
  
  let levelScore = 1;
  let levelName: LevelName = "Beginner";
  if (percentage >= 85) {
    levelScore = isGatePassed ? 4 : 2;
    levelName = isGatePassed ? "Expert" : "Competent";
  } else if (percentage >= 70) {
    levelScore = isGatePassed ? 3 : 2;
    levelName = isGatePassed ? "Proficient" : "Competent";
  } else if (percentage >= 50) {
    levelScore = 2;
    levelName = "Competent";
  } else {
    levelScore = 1;
    levelName = "Beginner";
  }

  // Proportional scaling for sub-category scores so their sum matches the final actual total score elegantly
  let adjustedTotal = 0;
  const areaResults: AreaResult[] = (Object.keys(areaScores) as AreaType[]).map((area, idx, arr) => {
    const s = areaScores[area].score;
    const m = areaScores[area].max;
    
    let adjustedScore = s;
    if (actualScore !== null && totalScore > 0) {
      adjustedScore = Math.round(s * (finalTotalScore / totalScore));
      if (adjustedScore > m) adjustedScore = m;
    }
    adjustedTotal += adjustedScore;

    // Compensate rounding errors on the last element to guarantee perfect visual math
    if (idx === arr.length - 1 && actualScore !== null) {
      const leftover = finalTotalScore - (adjustedTotal - adjustedScore);
      adjustedScore = Math.max(0, Math.min(m, leftover));
    }

    return {
      area,
      score: adjustedScore,
      max: m,
      percentage: m > 0 ? Math.round((adjustedScore / m) * 100) : 0
    };
  });

  const reinforcementAreas: AreaType[] = [...areaResults]
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 2)
    .map(ar => ar.area);

  const name = answers['I1'] || answers['성함'] || answers['name'] || answers['Q1'] || "익명";
  const email = answers['I2'] || answers['이메일'] || answers['email'] || answers['Q2'] || "Unknown";
  const timestamp = answers['타임스탬프'] || answers['timestamp'] || answers['시간'] || new Date().toISOString();

  // Create CategoryResult for compatibility with older components like RadarChart
  const categoryResults = areaResults.map(ar => ({
    category: ar.area,
    area: ar.area,
    score: ar.score,
    max: ar.max,
    maxScore: ar.max,
    percentage: ar.percentage,
    feedback: `${ar.area} 영역에 대한 강화가 필요합니다.`
  }));

  return {
    name,
    email,
    timestamp,
    displayTotalScore: finalTotalScore,
    computedTotalScore: finalTotalScore,
    percentage,
    level: levelScore as any,
    levelName,
    isGatePassed,
    gateMessage,
    areaResults,
    categoryResults,
    reinforcementAreas,
    normalizedRow: answers,
    questionCorrectness,
    debug: {
      matchedCount: Object.keys(questionCorrectness).filter(k => questionCorrectness[k]).length,
      originalScore: totalScore,
      actualScore: actualScore,
      scoreDiff: actualScore !== null ? actualScore - totalScore : 0
    }
  } as any; // Allow for dynamic fields added to DiagnosticResult
};

