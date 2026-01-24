import { ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { PublishScope, Tone, Audience, RedactMode } from '../types';

export function SettingsBar() {
  const { settings, setSettings, settingsExpanded, toggleSettingsExpanded } = useAppStore();

  const summaryText = `${capitalize(settings.publishScope)} / ${capitalize(settings.tone)} / ${capitalize(settings.audience)}`;

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      {/* 折りたたみヘッダー */}
      <button
        onClick={toggleSettingsExpanded}
        className="w-full px-4 py-2 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4" />
          <span>
            Settings: <span className="text-gray-800">{summaryText}</span>
          </span>
          <span className="text-gray-400">(Click to expand)</span>
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
              <option value="public">Public</option>
              <option value="unlisted">Unlisted</option>
              <option value="private">Private</option>
              <option value="internal">Internal</option>
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
              <option value="technical">Technical</option>
              <option value="casual">Casual</option>
              <option value="formal">Formal</option>
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
              <option value="engineers">Engineers</option>
              <option value="general">General</option>
              <option value="internal">Internal</option>
              <option value="executives">Executives</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Redact Mode
            </label>
            <select
              value={settings.redactMode}
              onChange={(e) => setSettings({ redactMode: e.target.value as RedactMode })}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">None</option>
              <option value="light">Light</option>
              <option value="strict">Strict</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
