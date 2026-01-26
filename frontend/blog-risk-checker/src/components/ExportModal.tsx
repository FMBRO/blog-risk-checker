import { useState } from 'react';
import { X, Copy, Download, Check } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { copyToClipboard, downloadFile } from '../utils/clipboard';
import clsx from 'clsx';

interface ExportModalProps {
  onClose: () => void;
}

export function ExportModal({ onClose }: ExportModalProps) {
  const { releaseResult, docTitle, showToast } = useAppStore();
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  if (!releaseResult) return null;

  const { safeMarkdown, fixSummary, checklist } = releaseResult;

  const handleCopyMarkdown = async () => {
    const success = await copyToClipboard(safeMarkdown);
    if (success) {
      showToast('Copied to clipboard');
    }
  };

  const handleDownloadMarkdown = () => {
    const filename = `${docTitle}-safe.md`;
    downloadFile(safeMarkdown, filename);
    showToast('Download started');
  };

  const handleCopyChecklist = async () => {
    const checklistText = checklist.join('\n');
    const success = await copyToClipboard(checklistText);
    if (success) {
      showToast('Copied to clipboard');
    }
  };

  const toggleCheckItem = (index: number) => {
    const newSet = new Set(checkedItems);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setCheckedItems(newSet);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Export Options</h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Export Actions */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Export Markdown</h3>
            <div className="flex gap-2">
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Copy className="w-4 h-4" />
                Copy Markdown
              </button>
              <button
                onClick={handleDownloadMarkdown}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>

          {/* Fix Summary */}
          {fixSummary.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Fix Summary</h3>
              <ul className="space-y-1 text-sm text-gray-600 bg-gray-50 rounded-md p-3">
                {fixSummary.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Checklist */}
          {checklist.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Pre-publish Checklist</h3>
                <button
                  onClick={handleCopyChecklist}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
              <ul className="space-y-2 bg-gray-50 rounded-md p-3">
                {checklist.map((item, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <button
                      onClick={() => toggleCheckItem(index)}
                      className={clsx(
                        'flex-shrink-0 w-5 h-5 border rounded flex items-center justify-center transition-colors mt-0.5',
                        checkedItems.has(index)
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-gray-400'
                      )}
                    >
                      {checkedItems.has(index) && <Check className="w-3 h-3" />}
                    </button>
                    <span
                      className={clsx(
                        'text-sm',
                        checkedItems.has(index) ? 'text-gray-400 line-through' : 'text-gray-700'
                      )}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
