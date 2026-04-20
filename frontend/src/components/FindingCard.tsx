import { ChevronDown, ChevronUp, Wand2 } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { Finding } from '../types';
import clsx from 'clsx';

// カテゴリ別の色定義
const CATEGORY_COLORS: Record<string, string> = {
  security: 'border-l-red-500',
  privacy: 'border-l-blue-500',
  legal: 'border-l-purple-500',
  compliance: 'border-l-orange-500',
  tone: 'border-l-yellow-500',
  quality: 'border-l-green-500',
};

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  security: 'bg-red-100 text-red-700',
  privacy: 'bg-blue-100 text-blue-700',
  legal: 'bg-purple-100 text-purple-700',
  compliance: 'bg-orange-100 text-orange-700',
  tone: 'bg-yellow-100 text-yellow-700',
  quality: 'bg-green-100 text-green-700',
};

interface FindingCardProps {
  finding: Finding;
}

export function FindingCard({ finding }: FindingCardProps) {
  const {
    selectedFindingId,
    collapsedFindingIds,
    selectFinding,
    toggleFindingCollapse,
    applyPatch,
  } = useAppStore();

  const isSelected = selectedFindingId === finding.id;
  const isCollapsed = collapsedFindingIds.has(finding.id);

  const borderColor = CATEGORY_COLORS[finding.category] || 'border-l-gray-400';
  const badgeColor = CATEGORY_BADGE_COLORS[finding.category] || 'bg-gray-100 text-gray-700';

  const handleCardClick = () => {
    selectFinding(isSelected ? null : finding.id);
  };

  const handleToggleCollapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFindingCollapse(finding.id);
  };

  const handleApplyPatch = (e: React.MouseEvent) => {
    e.stopPropagation();
    applyPatch(finding.id, false); // deleteMode: true でコンテンツ削除 & カード削除
  };

  return (
    <div
      onClick={handleCardClick}
      className={clsx(
        'border-l-4 rounded-lg shadow-sm cursor-pointer transition-all',
        borderColor,
        isSelected ? 'bg-blue-50 ring-2 ring-blue-300' : 'bg-white hover:bg-gray-50'
      )}
    >
      {/* ヘッダー */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* カテゴリバッジ + 重要度 */}
            <div className="flex items-center gap-2 mb-1">
              <span
                className={clsx(
                  'px-2 py-0.5 text-xs font-medium rounded-full capitalize',
                  badgeColor
                )}
              >
                {finding.category}
              </span>
              <span
                className={clsx(
                  'text-xs font-medium',
                  finding.severity === 'critical' && 'text-red-600',
                  finding.severity === 'high' && 'text-red-500',
                  finding.severity === 'medium' && 'text-yellow-600',
                  finding.severity === 'low' && 'text-gray-500'
                )}
              >
                {finding.severity.toUpperCase()}
              </span>
            </div>

            {/* タイトル */}
            <h3 className="text-base font-semibold text-gray-900">
              {finding.title}
            </h3>
          </div>

          {/* 折りたたみトグル */}
          <button
            onClick={handleToggleCollapse}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {isCollapsed ? (
              <ChevronDown className="w-5 h-5" />
            ) : (
              <ChevronUp className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* 展開コンテンツ */}
      {!isCollapsed && (
        <div className="px-4 pb-4 space-y-3">
          {/* Reason */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1">Reason</h4>
            <p className="text-sm text-gray-700">{finding.reason}</p>
          </div>

          {/* Suggestion */}
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1">Suggestion</h4>
            <p className="text-sm text-gray-700">{finding.suggestion}</p>
          </div>

          {/* Apply ボタン */}
          <button
            onClick={handleApplyPatch}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            Apply Fix
          </button>
        </div>
      )}
    </div>
  );
}
