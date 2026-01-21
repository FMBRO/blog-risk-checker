import { Tabs } from './Tabs';
import { FindingsView } from './FindingsView';
import { PersonaView } from './PersonaView';
import { useAppStore } from '../store/appStore';

export function ResultsPane() {
  const { activeTab, errorMessage } = useAppStore();

  return (
    <div className="h-full flex flex-col">
      {/* エラーバナー */}
      {errorMessage && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* タブ */}
      <Tabs />

      {/* タブコンテンツ */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'findings' ? <FindingsView /> : <PersonaView />}
      </div>
    </div>
  );
}
