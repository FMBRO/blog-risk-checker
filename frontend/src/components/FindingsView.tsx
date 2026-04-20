import { VerdictBanner } from './VerdictBanner';
import { SeverityFilterChips } from './SeverityFilterChips';
import { FindingCardList } from './FindingCardList';
import { useAppStore } from '../store/appStore';
import { FileSearch } from 'lucide-react';

export function FindingsView() {
  const { report, checkStatus } = useAppStore();

  if (checkStatus === 'idle' && !report) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
        <FileSearch className="w-12 h-12 mb-4" />
        <p className="text-center">
          Click the <span className="font-medium text-blue-600">Check</span> button to analyze your content.
        </p>
      </div>
    );
  }

  if (checkStatus === 'running') {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p>Analyzing content...</p>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="p-4 space-y-4">
      <VerdictBanner />
      <SeverityFilterChips />
      <FindingCardList />
    </div>
  );
}
