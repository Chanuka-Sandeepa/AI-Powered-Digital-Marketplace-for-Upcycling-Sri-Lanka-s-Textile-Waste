
import { useEffect, useState } from 'react';
import API from '../services/api';
import type { User } from '../types';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInButtonProps {
  role?: 'buyer' | 'seller';
  onSuccess: (user: User) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

const GoogleSignInButton = ({
  role,
  onSuccess,
  onError,
  disabled = false,
}: GoogleSignInButtonProps) => {
  const [scriptReady, setScriptReady] = useState(
    Boolean(window.google?.accounts?.oauth2)
  );
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller'>(
    role || 'buyer'
  );

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (window.google?.accounts?.oauth2) {
      setScriptReady(true);
      return;
    }

    const existingScript =
      document.querySelector<HTMLScriptElement>(
        'script[data-google-identity]'
      );

    const script = existingScript || document.createElement('script');

    const handleLoad = () => setScriptReady(true);
    const handleError = () =>
      onError('Could not load Google sign-in. Please try again.');

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    if (!existingScript) {
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
      document.head.appendChild(script);
    }

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, [onError]);

  const handleGoogleLogin = () => {
    onError('');

    if (!clientId) {
      onError(
        'Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID.'
      );
      return;
    }

    if (!window.google?.accounts?.oauth2 || !scriptReady) {
      onError('Google sign-in is still loading. Please try again.');
      return;
    }

    setLoading(true);

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',

      callback: async (tokenResponse: {
        access_token?: string;
        error?: string;
      }) => {
        if (!tokenResponse.access_token) {
          setLoading(false);
          onError(
            'Google sign-in was cancelled or did not return an access token.'
          );
          return;
        }

        try {
          const response = await API.post('/auth/google', {
            accessToken: tokenResponse.access_token,
            role: selectedRole,
          });

          localStorage.setItem('user', JSON.stringify(response.data));
          onSuccess(response.data);
        } catch (err: any) {
          onError(
            err?.response?.data?.message ||
              'Unable to sign in with Google. Please try again.'
          );
        } finally {
          setLoading(false);
        }
      },

      error_callback: () => {
        setLoading(false);
        onError('Google sign-in could not be opened. Try again.');
      },
    });

    tokenClient.requestAccessToken();
  };

  return (
    <div className="w-full space-y-3">
      <p className="text-sm font-medium text-gray-700 text-center">
        Continue as
      </p>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setSelectedRole('buyer')}
          disabled={disabled || loading}
          aria-pressed={selectedRole === 'buyer'}
          className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
            selectedRole === 'buyer'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Buyer
        </button>

        <button
          type="button"
          onClick={() => setSelectedRole('seller')}
          disabled={disabled || loading}
          aria-pressed={selectedRole === 'seller'}
          className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
            selectedRole === 'seller'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Seller
        </button>
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={disabled || loading || !scriptReady}
        className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-zinc-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-60"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11 11 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>

        {loading
          ? 'Connecting to Google...'
          : `Continue as ${selectedRole === 'seller' ? 'Seller' : 'Buyer'}`}
      </button>
    </div>
  );
};

export default GoogleSignInButton;
