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

  // Persona
  personaResult: null,
  personaStatus: 'idle',

  // Basic setters
  setProjectName: (name: string) => set({ projectName: name }),
  setDocTitle: (title: string) => set({ docTitle: title }),

  setEditorText: (text: string) => set({ editorText: text, isAutosaved: false }),

  setSettings: (newSettings: Partial<CheckSettings>) =>
    set((state) => {
      const audienceChanged = newSettings.audience !== undefined &&
                              newSettings.audience !== state.settings.audience;
      return {
        settings: { ...state.settings, ...newSettings },
        // audience変更時はpersonaStatusをidleにリセットして再実行を促す
        ...(audienceChanged && { personaStatus: 'idle' as const }),
      };
    }),

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

  applyPatch: async (findingId: string, deleteMode: boolean = false) => {
    const { checkId, editorText, report } = get();

    // Finding を report から削除するヘルパー関数
    const removeFindingFromReport = () => {
      // 1. report が存在しない場合は何もしない
      if (!report) return;

      // 2. findings 配列から該当の finding を除外
      const newFindings = report.findings.filter(f => f.id !== findingId);

      // 3. highlights.items から該当 findingId のハイライト情報を除外
      const newHighlightItems = report.highlights.items.filter(
        item => item.findingId !== findingId
      );

      // 4. ストアの report を新しいオブジェクトで更新
      set({
        report: {
          ...report,                    // 既存の report をスプレッド
          findings: newFindings,        // findings を新しい配列に置換
          highlights: {
            ...report.highlights,
            items: newHighlightItems    // highlights.items を新しい配列に置換
          },
          summary: {
            ...report.summary,
            totalFindings: newFindings.length,  // 件数を更新
          },
        },
        selectedFindingId: null,        // 選択状態をクリア
      });
    };

    // 削除モード: APIを呼ばずにローカルで削除
    if (deleteMode) {
      if (!report) {
        set({ errorMessage: 'No report available' });
        return;
      }
      const highlightItem = report.highlights.items.find(
        item => item.findingId === findingId
      );
      if (highlightItem && editorText.includes(highlightItem.text)) {
        const newText = editorText.replace(highlightItem.text, '');
        set({ editorText: newText });
      }
      // Finding カードを削除
      removeFindingFromReport();
      return;
    }

    // 通常モード: APIを呼んでパッチ適用
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
        //await get().runRecheck();
        removeFindingFromReport();
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

  runPersonaReview: async () => {
    const { editorText, settings } = get();
    set({ personaStatus: 'running', errorMessage: null });

    try {
      const result = await personaReview(editorText, settings);
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
