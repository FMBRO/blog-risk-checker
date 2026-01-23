import { create } from 'zustand';
import type {
  AppState,
  CheckSettings,
  CheckStatus,
  Report,
  SeverityFilter,
  TabType,
  PersonaReview,
  ReleaseResult,
} from '../types';
import {
  createCheck,
  recheck,
  createPatch,
  release,
  personaReview,
  ApiError,
} from '../api/client';

// デフォルト設定
const defaultSettings: CheckSettings = {
  publishScope: 'public',
  tone: 'technical',
  audience: 'engineers',
  redactMode: 'light',
};

// デフォルトのサンプルテキスト
const defaultText = `# サンプルブログ記事

これはBlog Risk Checkerのサンプルテキストです。

## はじめに

技術ブログを公開する前に、セキュリティやプライバシーの観点からチェックを行うことは重要です。

## 注意点

- APIキーやパスワードを含めないでください
- 個人情報（メールアドレス、電話番号など）に注意
- 社内機密情報の漏洩に注意

「Check」ボタンをクリックしてリスクチェックを実行してください。
`;

export const useAppStore = create<AppState>((set, get) => ({
  // ドキュメント情報
  projectName: 'My Project',
  docTitle: 'Untitled',
  isAutosaved: true,

  // 設定
  settings: defaultSettings,

  // エディタ
  editorText: defaultText,

  // チェック結果
  checkId: null,
  report: null,
  checkStatus: 'idle',
  errorMessage: null,

  // UI状態
  activeTab: 'findings',
  severityFilter: 'all',
  selectedFindingId: null,
  collapsedFindingIds: new Set(),
  settingsExpanded: false,
  activePersona: 'general',

  // Persona
  personaResult: null,
  personaStatus: 'idle',

  // Basic setters
  setProjectName: (name: string) => set({ projectName: name }),
  setDocTitle: (title: string) => set({ docTitle: title }),

  setEditorText: (text: string) => set({ editorText: text, isAutosaved: false }),

  setSettings: (newSettings: Partial<CheckSettings>) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  setActiveTab: (tab: TabType) => set({ activeTab: tab }),

  setSeverityFilter: (filter: SeverityFilter) => set({ severityFilter: filter }),

  selectFinding: (id: string | null) => set({ selectedFindingId: id }),

  toggleFindingCollapse: (id: string) =>
    set((state) => {
      const newSet = new Set(state.collapsedFindingIds);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { collapsedFindingIds: newSet };
    }),

  toggleSettingsExpanded: () =>
    set((state) => ({ settingsExpanded: !state.settingsExpanded })),

  setActivePersona: (persona: string) =>
    set(() => ({
      activePersona: persona,
      personaResult: null,
      personaStatus: 'idle',
    })),

  // State setters for async operations
  setCheckStatus: (status: CheckStatus) => set({ checkStatus: status }),
  setReport: (report: Report | null) => set({ report }),
  setCheckId: (id: string | null) => set({ checkId: id }),
  setErrorMessage: (message: string | null) => set({ errorMessage: message }),
  setPersonaResult: (result: PersonaReview | null) => set({ personaResult: result }),
  setPersonaStatus: (status: CheckStatus) => set({ personaStatus: status }),

  // Async Actions
  runCheck: async () => {
    const { editorText, settings } = get();
    set({ checkStatus: 'running', errorMessage: null });

    try {
      const result = await createCheck(editorText, settings);
      set({
        checkId: result.checkId,
        report: result.report,
        checkStatus: 'success',
        isAutosaved: true,
      });
    } catch (error) {
      const message = error instanceof ApiError
        ? error.detail.message
        : 'Failed to run check';
      set({ checkStatus: 'error', errorMessage: message });
    }
  },

  runRecheck: async () => {
    const { checkId, editorText, settings } = get();
    if (!checkId) {
      // checkIdがない場合は新規チェック
      return get().runCheck();
    }

    set({ checkStatus: 'running', errorMessage: null });

    try {
      const result = await recheck(checkId, editorText, settings);
      set({
        report: result.report,
        checkStatus: 'success',
        isAutosaved: true,
      });
    } catch (error) {
      const message = error instanceof ApiError
        ? error.detail.message
        : 'Failed to recheck';
      set({ checkStatus: 'error', errorMessage: message });
    }
  },

  applyPatch: async (findingId: string) => {
    const { checkId, editorText } = get();
    if (!checkId) {
      set({ errorMessage: 'No active check session' });
      return;
    }

    set({ errorMessage: null });

    try {
      const result = await createPatch(checkId, findingId, editorText);
      const { originalText, replacement } = result.apply;

      // テキストを更新 (最初の1件のみ置換)
      // Note: 同じテキストが複数ある場合は最初だけ置換される制限がある
      if (editorText.includes(originalText)) {
        const newText = editorText.replace(originalText, replacement);
        set({ editorText: newText });

        // 自動で再チェック
        await get().runRecheck();
      } else {
        set({ errorMessage: 'Original text not found in document' });
      }
    } catch (error) {
      const message = error instanceof ApiError
        ? error.detail.message
        : 'Failed to apply patch';
      set({ errorMessage: message });
    }
  },

  runPersonaReview: async (persona: string) => {
    const { editorText, settings } = get();
    set({ personaStatus: 'running', errorMessage: null });

    try {
      const result = await personaReview(persona, editorText, settings);
      set({
        personaResult: result,
        personaStatus: 'success',
      });
    } catch (error) {
      const message = error instanceof ApiError
        ? error.detail.message
        : 'Failed to run persona review';
      set({ personaStatus: 'error', errorMessage: message });
    }
  },

  runRelease: async (): Promise<ReleaseResult | null> => {
    const { checkId, editorText, settings, report } = get();

    if (!checkId || report?.verdict !== 'ok') {
      set({ errorMessage: 'Release conditions not met. Verdict must be "ok".' });
      return null;
    }

    try {
      const result = await release(checkId, editorText, settings);
      return result;
    } catch (error) {
      const message = error instanceof ApiError
        ? error.detail.message
        : 'Failed to release';
      set({ errorMessage: message });
      return null;
    }
  },
}));
