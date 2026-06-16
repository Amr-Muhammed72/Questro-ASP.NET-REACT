import { memo } from 'react';
import { Calendar, Clock, Globe, TrendingUp } from 'lucide-react';

const MetaItem = ({ icon: Icon, label, value, colorClass, bgClass }) => (
  <div className="flex gap-4 lg:gap-6 items-start group">
    <div className={`p-3 lg:p-4 rounded-2xl ${bgClass} ${colorClass} mt-1 transition-transform group-hover:scale-110 group-hover:-rotate-3 duration-300`}>
      <Icon className="w-6 h-6 lg:w-7 lg:h-7" />
    </div>
    <div className="flex flex-col justify-center pt-1">
      <div className="text-sm text-zinc-500 font-bold uppercase tracking-wider mb-1.5">{label}</div>
      <div className="text-base lg:text-lg font-bold text-white">{value}</div>
    </div>
  </div>
);

const MovieDetailsSummary = memo(({ movie }) => {
  const {
    overview,
    releaseDate,
    runtime,
    language,
    popularity,
    genres
  } = movie;

  const formattedReleaseDate = releaseDate 
    ? new Date(releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'N/A';
  
  const hours = runtime ? Math.floor(runtime / 60) : 0;
  const minutes = runtime ? runtime % 60 : 0;
  const formattedRuntime = runtime ? `${hours}h ${minutes}m` : 'N/A';

  return (
    <div className="glassmorphism relative rounded-3xl p-6 md:p-10 shadow-2xl group transition-all duration-500 hover:glow-sm border border-white/5 bg-zinc-900/40">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row gap-10 md:gap-16">
        
        {/* Left Side: Overview */}
        <div className="flex-1 md:w-3/5">
          <h3 className="text-2xl lg:text-3xl font-black text-white mb-6">Overview</h3>
          <p className="text-zinc-400 text-base md:text-lg lg:text-xl leading-relaxed">
            {overview || 'No overview available.'}
          </p>
        </div>

        {/* Right Side: Meta Grid */}
        <div className="flex-1 md:w-2/5 mt-8 md:mt-0">
          <div className="grid grid-cols-2 gap-y-10 gap-x-8">
            <MetaItem 
              icon={Calendar} 
              label="Release Date" 
              value={formattedReleaseDate} 
              colorClass="text-indigo-400"
              bgClass="bg-indigo-500/10"
            />
            <MetaItem 
              icon={Clock} 
              label="Runtime" 
              value={formattedRuntime} 
              colorClass="text-orange-400"
              bgClass="bg-orange-500/10"
            />
            <MetaItem 
              icon={Globe} 
              label="Language" 
              value={language ? language.toUpperCase() : 'N/A'} 
              colorClass="text-cyan-400"
              bgClass="bg-cyan-500/10"
            />
            <MetaItem 
              icon={TrendingUp} 
              label="Popularity" 
              value={popularity ? popularity.toFixed(1) : 'N/A'} 
              colorClass="text-rose-400"
              bgClass="bg-rose-500/10"
            />
            
            {genres && genres.length > 0 && (
              <div className="col-span-2 mt-4">
                <div className="text-sm text-zinc-500 font-bold uppercase tracking-wider mb-4">Genres</div>
                <div className="flex flex-wrap gap-3">
                  {genres.map((genre) => (
                    <span
                      key={genre}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl text-sm font-bold tracking-wide shadow-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
});

MovieDetailsSummary.displayName = 'MovieDetailsSummary';
export default MovieDetailsSummary;
