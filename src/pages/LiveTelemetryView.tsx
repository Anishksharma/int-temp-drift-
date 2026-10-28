/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { TelemetryChart } from '../components/common/TelemetryChart';
import { FactoryZone, SensorMetadata } from '../types/telemetry';
import {
  Activity,
  Download,
  Filter,
  CheckSquare,
  Square,
  TrendingUp,
  AlertTriangle,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';

export const LiveTelemetryView: React.FC = () => {
  const {
    sensors,
    analyses,
    history,
    selectedSensorId,
    setSelectedSensorId,
    selectedZone,
    setSelectedZone,
    activeHistoricalDataset,
    viewHistoricalAlongside,
    setViewHistoricalAlongside,
  } = useTelemetry();

  const [searchFilter, setSearchFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const currentSensor = sensors.find(s => s.id === selectedSensorId) || sensors[0];
  const currentAnalysis = analyses[selectedSensorId];
  const currentPoints = history[selectedSensorId] || [];

  // Filtered sensor list
  const filteredSensors = useMemo(() => {
    return sensors.filter(sensor => {
      if (selectedZone !== 'ALL' && sensor.zone !== selectedZone) return false;
      if (searchFilter) {
        const query = searchFilter.toLowerCase();
        const matches =
          sensor.id.toLowerCase().includes(query) ||
          sensor.name.toLowerCase().includes(query) ||
          sensor.equipmentName.toLowerCase().includes(query);
        if (!matches) return false;
      }
      if (severityFilter !== 'ALL') {
        const a = analyses[sensor.id];
        if (severityFilter === 'ANOMALY' && (!a || a.severity === 'NORMAL')) return false;
        if (severityFilter === 'CRITICAL' && (!a || (a.severity !== 'CRITICAL' && a.severity !== 'EMERGENCY'))) return false;
      }
      return true;
    });
  }, [sensors, selectedZone, searchFilter, severityFilter, analyses]);

  // CSV Export Functionality
  const exportTelemetryCSV = () => {
    const points = currentPoints;
    if (points.length === 0) return;

    const headers = ['Timestamp_ISO', 'Timestamp_Epoch_ms', 'Sensor_ID', 'Temperature_C', 'Baseline_C', 'RateOfChange_C_per_min', 'Anomaly_Score', 'SNR_dB', 'Is_Simulated'];
    const rows = points.map(p => [
      new Date(p.timestamp).toISOString(),
      p.timestamp,
      p.sensorId,
      p.temperature,
      p.baseline,
      p.rateOfChange,
      p.anomalyScore,
      p.snrDb,
      p.isSimulated ? 'TRUE' : 'FALSE',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentSensor.id}_telemetry_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">Live Multi-Channel Telemetry Stream</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time physical transducer monitoring with baseline drift, velocity vectors, and high-frequency resolution
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeHistoricalDataset && (
            <button
              onClick={() => setViewHistoricalAlongside(!viewHistoricalAlongside)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                viewHistoricalAlongside
                  ? 'bg-purple-950 text-purple-300 border-purple-700'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-purple-400" />
              {viewHistoricalAlongside ? 'Historical Overlay: ON' : 'Historical Overlay: OFF'}
            </button>
          )}

          <button
            onClick={exportTelemetryCSV}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Export Telemetry (.CSV)
          </button>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="space-y-4">
        <TelemetryChart
          sensor={currentSensor}
          points={currentPoints}
          analysis={currentAnalysis}
          historicalPoints={
            viewHistoricalAlongside && activeHistoricalDataset?.mappedTelemetry
              ? activeHistoricalDataset.mappedTelemetry
              : undefined
          }
          height={340}
          showProjection={true}
        />

        {/* Live Filter Bar for Sensors */}
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Zone Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-slate-400 font-semibold mr-1">Zone:</span>
            {(['ALL', 'Furnace and Heat Treatment', 'Industrial Cooling', 'Motor and Bearing Assembly', 'Process Pipeline and Storage'] as const).map(z => (
              <button
                key={z}
                onClick={() => setSelectedZone(z)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedZone === z
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {z === 'ALL' ? 'All Zones' : z.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Search & Severity Filters */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search sensor ID or machine..."
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-xs outline-none focus:border-cyan-500"
            />
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-xs outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ANOMALY">Any Anomaly</option>
              <option value="CRITICAL">Critical Only</option>
            </select>
          </div>
        </div>

        {/* Live Sensor Table with Sparklines */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Sensor & Equipment</th>
                  <th className="py-3 px-3">Live Reading</th>
                  <th className="py-3 px-3">Rolling Baseline</th>
                  <th className="py-3 px-3">Thermal Drift</th>
                  <th className="py-3 px-3">Velocity (dT/dt)</th>
                  <th className="py-3 px-3">Anomaly Score</th>
                  <th className="py-3 px-3">Trust Score</th>
                  <th className="py-3 px-3">Sparkline</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredSensors.map(sensor => {
                  const isSelected = selectedSensorId === sensor.id;
                  const analysis = analyses[sensor.id];
                  const sensorPts = history[sensor.id] || [];
                  const temp = analysis ? analysis.currentTemp : sensor.limits.nominalTemp;
                  const baseline = analysis ? analysis.currentBaseline : sensor.limits.nominalTemp;
                  const absDev = analysis ? analysis.absDeviation : 0;
                  const roc = analysis ? analysis.rateOfChangePerMin : 0;
                  const anomalyScore = analysis ? analysis.anomalyScore : 0.05;
                  const trustScore = analysis ? analysis.trustScore : 98;
                  const severity = analysis ? analysis.severity : 'NORMAL';

                  // Sparkline mini SVG (last 20 points)
                  const recent = sensorPts.slice(-20);
                  const minS = Math.min(...recent.map(r => r.temperature), sensor.limits.nominalTemp - 5);
                  const maxS = Math.max(...recent.map(r => r.temperature), sensor.limits.nominalTemp + 5);
                  const spanS = Math.max(1, maxS - minS);
                  const sparkPoints = recent
                    .map((p, idx) => {
                      const x = (idx / Math.max(1, recent.length - 1)) * 60;
                      const y = 20 - ((p.temperature - minS) / spanS) * 16 - 2;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(' ');

                  return (
                    <tr
                      key={sensor.id}
                      onClick={() => setSelectedSensorId(sensor.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-cyan-950/40 hover:bg-cyan-950/60 font-semibold'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-sans">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cyan-400">{sensor.id}</span>
                          <div>
                            <div className="text-slate-200 font-medium text-xs">{sensor.name}</div>
                            <div className="text-[10px] text-slate-400">{sensor.equipmentName}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="text-sm font-bold text-slate-100">{temp.toFixed(1)}°C</span>
                      </td>

                      <td className="py-2.5 px-3 text-slate-400">{baseline.toFixed(1)}°C</td>

                      <td className="py-2.5 px-3">
                        <span className={absDev > 5 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                          {absDev > 0 ? '+' : ''}{absDev.toFixed(1)}°C ({analysis?.percentDeviation.toFixed(1)}%)
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={Math.abs(roc) > 2 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {roc > 0 ? '+' : ''}{roc.toFixed(2)} °C/m
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                anomalyScore > 0.7
                                  ? 'bg-rose-500'
                                  : anomalyScore > 0.4
                                  ? 'bg-amber-400'
                                  : 'bg-cyan-400'
                              }`}
                              style={{ width: `${anomalyScore * 100}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-300">{anomalyScore.toFixed(2)}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`font-bold ${
                            trustScore > 80 ? 'text-emerald-400' : trustScore > 50 ? 'text-amber-400' : 'text-rose-400'
                          }`}
                        >
                          {trustScore}%
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <svg width="60" height="20" className="overflow-visible">
                          <polyline
                            points={sparkPoints}
                            fill="none"
                            stroke={severity === 'CRITICAL' ? '#f43f5e' : severity === 'WARNING' ? '#f59e0b' : '#06b6d4'}
                            strokeWidth="1.5"
                          />
                        </svg>
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                            severity === 'EMERGENCY'
                              ? 'bg-rose-500 text-white'
                              : severity === 'CRITICAL'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : severity === 'WARNING'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {severity}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
