# Deepcards

Deepcards is a flashcard application with some additional LLM features.

## Features

- Every flashcard has an associated conversation
- Generate cards automatically from conversations
- Spaced repetition for optimal retention

## Getting Started

To run locally, you'll need to install the dependencies in /client and /server respectively:

```bash
npm install
```

Then, you can start the client and server respectively with:

```bash
npm run dev
```

Both /client and /server have .env.example files that you can copy to .env and fill in with your own values. You will need to create a project at Supabase and OpenAI to get the necessary values.
