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
    <h2 
      onClick={isClickable ? handleTitleClick : undefined}
      className={`mb-2 ml-4 sm:ml-8 md:ml-12 lg:ml-16 text-xl font-bold text-[#E5E5E5] sm:mb-4 sm:text-2xl md:text-3xl ${
        isClickable ? 'cursor-pointer hover:text-white transition-colors duration-200 inline-block group/title' : ''
      }`}
    >
      {title}
      {isClickable && (
        <span className="inline-block ml-2 text-sm sm:text-base font-semibold text-sky-400 opacity-0 group-hover/title:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover/title:translate-x-0 align-middle">
          Explore All <ChevronRight className="inline w-5 h-5 -mt-0.5" />
        </span>
      )}
    </h2>
  );
};

export default CategoryHeader;