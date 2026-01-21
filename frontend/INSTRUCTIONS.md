# Blog Risk Checker フロントエンド開発指示書

## プロジェクト概要
技術ブログ公開前のリスクチェックツールのフロントエンド（MVP）を構築する。
ユーザーがMarkdownを編集し、セキュリティ・プライバシー・コンプライアンスの観点から指摘を受け、修正提案を適用できるWebアプリケーション。

---

## 技術スタック

### 必須ライブラリ
- **React 18** + **TypeScript** (strict mode)
- **Vite** (ビルドツール)
- **TailwindCSS** (スタイリング)
- **CodeMirror 6** (Markdownエディタ + ハイライト)
- **Zustand** (状態管理)

### 推奨ライブラリ
- `clsx` または `classnames` (クラス名結合)
- `lucide-react` (アイコン)

---

## プロジェクト構造
```
blog-risk-checker/
├── src/
│   ├── components/
│   │   ├── AppShell.tsx          # メインレイアウト
│   │   ├── TopBar.tsx            # ヘッダー（Check/Exportボタン含む）
│   │   ├── EditorPane.tsx        # 左ペイン統括
│   │   ├── SettingsBar.tsx       # 設定バー（折りたたみ可能）
│   │   ├── MarkdownEditor.tsx    # CodeMirrorエディタ
│   │   ├── ResultsPane.tsx       # 右ペイン統括
│   │   ├── Tabs.tsx              # Findings/Personaタブ
│   │   ├── FindingsView.tsx      # Findings表示全体
│   │   ├── VerdictBanner.tsx     # 総合判定バナー
│   │   ├── SeverityFilterChips.tsx # All/High/Lowフィルタ
│   │   ├── FindingCardList.tsx   # 指摘一覧
│   │   ├── FindingCard.tsx       # 個別指摘カード（折りたたみ可能）
│   │   └── PersonaView.tsx       # Personaタブ（枠のみ）
│   ├── api/
│   │   └── client.ts             # API通信層（fetch wrapper）
│   ├── store/
│   │   └── appStore.ts           # Zustand store
│   ├── types/
│   │   └── index.ts              # 型定義
│   ├── utils/
│   │   └── highlight.ts          # ハイライト計算ユーティリティ
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

---

## 開発手順（段階的実装）

### Phase 1: プロジェクト初期化
1. `npm create vite@latest blog-risk-checker -- --template react-ts`
2. 必要ライブラリのインストール:
```bash
   npm install zustand @codemirror/view @codemirror/state @codemirror/lang-markdown
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
```
3. TailwindCSSの設定（`tailwind.config.js`に`content`パス設定）
4. `tsconfig.json`で`strict: true`を確認

### Phase 2: 型定義作成（`src/types/index.ts`）
**仕様書セクション7, 15参照**

必須型:
- `PublishScope`, `Tone`, `Audience`, `RedactMode`
- `Verdict`, `Severity`
- `CheckSettings`
- `Report` (verdict, score, summary, findings, highlights)
- `Finding` (id, category, severity, title, reason, suggestion, ranges)
- `Range` (start, end, context)
- `Highlight` (findingId, start, end)
- `PersonaReview`
- `AppState` (Zustand store用)

### Phase 3: API Client実装（`src/api/client.ts`）
**仕様書セクション12-14参照**

実装すべき関数:
- `createCheck(text, settings, config?)` → POST `/v1/checks`
- `recheck(checkId, text, settings, config?)` → POST `/v1/checks/{checkId}/recheck`
- `createPatch(checkId, findingId, text, config?)` → POST `/v1/patches`
- `release(checkId, text, settings, config?)` → POST `/v1/release`
- `personaReview(persona, text, settings, config?)` → POST `/v1/persona-review`

エラーハンドリング:
- `res.ok === false`時に`detail.message`を返す
- 404, 409, 502, 500のエラーコードに対応

### Phase 4: Zustand Store実装（`src/store/appStore.ts`）
**仕様書セクション8, 13参照**

必須状態:
```typescript
{
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
  checkStatus: "idle" | "running" | "success" | "error";
  
  // UI状態
  activeTab: "findings" | "persona";
  severityFilter: "all" | "high" | "low";
  selectedFindingId: string | null;
  collapsedFindingIds: Set<string>;
  
  // Persona
  personaResult: PersonaReview | null;
  
  // Actions
  setEditorText: (text: string) => void;
  setSettings: (settings: CheckSettings) => void;
  runCheck: () => Promise<void>;
  runRecheck: () => Promise<void>;
  applyPatch: (findingId: string) => Promise<void>;
  setActiveTab: (tab: "findings" | "persona") => void;
  setSeverityFilter: (filter: "all" | "high" | "low") => void;
  selectFinding: (id: string | null) => void;
  toggleFindingCollapse: (id: string) => void;
}
```

### Phase 5: 基本レイアウト実装
**仕様書セクション1, 2参照**

#### `AppShell.tsx`
- 2カラムレイアウト（左60-70% / 右30-40%）
- レスポンシブ対応（モバイルは1カラム）

#### `TopBar.tsx`
- 左: アプリアイコン + プロジェクト名/ドキュメント名 + 保存状態
- 右: Checkボタン（青、未読ドット付き） + Exportボタン（グレー）

### Phase 6: エディタ実装（`MarkdownEditor.tsx`）
**仕様書セクション4, 17参照**

CodeMirror 6の設定:
- 行番号表示（`lineNumbers()`）
- Markdown構文（`markdown()`）
- ハイライト表示:
  - `report.highlights.items`を元にDecorationを作成
  - 黄色背景（`bg-yellow-200`）
  - 選択中の指摘は濃い背景 + 枠線（`bg-yellow-300 border-2 border-yellow-500`）
- オフセットベースのrange（`start`, `end`は文字オフセット）

エディタクリック時:
- クリック位置のハイライトに対応する`findingId`を検出
- `selectFinding(findingId)`を呼び出し

### Phase 7: 設定バー実装（`SettingsBar.tsx`）
**仕様書セクション3参照**

- 1行バー（折りたたみ可能）
- 表示: `Settings: Public / Technical / Engineers... (Click to expand)`
- クリックでインライン展開（セレクトボックス表示）
- 変更は即座に`store.setSettings()`で反映

### Phase 8: 結果ペイン実装
**仕様書セクション5, 6参照**

#### `ResultsPane.tsx`
- タブ切替（Findings/Persona）

#### `VerdictBanner.tsx`
- `report.verdict`に応じたアイコンと色:
  - `ok`: 緑チェック
  - `warn`: 黄色警告
  - `bad`: 赤エラー
- 表示例: `Overall Verdict: Passed / 3 Warnings`

#### `SeverityFilterChips.tsx`
- All / High / Low ボタン
- High: `severity === "high" || "critical"`
- Low: `severity === "low" || "medium"`

#### `FindingCard.tsx`
重要な実装ポイント:
- 左ボーダー色: カテゴリごと（security: 赤, privacy: 青, legal: 紫, etc.）
- カテゴリバッジ（角丸）
- タイトル（太字）
- 折りたたみトグル（右上の山形アイコン）
- 展開時: Reason / Suggestion表示
- 選択状態: 背景を`bg-blue-50`に変更
- クリック時: `selectFinding(id)`を呼び出し

#### `FindingCardList.tsx`
- `severityFilter`に基づくフィルタリング
- 縦並びスクロール

### Phase 9: Personaタブ実装（`PersonaView.tsx`）
**仕様書セクション14.5参照**

- タブ初回表示時に`personaReview("general")`を自動実行
- `personaResult.items`をカード表示（`FindingCard`を流用）

### Phase 10: インタラクション実装

#### Check実行フロー
**仕様書セクション18.1参照**
1. Checkボタンクリック
2. `checkId`が無い場合: `createCheck()`
3. `checkId`がある場合: `recheck()`
4. 成功: `report`を更新、ハイライト再描画
5. 失敗: エラーバナー表示

#### Patch適用フロー
**仕様書セクション18.2参照**
1. FindingCardの「Apply」ボタンクリック
2. `createPatch(checkId, findingId, text)`
3. `apply.replaceRange`を`editorText`に反映
4. 自動で`recheck()`を実行

#### 指摘選択フロー
**仕様書セクション9参照**
1. FindingCardクリック or エディタのハイライトクリック
2. `selectFinding(findingId)`
3. エディタ側でスクロール + 強調表示

### Phase 11: Export機能実装
**仕様書セクション14.4参照**

Exportボタン（ドロップダウン）:
- Markdown（安全版）をコピー
- チェックリストをコピー
- 修正サマリをコピー

条件:
- `report.verdict === "ok"`の場合のみ有効
- `release()`を呼び出し、`safeMarkdown`, `fixSummary`, `checklist`を取得

### Phase 12: エラーハンドリング
**仕様書セクション19参照**

- 各API呼び出しで`try-catch`
- エラーメッセージを右ペイン上部にバナー表示
- 409エラー（Release条件未達）: 専用メッセージ表示

### Phase 13: テストとデバッグ

開発サーバー起動:
```bash
npm run dev
```

確認項目:
1. エディタで文字入力できる
2. Checkボタンでモックデータが表示される
3. ハイライトが正しく表示される
4. 指摘カードの折りたたみが動作する
5. 指摘選択でエディタがスクロールする
6. フィルタが動作する
7. Personaタブが表示される
8. Exportボタンが条件付きで有効化される

---

## 重要な実装ポイント

### ハイライトの実装
- `report.highlights.items`を**正**とする（`finding.ranges`ではない）
- CodeMirror 6の`Decoration.mark()`を使用
- 選択中の指摘は異なるスタイルを適用

### Severity集約ルール
**仕様書セクション16参照**
- サーバー: `low`, `medium`, `high`, `critical`
- UI: `All`, `High`, `Low`の3段階
- High: `high` OR `critical`
- Low: `low` OR `medium`

### カテゴリ別色定義
```typescript
const CATEGORY_COLORS = {
  security: 'border-red-500',
  privacy: 'border-blue-500',
  legal: 'border-purple-500',
  compliance: 'border-orange-500',
  tone: 'border-yellow-500',
  quality: 'border-green-500',
};
```

### API Base URL
- 環境変数: `VITE_API_BASE_URL`
- デフォルト: `http://localhost:8000`
- 開発時は`.env.local`に設定

---

## デザインガイドライン

### 色
- Primary（Check）: `bg-blue-600 hover:bg-blue-700`
- Secondary（Export）: `bg-gray-200 hover:bg-gray-300`
- Success（Verdict: ok）: `text-green-600 bg-green-50`
- Warning（Verdict: warn）: `text-yellow-600 bg-yellow-50`
- Error（Verdict: bad）: `text-red-600 bg-red-50`

### タイポグラフィ
- ヘッダー: `text-sm font-medium`
- カードタイトル: `text-base font-semibold`
- 本文: `text-sm`
- 小さい文字: `text-xs text-gray-500`

### スペーシング
- カード間: `space-y-3`
- パディング: `p-4`（カード内部）

---

## 完成チェックリスト

- [ ] プロジェクト初期化とライブラリインストール完了
- [ ] 型定義（`types/index.ts`）完成
- [ ] API Client（`api/client.ts`）完成
- [ ] Zustand Store（`store/appStore.ts`）完成
- [ ] AppShell + TopBar実装完了
- [ ] MarkdownEditor（CodeMirror）実装完了
- [ ] SettingsBar実装完了
- [ ] ResultsPane + Findings表示完了
- [ ] FindingCard（折りたたみ、選択、カテゴリ色）完成
- [ ] VerdictBanner + SeverityFilterChips実装完了
- [ ] PersonaView実装完了
- [ ] Check実行フロー動作確認
- [ ] Patch適用フロー動作確認
- [ ] Export機能動作確認
- [ ] エラーハンドリング確認
- [ ] レスポンシブ対応確認

---

## トラブルシューティング

### CodeMirrorのハイライトが表示されない
- `EditorView.decorations.of()`で正しくDecorationを渡しているか確認
- `start`/`end`がテキスト長を超えていないか確認

### API呼び出しでCORSエラー
- バックエンドの`main.py`に以下を追加:
```python
  from fastapi.middleware.cors import CORSMiddleware
  app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"])
```

### Zustandのstateが更新されない
- `set()`内で正しくstateを更新しているか確認
- Immer構文（`produce`）を使う場合は`zustand/middleware`をインポート

---

## 参考資料

- **仕様書**: 本ドキュメントと同じディレクトリの`spec.md`を参照
- CodeMirror 6: https://codemirror.net/docs/
- Zustand: https://docs.pmnd.rs/zustand/
- TailwindCSS: https://tailwindcss.com/docs

---

**この指示書を元に、段階的に実装を進めてください。各Phaseを完了したら次のPhaseに進み、必要に応じてコードレビューを実施してください。**