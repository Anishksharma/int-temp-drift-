/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { Activity, CheckCircle2, AlertOctagon, Wifi, Radio } from 'lucide-react';

export const SensorTrustCard: React.FC = () => {
  const { sensors, selectedSensorId, analyses, history } = useTelemetry();
  const currentSensor = sensors.find(s => s.id === selectedSensorId) || sensors[0];
  const analysis = analyses[selectedSensorId];
  const points = history[selectedSensorId] || [];
  const latest = points[points.length - 1];

  if (!currentSensor || !analysis) return null;

  const trustScore = analysis.trustScore;
  const isHealthy = trustScore >= 80;
  const isWarning = trustScore < 80 && trustScore >= 50;
  const isFaulty = trustScore < 50;

  const snr = latest?.snrDb || 28;
  const isFlatline = analysis.isFlatline;
  const isMissing = analysis.isMissingData;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Sensor Trust & Data Quality
          </h3>
        </div>
        <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
          QA Diagnostic
        </span>
      </div>

      <div className="space-y-3">
        {/* Trust Gauge Big Score */}
        <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-lg border border-slate-800">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-3xl font-extrabold font-mono ${
                  isHealthy ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {trustScore}%
              </span>
              <span className="text-[11px] font-semibold uppercase text-slate-400">
                {isHealthy ? 'TRUSTED HIGH INTEGRITY' : isWarning ? 'SUSPECT DEGRADATION' : 'UNRELIABLE / FAULT'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Probe: <span className="text-slate-200 font-mono">{currentSensor.id}</span> ({currentSensor.type})
            </p>
          </div>

          <div className="w-12 h-12 rounded-full border-4 flex items-center justify-center shrink-0 border-slate-700 relative">
            <span
              className={`w-3 h-3 rounded-full ${
                isHealthy ? 'bg-emerald-400 animate-pulse' : isWarning ? 'bg-amber-400' : 'bg-rose-500'
              }`}
            />
          </div>
        </div>

        {/* Quality Factors Breakdown */}
        <div className="space-y-1.5 text-xs">
          {/* Signal-to-Noise */}
          <div className="flex items-center justify-between p-2 rounded bg-slate-800/20 border border-slate-800/60">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-300">Signal-to-Noise Ratio (SNR)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-200">{snr.toFixed(1)} dB</span>
              {snr >= 20 ? (
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">Optimal</span>
              ) : (
                <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded">High Noise</span>
              )}
            </div>
          </div>

          {/* Flatline Detection */}
          <div className="flex items-center justify-between p-2 rounded bg-slate-800/20 border border-slate-800/60">
            <div className="flex items-center gap-2">
              <AlertOctagon className={`w-3.5 h-3.5 ${isFlatline ? 'text-rose-400' : 'text-slate-400'}`} />
              <span className="text-slate-300">Stuck ADC / Flatline Check</span>
            </div>
            <div>
              {isFlatline ? (
                <span className="text-[10px] text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded font-semibold">
                  FROZEN VARIANCE
                </span>
              ) : (
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  Dynamic (Pass)
                </span>
              )}
            </div>
          </div>

          {/* Packet Loss / Heartbeat */}
          <div className="flex items-center justify-between p-2 rounded bg-slate-800/20 border border-slate-800/60">
            <div className="flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-300">Bus Heartbeat & Packet Flow</span>
            </div>
            <div>
              {isMissing ? (
                <span className="text-[10px] text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded font-semibold">
                  DROPPED
                </span>
              ) : (
                <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded">
                  100% Continuity
                </span>
              )}
            </div>
          </div>

          {/* Calibration Drift Status */}
          <div className="flex items-center justify-between p-2 rounded bg-slate-800/20 border border-slate-800/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-300">Calibration Zero-Offset</span>
            </div>
            <span className="font-mono text-slate-200">
              {currentSensor.currentOffset > 0 ? '+' : ''}
              {currentSensor.currentOffset.toFixed(1)}°C
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
