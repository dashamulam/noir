import type { Mood } from '../types';

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=85`;
export const moods: Mood[] = [
  { id: 'after-hours', name: 'After hours', description: 'For when the world goes quiet.', query: 'The Weeknd', image: photo('photo-1519608487953-e999c86e7455'), tag: 'LATE NIGHT / R&B' },
  { id: 'slow-mornings', name: 'Slow mornings', description: 'A softer start to your day.', query: 'acoustic chill', image: photo('photo-1441974231531-c6227db76b6e'), tag: 'ACOUSTIC / CHILL' },
  { id: 'main-character', name: 'Main character', description: 'Life looks better with a soundtrack.', query: 'Arijit Singh', image: photo('photo-1477959858617-67f85cf4f1df'), tag: 'BOLLYWOOD / FEELS' },
  { id: 'deep-focus', name: 'Deep focus', description: 'Find a little room to think.', query: 'lofi instrumental', image: photo('photo-1519681393784-d120267933ba'), tag: 'LO-FI / INSTRUMENTAL' },
  { id: 'indie-state', name: 'Indie state of mind', description: 'A little different. Just like you.', query: 'Anuv Jain', image: photo('photo-1475924156734-496f6cac6ec1'), tag: 'INDIE / ALTERNATIVE' },
];

export const channels = [
  { name: 'For you', query: 'Arijit Singh' },
  { name: 'Hindi', query: 'Hindi hits' },
  { name: 'English', query: 'The Weeknd' },
  { name: 'Punjabi', query: 'Diljit Dosanjh' },
  { name: 'Tamil', query: 'Anirudh Ravichander' },
  { name: 'Telugu', query: 'Telugu hits' },
];
