import { Venue, Special, VenueType, SpecialType } from '@/types/venue';

export const venues: Venue[] = [
  {
    id: 'library-taphouse',
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
      },
      {
        id: '2-2',
        title: "Happy Hour",
        description: "Mon–Fri 4–7 PM: select drafts, 2-for-1 wells & $3 wine",
        day: "Tuesday",
        startTime: "16:00",
        endTime: "19:00",
        type: "happy-hour",
        recurring: true
      },
      {
        id: '2-3',
        title: "Happy Hour",
        description: "Mon–Fri 4–7 PM: select drafts, 2-for-1 wells & $3 wine",
        day: "Wednesday",
        startTime: "16:00",
        endTime: "19:00",
        type: "happy-hour",
        recurring: true
      },
      {
        id: '2-4',
        title: "Happy Hour",
        description: "Mon–Fri 4–7 PM: select drafts, 2-for-1 wells & $3 wine",
        day: "Thursday",
        startTime: "16:00",
        endTime: "19:00",
        type: "happy-hour",
        recurring: true
      },
      {
        id: '2-5',
        title: "Happy Hour",
        description: "Mon–Fri 4–7 PM: select drafts, 2-for-1 wells & $3 wine",
        day: "Friday",
        startTime: "16:00",
        endTime: "19:00",
        type: "happy-hour",
        recurring: true
      }
    ],
    featuredImage: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1000",
      "https://images.unsplash.com/photo-1538488881038-e252a119ace7?q=80&w=1000"
    ],
    location: {
      latitude: 32.8365,
      longitude: -83.6320
    }
  },
  {
    id: 'late-night-library',
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
      },
      {
        id: '5-2',
        title: "Ladies Night",
        description: "Ladies get in free before midnight",
        day: "Friday",
        startTime: "22:00",
        endTime: "00:00",
        type: "ladies-night",
        recurring: true,
        imageUrl: "https://images.unsplash.com/photo-1575444758702-4a6b9222336e?q=80&w=1000"
      }
    ],
    featuredImage: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?q=80&w=1000",
      "https://images.unsplash.com/photo-1543007630-9710e4a00a20?q=80&w=1000"
    ],
    location: {
      latitude: 32.8406,
      longitude: -83.6325
    }
  },
  {
    id: 'jba-sports-bar',
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
      },
      {
        id: '6-2',
        title: "Sunday Jazz",
        description: "Live jazz and half-price wine bottles",
        day: "Sunday",
        startTime: "17:00",
        endTime: "21:00",
        type: "live-music",
        recurring: true,
        imageUrl: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?q=80&w=1000"
      }
    ],
    featuredImage: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=1000",
      "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=1000"
    ],
    location: {
      latitude: 32.8412,
      longitude: -83.6330
    }
  },
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
    featuredImage: "https://images.unsplash.com/photo-1559519529-0936e4058364?q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1559519529-0936e4058364?q=80&w=1000",
      "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=1000"
    ],
    location: {
      latitude: 32.8370,
      longitude: -83.6325
    }
  },
  {
    id: '3',
    name: "Cashman's Pub",
    description: "Classic Irish pub with a wide selection of beers on tap and traditional pub fare.",
    address: "370 Cherry St, Macon, GA 31201",
    phone: "(478) 742-3627",
    website: "https://www.cashmansmacon.com/",
    instagram: "cashmanspub",
    types: ['sports-bar', 'hangout'],
    rating: 4.5,
    priceLevel: 2,
    openHours: [
      { day: 'Monday', open: '16:00', close: '01:00' },
      { day: 'Tuesday', open: '16:00', close: '01:00' },
      { day: 'Wednesday', open: '16:00', close: '01:00' },
      { day: 'Thursday', open: '16:00', close: '01:00' },
      { day: 'Friday', open: '16:00', close: '02:00' },
      { day: 'Saturday', open: '12:00', close: '02:00' },
      { day: 'Sunday', open: '12:00', close: '00:00' }
    ],
    specials: [
      {
        id: '3-1',
        title: "$2 Tuesdays",
        description: "$2 domestic drafts and well drinks all night",
        day: "Tuesday",
        startTime: "16:00",
        endTime: "01:00",
        type: "drink-special",
        recurring: true
      },
      {
        id: '3-2',
        title: "Wing Wednesday",
        description: "10% off wings & ½ off select whiskey",
        day: "Wednesday",
        startTime: "16:00",
        endTime: "01:00",
        type: "food-special",
        recurring: true
      },
      {
        id: '3-3',
        title: "Game Day Special",
        description: "$2 Natural Light/Bud Light drafts, $3 Michelob Ultra",
        day: "Saturday",
        startTime: "12:00",
        endTime: "02:00",
        type: "drink-special",
        recurring: true
      }
    ],
    featuredImage: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1000",
      "https://images.unsplash.com/photo-1538488881038-e252a119ace7?q=80&w=1000"
    ],
    location: {
      latitude: 32.8365,
      longitude: -83.6320
    }
  },
  {
    id: '4',
    name: "Historic Grant's Lounge",
    description: "Historic music venue known as the birthplace of Southern Rock with live performances.",
    address: "576 Poplar St, Macon, GA 31201",
    phone: "(478) 742-6403",
    website: "https://historicgrants.com/",
    instagram: "historicgrantslounge",
    types: ['hangout', 'pool'],
    rating: 4.4,
    priceLevel: 2,
    openHours: [
      { day: 'Monday', closed: true, open: '', close: '' },
      { day: 'Tuesday', closed: true, open: '', close: '' },
      { day: 'Wednesday', open: '20:00', close: '02:00' },
      { day: 'Thursday', open: '20:00', close: '02:00' },
      { day: 'Friday', open: '20:00', close: '02:00' },
      { day: 'Saturday', open: '20:00', close: '02:00' },
      { day: 'Sunday', closed: true, open: '', close: '' }
    ],
    specials: [
      {
        id: '4-1',
        title: "Live Music",
        description: "Local and touring bands perform weekly",
        day: "Friday",
        startTime: "21:00",
        endTime: "01:00",
        type: "live-music",
        recurring: true,
        imageUrl: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?q=80&w=1000"
      }
    ],
    featuredImage: "https://images.unsplash.com/photo-1559519529-0936e4058364?q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1559519529-0936e4058364?q=80&w=1000",
      "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?q=80&w=1000"
    ],
    location: {
      latitude: 32.8380,
      longitude: -83.6315
    }
  },
  {
    id: '7',
    name: "Reboot Macon",
    description: "Arcade bar featuring classic video games, pinball machines, and craft beers.",
    address: "566 Cherry St, Macon, GA 31201",
    phone: "(478) 621-2646",
    website: "https://www.rebootmacon.com/",
    instagram: "rebootmacon",
    types: ['hangout'],
    rating: 4.8,
    priceLevel: 2,
    openHours: [
      { day: 'Monday', closed: true, open: '', close: '' },
      { day: 'Tuesday', open: '17:00', close: '23:00' },
      { day: 'Wednesday', open: '17:00', close: '23:00' },
      { day: 'Thursday', open: '17:00', close: '23:00' },
      { day: 'Friday', open: '17:00', close: '01:00' },
      { day: 'Saturday', open: '14:00', close: '01:00' },
      { day: 'Sunday', open: '14:00', close: '22:00' }
    ],
    specials: [
      {
        id: '7-1',
        title: "Game Tournament",
        description: "Weekly gaming tournaments with prizes",
        day: "Thursday",
        startTime: "19:00",
        endTime: "22:00",
        type: "drink-special",
        recurring: true
      },
      {
        id: '7-2',
        title: "Happy Hour",
        description: "$1 off all draft beers and $5 well drinks",
        day: "Wednesday",
        startTime: "17:00",
        endTime: "19:00",
        type: "happy-hour",
        recurring: true
      }
    ],
    featuredImage: "https://images.unsplash.com/photo-1511882150382-421056c89033?q=80&w=1000",
    images: [
      "https://images.unsplash.com/photo-1511882150382-421056c89033?q=80&w=1000",
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6a3?q=80&w=1000"
    ],
    location: {
      latitude: 32.8375,
      longitude: -83.6322
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

export const getOpenVenues = (): Venue[] => {
  const now = new Date();
  const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()];
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  return venues.filter(venue => {
    const todayHours = venue.openHours.find(h => h.day === day);
    if (!todayHours || todayHours.closed) return false;
    
    return todayHours.open <= time && time <= todayHours.close;
  });
};