import { useAppStore } from '../store/appStore';
import clsx from 'clsx';
import type { SeverityFilter } from '../types';

const filters: { id: SeverityFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'high', label: 'High' },
  { id: 'low', label: 'Low' },
];

export function SeverityFilterChips() {
  const { severityFilter, setSeverityFilter, report } = useAppStore();

  if (!report || report.findings.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => setSeverityFilter(filter.id)}
          className={clsx(
            'px-3 py-1 text-sm rounded-full transition-colors',
            severityFilter === filter.id
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
