import React, { useState } from 'react';
import { Card } from '../../components/Card';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, PieChart as PieIcon } from 'lucide-react';
import type { EmissionBreakdown } from '../../utils/carbonCalculations';

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomAreaTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

interface CustomPieTooltipProps {
  active?: boolean;
  payload?: {
    payload: TooltipPayloadItem;
  }[];
  total?: number;
}

interface TrendItem {
  date: string;
  Commute: number;
  Diet: number;
  Energy: number;
  Total: number;
}

interface EmissionTrendsChartProps {
  data: TrendItem[];
  timeRange: 'weekly' | 'monthly';
}

interface CategoryShareChartProps {
  breakdown: EmissionBreakdown;
}

interface CarbonChartsProps {
  /** Weekly historical trend data list */
  weeklyTrends: TrendItem[];
  /** Monthly historical trend data list */
  monthlyTrends: TrendItem[];
  /** Category-wise emissions breakdown */
  breakdown: EmissionBreakdown;
}

/**
 * Custom Tooltip for Recharts Area Chart
 */
const CustomAreaTooltip: React.FC<CustomAreaTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const total = payload.reduce((sum, entry) => sum + entry.value, 0);
  return (
    <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg text-left">
      <p className="text-xs font-bold text-slate-500 mb-1.5">{label}</p>
      {payload.map(item => (
        <p key={item.name} className="text-xs font-semibold" style={{ color: item.color }}>
          {item.name}: <span className="font-bold">{item.value.toFixed(1)} kg CO₂e</span>
        </p>
      ))}
      <p className="text-xs font-extrabold text-slate-800 mt-1.5 pt-1.5 border-t border-slate-100">
        Total: {total.toFixed(1)} kg CO₂e
      </p>
    </div>
  );
};

/**
 * Custom Tooltip for Recharts Pie Chart
 */
const CustomPieTooltip: React.FC<CustomPieTooltipProps> = ({ active, payload, total }) => {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  const totalVal = total || 1;
  const percentage = ((data.value / totalVal) * 100).toFixed(0);
  return (
    <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-lg text-left">
      <p className="text-xs font-extrabold" style={{ color: data.color }}>
        {data.name}
      </p>
      <p className="text-xs text-slate-700 font-bold mt-0.5">
        {data.value.toFixed(1)} kg CO₂e ({percentage}%)
      </p>
    </div>
  );
};

/**
 * Renders the stacked area trend lines chart
 */
const EmissionTrendsChart: React.FC<EmissionTrendsChartProps> = ({ data, timeRange }) => (
  <div
    className="h-72 w-full mt-2"
    role="img"
    aria-label={`Carbon emissions area chart showing daily ${timeRange} trends for commute, diet, and energy.`}
  >
    {data.length === 0 ? (
      <div className="h-full flex items-center justify-center text-slate-500 text-sm font-semibold">
        No historical log logs yet. Add a daily entry below!
      </div>
    ) : (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCommute" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#047857" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#047857" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorDiet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#b45309" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#b45309" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#475569" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#475569" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} dy={10} />
          <YAxis
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            dx={-5}
            label={{ value: 'kg CO₂e', angle: -90, position: 'insideLeft', offset: 10, fill: '#64748b', fontSize: 10 }}
          />
          <Tooltip content={<CustomAreaTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }} />
          <Area type="monotone" dataKey="Commute" stackId="1" stroke="#047857" strokeWidth={2} fillOpacity={1} fill="url(#colorCommute)" />
          <Area type="monotone" dataKey="Diet" stackId="1" stroke="#b45309" strokeWidth={2} fillOpacity={1} fill="url(#colorDiet)" />
          <Area type="monotone" dataKey="Energy" stackId="1" stroke="#475569" strokeWidth={2} fillOpacity={1} fill="url(#colorEnergy)" />
          <Legend iconType="circle" iconSize={8} verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11, color: '#334155', fontWeight: 'bold' }} />
        </AreaChart>
      </ResponsiveContainer>
    )}
  </div>
);

/**
 * Renders the donut pie breakdown chart
 */
const CategoryShareChart: React.FC<CategoryShareChartProps> = ({ breakdown }) => {
  const pieData = [
    { name: 'Commute', value: breakdown.commute, color: '#047857' },
    { name: 'Diet', value: breakdown.diet, color: '#b45309' },
    { name: 'Energy', value: breakdown.energy, color: '#475569' }
  ].filter(item => item.value > 0);

  return (
    <div
      className="h-52 w-full relative flex items-center justify-center"
      role="img"
      aria-label="Donut chart showing emissions proportion by category: commute, diet, and energy."
    >
      {breakdown.total === 0 ? (
        <div className="text-slate-500 text-sm font-semibold">No data to display</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomPieTooltip total={breakdown.total} />} />
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute text-center">
            <span className="block text-2xl font-black text-slate-900">{breakdown.total.toFixed(0)}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-extrabold">Total kg CO₂e</span>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Category Breakdown Legend List
 */
const CategoryLegendList: React.FC<CategoryShareChartProps> = ({ breakdown }) => {
  const pieData = [
    { name: 'Commute', value: breakdown.commute, color: '#047857' },
    { name: 'Diet', value: breakdown.diet, color: '#b45309' },
    { name: 'Energy', value: breakdown.energy, color: '#475569' }
  ].filter(item => item.value > 0);

  if (pieData.length === 0) {
    return <p className="text-center text-xs text-slate-500 font-medium">Log activity items to see carbon source distribution</p>;
  }

  return (
    <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
      {pieData.map(item => {
        const total = breakdown.total || 1;
        const percent = ((item.value / total) * 100).toFixed(0);
        return (
          <div key={item.name} className="flex justify-between items-center text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="font-bold text-slate-700">{item.name}</span>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-slate-900">{item.value.toFixed(1)} kg</span>
              <span className="text-slate-500 ml-1.5 text-[10px] font-bold">({percent}%)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * CarbonCharts Component
 * Displays interactive weekly/monthly trends and carbon category source shares.
 */
export const CarbonCharts: React.FC<CarbonChartsProps> = ({
  weeklyTrends,
  monthlyTrends,
  breakdown
}) => {
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('weekly');
  const chartData = timeRange === 'weekly' ? weeklyTrends : monthlyTrends;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Area Trend Chart */}
      <Card className="lg:col-span-2 border-slate-200 bg-white flex flex-col justify-between shadow-lg">
        <div>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Carbon Footprint Trends</h2>
                <p className="text-xs text-slate-500 font-medium">Track your daily emissions progression</p>
              </div>
            </div>

            <div className="flex bg-slate-100 p-1 border border-slate-200 rounded-xl max-w-fit">
              <button
                type="button"
                onClick={() => setTimeRange('weekly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer min-h-[38px] ${
                  timeRange === 'weekly' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
                }`}
                aria-label="Show weekly data"
              >
                7-Day Logs
              </button>
              <button
                type="button"
                onClick={() => setTimeRange('monthly')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer min-h-[38px] ${
                  timeRange === 'monthly' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
                }`}
                aria-label="Show monthly outlook"
              >
                30-Day Outlook
              </button>
            </div>
          </div>
        </div>

        <EmissionTrendsChart data={chartData} timeRange={timeRange} />
      </Card>

      {/* 2. Category Pie Breakdown */}
      <Card className="border-slate-200 bg-white flex flex-col justify-between shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Category Share</h2>
              <p className="text-xs text-slate-500 font-medium">Source breakdown of logged CO₂e</p>
            </div>
          </div>
        </div>

        <CategoryShareChart breakdown={breakdown} />
        <CategoryLegendList breakdown={breakdown} />
      </Card>
    </div>
  );
};
