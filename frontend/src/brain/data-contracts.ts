/** CodeTestRequest */
export interface CodeTestRequest {
  /** Code */
  code: string;
  /** Language */
  language: string;
  /** Testcases */
  testCases: TestCase[];
}

/** CodeTestResponse */
export interface CodeTestResponse {
  /** Results */
  results: TestResult[];
  /** Score */
  score: number;
  /** Totaltests */
  totalTests: number;
  /** Passedtests */
  passedTests: number;
}

/** FeedbackRequest */
export interface FeedbackRequest {
  /** Studentname */
  studentName: string;
  /** Averagescore */
  averageScore: number;
  /** Completionrate */
  completionRate: number;
  /** Strengths */
  strengths: string[];
  /** Areasforimprovement */
  areasForImprovement: string[];
  /** Programminglanguages */
  programmingLanguages: string[];
  /** Difficultylevels */
  difficultyLevels: string[];
  /** Totallessonscompleted */
  totalLessonsCompleted: number;
  /** Totallessonsassigned */
  totalLessonsAssigned: number;
  /** Recentsubmissions */
  recentSubmissions?: object[] | null;
}

/** FeedbackResponse */
export interface FeedbackResponse {
  /** Personalizedfeedback */
  personalizedFeedback: string;
  /** Improvementplan */
  improvementPlan: string[];
  /** Conceptrecommendations */
  conceptRecommendations: Record<string, string>[];
  /** Practiceexercises */
  practiceExercises: string[];
  /** Motivationalmessage */
  motivationalMessage: string;
}

/** HTTPValidationError */
export interface HTTPValidationError {
  /** Detail */
  detail?: ValidationError[];
}

/** HealthResponse */
export interface HealthResponse {
  /** Status */
  status: string;
}

/** TestCase */
export interface TestCase {
  /** Input */
  input: string;
  /** Expectedoutput */
  expectedOutput: string;
  /** Description */
  description?: string | null;
}

/** TestResult */
export interface TestResult {
  /** Passed */
  passed: boolean;
  /** Expected */
  expected: string;
  /** Actual */
  actual: string;
  /** Error */
  error?: string | null;
  /** Input */
  input?: string | null;
}

/** ValidationError */
export interface ValidationError {
  /** Location */
  loc: (string | number)[];
  /** Message */
  msg: string;
  /** Error Type */
  type: string;
}

export type CheckHealthData = HealthResponse;

export type TestJavascriptCodeData = CodeTestResponse;

export type TestJavascriptCodeError = HTTPValidationError;

export type GenerateFeedbackData = FeedbackResponse;

export type GenerateFeedbackError = HTTPValidationError;
