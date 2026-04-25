
export const getFeaturedMovie = async () => {
  return {
    id: 99,
    title: 'DUNE: AWAKENING',
    description: 'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
    imageUrl: 'https://images.unsplash.com/photo-1542044896530-05d3c054e284?w=1920&q=80'
  };
};

export const getTrendingMovies = async () => {
  return [
    { id: 1, title: 'THE TRAIN OF LOVE', imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80', isTop10: true, recentlyAdded: true },
    { id: 2, title: 'AGENT 007', imageUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=500&q=80', isTop10: true, recentlyAdded: true },
    { id: 3, title: 'WORLD DESTRUCTION', imageUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=500&q=80', isTop10: true },
    { id: 4, title: 'RAW', imageUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=500&q=80', isTop10: true },
    { id: 5, title: 'POISON', imageUrl: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=500&q=80' },
    { id: 6, title: 'SPORT CAR', imageUrl: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?w=500&q=80', recentlyAdded: true },
    { id: 14, title: 'WAR MACHINE', imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80' },
  ];
};

export const getContinueWatching = async () => {
  return [
    { id: 7, title: 'SHADOW FORCE', progress: 45, imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&q=80' },
    { id: 8, title: 'ASCEND REBORN', progress: 15, imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80' },
    { id: 9, title: 'CYBER TALES', progress: 90, imageUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=500&q=80' },
  ];
};

export const getTop10Movies = async () => {
  return [
    { id: 10, title: 'SCREAM 7', imageUrl: 'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=500&q=80' },
    { id: 11, title: 'ROOFMAN', imageUrl: 'https://images.unsplash.com/photo-1542044896530-05d3c054e284?w=500&q=80' },
    { id: 12, title: 'MIDNIGHT SUN', imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80' },
    { id: 13, title: 'ECHOES', imageUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=500&q=80' },
  ];
};