import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginWithGoogle } from '../../hooks/auth/useLoginWithGoogle';
import { usePasswordlessLogin } from '../../hooks/auth/usePasswordlessLogin';

interface AuthFormProps {
  redirectPath: string;
}

const AuthForm: React.FC<AuthFormProps> = ({ redirectPath }) => {
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [email, setEmail] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const navigate = useNavigate();
  const { loginWithGoogle } = useLoginWithGoogle();
  const { sendMagicLink, verifyOtp, loading } = usePasswordlessLogin();

  const handleGoogleAuth = async () => {
    await loginWithGoogle(redirectPath);
  };

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await sendMagicLink(email, redirectPath);
    if (!error) {
      setIsCodeSent(true);
    } else {
      console.error('Error sending magic link:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await verifyOtp(email, code);
    if (data.session) {
      navigate(redirectPath);
    } else if (error) {
      console.error('Error verifying OTP:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  return (
    <div className="bg-white py-4 px-4 sm:rounded-lg sm:px-10">
      <button
        onClick={handleGoogleAuth}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        Continue with Google
      </button>

      <div className="mt-4 relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or</span>
        </div>
      </div>

      {!showEmailInput ? (
        <button
          onClick={() => setShowEmailInput(true)}
          className="mt-4 w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Continue with Email
        </button>
      ) : (
        <form className="mt-4" onSubmit={isCodeSent ? handleVerifyOtp : handleSendMagicLink}>
          {!isCodeSent ? (
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Enter the code sent to your email
              </label>
              <input
                id="code"
                name="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm"
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {loading ? 'Processing...' : isCodeSent ? 'Verify Code' : 'Continue with Email'}
          </button>
        </form>
      )}

      {isCodeSent && (
        <button onClick={() => setIsCodeSent(false)} className="mt-2 w-full text-sm text-gray-600 hover:text-gray-500">
          Back to email input
        </button>
      )}
    </div>
  );
};

export default AuthForm;
