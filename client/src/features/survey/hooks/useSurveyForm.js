import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitSurvey } from '../api/surveyService';
import { useProfileStore } from '../../profile/store/useProfileStore';
import { rateMovie } from '../../movies/api/movieInteractionService';
import { rateGame } from '../../games/api/gameInteractionService';

export const useSurveyForm = () => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
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
      
      // Submit movie ratings in parallel
      if (formData.movieRatings.length > 0) {
        await Promise.all(
          formData.movieRatings.map((rating) => 
            rateMovie({ movieId: rating.id, stars: rating.stars })
          )
        );
      }

      // Submit game ratings in parallel
      if (formData.gameRatings.length > 0) {
        await Promise.all(
          formData.gameRatings.map((rating) => 
            rateGame({ gameId: rating.id, stars: rating.stars })
          )
        );
      }
      
      if (updatedProfileResponse && updatedProfileResponse.isSuccess) {
        setMyProfile(updatedProfileResponse.data);
      } else if (updatedProfileResponse && updatedProfileResponse.data) {
        setMyProfile(updatedProfileResponse.data);
      }
      
      localStorage.removeItem('justRegistered');
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
    if (step === 3) return formData.country !== '';
    if (step === 4) return formData.movieRatings.length >= 2;
    if (step === 5) return formData.gameRatings.length >= 2;
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
