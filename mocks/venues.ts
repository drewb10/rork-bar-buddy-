import { Venue, Special, VenueType, SpecialType } from '@/types/venue';

export const venues: Venue[] = [
  {
    id: '1',
    name: "The Hummingbird Stage & Taproom",
    description: "Live music venue with a great selection of craft beers and regular performances.",
    address: "430 Cherry St, Macon, GA 31201",
    phone: "(478) 741-9130",
    website: "https://www.thebirdstage.com/",
    instagram: "hummingbirdmacon",
    types: ['hangout'],
    rating: 4.6,
    priceLevel: 2,
    openHours: [
      { day: 'Monday', closed: true, open: '', close: '' },
      { day: 'Tuesday', open: '16:00', close: '00:00' },
      { day: 'Wednesday', open: '16:00', close: '00:00' },
      { day: 'Thursday', open: '16:00', close: '00:00' },
      { day: 'Friday', open: '16:00', close: '02:00' },
      { day: 'Saturday', open: '16:00', close: '02:00' },
      { day: 'Sunday', closed: true, open: '', close: '' }
    ],
    specials: [
      {
        id: '1-1',
        title: "Open Mic Night",
        description: "Show off your talent with $3 craft beer pints",
        day: "Tuesday",
        startTime: "20:00",
        endTime: "23:00",
        type: "live-music",
        recurring: true
      },
      {
        id: '1-2',
        title: "Happy Hour",
        description: "$2 off all drafts and appetizers",
        day: "Wednesday",
        startTime: "16:00",
        endTime: "19:00",
        type: "happy-hour",
        recurring: true
      }
    ],
    featuredImage: "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg",
    images: [
      "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg",
      "https://images.pexels.com/photos/274192/pexels-photo-274192.jpeg"
    ],
    location: {
      latitude: 32.8370,
      longitude: -83.6325
    }
  },
  {
    id: '2',
    name: "The Library Taphouse and Kitchen",
    description: "Casual bar with a wide selection of beers on tap and traditional pub fare.",
    address: "2644 Riverside Dr, Macon, GA 31204",
    phone: "(478) 743-5500",
    website: "https://www.thelibrarymacon.com/",
    instagram: "thelibrarymacon",
    types: ['sports-bar'],
    rating: 4.3,
    priceLevel: 2,
    openHours: [
      { day: 'Monday', open: '16:00', close: '00:00' },
      { day: 'Tuesday', open: '16:00', close: '00:00' },
      { day: 'Wednesday', open: '16:00', close: '00:00' },
      { day: 'Thursday', open: '16:00', close: '00:00' },
      { day: 'Friday', open: '16:00', close: '02:00' },
      { day: 'Saturday', open: '12:00', close: '02:00' },
      { day: 'Sunday', open: '12:00', close: '00:00' }
    ],
    specials: [
      {
        id: '2-1',
        title: "Happy Hour",
        description: "Mon–Fri 4–7 PM: select drafts, 2-for-1 wells & $3 wine",
        day: "Monday",
        startTime: "16:00",
        endTime: "19:00",
        type: "happy-hour",
        recurring: true
      }
    ],
    featuredImage: "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg",
    images: [
      "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg"
    ],
    location: {
      latitude: 32.8365,
      longitude: -83.6320
    }
  },
  {
    id: '5',
    name: "Late Nite",
    description: "Vibrant nightclub with DJs, dancing, and weekend events.",
    address: "496 2nd St, Macon, GA 31201",
    phone: "(478) 254-7009",
    website: "https://thisweekendatlatenite.com/",
    instagram: "latenitemacon",
    types: ['club'],
    rating: 4.1,
    priceLevel: 3,
    openHours: [
      { day: 'Monday', closed: true, open: '', close: '' },
      { day: 'Tuesday', closed: true, open: '', close: '' },
      { day: 'Wednesday', closed: true, open: '', close: '' },
      { day: 'Thursday', open: '22:00', close: '03:00' },
      { day: 'Friday', open: '22:00', close: '03:00' },
      { day: 'Saturday', open: '22:00', close: '03:00' },
      { day: 'Sunday', closed: true, open: '', close: '' }
    ],
    specials: [
      {
        id: '5-1',
        title: "College Night",
        description: "No cover with college ID. $3 shots all night!",
        day: "Thursday",
        startTime: "22:00",
        endTime: "03:00",
        type: "college-night",
        recurring: true
      }
    ],
    featuredImage: "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg",
    images: [
      "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg"
    ],
    location: {
      latitude: 32.8406,
      longitude: -83.6325
    }
  },
  {
    id: '6',
    name: "JBA",
    description: "Just Because Art Bar & Lounge offers craft cocktails in an upscale setting with regular live music and art exhibitions.",
    address: "499 Martin Luther King Jr Blvd, Macon, GA 31201",
    phone: "(478) 257-6456",
    website: "https://www.jbamacon.com/",
    instagram: "jbamacongeorgia",
    types: ['club', 'hangout', 'pool'],
    rating: 4.7,
    priceLevel: 3,
    openHours: [
      { day: 'Monday', closed: true, open: '', close: '' },
      { day: 'Tuesday', closed: true, open: '', close: '' },
      { day: 'Wednesday', open: '17:00', close: '00:00' },
      { day: 'Thursday', open: '17:00', close: '00:00' },
      { day: 'Friday', open: '17:00', close: '02:00' },
      { day: 'Saturday', open: '17:00', close: '02:00' },
      { day: 'Sunday', open: '16:00', close: '22:00' }
    ],
    specials: [
      {
        id: '6-1',
        title: "Karaoke Night",
        description: "Sing your heart out every Wednesday with $5 signature cocktails",
        day: "Wednesday",
        startTime: "20:00",
        endTime: "00:00",
        type: "karaoke",
        recurring: true
      }
    ],
    featuredImage: "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg",
    images: [
      "https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg"
    ],
    location: {
      latitude: 32.8412,
      longitude: -83.6330
    }
  }
];

export const getVenueById = (id: string): Venue | undefined => {
  return venues.find(venue => venue.id === id);
};

export const getSpecialsByDay = (day: string): { venue: Venue, special: Special }[] => {
  const results: { venue: Venue, special: Special }[] = [];
  
  venues.forEach(venue => {
    venue.specials.forEach(special => {
      if (special.day.toLowerCase() === day.toLowerCase()) {
        results.push({ venue, special });
      }
    });
  });
  
  return results;
};