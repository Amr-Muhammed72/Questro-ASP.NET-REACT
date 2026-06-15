import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, ShieldAlert, Loader2, Calendar } from 'lucide-react';
import { useChildren } from '../hooks/useFamily';
import { useFamilyStore } from '../store/useFamilyStore';
import { ChildForm } from './ChildForm';
import { EditRestrictionsModal } from './EditRestrictionsModal';
import Navbar from '../../../components/layout/NavBar';
export const FamilyDashboard = () => {
  const { data: children, isLoading, isError } = useChildren();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const isChildAccount = useFamilyStore((state) => state.isChild);
  return (
    <div>
      <div className="pb-20">
      <Navbar />
      </div>
      <div className="w-full max-w-6xl mx-auto p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-800">
          <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl">
              <Users className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
              Family Management
            </h1>
          </div>
          <p className="text-zinc-400 max-w-2xl text-lg">
            Manage your child accounts, set content restrictions, and oversee their Questro experience.
          </p>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-[0_0_20px_rgba(138,43,226,0.3)] hover:shadow-[0_0_25px_rgba(138,43,226,0.5)] transition-all group shrink-0 cursor-pointer"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Add Child Account
        </button>
      </div>

      {/* Children List */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          Your Child Accounts
        </h2>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl backdrop-blur-sm">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
            <p className="text-zinc-400">Loading child accounts...</p>
          </div>
        ) : isError ? (
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
            <p className="text-red-400">Failed to load child accounts. Please try again.</p>
          </div>
        ) : !children || children.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-4 bg-zinc-900/30 border border-zinc-800/50 rounded-3xl backdrop-blur-sm text-center">
            <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-zinc-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No child accounts yet</h3>
            <p className="text-zinc-400 max-w-md">
              Create a child account to give them access to Questro while maintaining control over the content they can see.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map((child) => (
              <div
                key={child.userId}
                className="group p-6 bg-zinc-900/60 border border-zinc-800 rounded-3xl hover:border-purple-500/50 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(138,43,226,0.12)] relative overflow-hidden backdrop-blur-md flex flex-col h-full"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full -z-10 group-hover:bg-purple-500/10 transition-colors" />
                
                <Link 
                  to={`/users/${child.userId}`}
                  className="flex items-center gap-4 mb-6 group/profile cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center shadow-inner shrink-0 group-hover/profile:border-indigo-500/50 transition-colors">
                    <span className="text-2xl font-bold text-zinc-300 uppercase group-hover/profile:text-white transition-colors">
                      {child.firstName ? child.firstName.charAt(0) : child.userName?.charAt(0)}
                    </span>
                  </div>
                  <div className="overflow-hidden">
                    <h3 className="text-lg font-bold text-white truncate group-hover/profile:text-indigo-300 transition-colors">
                      {child.firstName ? `${child.firstName} ${child.lastName || ''}` : child.userName}
                    </h3>
                    <p className="text-sm text-zinc-400 truncate group-hover/profile:text-zinc-300 transition-colors">@{child.userName}</p>
                  </div>
                </Link>

                <div className="space-y-3 pt-4 border-t border-zinc-800/80 flex-grow">
                  {child.birthDate && (
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Calendar className="w-4 h-4 text-zinc-500 shrink-0" />
                      <span>Born: {new Date(child.birthDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {child.restrictions ? (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 text-sm text-zinc-300 font-medium">
                        <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
                        <span>Active Restrictions:</span>
                      </div>
                      <div className="pl-6 space-y-1 text-xs text-zinc-400">
                        {child.restrictions.blockedMovieGenreIds?.length > 0 && (
                          <p>• {child.restrictions.blockedMovieGenreIds.length} Movie Genres Blocked</p>
                        )}
                        {child.restrictions.blockedGameGenreIds?.length > 0 && (
                          <p>• {child.restrictions.blockedGameGenreIds.length} Game Genres Blocked</p>
                        )}
                        {child.restrictions.maxContentRating && (
                          <p>• Max Movie Rating: {child.restrictions.maxContentRating}</p>
                        )}
                        {child.restrictions.maxMetacriticRating != null && (
                          <p>• Max Game Rating: {child.restrictions.maxMetacriticRating}/5</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-zinc-500 pt-2">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>No restrictions configured</span>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => setEditingChild(child)}
                  className="w-full mt-6 py-2.5 bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 hover:text-white text-sm font-medium rounded-xl border border-zinc-700/50 transition-colors shrink-0 cursor-pointer"
                >
                  Edit Restrictions
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isFormOpen && <ChildForm onClose={() => setIsFormOpen(false)} />}
      {editingChild && <EditRestrictionsModal child={editingChild} onClose={() => setEditingChild(null)} />}
    </div>
    </div>
  );
};
