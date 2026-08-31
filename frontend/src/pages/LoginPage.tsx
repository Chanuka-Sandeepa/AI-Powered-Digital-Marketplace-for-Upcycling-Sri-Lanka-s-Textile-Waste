import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Recycle, ArrowLeft, Eye, EyeOff, ArrowRight } from 'lucide-react';
import API from '../services/api.js';
import type { User } from '../types/index.js';

interface LoginPageProps {
  onAuthSuccess: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onAuthSuccess }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    try {
      const response = await API.post('/auth/login', { email, password });
      localStorage.setItem('user', JSON.stringify(response.data));
      onAuthSuccess(response.data);
      
      // Route to the right dashboard based on the account's role.
      const roleRoutes: Record<string, string> = {
        seller: '/seller-dashboard',
        buyer: '/buyer-dashboard',
        admin: '/admin-dashboard',
        super_admin: '/super-admin-dashboard',
      };
      navigate(roleRoutes[response.data.role] || '/');
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message;
      setError(backendMessage || 'Unable to sign in. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      {/* Top Nav Bar */}
      <header className="w-full border-b border-gray-100 bg-white/90 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <Recycle className="h-4 w-4" />
          </div>
          <span className="font-outfit text-lg font-bold tracking-tight text-zinc-900">
            TexCycle <span className="text-cyan-400">AI</span>
          </span>
        </div>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
      </header>

      {/* Main Content - Split Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-white border-r border-gray-100">
          <div className="flex-1 flex flex-col justify-center max-w-md">
            <h1 className="font-outfit text-4xl font-bold text-zinc-900 leading-tight mb-4">
              Welcome Back
            </h1>
            <p className="text-zinc-500 text-base leading-relaxed mb-10">
              Access Sri Lanka's leading textile waste marketplace and connect with sustainable
              opportunities. Join thousands of manufacturers driving the circular economy.
            </p>

            {/* Factory Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg mb-8 group">
              <img
                src="/textile_factory.png"
                alt="Textile factory workers"
                className="w-full h-60 object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Live Market Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white/95 via-white/70 to-transparent">
                <div className="flex items-center gap-2 mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Live Market Data</span>
                </div>
                <p className="text-xs font-medium text-zinc-700">
                  Currently tracking 450+ metric tons of textile surplus across 12 provinces.
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8">
              <div>
                <p className="font-outfit text-2xl font-bold text-zinc-900">1.2k+</p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Registered Sellers</p>
              </div>
              <div className="h-10 w-px bg-gray-200"></div>
              <div>
                <p className="font-outfit text-sm font-bold text-zinc-400 uppercase tracking-widest">National Impact</p>
                <p className="text-xs text-zinc-500 mt-0.5">Driving sustainable growth</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
          <div className="w-full max-w-md">
            {/* Form Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="font-outfit text-2xl font-bold text-zinc-900 mb-1.5">Login</h2>
                <p className="text-sm text-zinc-400">Enter your credentials to access your dashboard</p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 rounded-xl bg-red-50 border border-red-100 p-3 text-xs font-medium text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-2">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      id="login-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.lk"
                      className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-zinc-700">Password</label>
                    <button type="button" className="text-xs font-semibold text-cyan-500 hover:text-cyan-600 transition-colors">
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-10 text-sm text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2.5">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-cyan-500 focus:ring-cyan-400 cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="text-xs text-zinc-500 cursor-pointer select-none">
                    Keep me logged in for 30 days
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-cyan-400 hover:bg-cyan-500 py-3.5 text-sm font-bold text-zinc-900 transition-all hover:shadow-lg hover:shadow-cyan-200 active:scale-[0.98] disabled:opacity-60 mt-1"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>
                      Login to Marketplace
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative flex items-center">
                  <div className="flex-1 border-t border-gray-100"></div>
                  <span className="mx-3 text-[10px] font-semibold text-zinc-300 uppercase tracking-widest">Or continue with</span>
                  <div className="flex-1 border-t border-gray-100"></div>
                </div>

                {/* Google Button */}
                <button
                  id="login-google"
                  type="button"
                  className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-zinc-700 hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
              </form>

              {/* Footer Links */}
              <div className="mt-6 text-center">
                <p className="text-xs text-zinc-400">
                  Don't have an account?{' '}
                  <button
                    onClick={() => navigate('/register')}
                    className="font-bold text-cyan-500 hover:text-cyan-600 transition-colors"
                  >
                    Register now
                  </button>
                </p>
                <div className="flex items-center justify-center gap-1 mt-3">
                  <button className="text-[10px] text-zinc-300 hover:text-zinc-500 transition-colors">Privacy Policy</button>
                  <span className="text-[10px] text-zinc-200">•</span>
                  <button className="text-[10px] text-zinc-300 hover:text-zinc-500 transition-colors">Terms of Service</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-gray-100 bg-white px-6 py-4">
        <p className="text-[11px] text-zinc-400 text-center">
          © 2026 TexCycle AI Sri Lanka. Accelerating Circularity.
        </p>
      </footer>
    </div>
  );
};

export default LoginPage;
