import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type {
  UserProfile,
  CommuteMode,
  DietType,
  HeatingSource,
  DailyLogInput,
  EmissionBreakdown
} from '../utils/carbonCalculations';
import {
  calculateCommuteEmissions,
  calculateDietEmissions,
  calculateEnergyEmissions,
  calculateBaseAnnualEmissions
} from '../utils/carbonCalculations';
import type {
  CarbonLog,
  Badge,
  EcoHabit
} from '../__mocks__/userFootprintMock';
import {
  generateMockLogs,
  mockBadges,
  mockEcoHabits
} from '../__mocks__/userFootprintMock';
import { BASELINES } from '../utils/constants';

/**
 * Loads a user profile from Supabase.
 * @param userId Unique user authentication ID
 */
async function fetchDbProfile(userId: string): Promise<UserProfile | null> {
  const { data: dbProfile, error } = await supabase!
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !dbProfile) return null;

  return {
    onboarding_completed: dbProfile.onboarding_completed,
    base_diet: dbProfile.base_diet as DietType,
    base_travel_mode: dbProfile.base_travel_mode as CommuteMode,
    base_travel_km: Number(dbProfile.base_travel_km),
    base_home_energy_kwh: Number(dbProfile.base_home_energy_kwh),
    base_heating_source: dbProfile.base_heating_source as HeatingSource,
    base_flights: Number(dbProfile.base_flights ?? 0),
    base_recycles: Boolean(dbProfile.base_recycles ?? true),
    base_annual_emissions: Number(dbProfile.base_annual_emissions)
  };
}

/**
 * Loads user carbon logs from Supabase.
 * @param userId Unique user authentication ID
 */
async function fetchDbLogs(userId: string): Promise<CarbonLog[] | null> {
  const { data: dbLogs, error } = await supabase!
    .from('carbon_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (error || !dbLogs || dbLogs.length === 0) return null;

  return dbLogs.map(item => ({
    id: item.id,
    user_id: item.user_id,
    date: item.date,
    commute_mode: item.commute_mode as CommuteMode,
    commute_distance: Number(item.commute_distance),
    commute_emissions: Number(item.commute_emissions),
    diet_type: item.diet_type as DietType,
    diet_emissions: Number(item.diet_emissions),
    energy_kwh: Number(item.energy_kwh),
    heating_source: item.heating_source as HeatingSource,
    heating_kwh: Number(item.heating_kwh ?? 0),
    energy_emissions: Number(item.energy_emissions),
    total_emissions: Number(item.total_emissions)
  }));
}

/**
 * Loads user unlocked badges from Supabase.
 * @param userId Unique user authentication ID
 */
async function fetchDbBadges(userId: string): Promise<{ badge_id: string; awarded_at: string }[] | null> {
  const { data: dbBadges, error } = await supabase!
    .from('user_badges')
    .select('badge_id, awarded_at')
    .eq('user_id', userId);

  if (error || !dbBadges) return null;
  return dbBadges;
}

/**
 * Checks conditions to unlock the Eco Commuter achievement.
 * @param allLogs Combined logs list
 */
function checkEcoCommuter(allLogs: CarbonLog[]): boolean {
  const ecoCommutesCount = allLogs.filter(log =>
    ['ev_car', 'bus', 'train', 'bicycle', 'walking'].includes(log.commute_mode) &&
    (log.commute_distance > 0 || ['bicycle', 'walking'].includes(log.commute_mode))
  ).length;
  return ecoCommutesCount >= 3;
}

/**
 * Checks conditions to unlock the Green Plate achievement.
 * @param allLogs Combined logs list
 */
function checkGreenPlate(allLogs: CarbonLog[]): boolean {
  let vegetarianStreak = 0;
  for (let i = allLogs.length - 1; i >= 0; i--) {
    if (['vegan', 'vegetarian'].includes(allLogs[i].diet_type)) {
      vegetarianStreak++;
      if (vegetarianStreak >= 3) return true;
    } else {
      vegetarianStreak = 0; // broken streak
    }
  }
  return false;
}

/**
 * Checks conditions to unlock the Carbon Cutter achievement.
 * @param latestLog Latest added log entry
 * @param dailyBaseAverage Daily baseline target average
 */
function checkCarbonCutter(latestLog: CarbonLog, dailyBaseAverage: number): boolean {
  return dailyBaseAverage > 0 && latestLog.total_emissions <= dailyBaseAverage * 0.7;
}

/**
 * Checks conditions to unlock the Streak Master achievement.
 * @param allLogs Combined logs list
 */
function checkStreakMaster(allLogs: CarbonLog[]): boolean {
  if (allLogs.length < 5) return false;
  let consecutiveDays = 1;
  for (let i = allLogs.length - 1; i > 0; i--) {
    const d1 = new Date(allLogs[i].date);
    const d2 = new Date(allLogs[i - 1].date);
    const diffTime = Math.abs(d1.getTime() - d2.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      consecutiveDays++;
      if (consecutiveDays >= 5) return true;
    } else if (diffDays > 1) {
      consecutiveDays = 1; // reset streak
    }
  }
  return false;
}

/**
 * Custom React Hook to manage state, synchronization, and analytics of carbon tracking metrics.
 * Supports LocalStorage caching with transparent Supabase database syncing.
 */
export function useCarbonData() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const local = localStorage.getItem('carbon_tracker_profile');
    if (local) return JSON.parse(local);
    return {
      onboarding_completed: false,
      base_diet: 'omnivore',
      base_travel_mode: 'petrol_car',
      base_travel_km: 0,
      base_home_energy_kwh: 0,
      base_heating_source: 'none',
      base_flights: 0,
      base_recycles: true,
      base_annual_emissions: 0
    };
  });

  const [logs, setLogs] = useState<CarbonLog[]>(() => {
    const local = localStorage.getItem('carbon_tracker_logs');
    if (local) return JSON.parse(local);
    return generateMockLogs();
  });

  const [badges, setBadges] = useState<Badge[]>(() => {
    const local = localStorage.getItem('carbon_tracker_badges');
    if (local) return JSON.parse(local);
    return mockBadges;
  });

  const [habits, setHabits] = useState<EcoHabit[]>(() => {
    const local = localStorage.getItem('carbon_tracker_habits');
    if (local) return JSON.parse(local);
    return mockEcoHabits;
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Check for Supabase session and load data if present
  useEffect(() => {
    async function loadSupabaseSession() {
      if (!isSupabaseConfigured || !supabase) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserId(session.user.id);
          setLoading(true);
          
          const dbProfile = await fetchDbProfile(session.user.id);
          if (dbProfile) setProfile(dbProfile);

          const dbLogs = await fetchDbLogs(session.user.id);
          if (dbLogs) setLogs(dbLogs);

          const dbBadges = await fetchDbBadges(session.user.id);
          if (dbBadges) {
            const badgeIds = dbBadges.map(b => b.badge_id);
            setBadges(prev => prev.map(badge => ({
              ...badge,
              unlocked: badgeIds.includes(badge.id),
              unlockedAt: dbBadges.find(b => b.badge_id === badge.id)?.awarded_at
            })));
          }
        }
      } catch (err) {
        void err;
      } finally {
        setLoading(false);
      }
    }

    loadSupabaseSession();
  }, []);

  // Save changes to LocalStorage when states modify
  useEffect(() => {
    localStorage.setItem('carbon_tracker_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('carbon_tracker_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('carbon_tracker_badges', JSON.stringify(badges));
  }, [badges]);

  useEffect(() => {
    localStorage.setItem('carbon_tracker_habits', JSON.stringify(habits));
  }, [habits]);

  /**
   * Unlock a specific badge.
   */
  const unlockBadge = useCallback(async (badgeId: string) => {
    let alreadyUnlocked = false;
    setBadges(prev =>
      prev.map(badge => {
        if (badge.id === badgeId) {
          if (badge.unlocked) alreadyUnlocked = true;
          return { ...badge, unlocked: true, unlockedAt: new Date().toISOString() };
        }
        return badge;
      })
    );

    if (!alreadyUnlocked && userId && isSupabaseConfigured && supabase) {
      await supabase.from('user_badges').insert({
        user_id: userId,
        badge_id: badgeId,
        awarded_at: new Date().toISOString()
      });
    }
  }, [userId]);

  /**
   * Check conditions to award achievement badges.
   */
  const checkBadgesLogic = useCallback((allLogs: CarbonLog[], latestLog: CarbonLog) => {
    if (checkEcoCommuter(allLogs)) unlockBadge('eco_commuter');
    if (checkGreenPlate(allLogs)) unlockBadge('green_plate');

    const dailyBaseAverage = profile.base_annual_emissions / BASELINES.daysInYear;
    if (checkCarbonCutter(latestLog, dailyBaseAverage)) unlockBadge('carbon_cutter');
    if (checkStreakMaster(allLogs)) unlockBadge('streak_master');
  }, [profile.base_annual_emissions, unlockBadge]);

  /**
   * Save onboarding answers, estimate annual base footprint.
   */
  const completeOnboarding = useCallback(async (
    dietType: DietType,
    travelKm: number,
    travelMode: CommuteMode,
    monthlyKwh: number,
    heatSource: HeatingSource,
    flights: number,
    recycles: boolean
  ) => {
    const annualEst = calculateBaseAnnualEmissions(
      dietType,
      travelKm,
      travelMode,
      monthlyKwh,
      heatSource,
      flights,
      recycles
    );

    const updatedProfile: UserProfile = {
      onboarding_completed: true,
      base_diet: dietType,
      base_travel_mode: travelMode,
      base_travel_km: travelKm,
      base_home_energy_kwh: monthlyKwh,
      base_heating_source: heatSource,
      base_flights: flights,
      base_recycles: recycles,
      base_annual_emissions: annualEst
    };

    setProfile(updatedProfile);
    unlockBadge('first_step');

    if (userId && isSupabaseConfigured && supabase) {
      await supabase.from('profiles').upsert({
        id: userId,
        onboarding_completed: true,
        base_diet: dietType,
        base_travel_km: travelKm,
        base_travel_mode: travelMode,
        base_home_energy_kwh: monthlyKwh,
        base_heating_source: heatSource,
        base_flights: flights,
        base_recycles: recycles,
        base_annual_emissions: annualEst,
        updated_at: new Date().toISOString()
      });
    }
  }, [userId, unlockBadge]);

  /**
   * Add a daily activity log entry.
   */
  const addDailyLog = useCallback(async (input: DailyLogInput, logDate: string) => {
    const commuteEmissions = calculateCommuteEmissions(input.commute_distance, input.commute_mode);
    const dietEmissions = calculateDietEmissions(input.diet_type);
    const energyEmissions = calculateEnergyEmissions(input.energy_kwh, input.heating_source, input.heating_kwh);
    const totalEmissions = Number((commuteEmissions + dietEmissions + energyEmissions).toFixed(3));

    const newLog: CarbonLog = {
      id: `local-log-${Date.now()}`,
      user_id: userId || 'local-user',
      date: logDate,
      commute_mode: input.commute_mode,
      commute_distance: input.commute_distance,
      commute_emissions: commuteEmissions,
      diet_type: input.diet_type,
      diet_emissions: dietEmissions,
      energy_kwh: input.energy_kwh,
      heating_source: input.heating_source,
      heating_kwh: input.heating_kwh,
      energy_emissions: energyEmissions,
      total_emissions: totalEmissions
    };

    setLogs(prev => {
      const filtered = prev.filter(log => log.date !== logDate);
      const updated = [...filtered, newLog].sort((a, b) => a.date.localeCompare(b.date));
      setTimeout(() => checkBadgesLogic(updated, newLog), 50);
      return updated;
    });

    if (userId && isSupabaseConfigured && supabase) {
      await supabase.from('carbon_logs').upsert({
        user_id: userId,
        date: logDate,
        commute_mode: input.commute_mode,
        commute_distance: input.commute_distance,
        commute_emissions: commuteEmissions,
        diet_type: input.diet_type,
        diet_emissions: dietEmissions,
        energy_kwh: input.energy_kwh,
        heating_source: input.heating_source,
        heating_kwh: input.heating_kwh,
        energy_emissions: energyEmissions,
        total_emissions: totalEmissions
      });
    }
  }, [userId, checkBadgesLogic]);

  /**
   * Toggle completion of daily eco-habits.
   */
  const toggleHabit = useCallback((habitId: string) => {
    setHabits(prev =>
      prev.map(habit =>
        habit.id === habitId ? { ...habit, completed: !habit.completed } : habit
      )
    );
  }, []);

  /**
   * Reset all data (for testing / demo purposing).
   */
  const resetAllData = useCallback(() => {
    localStorage.removeItem('carbon_tracker_profile');
    localStorage.removeItem('carbon_tracker_logs');
    localStorage.removeItem('carbon_tracker_badges');
    localStorage.removeItem('carbon_tracker_habits');
    
    setProfile({
      onboarding_completed: false,
      base_diet: 'omnivore',
      base_travel_mode: 'petrol_car',
      base_travel_km: 0,
      base_home_energy_kwh: 0,
      base_heating_source: 'none',
      base_flights: 0,
      base_recycles: true,
      base_annual_emissions: 0
    });
    setLogs([]);
    setBadges(mockBadges.map(b => ({ ...b, unlocked: b.id === 'first_step' })));
    setHabits(mockEcoHabits.map(h => ({ ...h, completed: false })));
  }, []);

  // --- MEMOIZED CALCULATIONS FOR RENDERING ---
  
  // Total aggregate breakdown
  const emissionsBreakdown = useMemo<EmissionBreakdown>(() => {
    let commute = 0;
    let diet = 0;
    let energy = 0;

    for (const log of logs) {
      commute += log.commute_emissions;
      diet += log.diet_emissions;
      energy += log.energy_emissions;
    }

    return {
      commute: Number(commute.toFixed(1)),
      diet: Number(diet.toFixed(1)),
      energy: Number(energy.toFixed(1)),
      total: Number((commute + diet + energy).toFixed(1))
    };
  }, [logs]);

  // Aggregate savings
  const totalSavings = useMemo<number>(() => {
    let savings = 0;
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
    const dailyBaseline = dailyBaseCommuteEmissions + dailyBaseDietEmissions + dailyBaseEnergyEmissions;

    for (const log of logs) {
      savings += (dailyBaseline - log.total_emissions);
    }
    
    return Number(savings.toFixed(1));
  }, [logs, profile]);

  // Generate Recharts-friendly last-7-logs array
  const weeklyTrends = useMemo(() => {
    const last7 = logs.slice(-7);
    return last7.map(log => ({
      date: new Date(log.date).toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' }),
      Commute: Number(log.commute_emissions.toFixed(1)),
      Diet: Number(log.diet_emissions.toFixed(1)),
      Energy: Number(log.energy_emissions.toFixed(1)),
      Total: Number(log.total_emissions.toFixed(1))
    }));
  }, [logs]);

  // Generate monthly grouped trend data
  const monthlyTrends = useMemo(() => {
    const chunks = [];
    const chunkSize = 5;
    for (let i = 0; i < logs.length; i += chunkSize) {
      const chunk = logs.slice(i, i + chunkSize);
      const totalCommute = chunk.reduce((sum, l) => sum + l.commute_emissions, 0);
      const totalDiet = chunk.reduce((sum, l) => sum + l.diet_emissions, 0);
      const totalEnergy = chunk.reduce((sum, l) => sum + l.energy_emissions, 0);
      
      const lastDate = chunk[chunk.length - 1]?.date || '';
      const label = lastDate
        ? new Date(lastDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : `Period ${Math.floor(i / chunkSize) + 1}`;
        
      chunks.push({
        date: label,
        Commute: Number((totalCommute / chunk.length).toFixed(1)),
        Diet: Number((totalDiet / chunk.length).toFixed(1)),
        Energy: Number((totalEnergy / chunk.length).toFixed(1)),
        Total: Number(((totalCommute + totalDiet + totalEnergy) / chunk.length).toFixed(1))
      });
    }
    return chunks;
  }, [logs]);

  // Badge unlock count
  const unlockedBadgesCount = useMemo(() => {
    return badges.filter(b => b.unlocked).length;
  }, [badges]);

  // Habits progress points and co2 saved
  const habitsScore = useMemo(() => {
    let points = 0;
    let co2Saved = 0;
    for (const habit of habits) {
      if (habit.completed) {
        points += habit.points;
        co2Saved += habit.co2Saved;
      }
    }
    return {
      points,
      co2Saved: Number(co2Saved.toFixed(1))
    };
  }, [habits]);

  return {
    profile,
    logs,
    badges,
    habits,
    loading,
    emissionsBreakdown,
    totalSavings,
    weeklyTrends,
    monthlyTrends,
    unlockedBadgesCount,
    habitsScore,
    completeOnboarding,
    addDailyLog,
    toggleHabit,
    resetAllData
  };
}
