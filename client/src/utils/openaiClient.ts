// src/utils/openaiClient.ts

import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

export const initializeOpenAIClient = (apiKey: string) => {
  openaiClient = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
};

export const getOpenAIClient = () => {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized');
  }
  return openaiClient;
};
