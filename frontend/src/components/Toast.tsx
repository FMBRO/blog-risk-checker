import { CheckCircle } from 'lucide-react';
import { useAppStore } from '../store/appStore';

export function Toast() {
  const { toastMessage } = useAppStore();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in-up">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg shadow-lg">
        <CheckCircle className="w-5 h-5 text-green-400" />
        <span className="text-sm font-medium">{toastMessage}</span>
      </div>
    </div>
  );
}
