import { AppState } from '../types';

export const zones = ['Calgary', 'Edmonton', 'Red Deer'];
export const roles = ['driver', 'cityAdmin', 'superAdmin'] as const;
export const expenseCategories = ['Fuel', 'Maintenance', 'Insurance', 'Parking', 'Tolls', 'Lease', 'Misc'];

export const seedState: AppState = {
  signedIn: false,
  profile: {
    name: 'Alex Driver',
    phone: '+1 (403) 555-0100',
    email: 'driver@example.com',
    role: 'driver',
    zone: 'Calgary',
  },
  gpsConsent: false,
  units: 'metric',
  mileage: [
    { id: 'm1', date: '2026-04-12', start: 128440, end: 128598, isGigWork: true },
    { id: 'm2', date: '2026-04-13', start: 128598, end: 128751, isGigWork: true },
  ],
  fuel: [
    { id: 'f1', date: '2026-04-11', litres: 41.2, cost: 57.31, odometer: 128390 },
    { id: 'f2', date: '2026-04-13', litres: 38.4, cost: 52.44, odometer: 128745 },
  ],
  expenses: [
    { id: 'e1', date: '2026-04-12', amount: 18, category: 'Parking', note: 'Airport queue lot' },
    { id: 'e2', date: '2026-04-13', amount: 42.5, category: 'Maintenance', note: 'Interior detail' },
  ],
  earnings: [
    { id: 'earn1', date: '2026-04-12', amount: 214.5, note: 'Strong airport surge', platform: 'Uber' as const },
    { id: 'earn2', date: '2026-04-13', amount: 187.0, note: 'Downtown + late night', platform: 'Uber' as const },
  ],
  recurringExpenses: [
    { id: 're1', name: 'Phone bill', amount: 55, category: 'Misc', dayOfMonth: 1, active: true },
    { id: 're2', name: 'Auto insurance', amount: 187, category: 'Insurance', dayOfMonth: 1, active: true },
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
  currentShift: null,
  shifts: [],
  recurringAppliedMonths: [],
  deals: [
    {
      id: 'd1',
      sponsor: 'NW Auto Care',
      category: 'Mechanics',
      headline: '15% off oil changes for Uber drivers',
      detail: 'Show your Uber driver badge at checkout. Valid Mon–Fri.',
      cta: 'Get directions',
      zone: 'Calgary',
    },
    {
      id: 'd2',
      sponsor: 'Riverbend Fuel',
      category: 'Gas',
      headline: '2¢/L discount with driver app',
      detail: 'Present the deal at the pump terminal. Limit 60L per visit.',
      cta: 'See location',
      zone: 'Calgary',
    },
    {
      id: 'd3',
      sponsor: 'DriveShield Insurance',
      category: 'Insurance',
      headline: 'Rideshare add-on from $12/month',
      detail: 'Covers the gap between personal and commercial coverage. No broker needed.',
      cta: 'Get a quote',
      zone: 'Calgary',
    },
    {
      id: 'd4',
      sponsor: 'Pita Palace',
      category: 'Restaurants',
      headline: 'Free drink with any driver meal',
      detail: 'Hot meals under $12. Show driver profile at counter.',
      cta: 'View menu',
      zone: 'Calgary',
    },
  ],
  articles: [
    {
      id: 'a1',
      title: 'How to claim vehicle expenses on your CRA T2125',
      category: 'Tax',
      summary: 'A step-by-step breakdown of which expenses qualify and how to calculate your business-use percentage.',
      body: 'The T2125 form (Statement of Business Activities) is what self-employed drivers file with their personal tax return. You can deduct fuel, insurance, maintenance, licensing fees, and lease or depreciation costs — but only the business-use portion.\n\nStep 1: Track your total km and business km separately. Your mileage log is your proof.\n\nStep 2: Calculate your business-use percentage: business km / total km × 100.\n\nStep 3: Multiply each eligible expense by that percentage.\n\nStep 4: Keep all receipts for at least 6 years in case of audit.',
      readMinutes: 5,
    },
    {
      id: 'a2',
      title: 'GST/HST registration: when you need it and how to file',
      category: 'Tax',
      summary: 'Rideshare drivers must register for GST/HST from their very first dollar of income. Here\'s what that means.',
      body: 'Unlike most sole proprietors who only need to register once they hit $30,000 in annual revenue, rideshare drivers in Canada must register for GST/HST immediately.\n\nYou will need a Business Number (BN) from the CRA. Apply online at canada.ca/en/revenue-agency.\n\nUber remits the GST/HST on fares directly, but you still need to file a return and may need to track input tax credits (ITCs) on your expenses.',
      readMinutes: 4,
    },
    {
      id: 'a3',
      title: 'The 5 highest-value hours for Calgary drivers',
      category: 'Tips',
      summary: 'Data from the community suggests five time windows consistently outperform the rest.',
      body: '1. Thursday 11pm – 1am: Downtown bar rush. Short trips, high volume.\n2. Friday 7am – 9am: Business travellers to YYC. Often surge-priced.\n3. Friday 10pm – 2am: Highest overall surge frequency.\n4. Saturday morning 8am – 11am: Brunch and errands. Moderate volume, low competition.\n5. Sunday 4pm – 7pm: Return travellers from YYC. Solid airport runs.',
      readMinutes: 3,
    },
    {
      id: 'a4',
      title: 'Vehicle maintenance schedule for high-km drivers',
      category: 'Maintenance',
      summary: 'A practical guide to keeping your car healthy when you\'re putting on 50,000+ km a year.',
      body: 'High-mileage rideshare driving accelerates wear on several key systems.\n\nOil: Switch to full synthetic and change every 8,000–10,000 km. Budget $80–$120 per change.\n\nTires: Rotate every 10,000 km. Expect to replace all four every 40,000–60,000 km.\n\nBrakes: Inspect every 20,000 km. Urban stop-and-go wears pads faster than highway driving.\n\nTransmission fluid: Change every 50,000 km.\n\nCabin air filter: Replace every 20,000 km — passengers notice.',
      readMinutes: 4,
    },
    {
      id: 'a5',
      title: 'Understanding your net profit per km',
      category: 'Tips',
      summary: 'Earnings alone don\'t tell you if a shift was worth it. Here\'s the number that does.',
      body: 'Net profit per km = (Earnings − Fuel − Expenses) / km driven.\n\nA healthy target for Canadian rideshare drivers is $0.35–$0.55 per km after fuel and direct expenses.\n\nIf you\'re below $0.30/km, you\'re likely working in a low-surge window or driving too far between trips. Track this weekly and adjust your zone or hours accordingly.',
      readMinutes: 3,
    },
  ],
};
