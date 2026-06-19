import { memo, useState } from 'react';
import { Building2, Image as ImageIcon } from 'lucide-react';

const ScreenshotFallback = ({ src, alt }) => {
  const [error, setError] = useState(false);
  
  if (error || !src) {
    return (
      <div className="w-full aspect-video bg-zinc-800 flex flex-col items-center justify-center text-zinc-500">
        <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
        <span className="text-sm font-medium">Image Unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-500"
      loading="lazy"
      onError={() => setError(true)}
    />
  );
};

const CompanyLogoFallback = ({ src, alt }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
        <Building2 className="w-6 h-6" />
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
      loading="lazy"
      onError={() => setError(true)}
    />
  );
};

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

        {/* Visual Showcase */}
        {game.screenshots && game.screenshots.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Visual Showcase</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {game.screenshots.map((shot) => (
                <div key={shot.id} className="overflow-hidden rounded-xl border border-white/5 bg-zinc-900 group cursor-pointer relative ring-1 ring-white/10 shadow-lg">
                  <ScreenshotFallback src={shot.imageUrl} alt="Gameplay screenshot" />
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
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0 border border-white/5 relative shadow-md ring-1 ring-white/10">
                    <CompanyLogoFallback src={dev.imageUrl} alt={dev.name} />
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
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-900 flex-shrink-0 border border-white/5 relative shadow-md ring-1 ring-white/10">
                    <CompanyLogoFallback src={pub.imageUrl} alt={pub.name} />
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
