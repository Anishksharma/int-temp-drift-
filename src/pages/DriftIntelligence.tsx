/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import {
  BrainCircuit,
  Calculator,
  ShieldCheck,
  AlertTriangle,
  Flame,
  ArrowRight,
  TrendingUp,
  Cpu,
  Info,
} from 'lucide-react';

export const DriftIntelligence: React.FC = () => {
  const { sensors, selectedSensorId, setSelectedSensorId, analyses, history } = useTelemetry();
  const currentSensor = sensors.find(s => s.id === selectedSensorId) || sensors[0];
  const analysis = analyses[selectedSensorId];
  const points = history[selectedSensorId] || [];
  const latest = points[points.length - 1];

  // Mathematical feature breakdown for current sensor
  const span = Math.max(1, currentSensor.limits.criticalHigh - currentSensor.limits.nominalTemp);
  const tempDev = analysis ? Math.abs(analysis.currentTemp - currentSensor.limits.nominalTemp) : 0;
  const baselineShift = analysis ? Math.abs(analysis.currentBaseline - currentSensor.limits.nominalTemp) : 0;
  const thermalFactor = Math.min(1.0, (tempDev / span) * 0.7 + (baselineShift / span) * 0.3);

  const maxVelocity = Math.max(0.5, currentSensor.limits.maxRateOfChange);
  const velocityFactor = analysis ? Math.min(1.0, Math.abs(analysis.rateOfChangePerMin) / maxVelocity) : 0;

  const zDev = analysis ? Math.abs(analysis.currentTemp - analysis.currentBaseline) / (span * 0.2 || 1) : 0;
  const isolationPathFactor = Math.max(0, 1 - Math.exp(-0.5 * Math.pow(zDev, 2)));

  const finalAnomalyScore = analysis ? analysis.anomalyScore : 0.05;

  return (
    <div className="space-y-4 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Title & Architecture Disclosure Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">AI Drift Intelligence & Math Explainability</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Deterministic feature vector extraction, rolling exponential baselines, and multi-factor isolation surrogate
          </p>
        </div>

        {/* Transparent Methodology Disclosure Badge */}
        <div className="bg-cyan-950/80 border border-cyan-800/80 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <div>
            <span className="text-[10px] text-cyan-400 uppercase font-mono font-bold block">Active Detection Architecture:</span>
            <span className="text-slate-200 font-mono text-[11px] font-semibold">
              Deterministic Multi-Factor Isolation Estimator (JS/TS Engine)
            </span>
          </div>
        </div>
      </div>

      {/* Target Sensor Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs font-mono">
        <span className="text-slate-400 font-semibold px-2">Analyze Probe:</span>
        {sensors.map(s => {
          const a = analyses[s.id];
          const isSelected = s.id === selectedSensorId;
          return (
            <button
              key={s.id}
              onClick={() => setSelectedSensorId(s.id)}
              className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>{s.id}</span>
              <span className="text-[10px] opacity-80">({a ? a.currentTemp.toFixed(1) : ''}°)</span>
            </button>
          );
        })}
      </div>

      {/* Live Formula & Weight Decomposition */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Math Equation Card (2 spans) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Live Anomaly Equation Decomposition for {currentSensor.id}
              </h3>
            </div>
            <span className="text-xs font-mono text-purple-400 font-bold bg-purple-950/80 border border-purple-800/80 px-2 py-0.5 rounded">
              Score: {finalAnomalyScore.toFixed(3)}
            </span>
          </div>

          {/* Rendered Math Formula Display */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto">
            <div className="text-slate-400 text-[11px] mb-1 font-sans">Formal Linear Weight Representation:</div>
            <div className="text-cyan-300 font-semibold text-sm">
              S_anomaly = (0.45 · Z_thermal) + (0.35 · V_velocity) + (0.20 · D_isolation) + P_flatline
            </div>
            <div className="text-slate-400 mt-2 text-[11px] font-sans">
              Live Numerical Computation:
            </div>
            <div className="text-slate-200 font-bold text-xs mt-0.5">
              {finalAnomalyScore.toFixed(3)} = (0.45 × {thermalFactor.toFixed(3)}) + (0.35 × {velocityFactor.toFixed(3)}) + (0.20 × {isolationPathFactor.toFixed(3)}) + {analysis?.isFlatline ? '0.78 (Penalty)' : '0.00'}
            </div>
          </div>

          {/* Factor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Factor 1: Thermal Drift */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Term 1 (Weight: 45%)</span>
              <h4 className="text-xs font-semibold text-slate-200 mt-0.5">Thermal Drift Factor</h4>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-2">
                {thermalFactor.toFixed(3)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Temp Dev: {tempDev.toFixed(1)}°C from nominal target ({currentSensor.limits.nominalTemp}°C).
              </p>
            </div>

            {/* Factor 2: Velocity Rate */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Term 2 (Weight: 35%)</span>
              <h4 className="text-xs font-semibold text-slate-200 mt-0.5">Rate of Change (dT/dt)</h4>
              <div className="text-xl font-bold font-mono text-amber-400 mt-2">
                {velocityFactor.toFixed(3)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Current: {analysis?.rateOfChangePerMin.toFixed(2)} °C/min (Limit: {currentSensor.limits.maxRateOfChange}°C/min).
              </p>
            </div>

            {/* Factor 3: Isolation Partition Surrogate */}
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">Term 3 (Weight: 20%)</span>
              <h4 className="text-xs font-semibold text-slate-200 mt-0.5">Isolation Depth Surrogate</h4>
              <div className="text-xl font-bold font-mono text-purple-400 mt-2">
                {isolationPathFactor.toFixed(3)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Path split depth approximation against standard Gaussian kernel.
              </p>
            </div>
          </div>

          {/* Diagnostic Integrity Tests */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
            <h4 className="font-semibold text-slate-300">Continuous Drift & Integrity Monitors</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
              <div className="bg-slate-900 p-2 rounded">
                <span className="text-slate-400 block text-[10px]">Flatline Monitor</span>
                <span className={analysis?.isFlatline ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {analysis?.isFlatline ? 'STUCK ADC' : 'Normal Variance'}
                </span>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <span className="text-slate-400 block text-[10px]">Missing Data Gap</span>
                <span className={analysis?.isMissingData ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {analysis?.isMissingData ? 'HEARTBEAT LOST' : '0.0s (Live)'}
                </span>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <span className="text-slate-400 block text-[10px]">Persistent Breaches</span>
                <span className="text-amber-400 font-bold">
                  {analysis?.persistentViolationCount || 0} consecutive
                </span>
              </div>
              <div className="bg-slate-900 p-2 rounded">
                <span className="text-slate-400 block text-[10px]">Trust Score</span>
                <span className="text-emerald-400 font-bold">
                  {analysis?.trustScore || 100}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Algorithmic Guidelines & False Alarm Filter */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
              Industrial Anomaly Classification
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Standard operating rules for classifying detected thermal deviations:
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-900/60">
                <span className="font-bold text-emerald-300 block">Class 1: Normal Thermal Cycling</span>
                <p className="text-[11px] text-emerald-400/80 mt-0.5">
                  Anomaly Score &lt; 0.35. Baseline tracking absorbs natural diurnal and load-swing fluctuations.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-900/60">
                <span className="font-bold text-amber-300 block">Class 2: Incipient Insulation / Lube Drift</span>
                <p className="text-[11px] text-amber-400/80 mt-0.5">
                  Anomaly Score 0.35 - 0.70. Persistent velocity breach indicates degradation before upper temperature trip is reached.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-900/60">
                <span className="font-bold text-rose-300 block">Class 3: Catastrophic Thermal Runaway</span>
                <p className="text-[11px] text-rose-400/80 mt-0.5">
                  Anomaly Score &gt; 0.70. Exponential temperature climb or chiller/furnace failure requiring safety interlocking.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400">
            <span className="text-slate-200 font-semibold block mb-0.5">Transparent Verification:</span>
            No black-box or hallucinated neural network weights are used. All metrics are computed strictly deterministically in TypeScript from high-frequency time-series windows.
          </div>
        </div>
      </div>
    </div>
  );
};
