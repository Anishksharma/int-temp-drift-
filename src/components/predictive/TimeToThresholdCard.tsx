/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Clock, AlertTriangle, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';

export const TimeToThresholdCard: React.FC = () => {
  const { sensors, selectedSensorId, analyses } = useTelemetry();
  const currentSensor = sensors.find(s => s.id === selectedSensorId) || sensors[0];
  const analysis = analyses[selectedSensorId];

  if (!currentSensor || !analysis) {
    return null;
  }

  const isRising = analysis.rateOfChangePerMin > 0.05;
  const isFalling = analysis.rateOfChangePerMin < -0.05;
  const isStable = !isRising && !isFalling;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Time-to-Threshold Estimator
          </h3>
        </div>
        <span className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded font-mono">
          Simulated Projection
        </span>
      </div>

      <div className="space-y-3">
        {/* Current Sensor Overview */}
        <div className="flex items-center justify-between text-xs bg-slate-800/50 p-2 rounded-lg">
          <div>
            <span className="text-slate-400">Target Sensor:</span>
            <span className="ml-1 font-mono font-medium text-slate-200">{currentSensor.id} - {currentSensor.name}</span>
          </div>
          <div className="flex items-center gap-1 font-mono">
            {isRising && <TrendingUp className="w-3.5 h-3.5 text-rose-400" />}
            {isFalling && <TrendingDown className="w-3.5 h-3.5 text-cyan-400" />}
            <span className={isRising ? 'text-rose-400 font-bold' : isFalling ? 'text-cyan-400' : 'text-slate-400'}>
              {analysis.rateOfChangePerMin > 0 ? '+' : ''}{analysis.rateOfChangePerMin.toFixed(2)} °C/min
            </span>
          </div>
        </div>

        {/* Prediction Display */}
        {analysis.timeToCriticalMin !== null ? (
          <div className="bg-rose-950/40 border border-rose-900/60 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                Time to Critical High ({currentSensor.limits.criticalHigh}°C)
              </span>
              <span className="text-[10px] text-rose-400/80 font-mono">95% Confidence Interval</span>
            </div>
            
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold font-mono text-rose-200">
                {analysis.timeToCriticalMin}
              </span>
              <span className="text-xs font-semibold text-rose-300">MINUTES</span>
              <span className="text-xs font-mono text-rose-400/90 ml-1">
                ± {analysis.timeToThresholdUncertaintyMin || 1.2} min
              </span>
            </div>

            {/* Projection Progress bar */}
            <div className="w-full bg-slate-950/60 h-2 rounded-full overflow-hidden mt-2.5">
              <div
                className="bg-gradient-to-r from-amber-500 to-rose-500 h-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(10, 100 - (analysis.timeToCriticalMin / 20) * 100))}%`,
                }}
              />
            </div>

            <p className="text-[11px] text-rose-300/80 mt-2 leading-relaxed">
              At current thermal acceleration ({analysis.rateOfChangePerMin.toFixed(2)} °C/min), breach is projected within ~{analysis.timeToCriticalMin} minutes unless cooling is restored or load throttled.
            </p>
          </div>
        ) : analysis.timeToWarningMin !== null ? (
          <div className="bg-amber-950/40 border border-amber-900/60 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Time to Warning Threshold ({currentSensor.limits.warningHigh}°C)
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold font-mono text-amber-200">
                {analysis.timeToWarningMin}
              </span>
              <span className="text-xs font-semibold text-amber-300">MINUTES</span>
              <span className="text-xs font-mono text-amber-400/90 ml-1">
                ± {analysis.timeToThresholdUncertaintyMin || 0.8} min
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-950/30 border border-emerald-900/50 rounded-lg p-3.5 flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-emerald-300">Thermal Equilibrium Maintained</h4>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">
                Current rate of change ({analysis.rateOfChangePerMin.toFixed(2)} °C/min) shows no projected breach within 60+ minutes.
              </p>
            </div>
          </div>
        )}

        {/* Operating Limits Context */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
          <div className="bg-slate-800/40 p-2 rounded text-center">
            <span className="text-slate-400 block text-[10px]">Nominal</span>
            <span className="text-slate-200 font-semibold">{currentSensor.limits.nominalTemp}°C</span>
          </div>
          <div className="bg-slate-800/40 p-2 rounded text-center">
            <span className="text-amber-400 block text-[10px]">Warning</span>
            <span className="text-amber-200 font-semibold">{currentSensor.limits.warningHigh}°C</span>
          </div>
          <div className="bg-slate-800/40 p-2 rounded text-center">
            <span className="text-rose-400 block text-[10px]">Critical</span>
            <span className="text-rose-200 font-semibold">{currentSensor.limits.criticalHigh}°C</span>
          </div>
        </div>
      </div>
    </div>
  );
};
