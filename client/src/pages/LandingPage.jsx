import React from 'react';
import NavBar from '../components/NavBar';
import Hero from '../components/Hero';
import PosterGrid from '../components/PosterGrid';
import bgImage from '../assets/main-background.png';

const LandingPage = () => {
  return (
    <div className="relative w-full min-h-screen overflow-x-hidden font-sans bg-zinc-950">
      <div 
        className="absolute top-0 left-0 w-full h-[80vh] md:h-[100vh] z-0"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-zinc-950/30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/80 via-transparent to-transparent"></div>
      </div>

      <div className="relative z-50">
        <NavBar />
      </div>
      <main className="relative z-10 flex flex-col pt-24 md:pt-32 pb-24">
         <Hero />
         <div className="mt-8 md:mt-24">
           <PosterGrid />
         </div>
      </main>

    </div>
  );
};

export default LandingPage;