import React from 'react';
import { Save, X, FileText } from 'lucide-react';

interface SaveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
  initialTitle: string;
}

export const SaveReportModal: React.FC<SaveReportModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTitle,
}) => {
  const [title, setTitle] = React.useState(initialTitle);

  // Update local state when initialTitle changes
  React.useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(title);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-tactical-accent/20 flex items-center justify-center">
              <Save className="w-6 h-6 text-tactical-accent" />
            </div>
            <h3 className="text-xl font-bold text-white">Name Your Mission</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-gray-300 mb-6">
          Give your mission report a unique name to identify it in your dashboard.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="report-title" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Mission Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-gray-500" />
              </div>
              <input
                type="text"
                id="report-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tactical-accent focus:border-transparent transition-all"
                placeholder="e.g. Mountain Retreat - 7 Days"
                autoFocus
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={!title.trim()}
              className="flex-1 bg-tactical-accent text-black px-4 py-3 rounded font-bold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              SAVE REPORT
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 text-gray-400 hover:text-white border border-gray-700 px-4 py-3 rounded font-medium hover:bg-gray-700 transition-colors"
            >
              CANCEL
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};



