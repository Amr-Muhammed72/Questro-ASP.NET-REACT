import React, { memo, useCallback } from 'react';
import GameRow from './GameRow';

const GamesHomeView = memo(({ recentlyAdded, trending, genresWithGames, onGenreSearch }) => {
  const handleGenreSearchClick = useCallback((categoryId) => {
    if (onGenreSearch && categoryId) {
      onGenreSearch({ genreId: String(categoryId) });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [onGenreSearch]);

  return (
    <div className="space-y-12">
      {recentlyAdded.length > 0 && (
        <GameRow 
          title="Recently Added" 
          games={recentlyAdded} 
        />
      )}
      {trending.length > 0 && (
        <GameRow 
          title="Trending Now" 
          games={trending} 
        />
      )}
      {/* Dynamic rows for each Genre */}
      {genresWithGames && genresWithGames.map(g => (
        <GameRow 
          key={g.id} 
          title={g.name} 
          categoryId={g.id}
          games={g.games} 
          onTitleClick={handleGenreSearchClick}
        />
      ))}
    </div>
  );
});

export default GamesHomeView;