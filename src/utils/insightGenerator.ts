import type { UserProfile } from './carbonCalculations';
import type { CarbonLog } from '../__mocks__/userFootprintMock';
import {
  calculateCommuteEmissions,
  calculateDietEmissions,
  calculateEnergyEmissions
} from './carbonCalculations';
import { BASELINES } from './constants';

/**
 * Returns a personalized transport emissions insight.
 */
function getCommuteInsight(
  latestLog: CarbonLog,
  dailyBaseCommuteEmissions: number,
  dailyBaseTravelKm: number
): string | null {
  const todayCommute = calculateCommuteEmissions(latestLog.commute_distance, latestLog.commute_mode);
  const diff = dailyBaseCommuteEmissions - todayCommute;

  if (diff > 0.5) {
    const modeLabel = latestLog.commute_mode === 'walking' ? 'walking' :
                      latestLog.commute_mode === 'bicycle' ? 'biking' :
                      latestLog.commute_mode === 'bus' ? 'taking the bus' :
                      latestLog.commute_mode === 'train' ? 'taking the train' :
                      latestLog.commute_mode === 'ev_car' ? 'driving an EV' : 'commuting green';
    return `Switching to ${modeLabel} today saved ${diff.toFixed(1)}kg CO₂ compared to your baseline!`;
  }
  
  if (latestLog.commute_distance > dailyBaseTravelKm * 1.5 && ['petrol_car', 'diesel_car'].includes(latestLog.commute_mode)) {
    return 'Your petrol commute today was higher than average. Try carpooling or taking transit to save carbon.';
  }

  return null;
}

/**
 * Returns a personalized diet emissions insight.
 */
function getDietInsight(latestLog: CarbonLog, dailyBaseDietEmissions: number): string | null {
  const todayDiet = calculateDietEmissions(latestLog.diet_type);
  const diff = dailyBaseDietEmissions - todayDiet;

  if (diff > 0.5) {
    return `Eating a plant-focused (${latestLog.diet_type}) meal today saved ${diff.toFixed(1)}kg CO₂!`;
  }
  
  if (latestLog.diet_type === 'beef_heavy') {
    return 'Beef has a high carbon footprint. Swapping a beef meal for chicken or beans cuts food emissions by 75%.';
  }

  return null;
}

/**
 * Returns a personalized home energy emissions insight.
 */
function getEnergyInsight(latestLog: CarbonLog, dailyBaseEnergyEmissions: number): string | null {
  const todayEnergy = calculateEnergyEmissions(latestLog.energy_kwh, latestLog.heating_source, latestLog.heating_kwh);
  const diff = dailyBaseEnergyEmissions - todayEnergy;

  if (diff > 0.5) {
    return `Your efficient energy conservation today saved ${diff.toFixed(1)}kg CO₂ at home.`;
  }

  return null;
}

/**
 * Generates an array of carbon-reduction suggestions based on a user's logs and baseline configuration.
 * 
 * @param logs Historical logged activity entries
 * @param profile User profile baseline details
 * @returns Array of personalized suggestions strings
 */
export function generatePersonalizedInsights(
  logs: CarbonLog[],
  profile: UserProfile
): string[] {
  if (logs.length === 0) {
    return [
      'Complete your onboarding quiz and log today\'s activities to see customized carbon reduction suggestions.',
      'Commuting by train or bus generates up to 80% less carbon emissions per kilometer compared to a standard petrol car.',
      'Adding one plant-based meal to your diet daily saves over 500 kg of carbon emissions annually.'
    ];
  }

  const latestLog = logs[logs.length - 1];
  const insightsList: string[] = [];

  // 1. Calculate Daily baselines
  const dailyBaseTravelKm = profile.base_travel_km / BASELINES.daysInYear;
  const dailyBaseCommuteEmissions = calculateCommuteEmissions(dailyBaseTravelKm, profile.base_travel_mode);
  
  const dailyBaseElectricityKwh = profile.base_home_energy_kwh / BASELINES.daysInMonth;
  const dailyBaseHeatingKwh = profile.base_heating_source === 'none' ? 0 : (BASELINES.heatingKwhAssumption / BASELINES.daysInMonth);
  const dailyBaseEnergyEmissions = calculateEnergyEmissions(
    dailyBaseElectricityKwh,
    profile.base_heating_source,
    dailyBaseHeatingKwh
  );
  const dailyBaseDietEmissions = calculateDietEmissions(profile.base_diet);

  // 2. Fetch specific insights
  const commuteInsight = getCommuteInsight(latestLog, dailyBaseCommuteEmissions, dailyBaseTravelKm);
  if (commuteInsight) insightsList.push(commuteInsight);

  const dietInsight = getDietInsight(latestLog, dailyBaseDietEmissions);
  if (dietInsight) insightsList.push(dietInsight);

  const energyInsight = getEnergyInsight(latestLog, dailyBaseEnergyEmissions);
  if (energyInsight) insightsList.push(energyInsight);

  // 3. Fallback baseline tip injections
  if (insightsList.length < 2) {
    insightsList.push('Consider line drying your clothes! A standard dryer run produces about 1.8kg of CO₂.');
    insightsList.push('Lowering your home thermostat by just 1°C can reduce space heating emissions by 10%.');
  }

  return insightsList;
}
