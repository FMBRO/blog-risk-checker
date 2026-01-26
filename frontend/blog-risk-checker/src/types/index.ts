// 設定関連の型
export type PublishScope = 'public' | 'unlisted' | 'private' | 'internal';
export type Tone = 'technical' | 'casual' | 'formal';
export type Audience = 'engineers' | 'general' | 'internal' | 'executives';
export type RedactMode = 'none' | 'light' | 'strict';

// 判定・重要度の型
export type Verdict = 'ok' | 'warn' | 'bad';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

// チェック設定
export interface CheckSettings {
  publishScope: PublishScope;
  tone: Tone;
  audience: Audience;
  redactMode: RedactMode;
}

// ハイライト情報
export interface Highlight {
  text: string;
  context?: string;
}

export interface HighlightGroup {
  mode: 'text';
  items: {
    findingId: string;
    text: string;
  }[];
}

// 個別の指摘
export interface Finding {
  id: string;
  category: 'security' | 'privacy' | 'legal' | 'compliance' | 'tone' | 'quality';
  severity: Severity;
  title: string;
  reason: string;
  suggestion: string;
  highlights: Highlight[];
}

// レポート全体
export interface ReportSummary {
  totalFindings: number;
  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  byCategory: Record<string, number>;
}

export interface Report {
  verdict: Verdict;
  score: number;
  summary: ReportSummary;
  findings: Finding[];
  highlights: HighlightGroup;
}

// Patch適用結果
export interface PatchResult {
  apply: {
    mode: 'replaceText';
    originalText: string;
    replacement: string;
  };
}

// Release結果
export interface ReleaseResult {
  safeMarkdown: string;
  fixSummary: string[]; // API returns list of strings
  checklist: string[];
}

// Personaレビュー
export interface PersonaReviewItem {
  id: string;
  severity: Severity;
  title: string;
  reason: string;
  suggestion: string;
  highlights: { text: string; context: string }[];
}

export interface PersonaReviewSummary {
  total: number;
  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface PersonaReview {
  audience: Audience;
  verdict: Verdict;
  summary: PersonaReviewSummary;
  items: PersonaReviewItem[];
}

// APIエラー
export interface ApiError {
  detail: {
    message: string;
    code?: string;
  };
}

// UI用のSeverityフィルタ
export type SeverityFilter = 'all' | 'high' | 'low';

// タブ種別
export type TabType = 'findings' | 'persona';

// チェック状態
export type CheckStatus = 'idle' | 'running' | 'success' | 'error';

// Zustand Store用のAppState
export interface AppState {
  // ドキュメント情報
  projectName: string;
  docTitle: string;
  isAutosaved: boolean;

  // 設定
  settings: CheckSettings;

  // エディタ
  editorText: string;

  // チェック結果
  checkId: string | null;
  report: Report | null;
  checkStatus: CheckStatus;
  errorMessage: string | null;

  // UI状態
  activeTab: TabType;
  severityFilter: SeverityFilter;
  selectedFindingId: string | null;
  collapsedFindingIds: Set<string>;
  settingsExpanded: boolean;

  // Persona
  personaResult: PersonaReview | null;
  personaStatus: CheckStatus;

  // Release/Export
  releaseResult: ReleaseResult | null;
  releaseStatus: CheckStatus;

  // Toast
  toastMessage: string | null;

  // Actions
  setProjectName: (name: string) => void;
  setDocTitle: (title: string) => void;
  setEditorText: (text: string) => void;
  setSettings: (settings: Partial<CheckSettings>) => void;
  setActiveTab: (tab: TabType) => void;
  setSeverityFilter: (filter: SeverityFilter) => void;
  selectFinding: (id: string | null) => void;
  toggleFindingCollapse: (id: string) => void;
  toggleSettingsExpanded: () => void;

  // View Mode
  viewMode: 'edit' | 'preview';
  setViewMode: (mode: 'edit' | 'preview') => void;

  // Async Actions
  runCheck: () => Promise<void>;
  runRecheck: () => Promise<void>;
  applyPatch: (findingId: string, deleteMode?: boolean) => Promise<void>;
  runPersonaReview: () => Promise<void>;
  runRelease: () => Promise<ReleaseResult | null>;

  // State setters for async operations
  setCheckStatus: (status: CheckStatus) => void;
  setReport: (report: Report | null) => void;
  setCheckId: (id: string | null) => void;
  setErrorMessage: (message: string | null) => void;
  setPersonaResult: (result: PersonaReview | null) => void;
  setPersonaStatus: (status: CheckStatus) => void;

  // Release/Export actions
  setReleaseResult: (result: ReleaseResult | null) => void;
  setReleaseStatus: (status: CheckStatus) => void;
  clearReleaseResult: () => void;

  // Toast actions
  showToast: (message: string) => void;
  clearToast: () => void;
}
