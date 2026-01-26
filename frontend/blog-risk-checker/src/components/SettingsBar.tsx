import { ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { PublishScope, Tone, Audience, RedactMode } from '../types';

const PUBLISH_SCOPE_LABELS: Record<string, string> = {
  public: '公開',
  unlisted: '限定公開',
  private: '非公開',
  internal: '社内のみ',
};

const TONE_LABELS: Record<string, string> = {
  technical: 'テクニカル',
  casual: 'カジュアル',
  formal: 'フォーマル',
};

const AUDIENCE_LABELS: Record<string, string> = {
  engineers: '技術者',
  general: '一般',
  internal: 'コンプライアンス',
  executives: 'ビジネス',
};

export function SettingsBar() {
  const { settings, setSettings, settingsExpanded, toggleSettingsExpanded, viewMode, setViewMode } = useAppStore();

  const summaryText = `${PUBLISH_SCOPE_LABELS[settings.publishScope]} / ${TONE_LABELS[settings.tone]} / ${AUDIENCE_LABELS[settings.audience]}`;

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      {/* 折りたたみヘッダー */}
      <button
        onClick={toggleSettingsExpanded}
        className="w-full px-4 py-2 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-100 transition-colors"
      >
        {/* View Toggle */}
        <div className="flex bg-gray-200 rounded-lg p-0.5 mr-4">
          <button
            onClick={(e) => { e.stopPropagation(); setViewMode('edit'); }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'edit'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Editor
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setViewMode('preview'); }}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'preview'
              ? 'bg-white text-gray-800 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Preview
          </button>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <Settings className="w-4 h-4" />
          <span>
            Settings: <span className="text-gray-800">{summaryText}</span>
          </span>
          <span className="text-gray-400 text-xs ml-2">(Click to expand)</span>
        </div>
        {settingsExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {/* 展開時の設定パネル */}
      {settingsExpanded && (
        <div className="px-4 py-3 bg-white border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Publish Scope
            </label>
            <select
              value={settings.publishScope}
              onChange={(e) => setSettings({ publishScope: e.target.value as PublishScope })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="public">公開</option>
              <option value="unlisted">限定公開</option>
              <option value="private">非公開</option>
              <option value="internal">社内のみ</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Tone
            </label>
            <select
              value={settings.tone}
              onChange={(e) => setSettings({ tone: e.target.value as Tone })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="technical">テクニカル</option>
              <option value="casual">カジュアル</option>
              <option value="formal">フォーマル</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Audience
            </label>
            <select
              value={settings.audience}
              onChange={(e) => setSettings({ audience: e.target.value as Audience })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="engineers">技術者</option>
              <option value="general">一般</option>
              <option value="internal">コンプライアンス</option>
              <option value="executives">ビジネス</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              個人情報検閲レベル
            </label>
            <select
              value={settings.redactMode}
              onChange={(e) => setSettings({ redactMode: e.target.value as RedactMode })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">なし</option>
              <option value="light">低い</option>
              <option value="strict">高い</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
