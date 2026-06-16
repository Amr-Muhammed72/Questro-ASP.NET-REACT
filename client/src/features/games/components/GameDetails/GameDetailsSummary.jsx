import { memo } from 'react';

const GameDetailsSummary = memo(({ game }) => {
  if (!game) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
      {/* Main Content Column */}
      <div className="lg:col-span-8 flex flex-col gap-10">
        
        {/* Storyline */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold text-white tracking-tight">About this game</h2>
          </div>
          <div 
            className="text-zinc-300 leading-relaxed text-lg"
            dangerouslySetInnerHTML={{ __html: game.description || "No description available." }}
          />
        </section>

        {/* Screenshots */}
        {game.screenshots && game.screenshots.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Screenshots</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {game.screenshots.map((shot) => (
                <div key={shot.id} className="overflow-hidden rounded-xl border border-white/5 bg-zinc-900 group cursor-pointer">
                  <img
                    src={shot.imageUrl}
                    alt="Gameplay screenshot"
                    className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sidebar Column */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        
        {/* Developers */}
        {game.developers && game.developers.length > 0 && (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Developers</h3>
            <div className="flex flex-col gap-4">
              {game.developers.map((dev) => (
                <div key={dev.id} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0 border border-white/5">
                    {dev.imageUrl ? (
                      <img src={dev.imageUrl} alt={dev.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🏢</div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-200 text-sm group-hover:text-indigo-400 transition-colors">{dev.name}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Publishers */}
        {game.publishers && game.publishers.length > 0 && (
          <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Publishers</h3>
            <div className="flex flex-col gap-4">
              {game.publishers.map((pub) => (
                <div key={pub.id} className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0 border border-white/5">
                    {pub.imageUrl ? (
                      <img src={pub.imageUrl} alt={pub.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🏢</div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-200 text-sm group-hover:text-indigo-400 transition-colors">{pub.name}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
});

GameDetailsSummary.displayName = 'GameDetailsSummary';
export default GameDetailsSummary;
