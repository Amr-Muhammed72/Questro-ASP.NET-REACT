import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Film, 
  Gamepad2, 
  LayoutDashboard,
  HelpCircle,
  Building2,
  Briefcase,
  Shield,
  Scale,
  Mail,
  Activity,
  FileText,
  Smartphone
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.includes('@') && email.includes('.')) {
      setEmail('');
      setIsSubscribed(true);
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <footer className="w-full border-t border-white/5 bg-[#050507] relative mt-auto z-10 overflow-hidden">
      {/* Premium Top Edge Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[200px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8 mb-16">
          
          {/* Brand & Newsletter Section */}
          <div className="lg:col-span-3 space-y-6 pr-0 lg:pr-12">
            <Link to="/" className="flex items-center space-x-3 group w-fit">
              <div className="w-10 h-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                <img src={logoImg} alt="Questro Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent group-hover:from-white group-hover:to-zinc-200 transition-colors tracking-tight">
                Questro
              </span>
            </Link>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-md">
              Your ultimate entertainment hub. Discover top-rated movies, explore trending games, and connect with a community of passionate enthusiasts all in one premium destination.
            </p>
            
            {/* Newsletter Input */}
            <div className="pt-4">
              <p className="text-zinc-100 text-sm font-semibold mb-3">Subscribe to our weekly digest</p>
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2 max-w-md relative group">
                <div className="relative flex items-center">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address" 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300"
                  />
                  <button type="submit" className="absolute right-2 p-1.5 rounded-lg bg-white/10 text-zinc-300 hover:bg-indigo-500 hover:text-white transition-colors duration-300 cursor-pointer">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                {isSubscribed && (
                  <span className="text-emerald-400 text-xs font-medium pl-1 animate-pulse">Thanks for subscribing!</span>
                )}
              </form>
            </div>
          </div>

          {/* Platform Links */}
          <div className="lg:col-span-1">
            <h3 className="text-zinc-100 font-semibold mb-6 tracking-wide">Platform</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/movies" className="group flex items-center text-sm text-zinc-400 hover:text-indigo-400 transition-all duration-200">
                  <Film className="w-4 h-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <span className="group-hover:translate-x-1 transition-transform duration-200">Movies Collection</span>
                </Link>
              </li>
              <li>
                <Link to="/games" className="group flex items-center text-sm text-zinc-400 hover:text-indigo-400 transition-all duration-200">
                  <Gamepad2 className="w-4 h-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <span className="group-hover:translate-x-1 transition-transform duration-200">Gaming Hub</span>
                </Link>
              </li>
              <li>
                <Link to="/home" className="group flex items-center text-sm text-zinc-400 hover:text-indigo-400 transition-all duration-200">
                  <LayoutDashboard className="w-4 h-4 mr-2 opacity-70 group-hover:opacity-100 transition-opacity" />
                  <span className="group-hover:translate-x-1 transition-transform duration-200">My Dashboard</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="lg:col-span-1">
            <h3 className="text-zinc-100 font-semibold mb-6 tracking-wide">Support</h3>
            <ul className="space-y-4">
              <li>
                <div className="flex items-center text-sm text-zinc-500 hover:text-zinc-400 transition-all duration-200 cursor-default" title="Coming soon">
                  <HelpCircle className="w-4 h-4 mr-2 opacity-50" />
                  <span>Help Center</span>
                </div>
              </li>
              <li>
                <div className="flex items-center text-sm text-zinc-500 hover:text-zinc-400 transition-all duration-200 cursor-default" title="Coming soon">
                  <Mail className="w-4 h-4 mr-2 opacity-50" />
                  <span>Contact Us</span>
                </div>
              </li>
              <li>
                <div className="flex items-center text-sm text-zinc-500 hover:text-zinc-400 transition-all duration-200 cursor-default" title="Coming soon">
                  <FileText className="w-4 h-4 mr-2 opacity-50" />
                  <span>News & Updates</span>
                </div>
              </li>
              <li>
                <div className="flex items-center text-sm text-zinc-500 hover:text-zinc-400 transition-all duration-200 cursor-default" title="Coming soon">
                  <Smartphone className="w-4 h-4 mr-2 opacity-50" />
                  <span>Supported Devices</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="lg:col-span-1">
            <h3 className="text-zinc-100 font-semibold mb-6 tracking-wide">Company</h3>
            <ul className="space-y-4">
              <li>
                <div className="flex items-center text-sm text-zinc-500 hover:text-zinc-400 transition-all duration-200 cursor-default" title="Coming soon">
                  <Building2 className="w-4 h-4 mr-2 opacity-50" />
                  <span>About Questro</span>
                </div>
              </li>
              <li>
                <div className="flex items-center text-sm text-zinc-500 hover:text-zinc-400 transition-all duration-200 cursor-default" title="Coming soon">
                  <Briefcase className="w-4 h-4 mr-2 opacity-50" />
                  <span>Careers</span>
                </div>
              </li>
              <li>
                <div className="flex items-center text-sm text-zinc-500 hover:text-zinc-400 transition-all duration-200 cursor-default" title="Coming soon">
                  <Shield className="w-4 h-4 mr-2 opacity-50" />
                  <span>Privacy Policy</span>
                </div>
              </li>
              <li>
                <div className="flex items-center text-sm text-zinc-500 hover:text-zinc-400 transition-all duration-200 cursor-default" title="Coming soon">
                  <Scale className="w-4 h-4 mr-2 opacity-50" />
                  <span>Terms of Service</span>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-zinc-500">
            &copy; {new Date().getFullYear()} Questro Inc. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer" title="Facebook">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z"/></svg>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer" title="Twitter">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.004 3.985H5.078z"/></svg>
            </div>
            <div className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 hover:-translate-y-1 transition-all duration-300 cursor-pointer" title="Instagram">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.012-3.584.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.169a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
