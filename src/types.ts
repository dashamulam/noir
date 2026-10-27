export type MediaLink = { quality: string; url: string };
export type Artist = { id: string; name: string; image?: MediaLink[] };
export type Song = {
  id: string;
  name: string;
  duration: number | null;
  language?: string;
  year?: string | null;
  album: { id?: string | null; name: string | null };
  artists: { primary: Artist[] };
  image: MediaLink[];
  downloadUrl: MediaLink[];
};
export type Playlist = { id: string; name: string; songs: Song[]; createdAt: number };
export type SearchResult = { total: number; start: number; results: Song[] };
export type Quality = '320' | '160' | '96';
export type Mood = { id: string; name: string; description: string; query: string; image: string; tag: string };
