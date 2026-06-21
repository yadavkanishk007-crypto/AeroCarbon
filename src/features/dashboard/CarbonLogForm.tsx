import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import type { CommuteMode, DietType, HeatingSource, DailyLogInput } from '../../utils/carbonCalculations';
import { Calendar, Car, Utensils, Zap, Save } from 'lucide-react';

// 1. Define schema using Zod
const dailyLogSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  commute_mode: z.enum(['petrol_car', 'diesel_car', 'ev_car', 'bus', 'train', 'bicycle', 'walking'] as const),
  commute_distance: z.number().nonnegative('Distance must be 0 or greater').max(1000, 'Distance is unrealistically high'),
  diet_type: z.enum(['vegan', 'vegetarian', 'omnivore', 'beef_heavy'] as const),
  energy_kwh: z.number().nonnegative('Electricity kWh must be 0 or greater').max(200, 'Electricity is too high for a single day'),
  heating_source: z.enum(['gas', 'electric', 'none'] as const),
  heating_kwh: z.number().nonnegative('Heating kWh must be 0 or greater').max(200, 'Heating kWh is too high for a single day')
});

type DailyLogFormData = z.infer<typeof dailyLogSchema>;

interface CarbonLogFormProps {
  onSubmitLog: (input: DailyLogInput, date: string) => Promise<void>;
  defaultDate?: string;
}

export const CarbonLogForm: React.FC<CarbonLogFormProps> = ({ onSubmitLog, defaultDate }) => {
  const todayStr = defaultDate || new Date().toISOString().split('T')[0];

  // 2. Initialize React Hook Form with Zod validation resolver
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting }
  } = useForm<DailyLogFormData>({
    resolver: zodResolver(dailyLogSchema),
    defaultValues: {
      date: todayStr,
      commute_mode: 'petrol_car',
      commute_distance: 0,
      diet_type: 'omnivore',
      energy_kwh: 0,
      heating_source: 'none',
      heating_kwh: 0
    }
  });

  const selectedHeatingSource = useWatch({
    control,
    name: 'heating_source',
    defaultValue: 'none'
  });

  const onFormSubmit = async (data: DailyLogFormData) => {
    const input: DailyLogInput = {
      commute_mode: data.commute_mode as CommuteMode,
      commute_distance: data.commute_distance,
      diet_type: data.diet_type as DietType,
      energy_kwh: data.energy_kwh,
      heating_source: data.heating_source as HeatingSource,
      heating_kwh: data.heating_kwh
    };
    
    await onSubmitLog(input, data.date);
    
    // Reset form while keeping the date
    reset({
      date: data.date,
      commute_mode: 'petrol_car',
      commute_distance: 0,
      diet_type: 'omnivore',
      energy_kwh: 0,
      heating_source: 'none',
      heating_kwh: 0
    });
  };

  return (
    <Card className="border-slate-200 bg-white h-full shadow-lg">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg">
          <Calendar className="w-5 h-5" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">Log Daily Activities</h2>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 text-sm">
        {/* Date Input */}
        <div>
          <label htmlFor="logDate" className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Log Date
          </label>
          <input
            id="logDate"
            type="date"
            max={todayStr}
            {...register('date')}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
          {errors.date && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.date.message}</p>}
        </div>

        {/* Commute Logging */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-extrabold mb-1 text-xs uppercase tracking-wider">
            <Car className="w-4 h-4" /> Commute
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="commuteModeSelect" className="block text-xs text-slate-600 font-semibold mb-1">
                Travel Mode
              </label>
              <select
                id="commuteModeSelect"
                {...register('commute_mode')}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="petrol_car">Petrol Car</option>
                <option value="diesel_car">Diesel Car</option>
                <option value="ev_car">Electric Car (EV)</option>
                <option value="bus">Public Bus</option>
                <option value="train">Train / Metro</option>
                <option value="bicycle">Bicycle / Scooter</option>
                <option value="walking">Walking / Running</option>
              </select>
            </div>

            <div>
              <label htmlFor="commuteDistanceInput" className="block text-xs text-slate-600 font-semibold mb-1">
                Distance (km)
              </label>
              <input
                id="commuteDistanceInput"
                type="number"
                step="0.1"
                placeholder="e.g. 12.5"
                {...register('commute_distance', { valueAsNumber: true })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              {errors.commute_distance && (
                <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.commute_distance.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Diet Logging */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-extrabold mb-1 text-xs uppercase tracking-wider">
            <Utensils className="w-4 h-4" /> Daily Diet
          </div>

          <div>
            <label htmlFor="dietTypeSelect" className="block text-xs text-slate-600 font-semibold mb-1">
              Diet Style Today
            </label>
            <select
              id="dietTypeSelect"
              {...register('diet_type')}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            >
              <option value="vegan">100% Plant-Based (Vegan)</option>
              <option value="vegetarian">Vegetarian (No meat)</option>
              <option value="omnivore">Omnivore (Standard balance)</option>
              <option value="beef_heavy">Beef Heavy / High Meat</option>
            </select>
          </div>
        </div>

        {/* Home Energy Logging */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-emerald-800 font-extrabold mb-1 text-xs uppercase tracking-wider">
            <Zap className="w-4 h-4" /> Home Energy
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="electricityKwhInput" className="block text-xs text-slate-600 font-semibold mb-1">
                Electricity (kWh)
              </label>
              <input
                id="electricityKwhInput"
                type="number"
                step="0.1"
                placeholder="e.g. 8.4"
                {...register('energy_kwh', { valueAsNumber: true })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              {errors.energy_kwh && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.energy_kwh.message}</p>}
            </div>

            <div>
              <label htmlFor="formHeatingSourceSelect" className="block text-xs text-slate-600 font-semibold mb-1">
                Heating Fuel
              </label>
              <select
                id="formHeatingSourceSelect"
                {...register('heating_source')}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="none">No Space Heating</option>
                <option value="gas">Natural Gas</option>
                <option value="electric">Electric Heater</option>
              </select>
            </div>
          </div>

          {selectedHeatingSource !== 'none' && (
            <div className="pt-1.5 transition-all duration-300">
              <label htmlFor="heatingKwhInput" className="block text-xs text-slate-600 font-semibold mb-1">
                Heating consumption (kWh / gas volume equivalent)
              </label>
              <input
                id="heatingKwhInput"
                type="number"
                step="0.1"
                placeholder="e.g. 10"
                {...register('heating_kwh', { valueAsNumber: true })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              {errors.heating_kwh && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.heating_kwh.message}</p>}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white min-h-[48px] mt-3"
          ariaLabel="Save daily log"
        >
          <Save className="w-4 h-4" />
          {isSubmitting ? 'Saving...' : 'Save Log Entry'}
        </Button>
      </form>
    </Card>
  );
};
