import React, { useState } from 'react';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import type { CommuteMode, DietType, HeatingSource } from '../../utils/carbonCalculations';
import { Leaf, Compass, Calendar, Zap, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingQuizProps {
  onComplete: (
    dietType: DietType,
    travelKm: number,
    travelMode: CommuteMode,
    monthlyKwh: number,
    heatSource: HeatingSource
  ) => void;
}

export const OnboardingQuiz: React.FC<OnboardingQuizProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(1);
  
  // Form state
  const [diet, setDiet] = useState<DietType>('omnivore');
  const [travelMode, setTravelMode] = useState<CommuteMode>('petrol_car');
  const [travelKm, setTravelKm] = useState<number>(10000); // 10k km/year average
  const [energyKwh, setEnergyKwh] = useState<number>(300); // 300 kWh/month average
  const [heatingSource, setHeatingSource] = useState<HeatingSource>('gas');
  const [flights, setFlights] = useState<number>(2); // 2 flights/year average
  const [recycles, setRecycles] = useState<boolean>(true);

  const nextStep = () => setStep(prev => Math.min(prev + 1, 5));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = () => {
    onComplete(diet, travelKm, travelMode, energyKwh, heatingSource);
  };

  const stepsDetails = [
    { title: 'Base Diet Type', description: 'What are your average food consumption habits?', icon: Leaf },
    { title: 'Commute & Travel', description: 'How do you normally travel and how far per year?', icon: Compass },
    { title: 'Home Energy Usage', description: 'How much energy does your household consume?', icon: Zap },
    { title: 'Air Travel', description: 'How many flights do you take in an average year?', icon: Calendar },
    { title: 'Recycling & Waste', description: 'What are your waste reduction habits?', icon: RefreshCw }
  ];

  return (
    <div className="max-w-xl mx-auto w-full py-8 px-4">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold uppercase tracking-wider text-emerald-800">
            Step {step} of 5: {stepsDetails[step - 1].title}
          </span>
          <span className="text-xs text-slate-600 font-semibold">{Math.round((step / 5) * 100)}% Complete</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
          <div
            className="bg-emerald-600 h-full transition-all duration-300 ease-out"
            style={{ width: `${(step / 5) * 100}%` }}
          />
        </div>
      </div>

      <Card className="shadow-xl border-slate-200 bg-white">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            {React.createElement(stepsDetails[step - 1].icon, { className: 'w-6 h-6' })}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{stepsDetails[step - 1].title}</h2>
            <p className="text-sm text-slate-600 font-medium">{stepsDetails[step - 1].description}</p>
          </div>
        </div>

        {/* Step 1: Diet */}
        {step === 1 && (
          <div className="space-y-4">
            {[
              { id: 'beef_heavy', label: 'Meat Lover (Beef/Pork heavy)', desc: 'Frequent meat meals, particularly beef, lamb or pork', co2: '6.0 kg CO₂e/day' },
              { id: 'omnivore', label: 'Average Omnivore', desc: 'A standard balance of meats, fish, vegetables, and dairy', co2: '3.5 kg CO₂e/day' },
              { id: 'vegetarian', label: 'Vegetarian', desc: 'No meat, but eats dairy products and eggs', co2: '2.0 kg CO₂e/day' },
              { id: 'vegan', label: 'Plant-Based (Vegan)', desc: 'Exclusively plant foods. No meat, dairy, eggs, or animal products', co2: '1.5 kg CO₂e/day' }
            ].map(option => (
              <div
                key={option.id}
                onClick={() => setDiet(option.id as DietType)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  diet === option.id
                    ? 'border-emerald-600 bg-emerald-50 text-slate-900'
                    : 'border-slate-200 hover:border-slate-350 bg-slate-50/50 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold">{option.label}</span>
                  <span className="text-xs px-2.5 py-0.5 bg-slate-200/60 rounded-full text-slate-700 font-semibold">{option.co2}</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">{option.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Commute */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label htmlFor="travelModeSelect" className="block text-sm font-bold text-slate-700 mb-2">
                Primary Mode of Transport
              </label>
              <select
                id="travelModeSelect"
                value={travelMode}
                onChange={(e) => setTravelMode(e.target.value as CommuteMode)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="petrol_car">Petrol Vehicle</option>
                <option value="diesel_car">Diesel Vehicle</option>
                <option value="ev_car">Electric Vehicle (EV)</option>
                <option value="bus">Public Bus</option>
                <option value="train">Train / Metro</option>
                <option value="bicycle">Bicycle / Electric Scooter</option>
                <option value="walking">Walking / Running</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="travelKmRange" className="text-sm font-bold text-slate-700">
                  Estimated Travel Distance
                </label>
                <span className="text-emerald-700 font-extrabold">{travelKm.toLocaleString()} km / year</span>
              </div>
              <input
                id="travelKmRange"
                type="range"
                min="0"
                max="40000"
                step="500"
                value={travelKm}
                onChange={(e) => setTravelKm(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1 font-semibold">
                <span>0 km</span>
                <span>20,000 km</span>
                <span>40,000+ km</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Home Energy */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="electricityKwhRange" className="text-sm font-bold text-slate-700">
                  Monthly Electricity Consumption
                </label>
                <span className="text-emerald-700 font-extrabold">{energyKwh} kWh / month</span>
              </div>
              <input
                id="electricityKwhRange"
                type="range"
                min="50"
                max="1000"
                step="25"
                value={energyKwh}
                onChange={(e) => setEnergyKwh(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1 font-semibold">
                <span>50 kWh (Low)</span>
                <span>400 kWh (Medium)</span>
                <span>1,000+ kWh (High)</span>
              </div>
            </div>

            <div>
              <label htmlFor="heatingSourceSelect" className="block text-sm font-bold text-slate-700 mb-2">
                Primary Home Heating Fuel
              </label>
              <select
                id="heatingSourceSelect"
                value={heatingSource}
                onChange={(e) => setHeatingSource(e.target.value as HeatingSource)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="gas">Natural Gas / LPG</option>
                <option value="electric">Electric Heat Pump / Boiler</option>
                <option value="none">No Space Heating / Wood Stove</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 4: Air Travel */}
        {step === 4 && (
          <div className="space-y-6 text-left">
            <div>
              <label htmlFor="flightsInput" className="block text-sm font-bold text-slate-700 mb-2">
                Flights Taken Annually (Short & Long Haul)
              </label>
              <div className="flex items-center gap-4">
                <input
                  id="flightsInput"
                  type="number"
                  min="0"
                  max="100"
                  value={flights}
                  onChange={(e) => setFlights(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-center font-extrabold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-slate-600 text-sm font-medium">
                  Includes both vacation trips and business travel.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
              Did you know? An economy class round-trip flight from London to New York generates roughly 900 kg CO₂e. Limiting air travel is one of the most effective ways to lower your baseline footprint.
            </div>
          </div>
        )}

        {/* Step 5: Waste & Recycling */}
        {step === 5 && (
          <div className="space-y-6">
            <div>
              <span className="block text-sm font-bold text-slate-700 mb-3">
                Do you sort and recycle your waste?
              </span>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRecycles(true)}
                  className={`py-4 rounded-xl border font-bold transition-all duration-200 cursor-pointer ${
                    recycles
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  Yes, regularly
                </button>
                <button
                  type="button"
                  onClick={() => setRecycles(false)}
                  className={`py-4 rounded-xl border font-bold transition-all duration-200 cursor-pointer ${
                    !recycles
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  No, rarely
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                Recycling and composting can reduce your household landfill footprint by up to 250 kg of CO₂ equivalent annually. Sorting plastics, glass, paper, and food scraps has a direct local ecological benefit.
              </p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between">
          <Button
            variant="secondary"
            onClick={prevStep}
            disabled={step === 1}
            className="flex items-center gap-1 min-h-[48px]"
            ariaLabel="Previous page"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>

          {step < 5 ? (
            <Button onClick={nextStep} className="flex items-center gap-1 min-h-[48px]" ariaLabel="Next page">
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold min-h-[48px]" ariaLabel="Complete onboarding">
              Calculate Footprint
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
