/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { FactoryZone, SensorMetadata } from '../types/telemetry';
import { DriftVelocityRadar } from '../components/predictive/DriftVelocityRadar';
import { TimeToThresholdCard } from '../components/predictive/TimeToThresholdCard';
import { SensorTrustCard } from '../components/predictive/SensorTrustCard';
import { TelemetryChart } from '../components/common/TelemetryChart';
import {
  ShieldAlert,
  Flame,
  Snowflake,
  Cog,
  Pipette,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
} from 'lucide-react';

export const CommandCenter: React.FC<{ onNavigateToPage: (pageId: string) => void }> = ({
  onNavigateToPage,
}) => {
  const {
    sensors,
    analyses,
    history,
    selectedSensorId,
    setSelectedSensorId,
    alerts,
    unreadAlertCount,
  } = useTelemetry();

  const selectedSensor = sensors.find(s => s.id === selectedSensorId) || sensors[0];
  const selectedAnalysis = analyses[selectedSensorId];
  const selectedHistory = history[selectedSensorId] || [];

  // Zone group definitions
  const zoneConfig: {
    zone: FactoryZone;
    icon: React.ReactNode;
    color: string;
    bgGrad: string;
  }[] = [
    {
      zone: 'Furnace and Heat Treatment',
      icon: <Flame className="w-5 h-5 text-orange-400" />,
      color: 'border-orange-500/50',
      bgGrad: 'from-orange-950/20 to-slate-900',
    },
    {
      zone: 'Industrial Cooling',
      icon: <Snowflake className="w-5 h-5 text-sky-400" />,
      color: 'border-sky-500/50',
      bgGrad: 'from-sky-950/20 to-slate-900',
    },
    {
      zone: 'Motor and Bearing Assembly',
      icon: <Cog className="w-5 h-5 text-amber-400" />,
      color: 'border-amber-500/50',
      bgGrad: 'from-amber-950/20 to-slate-900',
    },
    {
      zone: 'Process Pipeline and Storage',
      icon: <Pipette className="w-5 h-5 text-cyan-400" />,
      color: 'border-cyan-500/50',
      bgGrad: 'from-cyan-950/20 to-slate-900',
    },
  ];

  // Global Plant Health Index calculation (0 to 100%)
  const globalHealth = useMemo(() => {
    let scoreSum = 0;
    sensors.forEach(s => {
      const a = analyses[s.id];
      if (!a) {
        scoreSum += 100;
        return;
      }
      let sensorScore = 100;
      if (a.severity === 'EMERGENCY') sensorScore = 10;
      else if (a.severity === 'CRITICAL') sensorScore = 35;
      else if (a.severity === 'WARNING') sensorScore = 70;

      // Penalize for high anomaly score or low trust
      sensorScore = Math.min(sensorScore, (1 - a.anomalyScore) * 100);
      sensorScore = (sensorScore * 0.7) + (a.trustScore * 0.3);
      scoreSum += sensorScore;
    });

    return Math.max(0, Math.min(100, Math.round(scoreSum / sensors.length)));
  }, [sensors, analyses]);

  // Critical alert ticker
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const topCriticalAlert = activeAlerts.find(a => a.severity === 'EMERGENCY' || a.severity === 'CRITICAL');

  return (
    <div className="space-y-5 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Top Banner Alert Ticker if Critical/Emergency active */}
      {topCriticalAlert && (
        <div className="bg-rose-950/80 border border-rose-500/70 p-3.5 rounded-xl flex items-center justify-between text-rose-100 shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded font-mono">
                  {topCriticalAlert.severity} ACTIVE
                </span>
                <span className="text-xs font-semibold">{topCriticalAlert.equipmentName}</span>
                <span className="text-xs text-rose-300 font-mono">({topCriticalAlert.sensorId})</span>
              </div>
              <p className="text-xs text-rose-200 mt-0.5">{topCriticalAlert.message}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedSensorId(topCriticalAlert.sensorId);
              onNavigateToPage('alerts');
            }}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0"
          >
            Manage Alerts <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* High-Level SCADA KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Metric 1: Global Health Index */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Plant Thermal Health</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className={`text-3xl font-extrabold font-mono ${
                globalHealth > 85 ? 'text-emerald-400' : globalHealth > 65 ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {globalHealth}%
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {globalHealth > 85 ? 'Optimal' : globalHealth > 65 ? 'Thermal Drift' : 'Critical Breaches'}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full transition-all duration-700 ${
                globalHealth > 85 ? 'bg-emerald-500' : globalHealth > 65 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${globalHealth}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Active Sensors */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Monitored Probes</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold font-mono text-slate-100">
              {sensors.filter(s => s.status === 'ONLINE').length}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ {sensors.length} Online</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Across 4 factory physical zones
          </p>
        </div>

        {/* Metric 3: Active Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Unresolved Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span
              className={`text-3xl font-extrabold font-mono ${
                unreadAlertCount > 0 ? 'text-amber-400' : 'text-slate-100'
              }`}
            >
              {unreadAlertCount}
            </span>
            <span className="text-xs text-slate-400">Events Active</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {activeAlerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'EMERGENCY').length} require immediate intervention
          </p>
        </div>

        {/* Metric 4: Max Drift Velocity */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Peak Drift Velocity</span>
            <TrendingUp className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold font-mono text-rose-400">
              {Math.max(...Object.values(analyses).map(a => Math.abs(a.rateOfChangePerMin || 0))).toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-mono">°C/min</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Thermal rate vector maximum
          </p>
        </div>
      </div>

      {/* Zone Overview Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-200 tracking-wide flex items-center gap-2">
            Factory Zone SCADA Heatmaps & Telemetry
          </h2>
          <button
            onClick={() => onNavigateToPage('digital-twin')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
          >
            Launch 2D Digital Twin <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {zoneConfig.map(cfg => {
            const zoneSensors = sensors.filter(s => s.zone === cfg.zone);
            const hasBreach = zoneSensors.some(s => {
              const a = analyses[s.id];
              return a && (a.severity === 'CRITICAL' || a.severity === 'EMERGENCY');
            });
            const hasWarning = zoneSensors.some(s => {
              const a = analyses[s.id];
              return a && a.severity === 'WARNING';
            });

            return (
              <div
                key={cfg.zone}
                className={`bg-gradient-to-b ${cfg.bgGrad} border ${
                  hasBreach ? 'border-rose-500/80' : hasWarning ? 'border-amber-500/80' : 'border-slate-800'
                } rounded-xl p-4 flex flex-col justify-between shadow-sm transition-all hover:border-slate-700`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="p-2 bg-slate-800/80 rounded-lg">{cfg.icon}</div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        hasBreach
                          ? 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse'
                          : hasWarning
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {hasBreach ? 'CRITICAL BREACH' : hasWarning ? 'DRIFT WARNING' : 'NORMAL'}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-100 mt-2.5 line-clamp-1">{cfg.zone}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{zoneSensors.length} active sensor channels</p>
                </div>

                {/* Sensor List in this zone */}
                <div className="mt-3.5 space-y-1.5 pt-2.5 border-t border-slate-800/80">
                  {zoneSensors.map(sensor => {
                    const analysis = analyses[sensor.id];
                    const isSelected = selectedSensorId === sensor.id;
                    const temp = analysis?.currentTemp || sensor.limits.nominalTemp;

                    return (
                      <button
                        key={sensor.id}
                        onClick={() => setSelectedSensorId(sensor.id)}
                        className={`w-full text-left p-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                          isSelected
                            ? 'bg-cyan-950/80 border border-cyan-700/80 text-cyan-200'
                            : 'bg-slate-800/40 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-mono font-bold text-[10px] text-slate-400">{sensor.id}</span>
                          <span className="truncate text-[11px]">{sensor.name.split(' ')[0]}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 font-mono">
                          <span className="font-semibold">{temp.toFixed(1)}°C</span>
                          {analysis?.severity === 'CRITICAL' || analysis?.severity === 'EMERGENCY' ? (
                            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                          ) : analysis?.severity === 'WARNING' ? (
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Focus: Live Oscilloscope & Predictive Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart Column (2 spans) */}
        <div className="lg:col-span-2 space-y-4">
          <TelemetryChart
            sensor={selectedSensor}
            points={selectedHistory}
            analysis={selectedAnalysis}
            height={340}
            showProjection={true}
          />

          {/* Quick Case Study Carousel Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-cyan-400 uppercase font-mono font-bold tracking-wider">
                Reproducible Simulation Laboratory
              </span>
              <h3 className="text-xs font-bold text-slate-200 mt-0.5">
                4 Incident Case Studies: Furnace Drift, Cooling Cavitation, Bearing Seizure, Sensor vs Genuine Fault
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Test early-warning response procedures with step-by-step reproducible scenario runs.
              </p>
            </div>
            <button
              onClick={() => onNavigateToPage('case-studies')}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors shrink-0 flex items-center gap-1.5"
            >
              Open Case Studies <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Predictive Widgets Column (1 span) */}
        <div className="space-y-4">
          <DriftVelocityRadar height={240} />
          <TimeToThresholdCard />
          <SensorTrustCard />
        </div>
      </div>
    </div>
  );
};
