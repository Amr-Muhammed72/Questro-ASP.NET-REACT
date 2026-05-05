import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, User, UserCircle, Calendar, Hash, ChevronDown } from 'lucide-react';

const RegisterForm = ({ handleRegister, isLoading }) => {
  const [formData, setFormData] = useState({
    userName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'Male',
    birthDate: ''
  });

  const [validationError, setValidationError] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setValidationError('');

    // Pre-flight Validation
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    if (new Date(formData.birthDate) >= new Date()) {
      setValidationError('Birth date must be in the past.');
      return;
    }

    // Format birthDate to match backend expectations (e.g. 2000-05-10T00:00:00)
    const formattedData = {
      ...formData,
      birthDate: `${formData.birthDate}T00:00:00`
    };

    handleRegister(formattedData);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
      {validationError && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg mb-2">
          {validationError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">First Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 pl-9 text-white focus:outline-none focus:border-purple-500/80 transition-all text-sm"
              required
              placeholder="First"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Last Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 pl-9 text-white focus:outline-none focus:border-purple-500/80 transition-all text-sm"
              required
              placeholder="Last"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Username</label>
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            name="userName"
            value={formData.userName}
            onChange={handleChange}
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 pl-9 text-white focus:outline-none focus:border-purple-500/80 transition-all text-sm"
            required
            placeholder="user293"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Email Address</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 pl-9 text-white focus:outline-none focus:border-purple-500/80 transition-all text-sm"
            required
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div ref={dropdownRef}>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Gender</label>
          <div className="relative">
            <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 z-10 pointer-events-none" />
            
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`w-full bg-zinc-900/50 border rounded-xl px-3 py-2.5 pl-9 text-left text-white transition-all text-sm flex items-center justify-between
                ${isDropdownOpen ? 'border-purple-500/80 outline-none ring-1 ring-purple-500/20' : 'border-zinc-700/50'}`}
            >
              {formData.gender}
              <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 w-full mt-2 bg-zinc-900/90 backdrop-blur-xl border border-zinc-700/50 rounded-xl overflow-hidden z-50 shadow-2xl">
                {['Male', 'Female', 'Other'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, gender: option });
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors
                      ${formData.gender === option ? 'bg-purple-500/20 text-purple-300' : 'text-zinc-300 hover:bg-purple-500/10 hover:text-white'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Birth Date</label>
          <div className="relative h-[42px]">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none z-10" />
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              className="absolute inset-0 w-full h-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-3 pl-9 text-white focus:outline-none focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/20 transition-all text-sm [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:hover:opacity-100 hover:border-zinc-500/50"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 pl-9 text-white focus:outline-none focus:border-purple-500/80 transition-all text-sm"
            required
            placeholder="••••••••"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1">Confirm Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 pointer-events-none" />
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-xl px-3 py-2.5 pl-9 text-white focus:outline-none focus:border-purple-500/80 transition-all text-sm"
            required
            placeholder="••••••••"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-6 bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition-all hover:shadow-purple-500/25 shadow-lg"
      >
        {isLoading ? 'Forging Realm...' : 'Create Account'}
      </button>
    </form>
  );
};

export default RegisterForm;
