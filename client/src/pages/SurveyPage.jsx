import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, ChevronRight } from 'lucide-react';
import { useSurveyGenres } from '../features/survey/hooks/useSurveyGenres';
import { useSurveyForm } from '../features/survey/hooks/useSurveyForm';
import SurveyStepIndicator from '../features/survey/components/SurveyStepIndicator';
import MovieGenresStep from '../features/survey/components/MovieGenresStep';
import GameGenresStep from '../features/survey/components/GameGenresStep';
import LocationStep from '../features/survey/components/LocationStep';
import MovieRatingStep from '../features/survey/components/MovieRatingStep';
import GameRatingStep from '../features/survey/components/GameRatingStep';

export default function SurveyPage() {
  const { movieGenres, gameGenres, isLoading: isGenresLoading, error: genresError } = useSurveyGenres();
  const {
    step,
    formData,
    isSubmitting,
    error: formError,
    handleNext,
    handlePrev,
    updateFormData,
    handleSubmit,
    isStepValid
  } = useSurveyForm();

  const combinedError = genresError || formError;

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl rounded-2xl"
      >
        <div className="p-6 md:p-12">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Personalize Your Experience</h2>
            <p className="text-zinc-400">Tell us what you love to get better recommendations.</p>
          </div>

          {combinedError && (
            <div className="mb-6 flex gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{combinedError}</p>
            </div>
          )}

          {isGenresLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
            </div>
          ) : (
            <div className="min-h-[300px]">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <MovieGenresStep
                    movieGenres={movieGenres}
                    formData={formData}
                    updateFormData={updateFormData}
                  />
                )}
                {step === 2 && (
                  <GameGenresStep
                    gameGenres={gameGenres}
                    formData={formData}
                    updateFormData={updateFormData}
                  />
                )}
                {step === 3 && (
                  <LocationStep
                    formData={formData}
                    updateFormData={updateFormData}
                  />
                )}
                {step === 4 && (
                  <MovieRatingStep
                    formData={formData}
                    updateFormData={updateFormData}
                  />
                )}
                {step === 5 && (
                  <GameRatingStep
                    formData={formData}
                    updateFormData={updateFormData}
                  />
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-between items-center">
            <SurveyStepIndicator currentStep={step} totalSteps={5} />

            <div className="flex gap-3">
              {step > 1 && (
                <button
                  onClick={handlePrev}
                  className="px-6 py-2.5 rounded-lg text-sm font-semibold text-white hover:bg-zinc-800 transition-colors"
                >
                  Back
                </button>
              )}
              {step < 5 ? (
                <button
                  onClick={handleNext}
                  disabled={!isStepValid() || isGenresLoading || !!genresError}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isGenresLoading || !isStepValid()}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isSubmitting ? 'Saving...' : 'Finish'}
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}