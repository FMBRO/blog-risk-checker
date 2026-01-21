import { SettingsBar } from './SettingsBar';
import { MarkdownEditor } from './MarkdownEditor';

export function EditorPane() {
  return (
    <div className="h-full flex flex-col">
      <SettingsBar />
      <div className="flex-1 overflow-hidden">
        <MarkdownEditor />
      </div>
    </div>
  );
}
