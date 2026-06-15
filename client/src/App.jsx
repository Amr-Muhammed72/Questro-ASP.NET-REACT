import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './features/auth/store/AuthContext';
import AnimatedRoutes from './routes/AnimatedRoutes';
import { RestrictionProvider } from './features/family/components/RestrictionProvider';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RestrictionProvider>
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </RestrictionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
