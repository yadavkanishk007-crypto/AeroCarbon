import { EMISSION_FACTORS, BASELINES } from './constants';

/**
 * Commute modes available for user transport selection.
 */
export type CommuteMode = 'petrol_car' | 'diesel_car' | 'ev_car' | 'bus' | 'train' | 'bicycle' | 'walking';

/**
 * Diet types reflecting food consumption habits.
 */
export type DietType = 'vegan' | 'vegetarian' | 'omnivore' | 'beef_heavy';

/**
 * Household space heating fuel sources.
 */
export type HeatingSource = 'gas' | 'electric' | 'none';

/**
 * Input format for daily logged carbon activities.
 */
export interface DailyLogInput {
  /** Mode of transportation taken today */
  commute_mode: CommuteMode;
  /** Distance traveled today in kilometers */
  commute_distance: number;
  /** Diet style followed today */
  diet_type: DietType;
  /** Electricity consumed today in kilowatt-hours */
  energy_kwh: number;
  /** Heating fuel source used today */
  heating_source: HeatingSource;
  /** Space heating consumed today in kilowatt-hours equivalent */
  heating_kwh: number;
}

/**
 * User Profile containing onboarding baseline measurements and configurations.
 */
export interface UserProfile {
  /** Indicates whether the user finished their base onboarding setup */
  onboarding_completed: boolean;
  /** Base diet selection */
  base_diet: DietType;
  /** Base mode of travel */
  base_travel_mode: CommuteMode;
  /** Base annual travel in kilometers */
  base_travel_km: number;
  /** Base monthly home energy in kWh */
  base_home_energy_kwh: number;
  /** Base heating fuel source */
  base_heating_source: HeatingSource;
  /** Base annual flights taken */
  base_flights: number;
  /** Base recycling habit status */
  base_recycles: boolean;
  /** Calculated total annual base carbon emissions in kg CO2e */
  base_annual_emissions: number;
}

/**
 * Carbon emission breakdown by category in kg CO2e.
 */
export interface EmissionBreakdown {
  /** Carbon footprint from transport */
  commute: number;
  /** Carbon footprint from diet */
  diet: number;
  /** Carbon footprint from household energy */
  energy: number;
  /** Combined total carbon footprint */
  total: number;
}

/**
 * Avoided daily carbon emissions compared to baseline averages.
 */
export interface DailySavings {
  /** Avoided transport emissions in kg CO2e */
  commuteSavings: number;
  /** Avoided diet emissions in kg CO2e */
  dietSavings: number;
  /** Avoided household energy emissions in kg CO2e */
  energySavings: number;
  /** Combined total avoided carbon emissions in kg CO2e */
  totalSavings: number;
}

/**
 * Calculates emissions for a commute trip based on distance and mode.
 * 
 * @param distanceKm Distance traveled in kilometers
 * @param mode Commute transportation mode
 * @returns Total commute emissions in kg CO2e (rounded to 3 decimals)
 */
export function calculateCommuteEmissions(distanceKm: number, mode: CommuteMode): number {
  if (distanceKm < 0) return 0;
  const factor = EMISSION_FACTORS.commute[mode] ?? 0;
  return Number((distanceKm * factor).toFixed(3));
}

/**
 * Calculates emissions for a diet selection per day.
 * 
 * @param dietType Diet type selection
 * @returns Daily diet emissions in kg CO2e
 */
export function calculateDietEmissions(dietType: DietType): number {
  return EMISSION_FACTORS.diet[dietType] ?? 0;
}

/**
 * Calculates emissions for home energy usage (electricity and heating).
 * 
 * @param electricityKwh Electricity consumed in kWh
 * @param heatingSource Heating fuel type selection
 * @param heatingKwh Space heating consumed in kWh equivalent
 * @returns Combined energy emissions in kg CO2e (rounded to 3 decimals)
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
 * Calculates the estimated annual base footprint based on onboarding questionnaire answers.
 * 
 * @param dietType Onboarding baseline diet selection
 * @param annualTravelKm Onboarding baseline annual travel in km
 * @param travelMode Onboarding baseline transport mode selection
 * @param monthlyElectricityKwh Onboarding baseline monthly electricity in kWh
 * @param heatingSource Onboarding baseline heating fuel source
 * @param annualFlights Onboarding baseline annual flights count
 * @param recycles Onboarding baseline waste recycling sorted status
 * @returns Total estimated annual base emissions in kg CO2e (rounded to 2 decimals)
 */
export function calculateBaseAnnualEmissions(
  dietType: DietType,
  annualTravelKm: number,
  travelMode: CommuteMode,
  monthlyElectricityKwh: number,
  heatingSource: HeatingSource,
  annualFlights: number,
  recycles: boolean
): number {
  // 1. Annual diet emissions
  const annualDiet = calculateDietEmissions(dietType) * BASELINES.daysInYear;
  
  // 2. Annual commute emissions
  const annualCommute = calculateCommuteEmissions(annualTravelKm, travelMode);
  
  // 3. Annual home energy (12 months)
  const monthlyElectricityEmissions = Math.max(0, monthlyElectricityKwh) * EMISSION_FACTORS.energy.electricity;
  const estimatedHeatingKwhMonthly = heatingSource === 'none' ? 0 : BASELINES.heatingKwhAssumption;
  const heatingFactor = EMISSION_FACTORS.energy.heating[heatingSource] ?? 0;
  const monthlyHeatingEmissions = estimatedHeatingKwhMonthly * heatingFactor;
  const annualEnergy = (monthlyElectricityEmissions + monthlyHeatingEmissions) * 12;
  
  // 4. Flights emissions
  const flightsEmissions = annualFlights * BASELINES.kgPerFlight;
  
  // 5. Recycling waste management savings
  const recyclingSavings = recycles ? BASELINES.recyclingSavings : 0;
  
  const total = annualDiet + annualCommute + annualEnergy + flightsEmissions - recyclingSavings;
  return Number(Math.max(0, total).toFixed(2));
}

/**
 * Calculates savings of today's log entries compared to the user's daily baseline.
 * 
 * @param log Daily activity log input
 * @param baseProfile User profile containing baseline configs
 * @returns Dynamic daily savings breakdown compared to baselines
 */
export function calculateDailySavings(
  log: DailyLogInput,
  baseProfile: UserProfile
): DailySavings {
  // Convert annual travel baseline to daily average
  const dailyBaseTravelKm = baseProfile.base_travel_km / BASELINES.daysInYear;
  const dailyBaseCommuteEmissions = calculateCommuteEmissions(dailyBaseTravelKm, baseProfile.base_travel_mode);
  
  // Convert monthly energy baseline to daily average
  const dailyBaseElectricityKwh = baseProfile.base_home_energy_kwh / BASELINES.daysInMonth;
  const dailyBaseHeatingKwh = baseProfile.base_heating_source === 'none' ? 0 : (BASELINES.heatingKwhAssumption / BASELINES.daysInMonth);
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
