import { useState } from 'react';
import { Shield, Download, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { ExportModal } from './ExportModal';
import clsx from 'clsx';

export function TopBar() {
  const {
    projectName,
    docTitle,
    isAutosaved,
    checkStatus,
    checkId,
    report,
    runCheck,
    runRecheck,
    runRelease,
    releaseStatus,
  } = useAppStore();

  const [showExportModal, setShowExportModal] = useState(false);

  const isRunning = checkStatus === 'running';
  const isReleasing = releaseStatus === 'running';
  const hasUncheckedChanges = !isAutosaved && checkId !== null;
  const canExport = (report?.score ?? 0) >= 70;

  const handleCheck = () => {
    if (checkId) {
      runRecheck();
    } else {
      runCheck();
    }
  };

  const handleExport = async () => {
    const result = await runRelease();
    if (result) {
      setShowExportModal(true);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      {/* 左側: アイコン + プロジェクト情報 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <span className="font-semibold text-gray-900">Blog Risk Checker</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
          {/*　
          <span>/</span>
          <span>{projectName}</span>
          <span>/</span>
          <span className="text-gray-700">{docTitle}</span>
          {isAutosaved ? (
            <span className="text-green-600 text-xs">(saved)</span>
          ) : (
            <span className="text-yellow-600 text-xs">(unsaved)</span>
          )}
          */}
        </div>
      </div>

      {/* 右側: アクションボタン */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCheck}
          disabled={isRunning}
          className={clsx(
            'relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            'bg-blue-600 text-white hover:bg-blue-700',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Check
            </>
          )}
          {/* 未チェック変更の通知ドット */}
          {hasUncheckedChanges && !isRunning && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
          )}
        </button>

        <button
          onClick={handleExport}
          disabled={!canExport || isReleasing}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
            canExport && !isReleasing
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          {isReleasing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export
            </>
          )}
        </button>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}
    </header>
  );
}
