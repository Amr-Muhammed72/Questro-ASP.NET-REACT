import { memo } from 'react';
import { Star, Heart, MessageCircle, Bookmark, CheckCircle, Users } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, colorClass }) => (
  <div className="flex flex-col md:flex-row items-center md:items-start md:justify-center gap-3 p-4 bg-[#11131A] rounded-2xl border border-white/5 transition-colors hover:border-white/10 w-full">
    <div className={`p-3 rounded-xl bg-white/5 ${colorClass}`}>
      <Icon className="w-5 h-5 md:w-6 md:h-6" />
    </div>
    <div className="text-center md:text-left flex-1">
      <div className="text-lg md:text-xl font-bold text-white">{value}</div>
      <div className="text-[10px] md:text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</div>
    </div>
  </div>
);

const MovieDetailsStats = memo(({ movie }) => {
  const {
    tmdbRating,
    ratingSummary,
    likesCount = 0,
    reviewsCount = 0,
    watchlistCount = 0,
    watchedCount = 0,
  } = movie;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
      <StatCard
        icon={Star}
        label="TMDB Score"
        value={tmdbRating ? tmdbRating.toFixed(1) : 'N/A'}
        colorClass="text-yellow-500"
      />
      <StatCard
        icon={Users}
        label="User Score"
        value={ratingSummary?.average ? ratingSummary.average.toFixed(1) : 'N/A'}
        colorClass="text-emerald-500"
      />
      <StatCard
        icon={Heart}
        label="Likes"
        value={likesCount.toLocaleString()}
        colorClass="text-rose-500"
      />
      <StatCard
        icon={MessageCircle}
        label="Reviews"
        value={reviewsCount.toLocaleString()}
        colorClass="text-blue-500"
      />
      <StatCard
        icon={Bookmark}
        label="Watchlisted"
        value={watchlistCount.toLocaleString()}
        colorClass="text-indigo-500"
      />
      <StatCard
        icon={CheckCircle}
        label="Watched"
        value={watchedCount.toLocaleString()}
        colorClass="text-emerald-500"
      />
    </div>
  );
});

MovieDetailsStats.displayName = 'MovieDetailsStats';
export default MovieDetailsStats;
