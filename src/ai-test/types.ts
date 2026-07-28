export type AreaType = "Understanding" | "Prompting" | "Evaluation" | "Practical" | "Ethics" | "Automation";

export type TrackType = "AI Literacy & Prompt" | "Data & Analysis x AI" | "Automation x AI" | "Domain/Business x AI" | "Dev/Platform/Cloud";

export type LevelName = "Beginner" | "Competent" | "Proficient" | "Expert";

export enum Category {
  Understanding = "Understanding",
  Prompting = "Prompting",
  Evaluation = "Evaluation",
  Practical = "Practical",
  Ethics = "Ethics",
  Automation = "Automation"
}

export interface Question {
  id: string;
  category: Category;
  points: number;
  isGate: boolean;
  correctAnswer: string;
}

export type CSVRow = Record<string, string>;

export interface CategoryResult {
  category: Category;
  area: AreaType;
  score: number;
  max: number;
  maxScore: number;
  percentage: number;
  feedback: string;
}

export interface AreaResult {
  area: AreaType;
  score: number;
  max: number;
  percentage: number;
}

export interface RoadmapCourse {
  track: TrackType;
  level: 1 | 2 | 3 | 4;
  courseTitle: string;
  description: string;
  tags: string[];
}

export interface IndividualResult {
  name: string;
  email: string;
  timestamp: string;
  totalScore: number;
  maxPossibleScore: number;
  percentage: number;
  level: number;
  isGatePassed: boolean;
  categoryResults: CategoryResult[];
  reinforcementAreas: CategoryResult[];
}

export interface DiagnosticResult {
  name: string;
  email: string;
  displayTotalScore: number;
  computedTotalScore: number;
  level: 1 | 2 | 3 | 4;
  levelName: LevelName;
  gateMessage: string;
  isGatePassed: boolean;
  areaResults: AreaResult[];
  reinforcementAreas: AreaType[];
  timestamp: string;
  normalizedRow: Record<string, any>;
  questionCorrectness: Record<string, boolean>;
  debug: {
    matchedCount: number;
    scoreDiff: number;
    q1Match?: boolean;
    q1Value?: string;
    q1Key?: string;
  };
}

export interface ItemMaster {
  questionId: string;
  area: AreaType;
  weight: number;
  gate: boolean;
  correctOption: number;
  correctAnswerText: string;
  intent?: string;
}

export interface OrgSummaryData {
  totalCount: number;
  levelDistribution: Record<LevelName, { count: number; percentage: number; description: string }>;
  areaAverages: Record<AreaType, number>;
  trackAverages: Record<TrackType, number>;
  priorityAreas: Array<{ area: AreaType; score: number; max: number; percentage: number }>;
  topMissedQuestions: Array<{
    id: string;
    missRate: number;
    intent: string;
    area: AreaType;
    insight: string;
  }>;
  recommendations: {
    commonTracks: Array<{
      track: TrackType;
      targetLevel: string;
      courses: RoadmapCourse[];
      reason: string;
    }>;
    roleBased: Array<{
      group: string;
      focusTrack: TrackType;
      reason: string;
    }>;
  };
}
