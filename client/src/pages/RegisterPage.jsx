import React, { useState } from 'react';
import { Gamepad2, Film, Star, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../features/auth/hooks/useRegister';
import RegisterForm from '../features/auth/components/RegisterForm';
import OtpForm from '../features/auth/components/OtpForm';
import { motion, AnimatePresence } from 'framer-motion';
import PremiumBackground from '../components/ui/PremiumBackground';
import DynamicPosterCollage from '../components/ui/DynamicPosterCollage';
import logoImg from '../assets/logo.png';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading, error } = useRegister();
  const [showOtp, setShowOtp] = useState(false);
  const [email, setEmail] = useState('');
  const [registrationData, setRegistrationData] = useState(null);

  const handleRegister = async (userData) => {
    try {
      await register(userData);
      setEmail(userData.email);
      setRegistrationData(userData);
      setShowOtp(true);
    } catch (exception) {
      throw exception;
    }
  };

  return (
    <PremiumBackground>
      <div className="w-full max-w-7xl grid lg:grid-cols-2 gap-8 items-center px-4 py-12">
          
          <div className="hidden lg:flex flex-col justify-center h-full relative space-y-8 pr-10">
            <div className="z-20 relative">
              <Link to="/" className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 flex items-center gap-4 mb-6">
                 <img src={logoImg} alt="Questro Logo" className="w-14 h-14 object-contain drop-shadow-xl" /> Questro
              </Link>
              <p className="text-zinc-300 text-xl font-medium max-w-md leading-relaxed">
                Join us to unlock your hybrid gateway to cinematic experiences and gaming worlds.
              </p>
            </div>

            <DynamicPosterCollage />
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl w-full max-w-md p-8 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {showOtp ? 'Verify OTP' : 'Begin Your Journey'}
                </h2>
                <p className="text-zinc-300">
                  {showOtp ? `We sent a code to ${email}` : 'Create an account to access your realm.'}
                </p>
              </div>

              <AnimatePresence>
                {error && !showOtp && !['User.EmailAlreadyExists', 'User.UserNameAlreadyExists', 'User.PasswordsDoNotMatch'].includes(error.code) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-4 rounded-xl shadow-lg shadow-red-500/5"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-300">Registration Failed</p>
                      <p className="mt-0.5">{error.message}</p>
                      {error.details && error.details.length > 0 && (
                        <ul className="list-disc ml-4 mt-2 space-y-1">
                          {error.details.map((detail, idx) => (
                            <li key={idx} className="text-red-400/90">{detail}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {!showOtp ? (
                <RegisterForm handleRegister={handleRegister} isLoading={isLoading} />
              ) : (
                <OtpForm email={email} registrationData={registrationData} onSuccess={() => navigate('/login')} />
              )}
              
              {!showOtp && (
                <p className="mt-6 text-center text-sm text-zinc-400">
                  Already have an account?{' '}
                  <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition cursor-pointer">Sign in here</Link>
                </p>
              )}
            </div>
          </div>

        </div>
    </PremiumBackground>
  );
};

export default RegisterPage;