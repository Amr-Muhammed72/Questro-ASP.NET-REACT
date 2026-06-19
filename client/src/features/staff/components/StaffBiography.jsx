import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';

const StaffBiography = ({ biography, itemVariants }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Prevent background scrolling and handle Esc key when the modal is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { 
      document.body.style.overflow = 'unset'; 
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  if (!biography) return null;

  // Decide if we need to truncate
  const characterLimit = 300;
  const hasLongBio = biography.length > characterLimit;
  const previewText = hasLongBio ? biography.slice(0, characterLimit).trim() + '...' : biography;

  return (
    <>
      {/* 🌟 1. THE PREVIEW CARD (ON THE MAIN PAGE) */}
      <motion.div variants={itemVariants} className="mt-12 bg-white/[0.02] border border-white/5 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
        <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
          </span>
          Biography
        </h2>
        
        <p className="text-zinc-300 leading-relaxed text-[1.05rem] font-light m-0">
          {previewText}
        </p>

        {hasLongBio && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-6 flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors font-semibold text-sm focus:outline-none group bg-indigo-500/10 hover:bg-indigo-500/20 px-5 py-2.5 rounded-full w-fit"
          >
            Read Full Bio 
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </button>
        )}
      </motion.div>

      {/* 🌟 2. THE POP-UP MODAL (FROSTED GLASS VIA PORTAL) */}
      {createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-12">
              
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-zinc-950/80 backdrop-blur-md cursor-pointer"
              />

              {/* Modal Content */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative w-full max-w-3xl max-h-[85vh] bg-zinc-900 border border-white/10 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 sm:p-8 border-b border-white/5 bg-zinc-900/50">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Biography</h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-full bg-white/5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors focus:outline-none group"
                  >
                    <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                  </button>
                </div>

                {/* Scrollable Text Area */}
                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                  <p className="text-zinc-300 leading-loose text-[1.1rem] whitespace-pre-line font-light m-0">
                    {biography}
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default StaffBiography;