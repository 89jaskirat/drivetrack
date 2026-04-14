import { AppState } from '../types';

export const zones = ['Calgary', 'Edmonton', 'Red Deer'];
export const roles = ['driver', 'cityAdmin', 'superAdmin'] as const;
export const expenseCategories = ['Fuel', 'Maintenance', 'Insurance', 'Parking', 'Tolls', 'Lease', 'Misc'];

export const seedState: AppState = {
  signedIn: false,
  profile: {
    name: 'Jaskirat',
    phone: '+1 (403) 555-0144',
    email: 'jaskirat1989@gmail.com',
    role: 'driver',
    zone: 'Calgary',
  },
  gpsConsent: false,
  units: 'metric',
  mileage: [
    { id: 'm1', date: '2026-04-12', start: 128440, end: 128598 },
    { id: 'm2', date: '2026-04-13', start: 128598, end: 128751 },
  ],
  fuel: [
    { id: 'f1', date: '2026-04-11', litres: 41.2, cost: 57.31, odometer: 128390 },
    { id: 'f2', date: '2026-04-13', litres: 38.4, cost: 52.44, odometer: 128745 },
  ],
  expenses: [
    { id: 'e1', date: '2026-04-12', amount: 18, category: 'Parking', note: 'Airport queue lot' },
    { id: 'e2', date: '2026-04-13', amount: 42.5, category: 'Maintenance', note: 'Interior detail' },
  ],
  posts: [
    {
      id: 'p1',
      author: 'Maria',
      title: 'Airport queue is moving faster after 8pm',
      body: 'The arrivals line looked rough at 6:30, but it cleared and the surge held steady after 8pm.',
      votes: 14,
      tags: ['airport', 'calgary'],
      comments: [
        {
          id: 'c1',
          author: 'Kevin',
          body: 'Same here. I switched from downtown and got two solid runs.',
          votes: 6,
          replies: [{ id: 'r1', author: 'Maria', body: 'Good call. Airport felt safer tonight.', votes: 2 }],
        },
      ],
    },
    {
      id: 'p2',
      author: 'City Admin',
      title: 'Gas deal at Riverbend Fuel',
      body: 'Verified lowest price in-zone as of this afternoon. Report if it changes.',
      votes: 9,
      tags: ['gas', 'verified'],
      comments: [{ id: 'c2', author: 'Sonia', body: 'Still active at 4:20pm.', votes: 3 }],
    },
    {
      id: 'p3',
      author: 'Aman',
      title: 'Best downtown windows this week?',
      body: 'Looking for the cleanest lunch and late-night blocks if anyone is tracking patterns.',
      votes: 7,
      tags: ['downtown', 'strategy'],
      comments: [],
    },
  ],
  gas: [
    { id: 'g1', station: 'Riverbend Fuel', price: 1.42, distanceKm: 2.4, address: '8330 18 St SE, Calgary' },
    { id: 'g2', station: 'Macleod Stop', price: 1.45, distanceKm: 4.1, address: '9408 Macleod Trl S, Calgary' },
    { id: 'g3', station: 'Airport Petro', price: 1.47, distanceKm: 5.6, address: '2000 Airport Rd NE, Calgary' },
  ],
};
