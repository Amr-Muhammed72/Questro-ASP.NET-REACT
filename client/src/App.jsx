import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './features/auth/store/AuthContext';
import AnimatedRoutes from './routes/AnimatedRoutes';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
