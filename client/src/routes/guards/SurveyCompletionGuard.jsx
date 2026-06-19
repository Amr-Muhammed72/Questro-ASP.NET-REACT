import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/store/AuthContext';
import { useSurveyCompletion } from '../../features/survey/hooks/useSurveyCompletion';
import PageLoader from '../../components/common/PageLoader';

const SurveyCompletionGuard = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  const { data: surveyStatus, isLoading, isError } = useSurveyCompletion(isLoggedIn);

  // If not logged in, we don't care about survey completion. Guest/Protected routes handle access.
  if (!isLoggedIn) {
    return children;
  }

  // If we are checking the survey status, show a loader to prevent premature rendering or navigation
  if (isLoading) {
    return <PageLoader />;
  }

  // If we have an error, we might want to just proceed or handle it. Let's proceed for now so we don't block the user forever.
  // Or we can let them proceed and they might get caught on the next fetch.
  if (isError) {
    return children;
  }

  // If survey is NOT completed and user is NOT on the survey page, redirect them to survey
  if (surveyStatus && !surveyStatus.isCompleted && location.pathname !== '/survey') {
    return <Navigate to="/survey" replace />;
  }

  // If survey IS completed and user is trying to access the survey page, redirect them away to home
  if (surveyStatus && surveyStatus.isCompleted && location.pathname === '/survey') {
    return <Navigate to="/home" replace />;
  }

  return children;
};

export default SurveyCompletionGuard;
