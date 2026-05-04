import React, { memo } from 'react';
import MovieRow from '../sections/MovieRow';

const BrowseView = memo(({ recentlyAdded, trending, recommended, genresWithMovies, onGenreSearch }) => {
  return (
    <div className="space-y-12">
      {recentlyAdded.length > 0 && (
        <MovieRow 
          title="Recently Added" 
          movies={recentlyAdded} 
        />
      )}
      {trending.length > 0 && (
        <MovieRow 
          title="Trending Now" 
          movies={trending} 
        />
      )}
      {recommended.length > 0 && (
        <MovieRow 
          title="Recommended for You" 
          movies={recommended} 
        />
      )}
      {genresWithMovies.map(g => (
        <MovieRow 
          key={g.genreId} 
          title={g.name} 
          movies={g.movies} 
          onTitleClick={() => {
            onGenreSearch({ genreId: String(g.genreId) });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      ))}
    </div>
  );
});

export default BrowseView;
