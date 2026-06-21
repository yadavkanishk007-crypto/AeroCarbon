import type { UserProfile, CommuteMode, DietType, HeatingSource } from '../utils/carbonCalculations';

export interface CarbonLog {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  commute_mode: CommuteMode;
  commute_distance: number;
  commute_emissions: number;
  diet_type: DietType;
  diet_emissions: number;
  energy_kwh: number;
  heating_source: HeatingSource;
  heating_kwh: number;
  energy_emissions: number;
  total_emissions: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface EcoHabit {
  id: string;
  title: string;
  category: 'commute' | 'diet' | 'energy';
  points: number;
  co2Saved: number; // kg
  completed: boolean;
}

// 1. Mock User Profile
export const mockUserProfile: UserProfile = {
  onboarding_completed: true,
  base_diet: 'omnivore',
  base_travel_mode: 'petrol_car',
  base_travel_km: 12000, // ~33 km/day
  base_home_energy_kwh: 360, // ~12 kWh/day
  base_heating_source: 'gas',
  base_annual_emissions: 8420.5 // base annual footprint
};

// Helper to format date
const getPastDateString = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

// 2. Generate 30 Days of Dynamic Carbon Logs
export const generateMockLogs = (userId: string = 'mock-user-id'): CarbonLog[] => {
  const logs: CarbonLog[] = [];
  
  // Custom travel distances, diets, and energy to make chart lines interesting
  const commuteDistances = [25, 30, 0, 45, 10, 0, 0, 32, 28, 5, 40, 15, 0, 0, 20, 35, 12, 50, 0, 0, 0, 24, 30, 0, 40, 10, 0, 0, 28, 15];
  const commuteModes: CommuteMode[] = [
    'petrol_car', 'petrol_car', 'walking', 'petrol_car', 'bus', 'walking', 'walking',
    'ev_car', 'ev_car', 'bicycle', 'train', 'bus', 'walking', 'walking',
    'petrol_car', 'petrol_car', 'bus', 'petrol_car', 'walking', 'walking', 'walking',
    'ev_car', 'ev_car', 'bicycle', 'train', 'bus', 'walking', 'walking', 'ev_car', 'bus'
  ];
  const diets: DietType[] = [
    'omnivore', 'omnivore', 'vegetarian', 'omnivore', 'vegan', 'vegetarian', 'omnivore',
    'omnivore', 'vegetarian', 'vegan', 'omnivore', 'vegetarian', 'vegan', 'vegetarian',
    'beef_heavy', 'omnivore', 'vegetarian', 'omnivore', 'vegan', 'vegan', 'vegetarian',
    'omnivore', 'omnivore', 'vegan', 'vegetarian', 'vegan', 'vegetarian', 'omnivore',
    'vegan', 'vegetarian'
  ];
  const energyKwhs = [12, 11, 10, 14, 9, 8, 11, 13, 10, 8, 12, 11, 9, 7, 15, 12, 10, 13, 9, 8, 10, 11, 12, 9, 13, 10, 8, 9, 10, 9];
  const heatingSources: HeatingSource[] = Array(30).fill('gas');
  const heatingKwhs = [6, 5, 7, 8, 5, 4, 6, 7, 5, 4, 6, 5, 4, 3, 8, 6, 5, 7, 4, 4, 5, 6, 6, 4, 7, 5, 4, 4, 5, 4];

  for (let i = 29; i >= 0; i--) {
    const dateStr = getPastDateString(i);
    const mode = commuteModes[i % commuteModes.length];
    const dist = commuteDistances[i % commuteDistances.length];
    
    // Emissions calculations (matched with carbonCalculations.ts rules)
    const factor = mode === 'petrol_car' ? 0.170 :
                   mode === 'diesel_car' ? 0.171 :
                   mode === 'ev_car' ? 0.050 :
                   mode === 'bus' ? 0.090 :
                   mode === 'train' ? 0.035 : 0;
    const commuteEmissions = Number((dist * factor).toFixed(3));

    const dietType = diets[i % diets.length];
    const dietEmissions = dietType === 'vegan' ? 1.5 :
                          dietType === 'vegetarian' ? 2.0 :
                          dietType === 'omnivore' ? 3.5 : 6.0;

    const electricityVal = energyKwhs[i % energyKwhs.length];
    const heatVal = heatingKwhs[i % heatingKwhs.length];
    const heatSource = heatingSources[i % heatingSources.length];
    const heatFactor = heatSource === 'gas' ? 0.200 : heatSource === 'electric' ? 0.350 : 0;
    
    const energyEmissions = Number((electricityVal * 0.350 + heatVal * heatFactor).toFixed(3));
    const totalEmissions = Number((commuteEmissions + dietEmissions + energyEmissions).toFixed(3));

    logs.push({
      id: `mock-log-${i}`,
      user_id: userId,
      date: dateStr,
      commute_mode: mode,
      commute_distance: dist,
      commute_emissions: commuteEmissions,
      diet_type: dietType,
      diet_emissions: dietEmissions,
      energy_kwh: electricityVal,
      heating_source: heatSource,
      heating_kwh: heatVal,
      energy_emissions: energyEmissions,
      total_emissions: totalEmissions
    });
  }

  return logs;
};

// 3. Mock Badges
export const mockBadges: Badge[] = [
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Completed the onboarding setup and estimated your base lifestyle footprint.',
    iconName: 'Compass',
    unlocked: true,
    unlockedAt: getPastDateString(30)
  },
  {
    id: 'eco_commuter',
    name: 'Eco Commuter',
    description: 'Logged 3 or more commutes using public transit, walking, or biking.',
    iconName: 'Bus',
    unlocked: true,
    unlockedAt: getPastDateString(20)
  },
  {
    id: 'green_plate',
    name: 'Green Plate',
    description: 'Logged 3 consecutive vegan or vegetarian meals.',
    iconName: 'Leaf',
    unlocked: false
  },
  {
    id: 'carbon_cutter',
    name: 'Carbon Cutter',
    description: 'Logged a day with emissions at least 30% below your baseline daily average.',
    iconName: 'TrendingDown',
    unlocked: true,
    unlockedAt: getPastDateString(10)
  },
  {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Logged activities for 5 consecutive days.',
    iconName: 'Zap',
    unlocked: false
  }
];

// 4. Mock Habits Checklist
export const mockEcoHabits: EcoHabit[] = [
  { id: 'h1', title: 'Commute via walking or bicycle', category: 'commute', points: 15, co2Saved: 3.4, completed: false },
  { id: 'h2', title: 'Work from home or carpool', category: 'commute', points: 10, co2Saved: 2.1, completed: false },
  { id: 'h3', title: 'Eat a fully plant-based lunch & dinner', category: 'diet', points: 20, co2Saved: 2.0, completed: false },
  { id: 'h4', title: 'Opt for locally sourced organic produce', category: 'diet', points: 10, co2Saved: 0.8, completed: false },
  { id: 'h5', title: 'Wash laundry in cold water & air dry', category: 'energy', points: 15, co2Saved: 1.5, completed: false },
  { id: 'h6', title: 'Turn off all standby electric appliances', category: 'energy', points: 5, co2Saved: 0.4, completed: false },
  { id: 'h7', title: 'Dim room lights and rely on natural light', category: 'energy', points: 5, co2Saved: 0.2, completed: false }
];
