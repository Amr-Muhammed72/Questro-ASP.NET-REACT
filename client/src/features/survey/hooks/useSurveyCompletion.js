import { useQuery } from '@tanstack/react-query';
import { getSurveyCompletionStatus } from '../api/surveyService';

export const useSurveyCompletion = (enabled = true) => {
  return useQuery({
    queryKey: ['surveyCompletionStatus'],
    queryFn: getSurveyCompletionStatus,
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, 
  });
};
