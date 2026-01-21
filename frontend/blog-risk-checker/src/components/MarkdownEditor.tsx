import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { Decoration, type DecorationSet, ViewPlugin, type ViewUpdate } from '@codemirror/view';
import { useAppStore } from '../store/appStore';

// ハイライト用のデコレーションマーク
const highlightMark = Decoration.mark({ class: 'cm-highlight' });
const selectedHighlightMark = Decoration.mark({ class: 'cm-highlight-selected' });

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
          if (update.docChanged || update.viewportChanged) {
            this.decorations = this.buildDecorations(update.view);
          }
        }

        buildDecorations(view: EditorView): DecorationSet {
          const state = useAppStore.getState();
          const highlights = state.report?.highlights?.items || [];
          const selectedId = state.selectedFindingId;

          const decorations: { from: number; to: number; mark: Decoration }[] = [];
          const docLength = view.state.doc.length;

          for (const h of highlights) {
            const from = Math.max(0, Math.min(h.start, docLength));
            const to = Math.max(from, Math.min(h.end, docLength));

            if (from < to) {
              const mark = h.findingId === selectedId ? selectedHighlightMark : highlightMark;
              decorations.push({ from, to, mark });
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

              // クリック位置にあるハイライトを探す
              for (const h of highlights) {
                if (pos >= h.start && pos <= h.end) {
                  selectFinding(h.findingId);
                  return;
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
      view.dispatch({});
    }
  }, [report, selectedFindingId]);

  return (
    <div ref={containerRef} className="h-full w-full bg-white" />
  );
}
