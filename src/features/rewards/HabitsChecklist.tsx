import React from 'react';
import { Card } from '../../components/Card';
import type { EcoHabit } from '../../__mocks__/userFootprintMock';
import { CheckSquare, Square, Award, Leaf } from 'lucide-react';

interface HabitsChecklistProps {
  habits: EcoHabit[];
  onToggleHabit: (habitId: string) => void;
  pointsScore: number;
  co2SavedScore: number;
}

export const HabitsChecklist: React.FC<HabitsChecklistProps> = ({
  habits,
  onToggleHabit,
  pointsScore,
  co2SavedScore
}) => {
  return (
    <Card className="border-slate-200 bg-white shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg">
            <Leaf className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Daily Eco Habits</h2>
            <p className="text-xs text-slate-500 font-medium">Action items to reduce your baseline footprint</p>
          </div>
        </div>

        {/* Gamified Score Metrics */}
        <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 border border-slate-200 rounded-xl">
          <div className="text-center">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Points</span>
            <span className="text-sm font-black text-emerald-700 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> {pointsScore}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-slate-250" />
          <div className="text-center">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Saved</span>
            <span className="text-sm font-black text-slate-800">{co2SavedScore} kg</span>
          </div>
        </div>
      </div>

      {/* Habit items list */}
      <div className="space-y-2">
        {habits.map(habit => (
          <div
            key={habit.id}
            onClick={() => onToggleHabit(habit.id)}
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all duration-200 ${
              habit.completed
                ? 'border-emerald-250 bg-emerald-50/50 text-slate-900'
                : 'border-slate-200 bg-slate-50/30 hover:bg-slate-50 text-slate-700'
            }`}
            role="checkbox"
            aria-checked={habit.completed}
            aria-label={`Toggle habit: ${habit.title}`}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleHabit(habit.id);
              }
            }}
          >
            <div className="flex items-center gap-3">
              <div className="text-emerald-600 flex-shrink-0">
                {habit.completed ? (
                  <CheckSquare className="w-5 h-5 fill-emerald-100 text-emerald-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400 hover:text-slate-500" />
                )}
              </div>
              <div>
                <span className={`text-sm font-bold ${habit.completed ? 'line-through text-slate-400' : 'text-slate-850'}`}>
                  {habit.title}
                </span>
                <span className="block sm:inline sm:ml-2 text-[10px] uppercase font-black tracking-widest text-slate-400">
                  {habit.category}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200/50">
                +{habit.points} pts
              </span>
              <span className="text-[10px] text-slate-500 font-extrabold hidden sm:inline">
                -{habit.co2Saved} kg CO₂
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
