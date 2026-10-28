/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { FactoryZone, SensorMetadata } from '../types/telemetry';
import {
  Layers,
  Thermometer,
  Activity,
  Flame,
  Snowflake,
  Cog,
  Pipette,
  Zap,
  Info,
  Maximize2,
  X,
} from 'lucide-react';

export const FactoryDigitalTwin: React.FC = () => {
  const {
    sensors,
    analyses,
    history,
    selectedSensorId,
    setSelectedSensorId,
    injectAnomaly,
  } = useTelemetry();

  const [heatMapMode, setHeatMapMode] = useState<boolean>(true);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>('EQ-FUR-01');

  // Find sensor for inspector drawer
  const inspectedSensor = sensors.find(s => s.id === selectedSensorId) || sensors[0];
  const inspectedAnalysis = analyses[inspectedSensor.id];
  const inspectedHistory = history[inspectedSensor.id] || [];

  // Helper to get color according to temperature relative to limits
  const getSensorColor = (sensor: SensorMetadata) => {
    const analysis = analyses[sensor.id];
    if (!analysis) return '#10b981';
    if (analysis.severity === 'EMERGENCY') return '#ef4444';
    if (analysis.severity === 'CRITICAL') return '#f43f5e';
    if (analysis.severity === 'WARNING') return '#f59e0b';
    return '#10b981';
  };

  // Map sensor coordinates in our 1000x600 factory floor schematic
  const sensorPositions: Record<string, { x: number; y: number; label: string }> = {
    // Zone 1: Furnace (Top Left)
    'F-101': { x: 140, y: 150, label: 'Annealing Core' },
    'F-102': { x: 260, y: 140, label: 'Quench Tank' },
    'F-103': { x: 370, y: 160, label: 'Pre-Heat Induction' },
    'F-104': { x: 190, y: 230, label: 'Flue Recuperator' },

    // Zone 2: Industrial Cooling (Top Right)
    'C-201': { x: 620, y: 140, label: 'Primary Chiller' },
    'C-202': { x: 740, y: 150, label: 'Plate Heat Exchanger' },
    'C-203': { x: 860, y: 130, label: 'Cooling Tower Sump' },
    'C-204': { x: 790, y: 220, label: 'Aux Chilled Water' },

    // Zone 3: Motor & Bearing (Bottom Left)
    'M-301': { x: 180, y: 430, label: 'Extruder Drive' },
    'M-302': { x: 310, y: 440, label: 'Hydraulic Stator' },
    'M-303': { x: 390, y: 510, label: 'Turbo Compressor' },

    // Zone 4: Process Pipeline & Storage (Bottom Right)
    'P-401': { x: 630, y: 430, label: 'Reactor Feed' },
    'P-402': { x: 760, y: 440, label: 'Steam Header' },
    'P-403': { x: 870, y: 500, label: 'Silo B Skin' },
  };

  return (
    <div className="space-y-4 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Top Header & View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Factory Digital Twin (SCADA Spatial Architecture)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time thermal spatial layout across four heavy manufacturing sectors with telemetry overlays
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHeatMapMode(!heatMapMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
              heatMapMode
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Thermometer className="w-4 h-4 text-cyan-400" />
            {heatMapMode ? 'Thermal Heat Gradient: ON' : 'Thermal Heat Gradient: OFF'}
          </button>
        </div>
      </div>

      {/* Main Floor Plan SVG Canvas & Inspector Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Floor Plan (2 spans) */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-inner relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-300">
              Floor Plan View (Level 1 Process Deck)
            </span>
            <div className="flex items-center gap-3 font-mono text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Nominal
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Warning Drift
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" /> Critical
              </span>
            </div>
          </div>

          {/* SVG Industrial Blueprint Floor */}
          <div className="relative w-full aspect-[16/10] bg-slate-900/60 rounded-lg border border-slate-800 overflow-hidden">
            <svg
              viewBox="0 0 1000 620"
              className="w-full h-full select-none"
            >
              <defs>
                {/* Zone 1 Thermal Glow Gradient */}
                <radialGradient id="furnaceHeatGlow" cx="25%" cy="25%" r="35%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={heatMapMode ? '0.28' : '0.04'} />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </radialGradient>
                {/* Zone 2 Cooling Glow Gradient */}
                <radialGradient id="coolingGlow" cx="75%" cy="25%" r="35%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={heatMapMode ? '0.25' : '0.04'} />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </radialGradient>
                {/* Zone 3 Motor Glow Gradient */}
                <radialGradient id="motorGlow" cx="25%" cy="75%" r="35%">
                  <stop offset="0%" stopColor="#eab308" stopOpacity={heatMapMode ? '0.22' : '0.04'} />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </radialGradient>
                {/* Zone 4 Pipeline Glow Gradient */}
                <radialGradient id="pipeGlow" cx="75%" cy="75%" r="35%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={heatMapMode ? '0.20' : '0.04'} />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Background Factory Grid */}
              <pattern id="twinGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.8" />
              </pattern>
              <rect width="1000" height="620" fill="url(#twinGrid)" />

              {/* Zone Demarcation Boundaries */}
              {/* Zone 1: Furnace & Heat Treatment */}
              <rect x="20" y="20" width="460" height="270" rx="12" fill="url(#furnaceHeatGlow)" stroke="#f97316" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.4" />
              <text x="35" y="48" className="fill-orange-400 font-mono font-bold text-[13px] tracking-wider">
                ZONE 1: FURNACE & HEAT TREATMENT
              </text>

              {/* Zone 2: Industrial Cooling */}
              <rect x="520" y="20" width="460" height="270" rx="12" fill="url(#coolingGlow)" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.4" />
              <text x="535" y="48" className="fill-cyan-400 font-mono font-bold text-[13px] tracking-wider">
                ZONE 2: INDUSTRIAL COOLING & CHILLERS
              </text>

              {/* Zone 3: Motor & Bearing Assembly */}
              <rect x="20" y="320" width="460" height="280" rx="12" fill="url(#motorGlow)" stroke="#eab308" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.4" />
              <text x="35" y="348" className="fill-amber-400 font-mono font-bold text-[13px] tracking-wider">
                ZONE 3: MOTOR & BEARING ASSEMBLY
              </text>

              {/* Zone 4: Process Pipeline & Storage */}
              <rect x="520" y="320" width="460" height="280" rx="12" fill="url(#pipeGlow)" stroke="#a855f7" strokeWidth="1" strokeDasharray="4 4" strokeOpacity="0.4" />
              <text x="535" y="348" className="fill-purple-400 font-mono font-bold text-[13px] tracking-wider">
                ZONE 4: PROCESS PIPELINE & STORAGE
              </text>

              {/* Piping & Flow Lines Connecting Zones */}
              {/* Chilled glycol line from Zone 2 to Zone 4 reactor */}
              <path d="M 620 180 L 620 380 L 630 380" fill="none" stroke="#06b6d4" strokeWidth="4" strokeDasharray="6 4" strokeOpacity="0.6" />
              {/* High pressure steam line from Zone 1 recuperator to Zone 4 manifold */}
              <path d="M 370 230 L 490 230 L 490 440 L 760 440" fill="none" stroke="#f43f5e" strokeWidth="3" strokeDasharray="5 3" strokeOpacity="0.5" />

              {/* Physical Machine Isometric Icons / Schematics */}
              {/* Furnace Body */}
              <rect x="70" y="80" width="140" height="130" rx="8" fill="#1e293b" stroke="#f97316" strokeWidth="2" />
              <circle cx="140" cy="145" r="32" fill="#334155" stroke="#f97316" strokeWidth="1.5" />
              <text x="140" y="150" textAnchor="middle" className="fill-orange-200 text-[10px] font-mono font-bold">F-101 CHAMBER</text>

              {/* Quench Tank Body */}
              <rect x="230" y="90" width="70" height="110" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="265" y="150" textAnchor="middle" className="fill-slate-300 text-[9px] font-mono">QUENCH</text>

              {/* Chiller Unit Body */}
              <rect x="560" y="80" width="130" height="120" rx="8" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" />
              <circle cx="625" cy="140" r="28" fill="#164e63" stroke="#22d3ee" strokeWidth="1" />
              <text x="625" y="145" textAnchor="middle" className="fill-cyan-200 text-[10px] font-mono font-bold">CHILLER C-201</text>

              {/* Extruder Motor Body */}
              <rect x="110" y="380" width="150" height="100" rx="8" fill="#1e293b" stroke="#eab308" strokeWidth="2" />
              <circle cx="185" cy="430" r="26" fill="#422006" stroke="#facc15" strokeWidth="1.5" />
              <text x="185" y="435" textAnchor="middle" className="fill-amber-200 text-[10px] font-mono font-bold">M-301 DRIVE</text>

              {/* Reactor Pipe Vessel */}
              <rect x="570" y="380" width="120" height="110" rx="10" fill="#1e293b" stroke="#a855f7" strokeWidth="2" />
              <text x="630" y="440" textAnchor="middle" className="fill-purple-200 text-[10px] font-mono font-bold">REACTOR P-401</text>

              {/* Silo Vessel */}
              <circle cx="870" cy="470" r="42" fill="#1e293b" stroke="#a855f7" strokeWidth="1.5" />
              <text x="870" y="475" textAnchor="middle" className="fill-purple-200 text-[10px] font-mono font-bold">SILO B</text>

              {/* Render Hotspots for all 14 Sensors */}
              {sensors.map(sensor => {
                const pos = sensorPositions[sensor.id];
                if (!pos) return null;
                const color = getSensorColor(sensor);
                const isSelected = selectedSensorId === sensor.id;
                const analysis = analyses[sensor.id];
                const temp = analysis?.currentTemp || sensor.limits.nominalTemp;

                return (
                  <g
                    key={sensor.id}
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedSensorId(sensor.id);
                      setSelectedMachineId(sensor.equipmentId);
                    }}
                  >
                    {/* Pulsing ring if selected or breach */}
                    {(isSelected || analysis?.severity === 'CRITICAL' || analysis?.severity === 'EMERGENCY') && (
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r="18"
                        fill="none"
                        stroke={color}
                        strokeWidth="1.5"
                        className="animate-ping opacity-60"
                      />
                    )}

                    {/* Sensor Pin Base */}
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="12"
                      fill="#0f172a"
                      stroke={isSelected ? '#38bdf8' : color}
                      strokeWidth={isSelected ? '3' : '2'}
                    />
                    <circle cx={pos.x} cy={pos.y} r="6" fill={color} />

                    {/* Text Pill Badge */}
                    <rect
                      x={pos.x - 30}
                      y={pos.y + 15}
                      width="60"
                      height="18"
                      rx="4"
                      fill="#0f172a"
                      stroke="#334155"
                      strokeWidth="1"
                    />
                    <text
                      x={pos.x}
                      y={pos.y + 27}
                      textAnchor="middle"
                      className="fill-slate-200 text-[9px] font-mono font-bold"
                    >
                      {temp.toFixed(1)}°C
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Machine Inspector Detail Drawer (1 span) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Equipment Telemetry Inspector
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-bold">
                {inspectedSensor.id}
              </span>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <h4 className="text-sm font-bold text-slate-100">{inspectedSensor.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{inspectedSensor.equipmentName}</p>
                <span className="inline-block mt-1 text-[10px] text-cyan-400 font-medium bg-slate-800 px-2 py-0.5 rounded">
                  {inspectedSensor.zone}
                </span>
              </div>

              {/* Current Status Highlights */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Current Temp</span>
                  <span className="text-xl font-bold font-mono text-cyan-300">
                    {inspectedAnalysis ? inspectedAnalysis.currentTemp.toFixed(1) : '--'}°C
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Rolling Baseline</span>
                  <span className="text-xl font-bold font-mono text-slate-300">
                    {inspectedAnalysis ? inspectedAnalysis.currentBaseline.toFixed(1) : '--'}°C
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Rate of Change</span>
                  <span className="text-base font-bold font-mono text-amber-400">
                    {inspectedAnalysis
                      ? `${inspectedAnalysis.rateOfChangePerMin > 0 ? '+' : ''}${inspectedAnalysis.rateOfChangePerMin.toFixed(2)} °C/m`
                      : '--'}
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Anomaly Score</span>
                  <span className="text-base font-bold font-mono text-purple-400">
                    {inspectedAnalysis ? inspectedAnalysis.anomalyScore.toFixed(2) : '--'}
                  </span>
                </div>
              </div>

              {/* Hardware Specifications */}
              <div className="text-[11px] space-y-1.5 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transducer Type:</span>
                  <span className="text-slate-200 font-mono">{inspectedSensor.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nominal Target:</span>
                  <span className="text-slate-200 font-mono">{inspectedSensor.limits.nominalTemp}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Warning High:</span>
                  <span className="text-amber-400 font-mono font-semibold">{inspectedSensor.limits.warningHigh}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Critical High:</span>
                  <span className="text-rose-400 font-mono font-semibold">{inspectedSensor.limits.criticalHigh}°C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Last Calibrated:</span>
                  <span className="text-slate-300 font-mono">{inspectedSensor.lastCalibratedDate}</span>
                </div>
              </div>

              {/* Quick Anomaly Testing on this Inspector */}
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1.5">
                  Simulation Injection for {inspectedSensor.id}:
                </span>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-medium">
                  <button
                    onClick={() => injectAnomaly(inspectedSensor.id, 'DRIFT_UP')}
                    className="bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-200 py-1.5 rounded"
                  >
                    +Drift
                  </button>
                  <button
                    onClick={() => injectAnomaly(inspectedSensor.id, 'SPIKE')}
                    className="bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 py-1.5 rounded"
                  >
                    +Spike
                  </button>
                  <button
                    onClick={() => injectAnomaly(inspectedSensor.id, 'RECOVER')}
                    className="bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800 text-emerald-200 py-1.5 rounded flex items-center justify-center gap-1"
                  >
                    <Zap className="w-2.5 h-2.5" /> Recover
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
