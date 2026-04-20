import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import clsx from 'clsx';

export function VerdictBanner() {
  const { report } = useAppStore();

  if (!report) return null;

  const { verdict, score, findings } = report;

  const highCount = findings.filter(
    (f) => f.severity === 'high' || f.severity === 'critical'
  ).length;
  const lowCount = findings.filter(
    (f) => f.severity === 'low' || f.severity === 'medium'
  ).length;

  const config = {
    ok: {
      icon: CheckCircle,
      label: 'Passed',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
    },
    warn: {
      icon: AlertTriangle,
      label: 'Warnings',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-200',
    },
    bad: {
      icon: XCircle,
      label: 'Issues Found',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      iconColor: 'text-red-600',
      borderColor: 'border-red-200',
    },
  }[verdict];

  const Icon = config.icon;

  return (
    <div
      className={clsx(
        'rounded-lg border p-4',
        config.bgColor,
        config.borderColor
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={clsx('w-6 h-6 flex-shrink-0', config.iconColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={clsx('font-semibold', config.textColor)}>
              Overall Verdict: {config.label}
            </span>
            {typeof score === 'number' && (
              <span className="text-sm text-gray-500">
                (Score: {score}/100)
              </span>
            )}
          </div>

          <div className="flex gap-4 text-xs">
            {highCount > 0 && (
              <span className="text-red-600">
                {highCount} High severity
              </span>
            )}
            {lowCount > 0 && (
              <span className="text-yellow-600">
                {lowCount} Low severity
              </span>
            )}
            {findings.length === 0 && (
              <span className="text-green-600">No issues found</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
