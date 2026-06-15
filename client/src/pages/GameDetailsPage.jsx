import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star } from "lucide-react";

import NavBar from "../components/layout/NavBar";
import bgImage from "../assets/main-background.png";

import GameRow from "../features/games/components/GameRow";
import { useAuth } from "../features/auth/store/AuthContext";

const BASE_URL = "http://localhost:5222/api/games";

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

const GamePageDetails = () => {
  const { id } = useParams();

  const [game, setGame] = useState(null);
  const [similarGames, setSimilarGames] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    fetchGameDetails();
    fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const response = await fetch(
        `http://localhost:5222/api/GameReview/${id}/reviews?pageIndex=1&pageSize=20`
      );
      const data = await response.json();
      console.log("Game Reviews:", data);
      setReviews(data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit game review clicked");
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `http://localhost:5222/api/GameReview/${id}/add-review`,
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
      console.log("Game review submitted:", data);

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

  const fetchGameDetails = async () => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`);
      const data = await response.json();

      setGame(data);
      setSimilarGames(data.similarGames || []);
    } catch (error) {
      console.log(error);
    }
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const trailer = getYoutubeEmbed(game.trailerUrl);

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

      {/* 🔝 NAVBAR */}
      <div className="relative z-50">
        <NavBar />
      </div>

      {/* 🎮 CONTENT */}
      <div className="relative z-10">

        {/* 🎥 TRAILER / BACKDROP */}
        <div className="relative w-full h-[80vh] mt-6 px-6 md:px-16">

          <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">

            {trailer ? (
              <iframe
                className="absolute inset-0 w-full h-full"
                src={trailer}
                title={game.title}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            ) : (
              <img
                src={game.backdropUrl || game.posterUrl}
                alt={game.title}
                className="w-full h-full object-cover"
              />
            )}

            {/* ⭐ RATING */}
            <div className="absolute bottom-10 left-10 z-10 max-w-3xl">
              <div className="flex items-center gap-3 mt-4">
                <Star className="text-yellow-400 fill-yellow-400" />
                <span className="text-lg">
                  {game.rating?.toFixed(1)}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* 📊 DETAILS */}
        <div className="px-6 md:px-16 py-10">

          {/* META */}
          <div className="flex flex-wrap gap-4 text-zinc-300">
            <span>
              🎮 {game.releaseDate?.split("T")[0]}
            </span>

            <span>
              🕹 {game.platforms?.map((p) => p.name).join(", ")}
            </span>
          </div>

          {/* 🎯 TITLE */}
          <h1 className="text-5xl md:text-7xl font-bold mt-6">
            {game.title}
          </h1>

          {/* 🎭 GENRES */}
          <div className="flex flex-wrap gap-3 mt-6">
            {game.genres?.map((genre) => (
              <span
                key={genre.id}
                className="px-4 py-2 rounded-full bg-red-600/20 border border-red-500/30 text-red-300"
              >
                {genre.name}
              </span>
            ))}
          </div>

          {/* 📝 DESCRIPTION */}
          <div
            className="mt-8 text-lg text-zinc-300 leading-8 max-w-5xl"
            dangerouslySetInnerHTML={{
              __html: game.description,
            }}
          />

          {/* 🏢 DEVELOPERS */}
          {game.developers?.length > 0 && (
            <div className="mt-14">

              <h2 className="text-2xl font-semibold mb-5">
                Developers
              </h2>

              <div className="flex flex-wrap gap-6">

                {game.developers.map((dev) => (
                  <div
                    key={dev.id}
                    className="bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden w-[220px]"
                  >
                    <img
                      src={dev.imageUrl}
                      alt={dev.name}
                      className="w-full h-[140px] object-cover"
                    />

                    <div className="p-4">
                      <h3 className="font-semibold text-lg">
                        {dev.name}
                      </h3>
                    </div>
                  </div>
                ))}

              </div>
            </div>
          )}

          {/* 🏢 PUBLISHERS */}
          {game.publishers?.length > 0 && (
            <div className="mt-14">

              <h2 className="text-2xl font-semibold mb-5">
                Publishers
              </h2>

              <div className="flex flex-wrap gap-6">

                {game.publishers.map((publisher) => (
                  <div
                    key={publisher.id}
                    className="bg-zinc-900/70 border border-zinc-800 rounded-2xl overflow-hidden w-[220px]"
                  >
                    <img
                      src={publisher.imageUrl}
                      alt={publisher.name}
                      className="w-full h-[140px] object-cover"
                    />

                    <div className="p-4">
                      <h3 className="font-semibold text-lg">
                        {publisher.name}
                      </h3>
                    </div>
                  </div>
                ))}

              </div>
            </div>
          )}

          {/* 📸 SCREENSHOTS */}
          {game.screenshots?.length > 0 && (
            <div className="mt-16">

              <h2 className="text-2xl font-semibold mb-6">
                Screenshots
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

                {game.screenshots.map((shot) => (
                  <div
                    key={shot.id}
                    className="overflow-hidden rounded-2xl border border-zinc-800"
                  >
                    <img
                      src={shot.imageUrl}
                      alt="game screenshot"
                      className="w-full h-[220px] object-cover hover:scale-105 transition duration-300"
                    />
                  </div>
                ))}

              </div>
            </div>
          )}

          {/* 🌐 STORE BUTTON */}
          {game.storeUrl && (
            <div className="mt-14">

              <a
                href={game.storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-4 rounded-2xl bg-red-600 hover:bg-red-700 transition font-semibold text-lg"
              >
                Visit Official Store
              </a>

            </div>
          )}

          {/* ⭐ ADD REVIEW */}
          <div className="mt-14 w-full">
            <h2 className="text-2xl font-semibold mb-5">
              Add Review
            </h2>
            
            {isLoggedIn ? (
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
                  className="w-full md:w-fit px-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition py-3 font-semibold"
                >
                  Submit Review
                </button>
              </form>
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-zinc-400 text-center">
                Please log in to leave a review.
              </div>
            )}
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
              <div className="flex flex-col gap-6 mb-16">
                {reviews.map((review) => (
                  <div
                    key={review.reviewId}
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
                            {review.createdAt || review.timestamp
                              ? new Date(review.createdAt || review.timestamp).toLocaleDateString()
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
                      {review.content || review.comment || review.body}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 🎮 SIMILAR GAMES */}
          {similarGames.length > 0 && (
            <div className="mt-16">

              <GameRow
                title="Similar Games"
                games={similarGames}
              />

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default GamePageDetails;