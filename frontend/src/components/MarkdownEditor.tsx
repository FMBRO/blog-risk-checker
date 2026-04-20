import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, StateEffect } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { Decoration, type DecorationSet, ViewPlugin, type ViewUpdate } from '@codemirror/view';
import { useAppStore } from '../store/appStore';

// ハイライト用のデコレーションマーク
const highlightMark = Decoration.mark({ class: 'cm-highlight' });
const selectedHighlightMark = Decoration.mark({ class: 'cm-highlight-selected' });
const forceUpdateEffect = StateEffect.define<null>();

export function MarkdownEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const {
    editorText,
    setEditorText,
    report,
    selectedFindingId,
    selectFinding,
  } = useAppStore();

  // エディタの初期化
  useEffect(() => {
    if (!containerRef.current) return;

    // ハイライトプラグイン
    const highlightPlugin = ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
          this.decorations = this.buildDecorations(view);
        }

        update(update: ViewUpdate) {
          if (update.docChanged || update.viewportChanged || update.transactions.some(tr => tr.effects.some(e => e.is(forceUpdateEffect)))) {
            this.decorations = this.buildDecorations(update.view);
          }
        }

        buildDecorations(view: EditorView): DecorationSet {
          const state = useAppStore.getState();
          const highlights = state.report?.highlights?.items || [];
          const selectedId = state.selectedFindingId;

          const decorations: { from: number; to: number; mark: Decoration }[] = [];
          const docString = view.state.doc.toString();

          for (const h of highlights) {
            if (!h.text) continue;

            // テキスト検索で位置を特定 (簡易実装: 全件ハイライト)
            let startIndex = 0;
            while (true) {
              const idx = docString.indexOf(h.text, startIndex);
              if (idx === -1) break;

              const from = idx;
              const to = idx + h.text.length;

              const mark = h.findingId === selectedId ? selectedHighlightMark : highlightMark;
              decorations.push({ from, to, mark });

              // 次の検索へ (重なり防止のため +1 でなく length 分進めるのが無難だが、重複検知のため +1)
              startIndex = idx + 1;
            }
          }

          // ソートしてDecorationSetを作成
          decorations.sort((a, b) => a.from - b.from);
          return Decoration.set(decorations.map((d) => d.mark.range(d.from, d.to)));
        }
      },
      {
        decorations: (v) => v.decorations,
      }
    );

    const state = EditorState.create({
      doc: editorText,
      extensions: [
        basicSetup,
        markdown(),
        highlightPlugin,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newText = update.state.doc.toString();
            setEditorText(newText);
          }
        }),
        EditorView.domEventHandlers({
          click: (event, view) => {
            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
            if (pos !== null) {
              const state = useAppStore.getState();
              const highlights = state.report?.highlights?.items || [];
              const docString = view.state.doc.toString();

              // クリック位置にあるハイライトを探す
              // Note: buildDecorations と同じロジックで位置を再計算する必要がある
              for (const h of highlights) {
                if (!h.text) continue;
                let startIndex = 0;
                while (true) {
                  const idx = docString.indexOf(h.text, startIndex);
                  if (idx === -1) break;

                  const from = idx;
                  const to = idx + h.text.length;

                  if (pos >= from && pos <= to) {
                    selectFinding(h.findingId);
                    return;
                  }
                  startIndex = idx + 1;
                }
              }
              // ハイライト外をクリックした場合は選択解除
              selectFinding(null);
            }
          },
        }),
        EditorView.theme({
          '&': {
            height: '100%',
          },
          '.cm-scroller': {
            overflow: 'auto',
          },
          '.cm-content': {
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            fontSize: '14px',
            padding: '16px',
          },
          '.cm-highlight': {
            backgroundColor: '#fef08a', // yellow-200
            borderRadius: '2px',
          },
          '.cm-highlight-selected': {
            backgroundColor: '#fde047', // yellow-300
            outline: '2px solid #eab308', // yellow-500
            borderRadius: '2px',
          },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []); // 初回のみ

  // 外部からテキストが変更された場合（パッチ適用時など）
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentText = view.state.doc.toString();
    if (currentText !== editorText) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentText.length,
          insert: editorText,
        },
      });
    }
  }, [editorText]);

  // ハイライト更新のトリガー
  useEffect(() => {
    const view = viewRef.current;
    if (view) {
      // 強制的に再描画
      view.dispatch({
        effects: forceUpdateEffect.of(null),
      });
    }
  }, [report, selectedFindingId]);

  return (
    <div ref={containerRef} className="h-full w-full bg-white" />
  );
}
