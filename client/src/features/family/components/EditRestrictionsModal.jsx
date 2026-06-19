import React, { useState, useEffect } from 'react';
import { X, Loader2, Save, AlertCircle } from 'lucide-react';
import { useUpdateChildRestrictions } from '../hooks/useFamily';
import { RestrictionToggles } from './RestrictionToggles';

export const EditRestrictionsModal = ({ child, onClose }) => {
  const initialRestrictions = child.restrictions || {};
  
  const [blockedMovieGenreIds, setBlockedMovieGenreIds] = useState(initialRestrictions.blockedMovieGenreIds || []);
  const [blockedGameGenreIds, setBlockedGameGenreIds] = useState(initialRestrictions.blockedGameGenreIds || []);
  const [apiError, setApiError] = useState('');

  const updateMutation = useUpdateChildRestrictions();

  const handleSave = () => {
    setApiError('');
    const payload = {
      blockedMovieGenreIds: Array.isArray(blockedMovieGenreIds) ? blockedMovieGenreIds.filter(id => id != null) : [],
      blockedGameGenreIds: Array.isArray(blockedGameGenreIds) ? blockedGameGenreIds.filter(id => id != null) : [],
    };

    updateMutation.mutate(
      { childId: child.userId, restrictionsData: payload },
      {
        onSuccess: () => {
          onClose();
        },
        onError: (error) => {
          setApiError(error?.details || error?.message || 'Failed to update restrictions.');
        },
      }
    );
  };
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900/90 border border-zinc-700/50 rounded-3xl shadow-2xl shadow-purple-900/20">
        
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-zinc-900/95 border-b border-zinc-800 backdrop-blur-md rounded-t-3xl">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">Edit Restrictions for {child.userName}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {apiError && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm font-medium">{apiError}</p>
            </div>
          )}

          {/* Restrictions */}
          <div className="p-5 bg-zinc-950/40 border border-zinc-800/80 rounded-2xl">
            <RestrictionToggles
              blockedMovieGenreIds={blockedMovieGenreIds}
              onChangeBlockedMovieGenres={setBlockedMovieGenreIds}
              blockedGameGenreIds={blockedGameGenreIds}
              onChangeBlockedGameGenres={setBlockedGameGenreIds}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-zinc-300 bg-transparent hover:bg-zinc-800 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-[0_0_20px_rgba(138,43,226,0.3)] hover:shadow-[0_0_25px_rgba(138,43,226,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Restrictions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
