import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { User, Loader2 } from 'lucide-react';

export function PersonaView() {
  const {
    personaResult,
    personaStatus,
    runPersonaReview,
    activeTab,
    settings,
  } = useAppStore();

  // タブがアクティブになったら自動でペルソナレビューを実行 (settings.audienceの変更も監視)
  useEffect(() => {
    if (activeTab === 'persona') {
      if (!personaResult || personaResult.audience !== settings.audience) {
        if (personaStatus === 'idle') {
          console.log('[PersonaView] Running review for audience:', settings.audience);
          runPersonaReview();
        }
      }
    }
  }, [activeTab, personaResult, personaStatus, runPersonaReview, settings.audience]);

  if (personaStatus === 'running') {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Running persona review...</p>
      </div>
    );
  }

  if (personaStatus === 'idle' && !personaResult) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
        <User className="w-12 h-12 mb-4" />
        <p className="text-center">
          Persona review will start automatically.
        </p>
      </div>
    );
  }

  if (!personaResult) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8">
        <p>No persona review results available.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header with audience and verdict */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-gray-600">
          <User className="w-5 h-5" />
          <span className="font-medium capitalize">
            Audience: {personaResult.audience}
          </span>
        </div>

        {/* Verdict badge and summary */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            personaResult.verdict === 'ok' ? 'bg-green-100 text-green-800' :
            personaResult.verdict === 'warn' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {personaResult.verdict.toUpperCase()}
          </span>
          <span className="text-sm text-gray-500">
            {personaResult.summary.total} issue{personaResult.summary.total !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {personaResult.items.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          No feedback from this audience.
        </div>
      ) : (
        <div className="space-y-3">
          {personaResult.items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  item.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  item.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                  item.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {item.severity.toUpperCase()}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.reason}</p>
              {item.suggestion && (
                <p className="text-sm text-blue-600">{item.suggestion}</p>
              )}
              {item.highlights && item.highlights.length > 0 && (
                <div className="mt-2 space-y-1">
                  {item.highlights.map((hl, idx) => (
                    <div key={idx} className="text-xs bg-yellow-50 border-l-2 border-yellow-400 pl-2 py-1">
                      <code className="text-yellow-800">{hl.text}</code>
                      {hl.context && <span className="text-gray-500 ml-2">- {hl.context}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
