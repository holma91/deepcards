// src/components/LoginModal.tsx
import React, { useCallback, useEffect } from 'react';
import { useLoginWithGoogle } from '../hooks/useLoginWithGoogle';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGetStarted?: boolean;
}

const GoogleIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
      <path
        fill="#4285F4"
        d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
      />
      <path
        fill="#34A853"
        d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
      />
      <path
        fill="#FBBC05"
        d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
      />
      <path
        fill="#EA4335"
        d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
      />
    </g>
  </svg>
);

const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  isGetStarted = false,
}) => {
  const { loginWithGoogle, loading } = useLoginWithGoogle();

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  const handleEscapeKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen, handleEscapeKey]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">
          {isGetStarted ? 'Get Started with Deepcards' : 'Log in to Deepcards'}
        </h2>
        <p className="mb-6">
          {isGetStarted
            ? 'Sign in to start creating and reviewing your flashcards.'
            : 'Welcome back! Sign in to continue your learning journey.'}
        </p>
        <button
          onClick={loginWithGoogle}
          disabled={loading}
          className="w-full px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition duration-300 flex items-center justify-center"
        >
          <GoogleIcon />
          <span className="ml-2">
            {loading ? 'Signing in...' : 'Continue with Google'}
          </span>
        </button>
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-300"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default LoginModal;
