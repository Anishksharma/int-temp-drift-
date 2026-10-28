/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import {
  Play,
  Pause,
  RotateCcw,
  Gauge,
  Flame,
  Volume2,
  VolumeX,
  Bell,
  Check,
  AlertTriangle,
  Zap,
} from 'lucide-react';

export const SimulationControlBar: React.FC = () => {
  const {
    isPaused,
    togglePause,
    simSpeed,
    setSimSpeed,
    resetSimulation,
    injectAnomaly,
    selectedSensorId,
    sensors,
    soundEnabled,
    setSoundEnabled,
    browserNotificationsEnabled,
    requestBrowserNotifications,
    activeOverrides,
  } = useTelemetry();

  const [selectedAnomalySensor, setSelectedAnomalySensor] = useState<string>(selectedSensorId);
  const currentSensor = sensors.find(s => s.id === selectedAnomalySensor) || sensors[0];
  const activeOverride = activeOverrides[selectedAnomalySensor];

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs sticky top-0 z-30 backdrop-blur-md">
      {/* Simulation Engine Status Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-cyan-950/80 border border-cyan-800/80 px-2.5 py-1 rounded-lg">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isPaused ? 'bg-amber-400' : 'bg-cyan-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isPaused ? 'bg-amber-500' : 'bg-cyan-500'
              }`}
            />
          </span>
          <span className="font-mono font-bold text-[11px] text-cyan-300 tracking-wider uppercase">
            {isPaused ? 'SIMULATION PAUSED' : 'SIMULATION ENGINE ACTIVE'}
          </span>
        </div>

        {/* Master Play/Pause & Reset */}
        <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700/60">
          <button
            onClick={togglePause}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
              isPaused
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
            }`}
            title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>

          <button
            onClick={resetSimulation}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Reset Simulation State to Baseline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Speed Multiplier */}
        <div className="flex items-center gap-1 bg-slate-800/80 px-1 py-0.5 rounded-lg border border-slate-700/60">
          <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1" />
          <span className="text-[10px] text-slate-400">Speed:</span>
          {[0.5, 1, 2, 5, 10].map(speed => (
            <button
              key={speed}
              onClick={() => setSimSpeed(speed)}
              className={`px-1.5 py-0.5 text-[10px] rounded font-mono font-bold transition-colors ${
                simSpeed === speed
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {speed}x
            </button>
          ))}
        </div>
      </div>

      {/* Anomaly Injection Suite */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700/60">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] text-slate-300 font-medium">Inject Event on:</span>
          <select
            value={selectedAnomalySensor}
            onChange={e => setSelectedAnomalySensor(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-1.5 py-0.5 font-mono outline-none"
          >
            {sensors.map(s => (
              <option key={s.id} value={s.id}>
                {s.id} ({s.name.split(' ')[0]})
              </option>
            ))}
          </select>

          {/* Anomaly Trigger Buttons */}
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={() => injectAnomaly(selectedAnomalySensor, 'DRIFT_UP')}
              className="bg-amber-950/80 hover:bg-amber-900 border border-amber-800/70 text-amber-300 px-2 py-0.5 rounded text-[11px] font-medium"
              title="Inject Gradual Thermal Drift (+0.8°C/s)"
            >
              +Drift
            </button>
            <button
              onClick={() => injectAnomaly(selectedAnomalySensor, 'SPIKE')}
              className="bg-rose-950/80 hover:bg-rose-900 border border-rose-800/70 text-rose-300 px-2 py-0.5 rounded text-[11px] font-medium"
              title="Inject Instant Thermal Spike (+12°C)"
            >
              +Spike
            </button>
            <button
              onClick={() => injectAnomaly(selectedAnomalySensor, 'DROP')}
              className="bg-sky-950/80 hover:bg-sky-900 border border-sky-800/70 text-sky-300 px-2 py-0.5 rounded text-[11px] font-medium"
              title="Inject Sudden Thermal Drop (-15°C)"
            >
              -Drop
            </button>
            <button
              onClick={() => injectAnomaly(selectedAnomalySensor, 'NOISE')}
              className="bg-purple-950/80 hover:bg-purple-900 border border-purple-800/70 text-purple-300 px-2 py-0.5 rounded text-[11px] font-medium"
              title="Inject Erratic Signal Noise"
            >
              Noise
            </button>
            <button
              onClick={() => injectAnomaly(selectedAnomalySensor, 'FLATLINE')}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium"
              title="Simulate Frozen / Stuck Sensor (Flatline)"
            >
              Flatline
            </button>
            <button
              onClick={() => injectAnomaly(selectedAnomalySensor, 'OFFLINE')}
              className="bg-red-950/80 hover:bg-red-900 border border-red-800/70 text-red-300 px-2 py-0.5 rounded text-[11px] font-medium"
              title="Simulate Disconnected / Offline Sensor"
            >
              Cut Signal
            </button>

            {activeOverride && (
              <button
                onClick={() => injectAnomaly(selectedAnomalySensor, 'RECOVER')}
                className="bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700 text-emerald-200 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 animate-pulse"
                title="Normalize sensor back to nominal operating condition"
              >
                <Zap className="w-3 h-3" /> Recover
              </button>
            )}
          </div>
        </div>

        {/* Audio Alert Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-1.5 rounded-lg border transition-colors ${
            soundEnabled
              ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title={soundEnabled ? 'Alarm Audio Active' : 'Alarm Audio Muted'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Browser Notifications Toggle */}
        <button
          onClick={requestBrowserNotifications}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] transition-colors ${
            browserNotificationsEnabled
              ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
          title="Enable System Browser Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          <span>{browserNotificationsEnabled ? 'Notifs On' : 'Enable Notifs'}</span>
        </button>
      </div>
    </div>
  );
};
