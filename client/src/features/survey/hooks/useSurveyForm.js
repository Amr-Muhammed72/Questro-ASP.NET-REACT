import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { submitSurvey } from '../api/surveyService';
import { useProfileStore } from '../../profile/store/useProfileStore';
import { rateMovie } from '../../movies/api/movieInteractionService';
import { rateGame } from '../../games/api/gameInteractionService';
import { gameService } from '../../games/api/gameService';
import { getMovieDetails } from '../../movies/api/movieService';

export const useSurveyForm = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setMyProfile } = useProfileStore();

  const [formData, setFormData] = useState({
    country: '',
    likedMovieGenres: [],
    dislikedMovieGenres: [],
    likedGameGenres: [],
    dislikedGameGenres: [],
    movieRatings: [], // Array of { id, stars }
    gameRatings: []   // Array of { id, stars }
  });

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const payload = { ...formData };
      if (!payload.country) delete payload.country;
      
      // Submit survey metadata first
      const updatedProfileResponse = await submitSurvey({
        country: payload.country,
        likedMovieGenres: payload.likedMovieGenres,
        dislikedMovieGenres: payload.dislikedMovieGenres,
        likedGameGenres: payload.likedGameGenres,
        dislikedGameGenres: payload.dislikedGameGenres
      });
      
      let ratingsFailed = false;

      // Submit movie ratings in parallel (don't block on error)
      if (formData.movieRatings.length > 0) {
        const movieResults = await Promise.allSettled(
          formData.movieRatings.map(async (rating) => {
            try { await getMovieDetails(rating.id); } catch(e) { console.error('Failed to sync movie', e); }
            return rateMovie({ movieId: rating.id, stars: rating.stars });
          })
        );
        if (movieResults.some(r => r.status === 'rejected')) ratingsFailed = true;
      }

      // Submit game ratings in parallel (don't block on error)
      if (formData.gameRatings.length > 0) {
        const gameResults = await Promise.allSettled(
          formData.gameRatings.map(async (rating) => {
            try { await gameService.getGameDetails(rating.id); } catch(e) { console.error('Failed to sync game', e); }
            return rateGame({ gameId: rating.id, stars: rating.stars });
          })
        );
        if (gameResults.some(r => r.status === 'rejected')) ratingsFailed = true;
      }
      
      if (ratingsFailed) {
        toast.warning('Survey completed, but some ratings failed to save.');
      } else {
        toast.success('Survey completed successfully!');
      }
      
      if (updatedProfileResponse && updatedProfileResponse.isSuccess) {
        setMyProfile(updatedProfileResponse.data);
      } else if (updatedProfileResponse && updatedProfileResponse.data) {
        setMyProfile(updatedProfileResponse.data);
      }
      
      queryClient.invalidateQueries({ queryKey: ['surveyCompletionStatus'] });
      navigate('/home');
    } catch (err) {
      console.error(err);
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0]?.[0];
        setError(firstError || 'Validation error occurred.');
      } else if (err.response?.data?.title) {
        setError(err.response.data.title);
      } else {
        setError('Failed to submit survey. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    if (step === 1) return formData.likedMovieGenres.length >= 1 && formData.likedMovieGenres.length <= 3 && formData.dislikedMovieGenres.length <= 3;
    if (step === 2) return formData.likedGameGenres.length >= 1 && formData.likedGameGenres.length <= 3 && formData.dislikedGameGenres.length <= 3;
    if (step === 3) return true; // Country is optional
    if (step === 4) return formData.movieRatings.length >= 1;
    if (step === 5) return formData.gameRatings.length >= 1;
    return true;
  };

  return {
    step,
    formData,
    isSubmitting,
    error,
    handleNext,
    handlePrev,
    updateFormData,
    handleSubmit,
    isStepValid
  };
};
