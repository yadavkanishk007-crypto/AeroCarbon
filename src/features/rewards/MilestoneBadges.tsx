import React from 'react';
import { Card } from '../../components/Card';
import type { Badge as BadgeType } from '../../__mocks__/userFootprintMock';
import { Compass, Bus, Leaf, TrendingDown, Zap, Award } from 'lucide-react';

const iconMap = {
  Compass,
  Bus,
  Leaf,
  TrendingDown,
  Zap,
  Award
};

interface MilestoneBadgesProps {
  badges: BadgeType[];
  unlockCount: number;
}

export const MilestoneBadges: React.FC<MilestoneBadgesProps> = ({ badges, unlockCount }) => {
  return (
    <Card className="border-slate-200 bg-white shadow-lg">
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Milestone Badges</h2>
            <p className="text-xs text-slate-500 font-medium">Achievements unlocked via daily habits</p>
          </div>
        </div>
        <span className="text-xs font-bold bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-100">
          {unlockCount} / {badges.length} Unlocked
        </span>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {badges.map(badge => {
          // Dynamic icon lookup via type-safe map
          const IconComponent = iconMap[badge.iconName as keyof typeof iconMap] || Award;
          
          return (
            <div
              key={badge.id}
              className={`p-4 rounded-xl border text-center flex flex-col items-center justify-between transition-all duration-300 relative overflow-hidden ${
                badge.unlocked
                  ? 'border-emerald-200 bg-emerald-50/20 shadow-sm'
                  : 'border-slate-200 bg-slate-50/50 opacity-55'
              }`}
            >
              {/* Unlock Indicator Glow */}
              {badge.unlocked && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full m-2" />
              )}

              {/* Icon Container */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform duration-300 ${
                  badge.unlocked
                    ? 'bg-emerald-100 text-emerald-700 scale-100 hover:scale-105 border border-emerald-200/30'
                    : 'bg-slate-100 text-slate-400 scale-90 border border-slate-200/50'
                }`}
              >
                <IconComponent className="w-6 h-6" />
              </div>

              {/* Text */}
              <div className="space-y-1">
                <h3 className={`text-xs font-black tracking-tight ${badge.unlocked ? 'text-slate-900' : 'text-slate-500'}`}>
                  {badge.name}
                </h3>
                <p className="text-[10px] text-slate-600 font-semibold leading-tight">
                  {badge.description}
                </p>
              </div>

              {/* Unlock Date */}
              {badge.unlocked && badge.unlockedAt && (
                <span className="text-[9px] text-slate-500 font-black block mt-3">
                  Unlocked {new Date(badge.unlockedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
