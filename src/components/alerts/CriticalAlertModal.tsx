/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { AlertTriangle, ShieldAlert, CheckCircle2, UserCheck, Search, X } from 'lucide-react';

export const CriticalAlertModal: React.FC = () => {
  const {
    criticalModalAlert,
    dismissCriticalModal,
    acknowledgeAlert,
    investigateAlert,
    assignAlert,
    resolveAlert,
    setSelectedSensorId,
  } = useTelemetry();

  const [assignee, setAssignee] = useState<string>('Sarah Chen (Thermal Lead)');
  const [rootCause, setRootCause] = useState<string>('');
  const [showResolveInput, setShowResolveInput] = useState<boolean>(false);

  if (!criticalModalAlert) return null;

  const isEmergency = criticalModalAlert.severity === 'EMERGENCY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl relative ${
          isEmergency
            ? 'bg-gradient-to-b from-rose-950/90 to-slate-950 border-rose-500/80 text-rose-100 ring-2 ring-rose-500/50'
            : 'bg-gradient-to-b from-amber-950/80 to-slate-950 border-amber-500/80 text-amber-100'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={dismissCriticalModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 p-1.5 rounded-lg bg-slate-900/60 transition-colors"
          aria-label="Dismiss Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div
            className={`p-3 rounded-xl shrink-0 ${
              isEmergency ? 'bg-rose-600/30 text-rose-400 animate-pulse' : 'bg-amber-600/30 text-amber-400'
            }`}
          >
            {isEmergency ? <ShieldAlert className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded font-mono ${
                  isEmergency ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950 font-bold'
                }`}
              >
                {criticalModalAlert.severity} EVENT TRIGGERED
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {new Date(criticalModalAlert.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mt-1 leading-snug">
              {criticalModalAlert.message}
            </h3>
          </div>
        </div>

        {/* Event Details Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs space-y-2 mb-5">
          <div className="flex justify-between">
            <span className="text-slate-400">Sensor ID:</span>
            <span className="font-mono font-bold text-slate-200">{criticalModalAlert.sensorId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Machine / Equipment:</span>
            <span className="font-medium text-slate-200">{criticalModalAlert.equipmentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Plant Zone:</span>
            <span className="font-medium text-slate-200">{criticalModalAlert.zone}</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-slate-800">
            <span className="text-slate-400">Recorded Reading:</span>
            <span className="font-mono font-bold text-rose-400 text-sm">
              {criticalModalAlert.triggeredValue}°C
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Threshold Limit:</span>
            <span className="font-mono text-slate-300">{criticalModalAlert.thresholdValue}°C</span>
          </div>
          <p className="text-slate-300 mt-2 text-[11px] leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
            {criticalModalAlert.detail}
          </p>
        </div>

        {/* Resolve Input Box if Active */}
        {showResolveInput ? (
          <div className="mb-4 bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs space-y-2">
            <label className="block text-slate-300 font-semibold">
              Root Cause & Corrective Action Log:
            </label>
            <textarea
              value={rootCause}
              onChange={e => setRootCause(e.target.value)}
              placeholder="e.g. Cleared thermal bypass damper blockage, normalized coolant loop pressure..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:ring-1 focus:ring-emerald-400 outline-none"
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResolveInput(false)}
                className="px-3 py-1 text-slate-400 hover:text-slate-200 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  resolveAlert(criticalModalAlert.id, 'Control Room Operator', rootCause || 'Standard corrective mitigation');
                  dismissCriticalModal();
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Submit Resolution
              </button>
            </div>
          </div>
        ) : null}

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => {
              acknowledgeAlert(criticalModalAlert.id, 'Shift Supervisor');
              dismissCriticalModal();
            }}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 px-3 rounded-xl font-semibold transition-colors border border-slate-700"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Acknowledge Event
          </button>

          <button
            onClick={() => {
              investigateAlert(criticalModalAlert.id, 'Incident Team');
              setSelectedSensorId(criticalModalAlert.sensorId);
              dismissCriticalModal();
            }}
            className="flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white py-2.5 px-3 rounded-xl font-semibold transition-colors shadow-sm"
          >
            <Search className="w-4 h-4" />
            Investigate Telemetry
          </button>

          <div className="flex items-center gap-1 col-span-2">
            <select
              value={assignee}
              onChange={e => setAssignee(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-2.5 py-2 flex-1 outline-none"
            >
              <option value="Sarah Chen (Thermal Lead)">Sarah Chen (Thermal Lead)</option>
              <option value="Dave Miller (Mechanical Maintenance)">Dave Miller (Mechanical Maintenance)</option>
              <option value="Alex Ross (Electrical Instrumentation)">Alex Ross (Electrical Instrumentation)</option>
              <option value="Elena Rostova (Plant Safety Officer)">Elena Rostova (Plant Safety Officer)</option>
            </select>
            <button
              onClick={() => {
                assignAlert(criticalModalAlert.id, assignee);
                dismissCriticalModal();
              }}
              className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl font-medium border border-slate-700 text-xs shrink-0"
            >
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              Assign
            </button>
            <button
              onClick={() => setShowResolveInput(true)}
              className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl font-medium text-xs shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Resolve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
