import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const SlideOutDrawer = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-[101] flex w-full max-w-sm flex-col bg-zinc-950 border-l border-zinc-800 shadow-2xl will-change-transform"
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5 shrink-0 bg-zinc-950">
              <h2 id="drawer-title" className="text-lg font-bold text-zinc-100 tracking-wide">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600"
                aria-label="Close drawer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              {children}
            </div>

            {footer && (
              <div className="border-t border-zinc-800 p-6 shrink-0 bg-zinc-950/95 backdrop-blur">
                {footer}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
