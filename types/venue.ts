export type VenueType = 
  | 'dive-bar'
  | 'sports-bar'
  | 'club'
  | 'brewery';

export type SpecialType =
  | 'happy-hour'
  | 'ladies-night'
  | 'trivia-night'
  | 'karaoke'
  | 'live-music'
  | 'college-night'
  | 'drink-special'
  | 'food-special';

export interface OpenHours {
  day: string;
  open: string;
  close: string;
  closed?: boolean;
}

export interface Special {
  id: string;
  title: string;
  description: string;
  day: string;
  startTime: string;
  endTime: string;
  type: SpecialType;
  recurring: boolean;
  imageUrl?: string;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  website?: string;
  instagram?: string;
  types: VenueType[];
  rating: number;
  priceLevel: 1 | 2 | 3 | 4;
  openHours: OpenHours[];
  specials: Special[];
  featuredImage: string;
  images: string[];
  location: {
    latitude: number;
    longitude: number;
  };
}