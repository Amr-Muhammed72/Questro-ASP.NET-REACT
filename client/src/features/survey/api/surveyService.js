import { apiClient } from '../../../lib/apiClient';

export const submitSurvey = async (surveyData) => {
  const response = await apiClient.post('/users/survey', surveyData);
  return response.data;
};
