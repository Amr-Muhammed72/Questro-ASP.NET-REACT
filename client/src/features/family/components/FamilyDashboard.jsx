import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, ShieldAlert, Loader2, Calendar, Settings } from 'lucide-react';
import { useChildren } from '../hooks/useFamily';

import { ChildForm } from './ChildForm';
import { EditRestrictionsModal } from './EditRestrictionsModal'; // We will rename this or just change its content to ManageChildModal

export const FamilyDashboard = () => {
  const { data: children, isLoading, isError } = useChildren();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChild, setEditingChild] = useState(null);

  return (
    <div className="relative min-h-screen font-sans py-10 bg-[#09090b] overflow-x-hidden">
      {/* Background Starfield */}
      <div className="star-field">
        <div className="star-layer" id="stars-small"></div>
        <div className="star-layer" id="stars-medium"></div>
        <div className="star-layer" id="stars-large"></div>
      </div>
      
      {/* Dynamic Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none opacity-60 mix-blend-screen z-0" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[150px] pointer-events-none opacity-60 mix-blend-screen z-0" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen z-0" />
      
      <div className="relative z-10 w-full max-w-[1600px] mx-auto pt-10 transition-all duration-300 flex flex-col">
        <div className="w-full px-4 sm:px-6 md:px-10 lg:px-16 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-purple-500/30 shadow-[0_0_15px_rgba(138,43,226,0.2)] rounded-2xl">
                  <Users className="w-8 h-8 text-purple-400" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                  Family Management
                </h1>
              </div>
              <p className="text-zinc-400 max-w-2xl text-lg mt-4">
                Manage your child accounts, set content restrictions, and oversee their Questro experience safely.
              </p>
            </div>

            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-[0_0_20px_rgba(138,43,226,0.3)] hover:shadow-[0_0_25px_rgba(138,43,226,0.5)] transition-all group shrink-0 cursor-pointer border border-white/10"
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
              <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/40 border border-white/10 rounded-3xl backdrop-blur-md">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
                <p className="text-zinc-400">Loading child accounts...</p>
              </div>
            ) : isError ? (
              <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-center backdrop-blur-md">
                <p className="text-red-400">Failed to load child accounts. Please try again.</p>
              </div>
            ) : !children || children.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 px-4 bg-zinc-900/40 border border-white/10 rounded-3xl backdrop-blur-md text-center">
                <div className="w-20 h-20 bg-zinc-800/50 border border-white/5 rounded-full flex items-center justify-center mb-6">
                  <Users className="w-10 h-10 text-zinc-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">No child accounts yet</h3>
                <p className="text-zinc-400 max-w-md">
                  Create a child account to give them access to Questro while maintaining control over the content they can see.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {children.map((child) => (
                  <div
                    key={child.userId}
                    className="group flex flex-col h-full p-6 bg-white/[0.02] border border-white/10 rounded-[2rem] hover:border-indigo-500/40 transition-all duration-500 hover:shadow-[0_15px_40px_rgb(99,102,241,0.15)] relative overflow-hidden backdrop-blur-2xl hover:-translate-y-1.5"
                  >
                    {/* Glossy Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-[40px] group-hover:bg-indigo-500/30 transition-colors duration-500 pointer-events-none" />
                    <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-purple-500/10 rounded-full blur-[40px] group-hover:bg-purple-500/20 transition-colors duration-500 pointer-events-none" />
                    
                    <Link 
                      to={`/users/${child.userId}`}
                      className="flex items-center gap-4 mb-6 group/profile cursor-pointer relative z-10"
                    >
                      <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-zinc-800 to-[#09090b] border border-white/10 flex items-center justify-center shadow-inner shrink-0 group-hover/profile:border-indigo-500/50 transition-colors relative overflow-hidden">
                        <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover/profile:opacity-100 transition-opacity"></div>
                        <span className="text-2xl font-bold bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent group-hover/profile:from-white group-hover/profile:to-indigo-200 transition-all relative z-10">
                          {child.firstName ? child.firstName.charAt(0) : child.userName?.charAt(0)}
                        </span>
                      </div>
                      <div className="overflow-hidden flex-1">
                        <h3 className="text-lg font-bold text-white truncate group-hover/profile:text-indigo-300 transition-colors tracking-tight">
                          {child.firstName ? `${child.firstName} ${child.lastName || ''}` : child.userName}
                        </h3>
                        <p className="text-sm text-zinc-400 truncate group-hover/profile:text-zinc-300 transition-colors mt-0.5">@{child.userName}</p>
                      </div>
                    </Link>

                    <div className="space-y-4 pt-5 border-t border-white/10 flex-grow relative z-10">
                      {child.birthDate && (
                        <div className="flex items-center gap-3 text-sm text-zinc-300 bg-white/[0.03] p-3 rounded-2xl border border-white/5 shadow-inner">
                          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <Calendar className="w-4 h-4" />
                          </div>
                          <span className="font-medium">Born {new Date(child.birthDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      
                      {child.restrictions ? (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-2.5 text-sm text-zinc-200 font-semibold tracking-wide">
                            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                              <ShieldAlert className="w-4 h-4" />
                            </div>
                            <span>Active Restrictions</span>
                          </div>
                          <div className="pl-10 space-y-2 text-xs font-medium text-zinc-400">
                            {child.restrictions.blockedMovieGenreIds?.length > 0 && (
                              <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" /> {child.restrictions.blockedMovieGenreIds.length} Movie Genres Blocked</p>
                            )}
                            {child.restrictions.blockedGameGenreIds?.length > 0 && (
                              <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" /> {child.restrictions.blockedGameGenreIds.length} Game Genres Blocked</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-sm text-zinc-500 pt-2 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                          <ShieldAlert className="w-4 h-4 shrink-0 opacity-50" />
                          <span className="font-medium">No restrictions configured</span>
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={() => setEditingChild(child)}
                      className="w-full mt-6 py-3.5 bg-white/[0.03] hover:bg-indigo-500 text-zinc-300 hover:text-white text-sm font-semibold rounded-2xl border border-white/10 hover:border-indigo-500 transition-all duration-300 flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] relative z-10 group/btn"
                    >
                      <Settings className="w-4 h-4 group-hover/btn:rotate-90 transition-transform duration-500" />
                      Manage Account
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isFormOpen && <ChildForm onClose={() => setIsFormOpen(false)} />}
      {editingChild && <EditRestrictionsModal child={editingChild} onClose={() => setEditingChild(null)} />}
    </div>
  );
};


