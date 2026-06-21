import React, { useMemo } from 'react';
import { Card } from '../../components/Card';
import { Sparkles, TrendingDown, ArrowUp, Lightbulb } from 'lucide-react';
import type { CarbonLog } from '../../__mocks__/userFootprintMock';
import type { UserProfile } from '../../utils/carbonCalculations';
import { calculateCommuteEmissions, calculateDietEmissions, calculateEnergyEmissions } from '../../utils/carbonCalculations';

interface PersonalizedInsightsProps {
  logs: CarbonLog[];
  profile: UserProfile;
  totalSavings: number;
}

export const PersonalizedInsights: React.FC<PersonalizedInsightsProps> = ({
  logs,
  profile,
  totalSavings
}) => {
  // Generate smart, dynamic insights based on latest logs
  const generatedInsights = useMemo(() => {
    const insightsList: string[] = [];
    if (logs.length === 0) {
      return [
        'Complete your onboarding quiz and log today\'s activities to see customized carbon reduction suggestions.',
        'Commuting by train or bus generates up to 80% less carbon emissions per kilometer compared to a standard petrol car.',
        'Adding one plant-based meal to your diet daily saves over 500 kg of carbon emissions annually.'
      ];
    }

    const latestLog = logs[logs.length - 1];

    // Commute savings check
    const dailyBaseTravelKm = profile.base_travel_km / 365;
    const dailyBaseCommuteEmissions = calculateCommuteEmissions(dailyBaseTravelKm, profile.base_travel_mode);
    const todayCommuteEmissions = calculateCommuteEmissions(latestLog.commute_distance, latestLog.commute_mode);
    const commuteDiff = dailyBaseCommuteEmissions - todayCommuteEmissions;

    if (commuteDiff > 0.5) {
      const modeLabel = latestLog.commute_mode === 'walking' ? 'walking' :
                        latestLog.commute_mode === 'bicycle' ? 'biking' :
                        latestLog.commute_mode === 'bus' ? 'taking the bus' :
                        latestLog.commute_mode === 'train' ? 'taking the train' :
                        latestLog.commute_mode === 'ev_car' ? 'driving an EV' : 'commuting green';
      insightsList.push(`Switching to ${modeLabel} today saved ${commuteDiff.toFixed(1)}kg CO₂ compared to your baseline!`);
    } else if (latestLog.commute_distance > dailyBaseTravelKm * 1.5 && ['petrol_car', 'diesel_car'].includes(latestLog.commute_mode)) {
      insightsList.push(`Your petrol commute today was higher than average. Try carpooling or taking transit to save carbon.`);
    }

    // Diet savings check
    const dailyBaseDietEmissions = calculateDietEmissions(profile.base_diet);
    const todayDietEmissions = calculateDietEmissions(latestLog.diet_type);
    const dietDiff = dailyBaseDietEmissions - todayDietEmissions;

    if (dietDiff > 0.5) {
      insightsList.push(`Eating a plant-focused (${latestLog.diet_type}) meal today saved ${dietDiff.toFixed(1)}kg CO₂!`);
    } else if (latestLog.diet_type === 'beef_heavy') {
      insightsList.push(`Beef has a high carbon footprint. Swapping a beef meal for chicken or beans cuts food emissions by 75%.`);
    }

    // Energy savings check
    const dailyBaseElectricityKwh = profile.base_home_energy_kwh / 30;
    const dailyBaseHeatingKwh = profile.base_heating_source === 'none' ? 0 : (200 / 30);
    const dailyBaseEnergyEmissions = calculateEnergyEmissions(
      dailyBaseElectricityKwh,
      profile.base_heating_source,
      dailyBaseHeatingKwh
    );
    const todayEnergyEmissions = calculateEnergyEmissions(latestLog.energy_kwh, latestLog.heating_source, latestLog.heating_kwh);
    const energyDiff = dailyBaseEnergyEmissions - todayEnergyEmissions;

    if (energyDiff > 0.5) {
      insightsList.push(`Your efficient energy conservation today saved ${energyDiff.toFixed(1)}kg CO₂ at home.`);
    }

    // Baseline fallback tips if no big changes today
    if (insightsList.length < 2) {
      insightsList.push('Consider line drying your clothes! A standard dryer run produces about 1.8kg of CO₂.');
      insightsList.push('Lowering your home thermostat by just 1°C can reduce space heating emissions by 10%.');
    }

    return insightsList;
  }, [logs, profile]);

  return (
    <div className="space-y-6">
      {/* Carbon Savings Header Widget */}
      <Card className="bg-emerald-50/50 border border-emerald-200/50 shadow-md">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block mb-1">
              Net Impact Score
            </span>
            <h2 className="text-2xl font-black text-slate-900 flex items-baseline gap-1">
              {totalSavings >= 0 ? '+' : ''}
              {totalSavings.toFixed(1)} <span className="text-sm font-semibold text-slate-500">kg CO₂e</span>
            </h2>
            <p className="text-xs text-slate-600 font-semibold mt-2">
              {totalSavings >= 0 
                ? 'Your emission reductions compared to your baseline lifestyle averages.'
                : 'Your current log emissions exceed your onboarding baseline averages.'}
            </p>
          </div>
          <div className={`p-3 rounded-2xl ${totalSavings >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            {totalSavings >= 0 ? <TrendingDown className="w-6 h-6" /> : <ArrowUp className="w-6 h-6" />}
          </div>
        </div>

        {totalSavings > 0 && (
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-800 bg-emerald-100/50 px-3 py-2 rounded-xl border border-emerald-200 w-fit font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>You saved equivalent to {Math.round(totalSavings * 1.2)} hours of tree absorption!</span>
          </div>
        )}
      </Card>

      {/* AI Recommendations */}
      <Card className="border-slate-200 bg-white shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg">
            <Lightbulb className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">AI-Driven Insights</h2>
        </div>

        <div className="space-y-3.5">
          {generatedInsights.map((insight, idx) => (
            <div key={idx} className="flex gap-3 items-start text-sm leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-emerald-700 mt-0.5 text-base font-extrabold">✦</span>
              <p className="text-slate-800 font-semibold">{insight}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
