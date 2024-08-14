// src/config.ts
export const API_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://deepcards-server-jji5s4leka-uk.a.run.app/api'
    : 'http://localhost:8080/api';
