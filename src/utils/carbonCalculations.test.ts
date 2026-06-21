import { describe, it, expect } from 'vitest';
import {
  calculateCommuteEmissions,
  calculateDietEmissions,
  calculateEnergyEmissions,
  calculateBaseAnnualEmissions,
  calculateDailySavings
} from './carbonCalculations';
import type { UserProfile, DailyLogInput } from './carbonCalculations';

describe('Carbon Calculation Formulas', () => {
  
  describe('Commute Emissions', () => {
    it('should correctly calculate emissions for petrol vs EV vehicle travel', () => {
      const distance = 10; // 10 km
      
      const petrolEmissions = calculateCommuteEmissions(distance, 'petrol_car');
      const evEmissions = calculateCommuteEmissions(distance, 'ev_car');
      
      // Expected math:
      // Petrol: 10 km * 0.170 kg/km = 1.700 kg CO2e
      // EV: 10 km * 0.050 kg/km = 0.500 kg CO2e
      // Difference: 1.200 kg CO2e
      expect(petrolEmissions).toBe(1.700);
      expect(evEmissions).toBe(0.500);
      expect(Number((petrolEmissions - evEmissions).toFixed(3))).toBe(1.200);
    });

    it('should return 0 emissions for zero distance', () => {
      expect(calculateCommuteEmissions(0, 'petrol_car')).toBe(0);
      expect(calculateCommuteEmissions(0, 'walking')).toBe(0);
    });

    it('should return 0 emissions for negative distance inputs', () => {
      expect(calculateCommuteEmissions(-15, 'diesel_car')).toBe(0);
    });

    it('should calculate correct emissions for active travel (bike, walk)', () => {
      expect(calculateCommuteEmissions(100, 'bicycle')).toBe(0);
      expect(calculateCommuteEmissions(50, 'walking')).toBe(0);
    });

    it('should calculate correct emissions for transit modes', () => {
      // 20 km bus: 20 * 0.090 = 1.8 kg CO2e
      expect(calculateCommuteEmissions(20, 'bus')).toBe(1.8);
      // 50 km train: 50 * 0.035 = 1.75 kg CO2e
      expect(calculateCommuteEmissions(50, 'train')).toBe(1.75);
    });
  });

  describe('Diet Emissions', () => {
    it('should return correct daily standard emissions for each diet type', () => {
      expect(calculateDietEmissions('vegan')).toBe(1.5);
      expect(calculateDietEmissions('vegetarian')).toBe(2.0);
      expect(calculateDietEmissions('omnivore')).toBe(3.5);
      expect(calculateDietEmissions('beef_heavy')).toBe(6.0);
    });
  });

  describe('Home Energy Emissions', () => {
    it('should calculate electric and gas heating emissions correctly', () => {
      // 100 kWh electricity: 100 * 0.350 = 35.0 kg
      // 50 kWh gas heating: 50 * 0.200 = 10.0 kg
      // Total: 45.0 kg
      const emissions = calculateEnergyEmissions(100, 'gas', 50);
      expect(emissions).toBe(45.0);
    });

    it('should calculate electric heating source correctly', () => {
      // 100 kWh electricity: 100 * 0.350 = 35.0 kg
      // 50 kWh electric heating: 50 * 0.350 = 17.5 kg
      // Total: 52.5 kg
      const emissions = calculateEnergyEmissions(100, 'electric', 50);
      expect(emissions).toBe(52.5);
    });

    it('should handle zero emissions or none heating source', () => {
      const emissions = calculateEnergyEmissions(0, 'none', 100);
      expect(emissions).toBe(0);
    });
  });

  describe('Base Onboarding Estimation', () => {
    it('should estimate base annual emissions correctly with zero flights and no recycling', () => {
      // Diet: vegetarian (2.0/day * 365 = 730)
      // Travel: 12000 km petrol (12000 * 0.170 = 2040)
      // Electricity: 300 kWh/month (300 * 0.350 = 105)
      // Heating: gas (200 kWh/month assumed * 0.200 = 40)
      // Energy Annual: (105 + 40) * 12 = 1740
      // Expected Total: 730 + 2040 + 1740 = 4510.00 kg
      const annualEmissions = calculateBaseAnnualEmissions(
        'vegetarian',
        12000,
        'petrol_car',
        300,
        'gas',
        0,
        false
      );
      expect(annualEmissions).toBe(4510.00);
    });

    it('should estimate base annual emissions including flights and recycling', () => {
      // Diet: vegetarian (2.0/day * 365 = 730)
      // Travel: 12000 km petrol (12000 * 0.170 = 2040)
      // Electricity: 300 kWh/month (300 * 0.350 = 105)
      // Heating: gas (200 kWh/month assumed * 0.200 = 40)
      // Energy Annual: (105 + 40) * 12 = 1740
      // Flights: 2 flights * 500 = 1000
      // Recycles: true = -250
      // Expected Total: 730 + 2040 + 1740 + 1000 - 250 = 5260.00 kg
      const annualEmissions = calculateBaseAnnualEmissions(
        'vegetarian',
        12000,
        'petrol_car',
        300,
        'gas',
        2,
        true
      );
      expect(annualEmissions).toBe(5260.00);
    });
  });

  describe('Daily Carbon Savings', () => {
    it('should calculate carbon saved when today\'s activities are below base average', () => {
      const mockProfile: UserProfile = {
        onboarding_completed: true,
        base_diet: 'omnivore', // 3.5 kg/day
        base_travel_mode: 'petrol_car',
        base_travel_km: 14600, // 40 km/day -> 40 * 0.170 = 6.8 kg/day
        base_home_energy_kwh: 300, // 10 kWh/day -> 10 * 0.350 = 3.5 kg/day
        base_heating_source: 'none',
        base_flights: 0,
        base_recycles: true,
        base_annual_emissions: 5037.00
      };

      // Daily baseline total = 3.5 + 6.8 + 3.5 = 13.8 kg/day
      
      const logToday: DailyLogInput = {
        commute_mode: 'ev_car',
        commute_distance: 20, // 20 * 0.050 = 1.0 kg (Baseline was 6.8, saving 5.8 kg)
        diet_type: 'vegan', // 1.5 kg (Baseline was 3.5, saving 2.0 kg)
        energy_kwh: 5, // 5 * 0.35 = 1.75 kg (Baseline was 3.5, saving 1.75 kg)
        heating_source: 'none',
        heating_kwh: 0
      };

      // Today total emissions = 1.0 + 1.5 + 1.75 = 4.25 kg
      // Savings = 13.8 - 4.25 = 9.55 kg
      
      const savings = calculateDailySavings(logToday, mockProfile);
      
      expect(savings.commuteSavings).toBe(5.800); // 6.8 - 1.0
      expect(savings.dietSavings).toBe(2.000);    // 3.5 - 1.5
      expect(savings.energySavings).toBe(1.750);  // 3.5 - 1.75
      expect(savings.totalSavings).toBe(9.550);
    });
  });

});
