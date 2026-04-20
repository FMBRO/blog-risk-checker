import { TopBar } from './TopBar';
import { EditorPane } from './EditorPane';
import { ResultsPane } from './ResultsPane';

export function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopBar />
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* 左ペイン: エディタ (60-70%) */}
        <div className="flex-1 lg:w-[65%] lg:min-w-0 border-r border-gray-200">
          <EditorPane />
        </div>
        {/* 右ペイン: 結果 (30-40%) */}
        <div className="lg:w-[35%] lg:min-w-[320px] bg-white overflow-hidden">
          <ResultsPane />
        </div>
      </div>
    </div>
  );
}
