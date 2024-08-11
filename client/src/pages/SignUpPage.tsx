import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-xl font-medium text-gray-900">Let's get started</h2>
      </div>

      <div className="mt-4 sm:mx-auto sm:w-full sm:max-w-md">
        <AuthForm redirectPath="/chat" />
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button onClick={() => navigate('/signin')} className="font-medium text-gray-900 hover:text-gray-700">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
