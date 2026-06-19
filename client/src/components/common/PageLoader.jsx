import React from 'react';

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-zinc-950">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500" />
  </div>
);

export default PageLoader;
