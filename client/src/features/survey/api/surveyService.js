import { apiClient } from '../../../lib/apiClient';

export const submitSurvey = async (surveyData) => {
  const response = await apiClient.post('/users/survey', surveyData);
  return response.data;
};

export const getSurveyCompletionStatus = async () => {
  const response = await apiClient.get('/users/survey/completion-status');
  return response.data;
};
