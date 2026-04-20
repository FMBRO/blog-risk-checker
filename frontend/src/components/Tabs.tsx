import { useAppStore } from '../store/appStore';
import clsx from 'clsx';
import type { TabType } from '../types';

const tabs: { id: TabType; label: string }[] = [
  { id: 'findings', label: 'Findings' },
  { id: 'persona', label: 'Audience' },
];

export function Tabs() {
  const { activeTab, setActiveTab, report } = useAppStore();

  const findingsCount = report?.findings?.length ?? 0;

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'px-4 py-2.5 text-sm font-medium transition-colors relative',
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            )}
          >
            {tab.label}
            {tab.id === 'findings' && findingsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                {findingsCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
