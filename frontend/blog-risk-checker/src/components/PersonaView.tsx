import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { User, Loader2 } from 'lucide-react';

export function PersonaView() {
  const {
    personaResult,
    personaStatus,
    runPersonaReview,
    activeTab,
    activePersona,
  } = useAppStore();

  // タブがアクティブになったら自動でペルソナレビューを実行 (activePersonaの変更も監視)
  useEffect(() => {
    if (activeTab === 'persona') {
      if (!personaResult || personaResult.persona !== activePersona) {
        if (personaStatus === 'idle') {
          console.log('[PersonaView] Running review for persona:', activePersona);
          runPersonaReview(activePersona);
        }
      }
    }
  }, [activeTab, personaResult, personaStatus, runPersonaReview, activePersona]);

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
      <div className="flex items-center gap-2 text-gray-600">
        <User className="w-5 h-5" />
        <span className="font-medium">
          Persona: {personaResult.persona}
        </span>
      </div>

      {personaResult.items.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          No feedback from this persona.
        </div>
      ) : (
        <div className="space-y-3">
          {personaResult.items.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-lg p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700 capitalize">
                  {item.category}
                </span>
                <span className="text-xs text-gray-500 uppercase">
                  {item.severity}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.reason}</p>
              {item.suggestion && (
                <p className="text-sm text-blue-600">{item.suggestion}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
