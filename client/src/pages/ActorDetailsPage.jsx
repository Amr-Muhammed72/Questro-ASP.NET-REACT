import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Star, CalendarDays, MapPin, User } from "lucide-react";


import bgImage from '../assets/main-background.png';

import MovieRow from '../features/movies/components/MovieRow';

const BASE_URL = 'http://localhost:5222/api/staff';

const ActorDetailsPage = () => {
  const { id } = useParams();

  const [actor, setActor] = useState(null);
  const [knownForMovies, setKnownForMovies] = useState([]);

  useEffect(() => {
    fetchActorDetails();
  }, [id]);

  const fetchActorDetails = async () => {
    try {
      const response = await fetch(`${BASE_URL}/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch actor details');
      }

      const data = await response.json();

      setActor(data);
      setKnownForMovies(data.knownForMovies || []);

    } catch (error) {
      console.log(error);
    }
  };

  if (!actor) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

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
        
      </div>

      {/* CONTENT */}
      <div className="relative z-10">

        {/* 🎭 HERO SECTION */}
        <div className="px-6 md:px-16 mt-8">

          <div className="relative rounded-3xl overflow-hidden bg-zinc-900/60 border border-white/10 shadow-2xl backdrop-blur-sm">

            <div className="flex flex-col lg:flex-row gap-10 p-8 md:p-12">

              {/* PROFILE IMAGE */}
              <div className="shrink-0 mx-auto lg:mx-0">

                <img
                  src={
                    actor.profileUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}`
                  }
                  alt={actor.name}
                  className="w-[280px] h-[400px] object-cover rounded-3xl shadow-2xl"
                />

              </div>

              {/* INFO */}
              <div className="flex-1">

                {/* NAME */}
                <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                  {actor.name}
                </h1>

                {/* META */}
                <div className="flex flex-wrap gap-6 mt-6 text-zinc-300">

                  <div className="flex items-center gap-2">
                    <CalendarDays size={18} />
                    <span>
                      {actor.birthDate?.split("T")[0]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <MapPin size={18} />
                    <span>
                      {actor.placeOfBirth}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <User size={18} />
                    <span>
                      {actor.gender}
                    </span>
                  </div>

                </div>

                {/* DEPARTMENT */}
                <div className="mt-6 inline-flex items-center rounded-full bg-red-600/20 border border-red-500/30 px-5 py-2 text-red-400 font-medium">
                  {actor.department}
                </div>

                {/* BIOGRAPHY */}
                <div className="mt-10">

                  <h2 className="text-2xl font-semibold mb-4">
                    Biography
                  </h2>

                  <p className="text-zinc-300 leading-8 text-lg whitespace-pre-line">
                    {actor.biography}
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

        {/* 🎬 KNOWN FOR MOVIES */}
        {knownForMovies.length > 0 && (
          <div className="px-6 md:px-16 py-14">

            <MovieRow
              title="Known For"
              movies={knownForMovies}
            />

          </div>
        )}

      </div>
    </div>
  );
};

export default ActorDetailsPage;
