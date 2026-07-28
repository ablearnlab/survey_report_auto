export const sanitizeHeader = (key: string): string => {
  if (typeof key !== 'string') return key;
  return key.replace(/^\ufeff/, '').trim();
};

export const extractQuestionNumber = (header: string): number | null => {
  const cleanHeader = header.trim();
  
  // 1. Check for patterns like "Q1", "Q01", "Q-1"
  let m = cleanHeader.match(/\b[qQ]([0-9]+)\b/);
  if (m) return parseInt(m[1], 10);
  
  // 2. Check for "1.", "1)", "[1]", "(1)", "1번" optionally with word boundary before
  m = cleanHeader.match(/(?:^|[^0-9])([0-9]+)(?:번|\.|\)|\])/);
  if (m) return parseInt(m[1], 10);
  
  // 3. Just starts with a number (e.g. "1 다음 중...")
  m = cleanHeader.match(/^([0-9]+)/);
  if (m) return parseInt(m[1], 10);

  return null;
};

export const normalizeRow = (row: Record<string, any>) => {
  const rowKeys = Object.keys(row);
  
  // Clean keys and find matching meta keys
  let timestampKey = "";
  let scoreKey = "";
  let nameKey = "";
  let emailKey = "";
  let majorKey = "";
  let expKey = "";
  let classWishKey = "";
  let teamKey = "";
  const surveyKeys: string[] = [];

  rowKeys.forEach(k => {
    const cleanK = k.replace(/^\ufeff/, '').trim();
    const lowerK = cleanK.toLowerCase();
    
    if (lowerK.includes('타임스탬프') || lowerK.includes('timestamp') || lowerK === '시간') {
      timestampKey = k;
    } else if (lowerK === '점수' || lowerK === 'score') {
      scoreKey = k;
    } else if ((lowerK.includes('성함') || lowerK.includes('이름') || lowerK === 'name' || lowerK === 'i1') && cleanK.length < 15) {
      nameKey = k;
    } else if ((lowerK.includes('이메일') || lowerK.includes('email') || lowerK === 'i2') && cleanK.length < 30) {
      emailKey = k;
    } else if ((lowerK.includes('전공') || lowerK === 'i3') && cleanK.length < 35) {
      majorKey = k;
    } else if ((lowerK.includes('경력') || lowerK.includes('적용') || lowerK.includes('자동화') || lowerK === 'i4') && cleanK.length < 35) {
      expKey = k;
    } else if (lowerK.includes('희망 과정') || lowerK.includes('분반') || lowerK.includes('class')) {
      classWishKey = k;
    } else if (lowerK.includes('소속 부서명') || lowerK.includes('소속')) {
      teamKey = k;
    } else if (lowerK.includes('프롬프트 a/b') || lowerK.includes('뒷받침하는 증거') || lowerK.includes('업무 자동화 흐름') || lowerK.includes('발생할 수 있는 위험') || lowerK.includes('한계를 이해')) {
      surveyKeys.push(k);
    }
  });

  // Fallbacks if not dynamically matched
  if (!timestampKey) timestampKey = rowKeys.find(k => k.trim() === '타임스탬프') || "";
  if (!scoreKey) scoreKey = rowKeys.find(k => k.trim() === '점수') || "";
  if (!nameKey) nameKey = rowKeys.find(k => k.trim() === '성함') || "";
  if (!emailKey) emailKey = rowKeys.find(k => k.trim() === '이메일') || "";
  if (!majorKey) majorKey = rowKeys.find(k => k.trim() === 'AI 및 빅데이터 관련 전공 유무') || "";
  if (!expKey) expKey = rowKeys.find(k => k.trim() === 'AI 및 빅데이터 관련 업무 경력 유무') || "";

  const identifiedMetaKeys = [timestampKey, scoreKey, nameKey, emailKey, majorKey, expKey, classWishKey, teamKey, ...surveyKeys].filter(Boolean);
  const questionKeys = rowKeys.filter(k => !identifiedMetaKeys.includes(k));

  if (questionKeys.length < 25) {
    throw new Error(
      `CSV 형식 오류: 문항 컬럼 25개를 찾지 못했습니다. (현재 발견: ${questionKeys.length}개).\n` +
      `발견된 메타데이터 - 성함: ${nameKey || '미발견'}, 이메일: ${emailKey || '미발견'}, 전공: ${majorKey || '미발견'}, 경력: ${expKey || '미발견'}.`
    );
  }

  // Preserve original order of questions
  const orderedQuestionKeys = rowKeys.filter(k => questionKeys.includes(k));
  
  const normalized: any = {};
  
  // Map standard Korean keys
  normalized['타임스탬프'] = timestampKey ? row[timestampKey] : "";
  normalized['점수'] = scoreKey ? row[scoreKey] : "";
  normalized['성함'] = nameKey ? row[nameKey] : "";
  normalized['이메일'] = emailKey ? row[emailKey] : "";
  normalized['AI 및 빅데이터 관련 전공 유무'] = majorKey ? row[majorKey] : "";
  normalized['AI 및 빅데이터 관련 업무 경력 유무'] = expKey ? row[expKey] : "";

  // Map structural question-IDs for compatibility with calculation logic
  normalized['I1'] = nameKey ? row[nameKey] : "";
  normalized['I2'] = emailKey ? row[emailKey] : "";
  normalized['I3'] = majorKey ? row[majorKey] : "";
  normalized['I4'] = expKey ? row[expKey] : "";

  // Map questions smartly. If a column header clearly designates a question number (1 to 25), use that.
  // Otherwise, fallback to sequential indexing.
  const questionKeyMap = new Map<string, string>();
  const usedNumbers = new Set<number>();
  
  // First pass: Match explicit numbers
  orderedQuestionKeys.forEach((key) => {
    const num = extractQuestionNumber(key);
    if (num && num >= 1 && num <= 25 && !usedNumbers.has(num)) {
      questionKeyMap.set(key, `Q${num}`);
      usedNumbers.add(num);
    }
  });

  // Second pass: fill unmapped columns in sequential order of unassigned target IDs
  let currentTargetNum = 1;
  orderedQuestionKeys.forEach((key) => {
    if (!questionKeyMap.has(key)) {
      while (usedNumbers.has(currentTargetNum) && currentTargetNum <= 25) {
        currentTargetNum++;
      }
      if (currentTargetNum <= 25) {
        questionKeyMap.set(key, `Q${currentTargetNum}`);
        usedNumbers.add(currentTargetNum);
        currentTargetNum++;
      } else {
        // Fallback for overflow (shouldn't happen because total questionKeys is 25)
        questionKeyMap.set(key, `Q_overflow`);
      }
    }
  });

  orderedQuestionKeys.forEach((key) => {
    const qId = questionKeyMap.get(key);
    if (qId) {
      normalized[qId] = row[key];
      // Keep track of original header
      normalized[`_original_header_${qId}`] = key;
    }
  });

  normalized["_debug_orderedQuestionKeys"] = orderedQuestionKeys;
  normalized["_debug_questionKeyMap"] = Object.fromEntries(questionKeyMap.entries());
  
  return normalized;
};

