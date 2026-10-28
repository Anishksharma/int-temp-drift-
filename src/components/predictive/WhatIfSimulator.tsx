/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Sliders, Wrench, RotateCcw, Zap, Snowflake, CheckCircle } from 'lucide-react';

export const WhatIfSimulator: React.FC = () => {
  const {
    sensors,
    selectedSensorId,
    analyses,
    whatIfParams,
    setWhatIfParams,
    resetWhatIfParams,
  } = useTelemetry();

  const currentSensor = sensors.find(s => s.id === selectedSensorId) || sensors[0];
  const analysis = analyses[selectedSensorId];

  if (!currentSensor || !analysis) return null;

  const hasModifications =
    whatIfParams.sensorCalibrationOffset !== 0 ||
    whatIfParams.coolingEfficiencyBoost !== 0 ||
    whatIfParams.loadReductionPercent !== 0 ||
    whatIfParams.replaceFaultySensor;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            What-If Maintenance Simulator
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded font-mono">
            Digital Intervention
          </span>
          {hasModifications && (
            <button
              onClick={resetWhatIfParams}
              className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Simulate corrective engineering actions on <span className="text-slate-200 font-mono font-medium">{currentSensor.name}</span> to observe counterfactual temperature drift trajectories in real-time.
        </p>

        {/* Action 1: Zero-point offset recalibration */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-slate-400" />
              Sensor Offset Recalibration:
            </span>
            <span className="font-mono text-cyan-300 font-semibold">
              {whatIfParams.sensorCalibrationOffset > 0 ? '+' : ''}
              {whatIfParams.sensorCalibrationOffset.toFixed(1)} °C
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="10"
            step="0.5"
            value={whatIfParams.sensorCalibrationOffset}
            onChange={e =>
              setWhatIfParams(p => ({ ...p, sensorCalibrationOffset: parseFloat(e.target.value) }))
            }
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
            <span>-10.0°C</span>
            <span>0.0°C (Uncalibrated)</span>
            <span>+10.0°C</span>
          </div>
        </div>

        {/* Action 2: Cooling Loop Restoration */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Snowflake className="w-3.5 h-3.5 text-sky-400" />
              Auxiliary Cooling Loop Injection:
            </span>
            <span className="font-mono text-sky-300 font-semibold">
              +{whatIfParams.coolingEfficiencyBoost}% heat flux
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="5"
            value={whatIfParams.coolingEfficiencyBoost}
            onChange={e =>
              setWhatIfParams(p => ({ ...p, coolingEfficiencyBoost: parseInt(e.target.value, 10) }))
            }
            className="w-full accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Action 3: Motor / Machine Load Reduction */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Mechanical / Electrical Load Throttling:
            </span>
            <span className="font-mono text-amber-300 font-semibold">
              -{whatIfParams.loadReductionPercent}% throughput
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="5"
            value={whatIfParams.loadReductionPercent}
            onChange={e =>
              setWhatIfParams(p => ({ ...p, loadReductionPercent: parseInt(e.target.value, 10) }))
            }
            className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Action 4: Hardware Replacement Toggle */}
        <div className="pt-1">
          <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 cursor-pointer hover:bg-slate-800/60 transition-colors">
            <span className="text-xs text-slate-300 flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${whatIfParams.replaceFaultySensor ? 'text-emerald-400' : 'text-slate-500'}`} />
              Simulate Sensor Replacement & Harness Renewal
            </span>
            <input
              type="checkbox"
              checked={whatIfParams.replaceFaultySensor}
              onChange={e =>
                setWhatIfParams(p => ({ ...p, replaceFaultySensor: e.target.checked }))
              }
              className="accent-emerald-400 w-4 h-4 cursor-pointer"
            />
          </label>
        </div>

        {/* Projected Outcome Summary */}
        <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-lg text-xs">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
            Simulated Counterfactual Result
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-slate-300">Projected Effective Temp:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {analysis.currentTemp.toFixed(1)}°C
            </span>
          </div>
          <div className="flex items-baseline justify-between mt-1 text-[11px]">
            <span className="text-slate-400">Post-Intervention Anomaly Score:</span>
            <span className="font-mono text-slate-200">
              {analysis.anomalyScore.toFixed(2)} ({analysis.anomalyScore > 0.6 ? 'Elevated' : 'Controlled'})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
