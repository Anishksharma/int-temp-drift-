/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { MachineLimits } from '../types/telemetry';
import {
  Settings,
  FileText,
  Save,
  Volume2,
  VolumeX,
  Bell,
  CheckCircle2,
  Sliders,
  Shield,
  Download,
  Printer,
} from 'lucide-react';

export const ReportsAndSettings: React.FC = () => {
  const {
    sensors,
    updateSensorLimits,
    soundEnabled,
    setSoundEnabled,
    showModalOnCritical,
    setShowModalOnCritical,
    browserNotificationsEnabled,
    requestBrowserNotifications,
    alerts,
    analyses,
  } = useTelemetry();

  const [selectedSensorToEdit, setSelectedSensorToEdit] = useState<string>(sensors[0].id);
  const currentSensor = sensors.find(s => s.id === selectedSensorToEdit) || sensors[0];

  // Editable limits form state
  const [formLimits, setFormLimits] = useState<MachineLimits>(currentSensor.limits);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Sync form when selected sensor changes
  const handleSelectSensor = (sensorId: string) => {
    setSelectedSensorToEdit(sensorId);
    const target = sensors.find(s => s.id === sensorId);
    if (target) {
      setFormLimits(target.limits);
      setSavedSuccess(false);
    }
  };

  const handleSaveLimits = (e: React.FormEvent) => {
    e.preventDefault();
    updateSensorLimits(selectedSensorToEdit, formLimits);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  // Executive Compliance Report Generation
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);

  const generateShiftReport = () => {
    const totalAlerts = alerts.length;
    const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'EMERGENCY').length;
    const warningCount = alerts.filter(a => a.severity === 'WARNING').length;
    const resolvedCount = alerts.filter(a => a.status === 'RESOLVED').length;

    const report = `================================================================================
THERMODRIFT INDUSTRIAL COMPLIANCE & THERMAL EXCURSION SHIFT REPORT
Generated: ${new Date().toISOString()} | Shift: Day Shift Deck 1
Facility: Apex Advanced Processing Plant #4 | Control Room: Main SCADA
================================================================================

1. EXECUTIVE SUMMARY & COMPLIANCE VERIFICATION
- Total Sensor Channels Monitored: ${sensors.length}
- Online Channels: ${sensors.filter(s => s.status === 'ONLINE').length}
- Degraded / Offline Probes: ${sensors.filter(s => s.status === 'OFFLINE').length}
- Shift Compliance Rating: ${criticalCount === 0 ? 'CLASS A - 100% OPERATIONAL' : 'CLASS B - ACTIVE ANOMALIES LOGGED'}

2. INCIDENT & DRIFT SUMMARY
- Total Qualified Events: ${totalAlerts}
- Emergency / Critical Breaches: ${criticalCount}
- Incipient Drift Warnings: ${warningCount}
- Successfully Resolved / Remediated: ${resolvedCount}

3. ZONE HEALTH ASSESSMENT
- Furnace and Heat Treatment: ${analyses['F-101']?.currentTemp.toFixed(1)}°C (Nominal: 850°C) - Status: ${analyses['F-101']?.severity || 'NORMAL'}
- Industrial Cooling & Chillers: ${analyses['C-201']?.currentTemp.toFixed(1)}°C (Nominal: 4.2°C) - Status: ${analyses['C-201']?.severity || 'NORMAL'}
- Motor & Bearing Assembly: ${analyses['M-301']?.currentTemp.toFixed(1)}°C (Nominal: 52°C) - Status: ${analyses['M-301']?.severity || 'NORMAL'}
- Process Pipeline & Storage: ${analyses['P-401']?.currentTemp.toFixed(1)}°C (Nominal: 145°C) - Status: ${analyses['P-401']?.severity || 'NORMAL'}

4. PREVENTIVE RECOMMENDATIONS
- Calibrate thermocouple probe F-103 during next scheduled 8-hour cold shutdown.
- Verify primary glycol pump cavitation acoustic signature before next shift handover.
================================================================================
Authorized by: Certified Process Safety Automation Lead
`;
    setGeneratedReport(report);
  };

  return (
    <div className="space-y-4 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Operating Limits & Compliance Reporting
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Per-machine thermal boundaries, rate-of-change caps, hysteresis buffers, and executive compliance exports
          </p>
        </div>

        <button
          onClick={generateShiftReport}
          className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
        >
          <FileText className="w-4 h-4" />
          Generate Shift Audit Report
        </button>
      </div>

      {/* Generated Report Display if open */}
      {generatedReport && (
        <div className="bg-slate-950 border border-cyan-500/80 rounded-xl p-4 space-y-3 font-mono text-xs text-slate-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-cyan-400">Official Shift Audit Report Preview</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button
                onClick={() => setGeneratedReport(null)}
                className="text-slate-400 hover:text-slate-200 text-xs px-2 py-1"
              >
                Close
              </button>
            </div>
          </div>
          <pre className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            {generatedReport}
          </pre>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Machine Operating Limits Configuration (2 spans) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Per-Machine Operating Threshold Calibration
              </h3>
            </div>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Limits Saved Successfully!
              </span>
            )}
          </div>

          {/* Select Sensor to Edit */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
            <span className="text-slate-400 font-semibold">Select Machine:</span>
            {sensors.map(s => (
              <button
                key={s.id}
                onClick={() => handleSelectSensor(s.id)}
                className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  selectedSensorToEdit === s.id
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {s.id}
              </button>
            ))}
          </div>

          {/* Limits Form */}
          <form onSubmit={handleSaveLimits} className="space-y-4 pt-2">
            <div className="text-xs text-slate-400">
              Configuring operating boundaries for{' '}
              <strong className="text-slate-200 font-mono">{currentSensor.name}</strong> ({currentSensor.equipmentName})
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Nominal Operating Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formLimits.nominalTemp}
                  onChange={e => setFormLimits({ ...formLimits, nominalTemp: parseFloat(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg p-2 font-mono outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Warning High Threshold (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formLimits.warningHigh}
                  onChange={e => setFormLimits({ ...formLimits, warningHigh: parseFloat(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 text-amber-300 rounded-lg p-2 font-mono outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Critical High Threshold (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formLimits.criticalHigh}
                  onChange={e => setFormLimits({ ...formLimits, criticalHigh: parseFloat(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 text-rose-300 rounded-lg p-2 font-mono outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Emergency High Limit (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formLimits.emergencyHigh}
                  onChange={e => setFormLimits({ ...formLimits, emergencyHigh: parseFloat(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 text-rose-400 font-bold rounded-lg p-2 font-mono outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Max Allowable Velocity dT/dt (°C/min)
                </label>
                <input
                  type="number"
                  step="0.2"
                  value={formLimits.maxRateOfChange}
                  onChange={e => setFormLimits({ ...formLimits, maxRateOfChange: parseFloat(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg p-2 font-mono outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Drift Warning Percentage (%)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formLimits.driftThresholdPercent}
                  onChange={e => setFormLimits({ ...formLimits, driftThresholdPercent: parseFloat(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 text-slate-100 rounded-lg p-2 font-mono outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors shadow-sm"
              >
                <Save className="w-4 h-4" /> Save Operating Boundaries
              </button>
            </div>
          </form>
        </div>

        {/* Global Alert Notification Engine Settings (1 span) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Alert Engine & Dispatch Preferences
              </h3>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              {/* Critical Modal Toggle */}
              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <div>
                  <span className="font-semibold text-slate-200 block">Critical Event Modal Popup</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Instantly surface high-priority takeover modal on Emergency & Critical trips
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={showModalOnCritical}
                  onChange={e => setShowModalOnCritical(e.target.checked)}
                  className="accent-cyan-400 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Sound Alarm Toggle */}
              <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                <div>
                  <span className="font-semibold text-slate-200 block">Web Audio Synthesizer Alarm</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Generate audible sawtooth/sine alarm beeps on critical deviations
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={e => setSoundEnabled(e.target.checked)}
                  className="accent-cyan-400 w-4 h-4 cursor-pointer"
                />
              </label>

              {/* Browser Push Notifications */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block">Desktop Browser Notifications</span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Status: {browserNotificationsEnabled ? 'Permission Granted' : 'Requires Permission'}
                  </p>
                </div>
                <button
                  onClick={requestBrowserNotifications}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-[11px] font-medium border border-slate-700"
                >
                  {browserNotificationsEnabled ? 'Granted' : 'Request'}
                </button>
              </div>

              {/* Hysteresis & Deduplication Info */}
              <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-200 block">Hysteresis & Cooldown Rules:</span>
                <div>• Hysteresis Buffer: <strong>1.5°C</strong> (prevents boundary flickering)</div>
                <div>• Alert Deduplication Window: <strong>25 seconds</strong></div>
                <div>• Persistence Requirement: <strong>&gt;= 3 consecutive samples</strong></div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-mono">
            Configuration persisted in browser local storage and shared SCADA store.
          </div>
        </div>
      </div>
    </div>
  );
};
