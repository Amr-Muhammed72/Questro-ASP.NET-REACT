export const normalizeMovies = (movies, limit) => {
  return movies.slice(0, limit).map((m) => ({
    id: `movie-${m.tmdbId || m.id}`,
    title: m.title || m.name,
    description: m.overview || 'Immerse yourself in this cinematic masterpiece.',
    rating: m.tmdbRating || m.vote_average,
    imageUrl: m.backdropUrl || m.posterUrl || m.backdrop_path,
    type: 'movie',
    originalData: m,
  }));
};

export const normalizeGames = (games, limit) => {
  return games.slice(0, limit).map((g) => ({
    id: `game-${g.rawgId || g.id}`,
    title: g.title || g.name,
    description: g.description_raw || g.description || 'A great adventure awaits.',
    rating: g.rating,
    imageUrl: g.posterUrl || g.background_image || g.imageUrl,
    type: 'game',
    originalData: g,
  }));
};

export const interleaveMedia = (arr1, arr2, limit) => {
  const mixed = [];
  const maxLength = Math.max(arr1.length, arr2.length);

  for (let i = 0; i < maxLength; i++) {
    if (arr1[i]) mixed.push(arr1[i]);
    if (arr2[i]) mixed.push(arr2[i]);
  }
  return mixed.slice(0, limit);
};