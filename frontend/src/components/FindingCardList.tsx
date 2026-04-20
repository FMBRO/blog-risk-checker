import { useAppStore } from '../store/appStore';
import { FindingCard } from './FindingCard';

export function FindingCardList() {
  const { report, severityFilter } = useAppStore();

  if (!report) return null;

  const filteredFindings = report.findings.filter((finding) => {
    if (severityFilter === 'all') return true;
    if (severityFilter === 'high') {
      return finding.severity === 'high' || finding.severity === 'critical';
    }
    if (severityFilter === 'low') {
      return finding.severity === 'low' || finding.severity === 'medium';
    }
    return true;
  });

  if (filteredFindings.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        No findings match the current filter.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredFindings.map((finding) => (
        <FindingCard key={finding.id} finding={finding} />
      ))}
    </div>
  );
}
