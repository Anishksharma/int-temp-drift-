/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { WhatIfSimulator } from '../components/predictive/WhatIfSimulator';
import {
  HeartPulse,
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Sliders,
  FileCheck,
} from 'lucide-react';

export const EquipmentHealth: React.FC = () => {
  const { sensors, analyses, selectedSensorId, setSelectedSensorId } = useTelemetry();
  const [workOrderCreated, setWorkOrderCreated] = useState<string | null>(null);

  // Equipment groups mapped from sensors
  const equipmentList = [
    {
      id: 'EQ-FUR-01',
      name: 'Continuous Annealing Furnace #1',
      zone: 'Furnace and Heat Treatment',
      sensorId: 'F-101',
      operatingHours: 14280,
      mtbfHours: 18500,
      nextMaintenanceDays: 14,
      thermalStressIndex: 78,
    },
    {
      id: 'EQ-CHL-01',
      name: 'Screw Compressor Chiller Unit A',
      zone: 'Industrial Cooling',
      sensorId: 'C-201',
      operatingHours: 9400,
      mtbfHours: 12000,
      nextMaintenanceDays: 28,
      thermalStressIndex: 42,
    },
    {
      id: 'EQ-EXT-01',
      name: 'Co-Rotating Twin Screw Extruder 250kW',
      zone: 'Motor and Bearing Assembly',
      sensorId: 'M-301',
      operatingHours: 6200,
      mtbfHours: 8000,
      nextMaintenanceDays: 9,
      thermalStressIndex: 65,
    },
    {
      id: 'EQ-STM-02',
      name: 'Boiler Main Steam Superheater Header',
      zone: 'Process Pipeline and Storage',
      sensorId: 'P-402',
      operatingHours: 21500,
      mtbfHours: 25000,
      nextMaintenanceDays: 45,
      thermalStressIndex: 54,
    },
    {
      id: 'EQ-HYD-02',
      name: 'Rexroth 75kW Hydraulic Pump Motor',
      zone: 'Motor and Bearing Assembly',
      sensorId: 'M-302',
      operatingHours: 11100,
      mtbfHours: 15000,
      nextMaintenanceDays: 32,
      thermalStressIndex: 38,
    },
    {
      id: 'EQ-HEX-02',
      name: 'Stainless Plate Heat Exchanger HX-2',
      zone: 'Industrial Cooling',
      sensorId: 'C-202',
      operatingHours: 8200,
      mtbfHours: 14000,
      nextMaintenanceDays: 60,
      thermalStressIndex: 25,
    },
  ];

  return (
    <div className="space-y-4 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-slate-100">
              Plant Equipment Health & Reliability Index
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Degradation tracking, MTBF operational estimations, thermal stress indices, and proactive work orders
          </p>
        </div>

        {workOrderCreated && (
          <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Work Order #{workOrderCreated} generated and routed to maintenance dispatch!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Equipment List (2 spans) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {equipmentList.map(eq => {
              const analysis = analyses[eq.sensorId];
              const isSelected = selectedSensorId === eq.sensorId;
              const healthScore = Math.max(10, Math.min(100, 100 - (eq.thermalStressIndex * 0.5) - (analysis ? analysis.anomalyScore * 40 : 0)));

              return (
                <div
                  key={eq.id}
                  onClick={() => setSelectedSensorId(eq.sensorId)}
                  className={`bg-slate-900 border rounded-xl p-4 cursor-pointer transition-all shadow-sm ${
                    isSelected
                      ? 'border-cyan-500/80 bg-cyan-950/20 ring-1 ring-cyan-500/40'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">{eq.id}</span>
                      <h4 className="text-xs font-bold text-slate-100 mt-0.5 line-clamp-1">{eq.name}</h4>
                      <p className="text-[10px] text-slate-400">{eq.zone}</p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-lg font-extrabold font-mono ${
                          healthScore > 80
                            ? 'text-emerald-400'
                            : healthScore > 60
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {Math.round(healthScore)}%
                      </span>
                      <span className="block text-[9px] uppercase font-bold text-slate-400">Health Index</span>
                    </div>
                  </div>

                  {/* Operational Metrics */}
                  <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-400 block text-[9px]">Run Hours</span>
                      <span className="text-slate-200">{eq.operatingHours.toLocaleString()}h</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">MTBF Target</span>
                      <span className="text-slate-200">{eq.mtbfHours.toLocaleString()}h</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px]">Next Service</span>
                      <span className="text-amber-400">{eq.nextMaintenanceDays} days</span>
                    </div>
                  </div>

                  {/* Thermal Stress Progress */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>Thermal Stress Index</span>
                      <span className="font-mono">{eq.thermalStressIndex} / 100</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          eq.thermalStressIndex > 70
                            ? 'bg-rose-500'
                            : eq.thermalStressIndex > 40
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                        }`}
                        style={{ width: `${eq.thermalStressIndex}%` }}
                      />
                    </div>
                  </div>

                  {/* Work Order Action */}
                  <div className="mt-3.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-400">
                      Probe: <strong>{eq.sensorId}</strong> ({analysis ? `${analysis.currentTemp.toFixed(1)}°C` : ''})
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        const woId = `WO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
                        setWorkOrderCreated(woId);
                        setTimeout(() => setWorkOrderCreated(null), 6000);
                      }}
                      className="text-[10px] bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 px-2 py-1 rounded transition-colors font-semibold flex items-center gap-1"
                    >
                      <Wrench className="w-3 h-3" /> Issue Work Order
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: What-If Maintenance Simulator (1 span) */}
        <div>
          <WhatIfSimulator />
        </div>
      </div>
    </div>
  );
};
