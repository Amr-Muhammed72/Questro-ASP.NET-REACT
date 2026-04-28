// Mock data for movies and games to simulate an API/backend response
const mediaItems = [
  { id: 1, title: 'THE TRAIN OF LOVE', type: 'movie', imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80' },
  { id: 2, title: 'AGENT', type: 'movie', imageUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=500&q=80' },
  { id: 3, title: 'CYBER DRIFT', type: 'game', imageUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=500&q=80' },
  { id: 4, title: 'RAW', type: 'movie', imageUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=500&q=80' },
  { id: 5, title: 'POISON', type: 'movie', imageUrl: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=500&q=80' },
  { id: 6, title: 'GRAND AUTO', type: 'game', imageUrl: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?w=500&q=80' },
  { id: 7, title: 'MIDTOWN', type: 'movie', imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&q=80' },
  { id: 8, title: 'ONE NIGHT', type: 'movie', imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80' },
  { id: 9, title: 'LOVE AT', type: 'movie', imageUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=500&q=80' },
  { id: 10, title: 'NEON ASCEND', type: 'game', imageUrl: 'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=500&q=80' },
  { id: 11, title: 'THE TRAIN OF LOVE', type: 'movie', imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80' },
  { id: 12, title: 'AGENT', type: 'movie', imageUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=500&q=80' },
  { id: 13, title: 'CYBER DRIFT', type: 'game', imageUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=500&q=80' },
  { id: 14, title: 'RAW', type: 'movie', imageUrl: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=500&q=80' },
  { id: 15, title: 'POISON', type: 'movie', imageUrl: 'https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=500&q=80' },
  { id: 16, title: 'GRAND AUTO', type: 'game', imageUrl: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?w=500&q=80' },
  { id: 17, title: 'MIDTOWN', type: 'movie', imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=500&q=80' },
  { id: 18, title: 'ONE NIGHT', type: 'movie', imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&q=80' },
  { id: 19, title: 'LOVE AT', type: 'movie', imageUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=500&q=80' },
  { id: 20, title: 'NEON ASCEND', type: 'game', imageUrl: 'https://images.unsplash.com/photo-1614200187524-dc4b892acf16?w=500&q=80' },
];

const getTrending = async () => {
  // Simulating a network request delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mediaItems);
    }, 800);
  });
};

const getNewReleases = async () => {
  // Simulating a network request returning different/shuffled data
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([...mediaItems].reverse());
    }, 800);
  });
};

export default { getTrending, getNewReleases };
