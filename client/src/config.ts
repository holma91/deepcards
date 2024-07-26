// src/config.ts
export const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://your-production-api-url.com/api'
    : 'http://localhost:3001/api';
