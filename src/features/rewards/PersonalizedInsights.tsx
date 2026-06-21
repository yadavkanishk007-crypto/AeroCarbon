import React, { useMemo } from 'react';
import { Card } from '../../components/Card';
import { Sparkles, TrendingDown, ArrowUp, Lightbulb } from 'lucide-react';
import type { CarbonLog } from '../../__mocks__/userFootprintMock';
import type { UserProfile } from '../../utils/carbonCalculations';
import { generatePersonalizedInsights } from '../../utils/insightGenerator';

interface PersonalizedInsightsProps {
  /** Historical list of logged daily activities */
  logs: CarbonLog[];
  /** User profile baseline settings */
  profile: UserProfile;
  /** Cumulative carbon saved by user vs baselines */
  totalSavings: number;
}

/**
 * PersonalizedInsights Component
 * Renders dynamically generated AI reduction tips and carbon savings metrics.
 */
export const PersonalizedInsights: React.FC<PersonalizedInsightsProps> = ({
  logs,
  profile,
  totalSavings
}) => {
  // Call the external modularized logic utility
  const generatedInsights = useMemo(() => {
    return generatePersonalizedInsights(logs, profile);
  }, [logs, profile]);

  const isSaving = totalSavings >= 0;

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
              {isSaving ? '+' : ''}
              {totalSavings.toFixed(1)} <span className="text-sm font-semibold text-slate-500">kg CO₂e</span>
            </h2>
            <p className="text-xs text-slate-600 font-semibold mt-2">
              {isSaving 
                ? 'Your emission reductions compared to your baseline lifestyle averages.'
                : 'Your current log emissions exceed your onboarding baseline averages.'}
            </p>
          </div>
          <div className={`p-3 rounded-2xl ${isSaving ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            {isSaving ? <TrendingDown className="w-6 h-6" /> : <ArrowUp className="w-6 h-6" />}
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
