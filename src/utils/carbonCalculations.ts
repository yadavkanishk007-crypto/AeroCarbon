export type CommuteMode = 'petrol_car' | 'diesel_car' | 'ev_car' | 'bus' | 'train' | 'bicycle' | 'walking';
export type DietType = 'vegan' | 'vegetarian' | 'omnivore' | 'beef_heavy';
export type HeatingSource = 'gas' | 'electric' | 'none';

export interface DailyLogInput {
  commute_mode: CommuteMode;
  commute_distance: number; // in km
  diet_type: DietType;
  energy_kwh: number; // in kWh
  heating_source: HeatingSource;
  heating_kwh: number; // in kWh
}

export interface UserProfile {
  onboarding_completed: boolean;
  base_diet: DietType;
  base_travel_mode: CommuteMode;
  base_travel_km: number; // annual
  base_home_energy_kwh: number; // monthly
  base_heating_source: HeatingSource;
  base_annual_emissions: number; // kg CO2e
}

export interface EmissionBreakdown {
  commute: number;
  diet: number;
  energy: number;
  total: number;
}

export interface DailySavings {
  commuteSavings: number; // kg CO2e
  dietSavings: number; // kg CO2e
  energySavings: number; // kg CO2e
  totalSavings: number; // kg CO2e
}

// Standardized Carbon Multipliers (kg CO2e per unit)
export const EMISSION_FACTORS = {
  commute: {
    petrol_car: 0.170, // kg CO2e per km
    diesel_car: 0.171, // kg CO2e per km
    ev_car: 0.050,     // kg CO2e per km
    bus: 0.090,        // kg CO2e per km
    train: 0.035,      // kg CO2e per km
    bicycle: 0.0,
    walking: 0.0
  },
  diet: {
    vegan: 1.5,       // kg CO2e per day
    vegetarian: 2.0,  // kg CO2e per day
    omnivore: 3.5,    // kg CO2e per day
    beef_heavy: 6.0   // kg CO2e per day
  },
  energy: {
    electricity: 0.350, // kg CO2e per kWh
    heating: {
      gas: 0.200,      // kg CO2e per kWh equivalent
      electric: 0.350, // kg CO2e per kWh equivalent
      none: 0.0
    }
  }
} as const;

/**
 * Calculates emissions for a commute trip.
 */
export function calculateCommuteEmissions(distanceKm: number, mode: CommuteMode): number {
  if (distanceKm < 0) return 0;
  const factor = EMISSION_FACTORS.commute[mode] ?? 0;
  return Number((distanceKm * factor).toFixed(3));
}

/**
 * Calculates emissions for a diet selection.
 */
export function calculateDietEmissions(dietType: DietType): number {
  return EMISSION_FACTORS.diet[dietType] ?? 0;
}

/**
 * Calculates emissions for home energy usage.
 */
export function calculateEnergyEmissions(
  electricityKwh: number,
  heatingSource: HeatingSource,
  heatingKwh: number
): number {
  const electricityVal = Math.max(0, electricityKwh);
  const heatingVal = Math.max(0, heatingKwh);
  
  const electricityEmissions = electricityVal * EMISSION_FACTORS.energy.electricity;
  const heatingFactor = EMISSION_FACTORS.energy.heating[heatingSource] ?? 0;
  const heatingEmissions = heatingVal * heatingFactor;
  
  return Number((electricityEmissions + heatingEmissions).toFixed(3));
}

/**
 * Calculates the estimated annual base footprint based on onboarding questionnaire.
 */
export function calculateBaseAnnualEmissions(
  dietType: DietType,
  annualTravelKm: number,
  travelMode: CommuteMode,
  monthlyElectricityKwh: number,
  heatingSource: HeatingSource
): number {
  // 1. Annual diet emissions (365 days)
  const annualDiet = calculateDietEmissions(dietType) * 365;
  
  // 2. Annual commute emissions
  const annualCommute = calculateCommuteEmissions(annualTravelKm, travelMode);
  
  // 3. Annual home energy (12 months)
  // Assume heating uses roughly 150 kWh equivalent monthly on average if gas/electric, or we scale monthly electricity
  const monthlyElectricityEmissions = Math.max(0, monthlyElectricityKwh) * EMISSION_FACTORS.energy.electricity;
  const estimatedHeatingKwhMonthly = heatingSource === 'none' ? 0 : 200; // simplified onboarding assumption
  const heatingFactor = EMISSION_FACTORS.energy.heating[heatingSource] ?? 0;
  const monthlyHeatingEmissions = estimatedHeatingKwhMonthly * heatingFactor;
  
  const annualEnergy = (monthlyElectricityEmissions + monthlyHeatingEmissions) * 12;
  
  return Number((annualDiet + annualCommute + annualEnergy).toFixed(2));
}

/**
 * Calculates savings of today's log entries compared to the user's daily baseline.
 */
export function calculateDailySavings(
  log: DailyLogInput,
  baseProfile: UserProfile
): DailySavings {
  // Convert annual travel baseline to daily average
  const dailyBaseTravelKm = baseProfile.base_travel_km / 365;
  const dailyBaseCommuteEmissions = calculateCommuteEmissions(dailyBaseTravelKm, baseProfile.base_travel_mode);
  
  // Convert monthly energy baseline to daily average
  const dailyBaseElectricityKwh = baseProfile.base_home_energy_kwh / 30;
  const dailyBaseHeatingKwh = baseProfile.base_heating_source === 'none' ? 0 : (200 / 30);
  const dailyBaseEnergyEmissions = calculateEnergyEmissions(
    dailyBaseElectricityKwh,
    baseProfile.base_heating_source,
    dailyBaseHeatingKwh
  );
  
  const dailyBaseDietEmissions = calculateDietEmissions(baseProfile.base_diet);
  
  // Calculate today's emissions
  const todayCommuteEmissions = calculateCommuteEmissions(log.commute_distance, log.commute_mode);
  const todayDietEmissions = calculateDietEmissions(log.diet_type);
  const todayEnergyEmissions = calculateEnergyEmissions(log.energy_kwh, log.heating_source, log.heating_kwh);
  
  // Savings = Baseline - Today (positive value is a saving, negative means exceeded baseline)
  const commuteSavings = Number((dailyBaseCommuteEmissions - todayCommuteEmissions).toFixed(3));
  const dietSavings = Number((dailyBaseDietEmissions - todayDietEmissions).toFixed(3));
  const energySavings = Number((dailyBaseEnergyEmissions - todayEnergyEmissions).toFixed(3));
  const totalSavings = Number((commuteSavings + dietSavings + energySavings).toFixed(3));
  
  return {
    commuteSavings,
    dietSavings,
    energySavings,
    totalSavings
  };
}
