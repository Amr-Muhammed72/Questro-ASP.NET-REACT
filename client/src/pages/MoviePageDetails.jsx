import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star } from "lucide-react";

import NavBar from '../components/NavBar';
import bgImage from "../assets/main-background.jpeg";
import MovieCard from '../components/cards/MovieCard';

const BASE_URL = 'http://localhost:5222/api/movies';

// 🎬 YouTube fix
const getYoutubeEmbed = (url) => {
  if (!url) return null;

  let videoId = "";

  if (url.includes("watch?v=")) {
    videoId = url.split("v=")[1]?.split("&")[0];
  } else if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1];
  } else {
    videoId = url;
  }

  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0`;
};

const MoviePageDetails = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    fetchMovieDetails();
  }, [id]);

  const fetchMovieDetails = async () => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`);
      const data = await response.json();
      setMovie(data);
    } catch (error) {
      console.log(error);
    }
  };

  if (!movie) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const Trailer = getYoutubeEmbed(movie.trailerUrl);
  const img = movie.posterUrl || movie.imageUrl || (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null) || movie.backdropUrl;

  return (
    <div
      className="w-full min-h-screen text-white relative pt-20"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >

      {/* 🌑 OVERLAYS */}
      <div className="absolute inset-0 bg-black/75" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />

      {/* 🔝 NAVBAR (above everything) */}
      <div className="relative z-50">
        <NavBar />
      </div>

      {/* CONTENT */}
      <div className="relative z-10">

        {/* 🎬 TRAILER (UNDER NAVBAR) */}
        <div className="relative w-full h-[80vh] mt-6 px-6 md:px-16">

          <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">

            {Trailer ? (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={Trailer}
                title={movie.title}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <img src={img} alt={movie.title} />
              </div>
            )}

            {/* RATING OVERLAY */}
            <div className="absolute bottom-10 left-10 z-10 max-w-3xl">
              <div className="flex items-center gap-3 mt-4">
                <Star className="text-yellow-400 fill-yellow-400" />
                <span className="text-lg">
                  {movie.tmdbRating?.toFixed(1)}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* 📊 DETAILS */}
        <div className="px-6 md:px-16 py-10">

          {/* META */}
          <div className="flex flex-wrap gap-4 text-zinc-300">
            <span>🎬 {movie.releaseDate?.split("T")[0]}</span>
            <span>⏱ {movie.runtime} min</span>
            <span>🎭 {movie.genres?.join(", ")}</span>
          </div>
          
          {/* TITLE */}
          <h1 className="text-5xl md:text-7xl font-bold mt-6">
            {movie.title}
          </h1>

          {/* OVERVIEW */}
          <p className="mt-6 text-lg text-zinc-300 max-w-4xl">
            {movie.overview}
          </p>

          {/* 🎭 CAST */}
          {movie.cast?.length > 0 && (
            <div className="mt-10">

              <h2 className="text-xl font-semibold mb-4">
                Top Cast
              </h2>

              <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide">

                {movie.cast.slice(0, 8).map((actor, i) => (
                  <div key={i} className="min-w-[120px] text-center">

                    <img
                      src={
                        actor.profileUrl
                          ? `https://image.tmdb.org/t/p/w185${actor.profileUrl}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}`
                      }
                      alt={actor.name}
                      className="w-[120px] h-[160px] object-cover rounded-xl shadow-lg"
                    />

                    <p className="mt-2 text-sm text-zinc-300">
                      {actor.name}
                    </p>

                    <p className="text-xs text-zinc-500">
                      {actor.role}
                    </p>

                  </div>
                ))}

              </div>
            </div>
          )}

          {/* 🎞 SIMILAR MOVIES */}
{movie.similarMovies?.length > 0 && (
  <div className="mt-12">

    <h2 className="text-xl font-semibold mb-4">
      Similar Movies
    </h2>

    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">

      {movie.similarMovies.map((m, index) => (
        <div
          key={m.tmdbId || m.movieId || index}
          className="snap-start shrink-0"
        >
          <MovieCard movie={m} isRowItem={true} />
        </div>
      ))}

    </div>
  </div>
)}

        </div>
      </div>
    </div>
  );
};

export default MoviePageDetails;