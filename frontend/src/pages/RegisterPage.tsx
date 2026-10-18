import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Recycle, ArrowLeft, Eye, EyeOff, ArrowRight, User as UserIcon, Phone, Store, ShoppingCart, Check } from 'lucide-react';
import API from '../services/api.js';
import GoogleSignInButton from '../components/GoogleSignInButton';
import type { User } from '../types/index.js';

interface RegisterPageProps {
  onAuthSuccess: (user: User) => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onAuthSuccess }) => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'seller' | 'buyer'>('seller');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      const response = await API.post('/auth/register', { 
        name, 
        email, 
        password, 
        role, 
        phone 
      });
      localStorage.setItem('user', JSON.stringify(response.data));
      onAuthSuccess(response.data);
      
      navigate(role === 'seller' ? '/seller-dashboard' : '/buyer-dashboard');
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message;
      setError(backendMessage || 'Unable to create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh w-full flex flex-col bg-gradient-to-br from-cyan-50 via-white to-violet-50">
      {/* Top Nav Bar - Matches LoginPage */}
      <header className="sticky top-0 z-20 w-full border-b border-white/70 bg-white/75 px-5 py-3 flex items-center justify-between shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-200/70">
            <Recycle className="h-4 w-4" />
          </div>
          <span className="font-outfit text-lg font-bold tracking-tight text-zinc-900">
            TexCycle <span className="bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent">AI</span>
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

      {/* Main Content - Split Panel (Matches LoginPage layout) */}
      <div className="flex flex-1 items-center">
        {/* Left Panel - Branding (Matches LoginPage) */}
        <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white xl:p-10">
          <img src="/textile_factory.png" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-emerald-950/85 via-teal-900/70 to-cyan-950/80" />
          <div className="relative z-10 flex-1 flex flex-col justify-start pt-10 max-w-md">
            <h1 className="font-outfit text-4xl font-bold leading-tight text-white mb-4">
              Create Account
            </h1>
            <p className="text-emerald-50 text-base leading-relaxed mb-10">
              Join Sri Lanka's leading textile waste marketplace and start your journey 
              toward a sustainable circular economy.
            </p>

            <div className="mb-8 flex w-fit items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 shadow-lg backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-300" />
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-200">Live marketplace</p>
                <p className="mt-0.5 text-xs font-medium text-white">450+ metric tons of textile surplus tracked</p>
              </div>
            </div>

            {/* Stats - Same as LoginPage */}
            <div className="flex items-center gap-8">
              <div>
                <p className="font-outfit text-2xl font-bold text-white">1.2k+</p>
                <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mt-0.5">Registered Sellers</p>
              </div>
              <div className="h-10 w-px bg-white/30"></div>
              <div>
                <p className="font-outfit text-sm font-bold text-amber-200 uppercase tracking-widest">National Impact</p>
                <p className="text-xs text-emerald-50 mt-0.5">Driving sustainable growth</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Register Form (Matches LoginPage styling) */}
        <div className="relative w-full lg:w-1/2 flex items-center justify-center overflow-hidden p-4 sm:p-7 bg-gradient-to-br from-cyan-50 via-violet-50 to-amber-50">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 top-10 h-48 w-48 rounded-full bg-fuchsia-200/60 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute bottom-8 left-4 h-56 w-56 rounded-full bg-emerald-200/60 blur-3xl" />
          <div className="relative z-10 w-full max-w-md">
            {/* Form Card - Same styling as LoginPage */}
            <div className="relative rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_24px_80px_-24px_rgba(8,145,178,0.32)] backdrop-blur-xl sm:p-7">
              {/* Header - Same as LoginPage */}
              <div className="text-center mb-5">
                <h2 className="font-outfit text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 via-cyan-700 to-violet-700 bg-clip-text text-transparent mb-1.5">Register</h2>
                <p className="text-sm text-zinc-500">Create your account to get started</p>
              </div>

              {/* Error - Same as LoginPage */}
              {error && (
                <div className="mb-5 rounded-xl bg-red-50 border border-red-100 p-3 text-xs font-medium text-red-600">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                      <UserIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                  </div>
                </div>

                {/* Email - Same styling as LoginPage */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.lk"
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                  </div>
                </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                      <Phone className="h-4 w-4" />
                    </span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+94 7X XXX XXXX"
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                  </div>
                </div>

                {/* Password Row - Matches LoginPage styling */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-2">Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                        <Lock className="h-4 w-4" />
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
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
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-2">Confirm</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
                        <Lock className="h-4 w-4" />
                      </span>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-zinc-800 placeholder:text-zinc-300 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Role Selection - Custom styled to match LoginPage aesthetics */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-2">Select Your Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('seller')}
                      className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                        role === 'seller'
                          ? 'border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {role === 'seller' && (
                        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
                          <Check className="h-3 w-3 text-white" />
                        </span>
                      )}
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${role === 'seller' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-zinc-500'}`}>
                        <Store className="h-4 w-4" />
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-bold ${role === 'seller' ? 'text-emerald-700' : 'text-zinc-700'}`}>Seller</p>
                        <p className="text-[10px] text-zinc-400 leading-tight">Upload & sell textile waste</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('buyer')}
                      className={`relative flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                        role === 'buyer'
                          ? 'border-violet-400 bg-violet-50 shadow-md shadow-violet-100'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {role === 'buyer' && (
                        <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-500">
                          <Check className="h-3 w-3 text-white" />
                        </span>
                      )}
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${role === 'buyer' ? 'bg-violet-500 text-white' : 'bg-gray-100 text-zinc-500'}`}>
                        <ShoppingCart className="h-4 w-4" />
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-bold ${role === 'buyer' ? 'text-violet-700' : 'text-zinc-700'}`}>Buyer</p>
                        <p className="text-[10px] text-zinc-400 leading-tight">Browse & purchase materials</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Submit Button - Matches LoginPage */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-200/70 transition-all hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 hover:shadow-xl hover:shadow-cyan-200 active:scale-[0.98] disabled:opacity-60 mt-1"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating Account...
                    </span>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>

                {/* Divider - Same as LoginPage */}
                <div className="relative flex items-center">
                  <div className="flex-1 border-t border-gray-100"></div>
                  <span className="mx-3 text-[10px] font-semibold text-zinc-300 uppercase tracking-widest">Or continue with</span>
                  <div className="flex-1 border-t border-gray-100"></div>
                </div>

                {/* Google Button */}
                <GoogleSignInButton
                  role={role}
                  onError={setError}
                  onSuccess={(userData) => {
                    onAuthSuccess(userData);
                    navigate(userData.role === 'seller' ? '/seller-dashboard' : '/buyer-dashboard');
                  }}
                />

                {/* Footer Links - Same as LoginPage */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-zinc-400">
                    Already have an account?{' '}
                    <button
                      onClick={() => navigate('/login')}
                      className="font-bold text-emerald-600 hover:text-cyan-600 transition-colors"
                    >
                      Login now
                    </button>
                  </p>
                  <div className="flex items-center justify-center gap-1 mt-3">
                    <button className="text-[10px] text-zinc-300 hover:text-zinc-500 transition-colors">Privacy Policy</button>
                    <span className="text-[10px] text-zinc-200">•</span>
                    <button className="text-[10px] text-zinc-300 hover:text-zinc-500 transition-colors">Terms of Service</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer - Matches LoginPage exactly */}
      <footer className="w-full border-t border-white/70 bg-white/70 px-6 py-3 backdrop-blur">
        <p className="text-[11px] text-zinc-500 text-center">
          © 2026 TexCycle AI Sri Lanka. Accelerating Circularity.
        </p>
      </footer>
    </div>
  );
};

export default RegisterPage;
