import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CategoryHeader = ({ title, listQuery, onTitleClick }) => {
  const navigate = useNavigate();

  const handleTitleClick = () => {
    if (listQuery) {
      navigate(`/movies?list=${listQuery}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (onTitleClick) {
      onTitleClick();
    }
  };

  const isClickable = !!listQuery || !!onTitleClick;

  return (
    <div className="w-full flex items-center justify-between mb-8 px-4 sm:px-8 md:px-12 lg:px-16 sm:mb-4">
    <h1 
      onClick={isClickable ? handleTitleClick : undefined}
      className={`text-3xl font-bold text-[#E5E5E5] sm:text-4xl md:text-5xl ${
        isClickable ? 'cursor-pointer hover:text-white transition-colors duration-200' : ''
      }`}
    >
      {title}
    </h1>
      {isClickable && (
        <div 
          onClick={handleTitleClick}
          className="text-zinc-400 text-sm sm:text-base font-semibold hover:text-white cursor-pointer transition-colors flex items-center"
        >
          Explore All <ChevronRight className="w-5 h-5 ml-1" />
        </div>
      )}
    </div>
  );
};

export default CategoryHeader;