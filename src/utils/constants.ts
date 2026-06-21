/**
 * Standardized Carbon Multipliers (kg CO2e per unit of activity)
 * Derived from government carbon statistics (DEFRA, EPA).
 */
export const EMISSION_FACTORS = {
  /**
   * Commute modes: kg CO2e per passenger-kilometer (km)
   */
  commute: {
    petrol_car: 0.170,
    diesel_car: 0.171,
    ev_car: 0.050,
    bus: 0.090,
    train: 0.035,
    bicycle: 0.0,
    walking: 0.0
  },
  /**
   * Diet types: daily average footprint in kg CO2e per day
   */
  diet: {
    vegan: 1.5,
    vegetarian: 2.0,
    omnivore: 3.5,
    beef_heavy: 6.0
  },
  /**
   * Household energy: kg CO2e per kilowatt-hour (kWh) or equivalent
   */
  energy: {
    electricity: 0.350,
    heating: {
      gas: 0.200,
      electric: 0.350,
      none: 0.0
    }
  }
} as const;

/**
 * Standard baseline values for estimations
 */
export const BASELINES = {
  /**
   * Average flight emissions (kg CO2e per flight)
   */
  kgPerFlight: 500,
  /**
   * Average annual recycling savings (kg CO2e)
   */
  recyclingSavings: 250,
  /**
   * Average monthly heating kWh assumption for natural gas or electric heating
   */
  heatingKwhAssumption: 200,
  /**
   * Average days in a year
   */
  daysInYear: 365,
  /**
   * Average days in a month
   */
  daysInMonth: 30
} as const;
