import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthForm from '../components/auth/AuthForm';

const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = (location.state as { from?: { pathname: string } })?.from?.pathname || '/chat';

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl font-medium text-gray-900">Welcome back</h2>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <AuthForm redirectPath={redirectPath} />
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <button onClick={() => navigate('/signup')} className="font-medium text-gray-900 hover:text-gray-700">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignInPage;
