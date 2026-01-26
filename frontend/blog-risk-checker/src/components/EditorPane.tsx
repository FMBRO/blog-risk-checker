import { useAppStore } from '../store/appStore';
import { SettingsBar } from './SettingsBar';
import { MarkdownEditor } from './MarkdownEditor';
import { MarkdownPreview } from './MarkdownPreview';

export function EditorPane() {
  const { viewMode } = useAppStore();

  return (
    <div className="h-full flex flex-col">
      <SettingsBar />
      <div className="flex-1 overflow-hidden">
        {viewMode === 'preview' ? <MarkdownPreview /> : <MarkdownEditor />}
      </div>
    </div>
  );
}
