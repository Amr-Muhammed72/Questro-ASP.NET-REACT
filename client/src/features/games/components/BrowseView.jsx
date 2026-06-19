import React, { memo } from 'react';
import GameRow from './GameRow';

const BrowseView = memo(({ recentlyAdded, trending, genresWithGames, onGenreSearch, sentinelRef }) => {
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
      {genresWithGames.map(g => (
        <GameRow 
          key={g.genreId} 
          title={g.name} 
          games={g.games} 
          onTitleClick={() => {
            onGenreSearch({ genreId: String(g.genreId) });
          }}
        />
      ))}
      <div ref={sentinelRef} className="h-1" />
    </div>
  );
});

export default BrowseView;