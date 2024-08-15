const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://deepcards-server-jji5s4leka-uk.a.run.app/api';
  }

  // For development
  const devApiUrl = import.meta.env.VITE_DEV_API_URL;
  if (devApiUrl) {
    return devApiUrl;
  }

  // Fallback to localhost if VITE_DEV_API_URL is not set
  return 'http://localhost:8080/api';
};

export const API_BASE_URL = getApiBaseUrl();
