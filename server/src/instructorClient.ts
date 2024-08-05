// server/src/instructorClient.ts

import Instructor from '@instructor-ai/instructor';
import openai from './openaiClient';

const instructor = Instructor({
  client: openai,
  mode: 'FUNCTIONS',
});

export default instructor;
