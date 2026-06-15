import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star } from "lucide-react";
import NavBar from '../components/layout/NavBar';
import bgImage from '../assets/main-background.png';
import MovieRow from '../features/movies/components/MovieRow';

import { useAuth } from '../features/auth/store/AuthContext';
import ActorCard from '../features/movies/components/ActorCard';

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
  const [similarMovies, setSimilarMovies] = useState([]);
  const { isLoggedIn, logout } = useAuth();

  useEffect(() => {
    fetchMovieDetails();
    fetchReviews();
  }, [id]);

  const fetchMovieDetails = async () => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`);
      const data = await response.json();
      setMovie(data);
      setSimilarMovies(data.similarMovies || []);

    } catch (error) {
      console.log(error);
    }
  };
  const fetchReviews = async () => {
  try {

    setReviewsLoading(true);

    const response = await fetch(
      `http://localhost:5222/api/movie-reviews/${id}?pageIndex=1&pageSize=20`
    );

    const data = await response.json();

    console.log("Reviews:", data);

    setReviews(data.data || []);

  } catch (error) {

    console.error(error);

  } finally {

    setReviewsLoading(false);

  }
  };

const [rating, setRating] = useState(0);
const [comment, setComment] = useState("");
const [reviews, setReviews] = useState([]);
const [reviewsLoading, setReviewsLoading] = useState(true);


const handleSubmit = async (e) => {
  e.preventDefault();

  console.log("Submit clicked");

  try {

    const token = localStorage.getItem("accessToken");

    const response = await fetch(
      `http://localhost:5222/api/movie-reviews/${id}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          rating,
          comment,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to submit review");
    }

    const data = await response.json();

    console.log("Review submitted:", data);

    // clear form
    setRating(0);
    setComment("");
    fetchReviews();

    alert("Review submitted successfully!");

  } catch (error) {
    console.error(error);
    alert(error.message);
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
                  <div key={i} className="shrink-0">
                    <ActorCard actor={actor} isRowItem={true} />
                  </div>
                ))}

              </div>
            </div>
          )}

          {/* ⭐ ADD REVIEW */}
          <div className="mt-14 w-full">
          
            <h2 className="text-2xl font-semibold mb-5">
              Add Review
            </h2>
          
            <form
              onSubmit={handleSubmit}
              className="w-full flex flex-col gap-5"
            >
          
              {/* ⭐ STAR RATING */}
              <div className="flex items-center gap-2 flex-wrap">
          
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="transition hover:scale-110"
                  >
                    <Star
                      size={30}
                      className={
                        star <= rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-zinc-600"
                      }
                    />
                  </button>
                ))}
          
                <span className="ml-3 text-zinc-300 text-lg">
                  {rating ? `${rating}/5` : "Select Rating"}
                </span>
          
              </div>
          
              {/* ✍ REVIEW TEXTAREA */}
              <textarea
                placeholder="Write your review..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={8}
                className="w-full min-h-[220px] bg-zinc-900 border border-zinc-700 rounded-2xl p-5 outline-none focus:border-red-500 resize-y"
              />
          
              {/* 🚀 SUBMIT BUTTON */}
              <button
                type="submit"
                className=" w-full md:w-fit px-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition rounded-xl py-3 font-semibold"
              >
                Submit Review
              </button>
          
            </form>
          </div>
          
          {/* 📝 REVIEWS LIST */}
<div className="mt-16">

  <h2 className="text-3xl font-bold mb-8">
    User Reviews
  </h2>

  {reviewsLoading ? (

    <div className="text-zinc-400">
      Loading reviews...
    </div>

  ) : reviews.length === 0 ? (

    <div className="text-zinc-500">
      No reviews yet.
    </div>

  ) : (

    <div className="flex flex-col gap-6">

      {reviews.map((review) => (

        <div
          key={review.id}
          className="
            bg-zinc-900/70
            border border-zinc-800
            rounded-3xl
            p-6
            backdrop-blur-md
            shadow-xl
          "
        >

          {/* TOP */}
          <div className="flex items-center justify-between gap-4 flex-wrap">

            {/* USER */}
            <div className="flex items-center gap-4">

              <img
                src={
                  review.userAvatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    review.userName || review.username || "User"
                  )}`
                }
                alt={review.userName || review.username}
                className="w-14 h-14 rounded-full object-cover"
              />

              <div>

                <h3 className="font-semibold text-lg">
                  {review.userName || review.username || "Anonymous"}
                </h3>

                <p className="text-sm text-zinc-500">
                  {review.timestamp || review.createdAt
                    ? new Date(review.timestamp || review.createdAt).toLocaleDateString()
                    : "Recently"}
                </p>

              </div>
            </div>

            {/* RATING */}
            <div className="flex items-center gap-1">

              {[...Array(5)].map((_, i) => (

                <Star
                  key={i}
                  size={18}
                  className={
                    i < review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-zinc-700"
                  }
                />

              ))}

            </div>
          </div>

          {/* COMMENT */}
          <p className="mt-5 text-zinc-300 leading-relaxed text-[15px]">
            {review.comment}
          </p>

        </div>
      ))}

      </div>
      )}
    </div>

          {/* 🎞 SIMILAR MOVIES */}
          {similarMovies.length > 0 && (
            <div className="mt-14">
              <MovieRow
                title="Similar Movies"
                movies={similarMovies}
              />

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoviePageDetails;