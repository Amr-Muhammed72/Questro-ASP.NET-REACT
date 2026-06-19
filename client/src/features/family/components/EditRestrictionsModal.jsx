import { useState, useEffect } from 'react';
import { X, Loader2, Save, AlertCircle, ShieldAlert, KeyRound, Trash2 } from 'lucide-react';
import { useUpdateChildRestrictions, useChangeChildPassword, useDeleteChild } from '../hooks/useFamily';
import { RestrictionToggles } from './RestrictionToggles';

export const EditRestrictionsModal = ({ child, onClose }) => {
  const [activeTab, setActiveTab] = useState('restrictions'); // 'restrictions', 'security', 'danger'
  const [apiError, setApiError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Restrictions State
  const initialRestrictions = child.restrictions || {};
  const [blockedMovieGenreIds, setBlockedMovieGenreIds] = useState(initialRestrictions.blockedMovieGenreIds || []);
  const [blockedGameGenreIds, setBlockedGameGenreIds] = useState(initialRestrictions.blockedGameGenreIds || []);

  // Security State
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Danger State
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const updateRestrictionsMutation = useUpdateChildRestrictions();
  const changePasswordMutation = useChangeChildPassword();
  const deleteChildMutation = useDeleteChild();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSaveRestrictions = () => {
    setApiError('');
    setSuccessMsg('');
    const payload = {
      blockedMovieGenreIds: Array.isArray(blockedMovieGenreIds) ? blockedMovieGenreIds.filter(id => id != null) : [],
      blockedGameGenreIds: Array.isArray(blockedGameGenreIds) ? blockedGameGenreIds.filter(id => id != null) : []
    };

    updateRestrictionsMutation.mutate(
      { childId: child.userId, restrictionsData: payload },
      {
        onSuccess: () => {
          setSuccessMsg('Restrictions updated successfully.');
          setTimeout(() => setSuccessMsg(''), 3000);
        },
        onError: (error) => {
          setApiError(error?.details || error?.message || 'Failed to update restrictions.');
        },
      }
    );
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setApiError('');
    setSuccessMsg('');
    
    if (newPassword !== confirmNewPassword) {
      setApiError('Passwords do not match.');
      return;
    }

    changePasswordMutation.mutate(
      { childId: child.userId, passwordData: { newPassword, confirmNewPassword } },
      {
        onSuccess: () => {
          setSuccessMsg('Password changed successfully.');
          setNewPassword('');
          setConfirmNewPassword('');
          setTimeout(() => setSuccessMsg(''), 3000);
        },
        onError: (error) => {
          setApiError(error?.details || error?.message || 'Failed to change password.');
        },
      }
    );
  };

  const handleDeleteChild = () => {
    setApiError('');
    if (deleteConfirm !== child.userName) {
      setApiError('Username does not match.');
      return;
    }

    deleteChildMutation.mutate(child.userId, {
      onSuccess: () => {
        onClose();
      },
      onError: (error) => {
        setApiError(error?.details || error?.message || 'Failed to delete account.');
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-zinc-900/90 border border-white/10 rounded-3xl shadow-2xl shadow-purple-900/20 overflow-hidden backdrop-blur-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-zinc-900/95 border-b border-white/10">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">Manage Account: {child.userName}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex px-6 pt-4 border-b border-white/10 gap-6 bg-zinc-900/50">
          <button 
            onClick={() => { setActiveTab('restrictions'); setApiError(''); setSuccessMsg(''); }}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'restrictions' ? 'text-purple-400' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <span className="flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Restrictions</span>
            {activeTab === 'restrictions' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-t-full" />}
          </button>
          <button 
            onClick={() => { setActiveTab('security'); setApiError(''); setSuccessMsg(''); }}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'security' ? 'text-purple-400' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <span className="flex items-center gap-2"><KeyRound className="w-4 h-4" /> Security</span>
            {activeTab === 'security' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-500 rounded-t-full" />}
          </button>
          <button 
            onClick={() => { setActiveTab('danger'); setApiError(''); setSuccessMsg(''); }}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'danger' ? 'text-red-400' : 'text-zinc-400 hover:text-red-300'}`}
          >
            <span className="flex items-center gap-2"><Trash2 className="w-4 h-4" /> Danger Zone</span>
            {activeTab === 'danger' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 rounded-t-full" />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {apiError && (
            <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm font-medium">{apiError}</p>
            </div>
          )}
          {successMsg && (
            <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <p className="text-green-400 text-sm font-medium">{successMsg}</p>
            </div>
          )}

          {activeTab === 'restrictions' && (
            <div className="space-y-6">
              <div className="p-5 bg-black/20 border border-white/5 rounded-2xl">
                <RestrictionToggles
                  blockedMovieGenreIds={blockedMovieGenreIds}
                  onChangeBlockedMovieGenres={setBlockedMovieGenreIds}
                  blockedGameGenreIds={blockedGameGenreIds}
                  onChangeBlockedGameGenres={setBlockedGameGenreIds}
                />
              </div>
              <div className="flex justify-end pt-4 border-t border-white/10">
                <button
                  onClick={handleSaveRestrictions}
                  disabled={updateRestrictionsMutation.isPending}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-[0_0_20px_rgba(138,43,226,0.3)] hover:shadow-[0_0_25px_rgba(138,43,226,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateRestrictionsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Restrictions
                </button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="p-5 bg-black/20 border border-white/5 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold text-white">Change Password</h3>
                <p className="text-sm text-zinc-400">Update the login password for this child account.</p>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">Confirm New Password</label>
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-zinc-900/50 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-white/10">
                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending || !newPassword || !confirmNewPassword}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-[0_0_20px_rgba(138,43,226,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {changePasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Change Password
                </button>
              </div>
            </form>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl space-y-4">
                <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" /> Delete Account
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Permanently delete <strong>{child.userName}</strong>'s account and all associated data. This action cannot be undone.
                </p>
                <div className="pt-4 space-y-2">
                  <label className="block text-sm font-medium text-zinc-300">
                    Type <strong>{child.userName}</strong> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-900/50 border border-red-500/30 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    placeholder={child.userName}
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-white/10">
                <button
                  onClick={handleDeleteChild}
                  disabled={deleteChildMutation.isPending || deleteConfirm !== child.userName}
                  className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteChildMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete Account
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
