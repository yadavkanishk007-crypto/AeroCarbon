import { useCarbonData } from './hooks/useCarbonData';
import { OnboardingQuiz } from './features/calculator/OnboardingQuiz';
import { CarbonLogForm } from './features/dashboard/CarbonLogForm';
import { CarbonCharts } from './features/dashboard/CarbonCharts';
import { PersonalizedInsights } from './features/rewards/PersonalizedInsights';
import { HabitsChecklist } from './features/rewards/HabitsChecklist';
import { MilestoneBadges } from './features/rewards/MilestoneBadges';
import { Card } from './components/Card';
import { Button } from './components/Button';
import {
  Leaf,
  RotateCcw,
  Globe,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { useState } from 'react';

function App() {
  const {
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
  } = useCarbonData();

  const [activeDate, setActiveDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Find if today's date has already been logged
  const todayLog = logs.find(log => log.date === activeDate);
  const dailyBaseAverage = profile.base_annual_emissions / 365;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-slate-900">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold tracking-wider uppercase text-emerald-700">Loading Carbon Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans">
      {/* 1. Global Header Navigation */}
      <header className="glass-panel border-x-0 border-t-0 sticky top-0 z-50 px-6 py-4 flex items-center justify-between shadow-sm bg-white">
        <nav className="flex items-center gap-3.5" aria-label="Main Navigation">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
            <Leaf className="w-5 h-5 fill-emerald-600/10" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">
            AeroCarbon
          </span>
        </nav>

        {profile.onboarding_completed && (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 font-semibold">
              <Globe className="w-4 h-4 text-emerald-700" />
              <span>Base Baseline: <strong className="text-slate-800">{(profile.base_annual_emissions / 1000).toFixed(1)} tons / year</strong></span>
            </div>
            <Button
              variant="secondary"
              onClick={resetAllData}
              className="text-xs px-3.5 py-1.5 flex items-center gap-1.5 min-h-[38px]"
              ariaLabel="Reset data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo
            </Button>
          </div>
        )}
      </header>

      {/* 2. Main Landmark Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        
        {/* Onboarding View (Pillar 1: Understand) */}
        {!profile.onboarding_completed ? (
          <section className="py-8 text-center max-w-3xl mx-auto space-y-8" aria-label="Onboarding Section">
            <div className="space-y-4">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 uppercase tracking-widest">
                Understand Your Footprint
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Reduce Emissions with <br/>
                <span className="text-emerald-700 font-black">
                  Interactive Carbon Tracking
                </span>
              </h1>
              <p className="text-base text-slate-600 max-w-xl mx-auto leading-relaxed font-medium">
                Estimate your lifestyle baseline, then track logs and complete habits to unlock achievements.
              </p>
            </div>

            <OnboardingQuiz onComplete={completeOnboarding} />
          </section>
        ) : (
          /* Dashboard View (Pillar 2 & 3: Track & Reduce) */
          <div className="space-y-8">
            
            {/* Summary KPI Stats cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" aria-label="Key Performance Indicators">
              
              {/* Baseline Footprint */}
              <Card className="border-slate-200 bg-white shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Annual Baseline
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  {(profile.base_annual_emissions / 1000).toFixed(2)}{' '}
                  <span className="text-xs font-semibold text-slate-550">tons CO₂e</span>
                </h3>
                <p className="text-[10px] text-emerald-750 mt-2 flex items-center gap-1 font-bold">
                  <span>Estimated base lifestyle</span>
                </p>
              </Card>

              {/* Daily Target Average */}
              <Card className="border-slate-200 bg-white shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Daily Baseline Avg
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  {dailyBaseAverage.toFixed(1)}{' '}
                  <span className="text-xs font-semibold text-slate-550">kg CO₂e</span>
                </h3>
                <p className="text-[10px] text-slate-600 mt-2 font-bold">
                  Average daily carbon budget
                </p>
              </Card>

              {/* Today's Logged Emissions */}
              <Card className="border-slate-200 bg-white shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Today's Emissions ({activeDate})
                </span>
                <h3 className="text-2xl font-black text-slate-900">
                  {todayLog ? (
                    <>
                      {todayLog.total_emissions.toFixed(1)}{' '}
                      <span className="text-xs font-semibold text-slate-550">kg CO₂e</span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-amber-700">Not Logged Yet</span>
                  )}
                </h3>
                <div className="text-[10px] mt-2 flex items-center gap-1">
                  {todayLog ? (
                    todayLog.total_emissions <= dailyBaseAverage ? (
                      <span className="text-emerald-750 font-bold flex items-center gap-0.5">
                        <TrendingDown className="w-3.5 h-3.5" /> Below daily baseline
                      </span>
                    ) : (
                      <span className="text-rose-700 font-bold flex items-center gap-0.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Above daily baseline
                      </span>
                    )
                  ) : (
                    <span className="text-slate-500 font-bold">Input your activities below</span>
                  )}
                </div>
              </Card>

              {/* Accumulative Carbon Saved */}
              <Card className="bg-emerald-50 border-emerald-250 shadow-md">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                  Carbon Avoided
                </span>
                <h3 className="text-2xl font-black text-emerald-800">
                  {totalSavings >= 0 ? '+' : ''}
                  {totalSavings.toFixed(1)}{' '}
                  <span className="text-xs font-semibold text-slate-700">kg CO₂e</span>
                </h3>
                <p className="text-[10px] text-slate-600 mt-2 font-bold">
                  Sum savings vs baseline averages
                </p>
              </Card>
            </section>

            {/* Middle Analytics & Log entry section */}
            <section className="space-y-6" aria-label="Carbon Log Tracking and Charts">
              {/* Main Charts Widget (Track Pillar) */}
              <CarbonCharts
                weeklyTrends={weeklyTrends}
                monthlyTrends={monthlyTrends}
                breakdown={emissionsBreakdown}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daily Activity Logger Form */}
                <div className="lg:col-span-1">
                  <CarbonLogForm
                    onSubmitLog={async (input, date) => {
                      setActiveDate(date);
                      await addDailyLog(input, date);
                    }}
                    defaultDate={activeDate}
                  />
                </div>

                {/* Gamified Checklist & Insights */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Dynamic Insights (Reduce Pillar) */}
                  <PersonalizedInsights
                    logs={logs}
                    profile={profile}
                    totalSavings={totalSavings}
                  />

                  {/* Habit checklist (Reduce Pillar) */}
                  <HabitsChecklist
                    habits={habits}
                    onToggleHabit={toggleHabit}
                    pointsScore={habitsScore.points}
                    co2SavedScore={habitsScore.co2Saved}
                  />
                </div>
              </div>
            </section>

            {/* Achievements Section */}
            <section aria-label="Gamified Milestones & Badges">
              <MilestoneBadges badges={badges} unlockCount={unlockedBadgesCount} />
            </section>

          </div>
        )}
      </main>

      {/* 3. Footer */}
      <footer className="mt-auto py-8 px-6 border-t border-slate-200 bg-white text-center text-xs text-slate-500 font-semibold shadow-inner">
        <p>© 2026 AeroCarbon. Owned and developed by Kanishk Yadav. All rights reserved.</p>
        <p className="mt-1">Designed for WCAG AA compliance and strict type safety. Powered by React, TypeScript, Tailwind CSS, Recharts, and Supabase (PostgreSQL).</p>
      </footer>
    </div>
  );
}

export default App;
