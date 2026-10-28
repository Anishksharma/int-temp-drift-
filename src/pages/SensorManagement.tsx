/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { SensorMetadata } from '../types/telemetry';
import {
  SlidersHorizontal,
  Wrench,
  Radio,
  CheckCircle2,
  Calendar,
  Layers,
  Activity,
  AlertOctagon,
} from 'lucide-react';

export const SensorManagement: React.FC = () => {
  const {
    sensors,
    analyses,
    updateSensorOffset,
    selectedSensorId,
    setSelectedSensorId,
  } = useTelemetry();

  const [activeCalibratingSensorId, setActiveCalibratingSensorId] = useState<string | null>(null);
  const [tempOffset, setTempOffset] = useState<number>(0);

  const startCalibration = (sensor: SensorMetadata) => {
    setActiveCalibratingSensorId(sensor.id);
    setTempOffset(sensor.currentOffset || 0);
  };

  const saveCalibration = (sensorId: string) => {
    updateSensorOffset(sensorId, tempOffset);
    setActiveCalibratingSensorId(null);
  };

  return (
    <div className="space-y-4 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Sensor Registry & Transducer Management
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Calibration offsets, signal-to-noise diagnostic monitoring, hardware transducer types, and trust scores
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
          <span className="text-slate-400">Total Probes:</span>
          <span className="text-cyan-300 font-bold">{sensors.length} Channels</span>
        </div>
      </div>

      {/* Sensor Calibration Drawer if Active */}
      {activeCalibratingSensorId && (
        <div className="bg-slate-900 border border-cyan-500/80 p-4 rounded-xl text-xs space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-cyan-300 flex items-center gap-2">
              <Wrench className="w-4 h-4" /> Calibration Zero-Point Offset Tool for Probe #{activeCalibratingSensorId}
            </h4>
            <span className="text-xs font-mono text-slate-400">
              Current Applied Offset: {tempOffset > 0 ? '+' : ''}{tempOffset.toFixed(1)}°C
            </span>
          </div>

          <p className="text-slate-300 text-[11px]">
            Adjust the empirical calibration offset to eliminate steady-state thermocouple thermocouple drift and wiring resistance bias.
          </p>

          <div className="flex items-center gap-4">
            <input
              type="range"
              min="-10"
              max="10"
              step="0.1"
              value={tempOffset}
              onChange={e => setTempOffset(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="font-mono font-bold text-cyan-300 text-sm shrink-0 w-16 text-right">
              {tempOffset > 0 ? '+' : ''}{tempOffset.toFixed(1)}°C
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={() => setActiveCalibratingSensorId(null)}
              className="px-3 py-1 text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={() => saveCalibration(activeCalibratingSensorId)}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Commit Calibration
            </button>
          </div>
        </div>
      )}

      {/* Sensors Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Probe ID & Name</th>
                <th className="py-3 px-3">Transducer Type</th>
                <th className="py-3 px-3">Plant Zone</th>
                <th className="py-3 px-3">Last Calibrated</th>
                <th className="py-3 px-3">Sampling Rate</th>
                <th className="py-3 px-3">Offset</th>
                <th className="py-3 px-3">Trust Score</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {sensors.map(sensor => {
                const analysis = analyses[sensor.id];
                const trustScore = analysis ? analysis.trustScore : 98;
                const isSelected = selectedSensorId === sensor.id;

                return (
                  <tr
                    key={sensor.id}
                    onClick={() => setSelectedSensorId(sensor.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-cyan-950/40 hover:bg-cyan-950/60' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-400">{sensor.id}</span>
                        <div>
                          <div className="text-slate-200 font-semibold">{sensor.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{sensor.equipmentName}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-300 font-sans text-xs">
                      {sensor.type}
                    </td>

                    <td className="py-3 px-3 text-slate-400 font-sans text-xs">
                      {sensor.zone}
                    </td>

                    <td className="py-3 px-3 text-slate-400">
                      {sensor.lastCalibratedDate}
                    </td>

                    <td className="py-3 px-3 text-slate-300">
                      {sensor.nominalSamplingRateHz} Hz
                    </td>

                    <td className="py-3 px-3">
                      <span className={sensor.currentOffset !== 0 ? 'text-cyan-400 font-bold' : 'text-slate-400'}>
                        {sensor.currentOffset > 0 ? '+' : ''}{sensor.currentOffset.toFixed(1)}°C
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            trustScore > 80 ? 'text-emerald-400' : trustScore > 50 ? 'text-amber-400' : 'text-rose-400'
                          }`}
                        >
                          {trustScore}%
                        </span>
                        {analysis?.isFlatline && (
                          <span className="text-[9px] bg-rose-950 text-rose-300 px-1 py-0.5 rounded border border-rose-800">
                            STUCK
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          startCalibration(sensor);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded text-[11px] font-sans font-medium transition-colors"
                      >
                        Calibrate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
