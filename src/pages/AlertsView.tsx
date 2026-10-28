/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import { AlertSeverity, AlertStatus, IndustrialAlert } from '../types/telemetry';
import {
  Bell,
  CheckCircle2,
  Search,
  UserCheck,
  AlertTriangle,
  ShieldAlert,
  Info,
  Trash2,
  ExternalLink,
  Filter,
} from 'lucide-react';

export const AlertsView: React.FC<{ onInspectSensor?: (sensorId: string) => void }> = ({
  onInspectSensor,
}) => {
  const {
    alerts,
    unreadAlertCount,
    acknowledgeAlert,
    investigateAlert,
    assignAlert,
    resolveAlert,
    clearResolvedAlerts,
    setSelectedSensorId,
  } = useTelemetry();

  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Resolve modal state
  const [resolvingAlertId, setResolvingAlertId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState<string>('');

  // Assign dropdown state
  const [assigningAlertId, setAssigningAlertId] = useState<string | null>(null);
  const [assigneeName, setAssigneeName] = useState<string>('Sarah Chen (Thermal Lead)');

  const engineers = [
    'Sarah Chen (Thermal Lead)',
    'Dave Miller (Maintenance Lead)',
    'Alex Ross (Electrical Instrumentation)',
    'Marcus Vance (Process Safety Officer)',
    'Elena Rostova (Shift Supervisor)',
  ];

  // Filtered alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      if (severityFilter !== 'ALL' && alert.severity !== severityFilter) return false;
      if (statusFilter !== 'ALL' && alert.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          alert.sensorId.toLowerCase().includes(q) ||
          alert.sensorName.toLowerCase().includes(q) ||
          alert.equipmentName.toLowerCase().includes(q) ||
          alert.message.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [alerts, severityFilter, statusFilter, searchQuery]);

  return (
    <div className="space-y-4 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-slate-100">
              Alerts & Incident Notification Center
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Deduplicated industrial incident logging, alarm hysteresis, and engineer assignment audit trail
          </p>
        </div>

        <div className="flex items-center gap-2">
          {alerts.some(a => a.status === 'RESOLVED') && (
            <button
              onClick={clearResolvedAlerts}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Resolved History
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Severity Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <span className="text-slate-400 font-semibold mr-1">Severity:</span>
          {(['ALL', 'EMERGENCY', 'CRITICAL', 'WARNING', 'INFO'] as const).map(sev => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                severityFilter === sev
                  ? sev === 'EMERGENCY'
                    ? 'bg-rose-600 text-white font-bold'
                    : sev === 'CRITICAL'
                    ? 'bg-rose-950 text-rose-300 border border-rose-700 font-bold'
                    : sev === 'WARNING'
                    ? 'bg-amber-950 text-amber-300 border border-amber-700 font-bold'
                    : 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-xs outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="INVESTIGATING">Investigating</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <input
            type="text"
            placeholder="Search incident logs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-xs outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Resolve Dialog Popover */}
      {resolvingAlertId && (
        <div className="bg-slate-900 border border-emerald-600/80 p-4 rounded-xl text-xs space-y-2">
          <h4 className="font-bold text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Resolve Incident #{resolvingAlertId}
          </h4>
          <p className="text-slate-300 text-[11px]">
            Record root cause findings, corrective actions performed, and return equipment to nominal baseline.
          </p>
          <textarea
            value={resolveNotes}
            onChange={e => setResolveNotes(e.target.value)}
            placeholder="e.g. Cleared stuck chiller expansion valve, adjusted damper bypass..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 text-xs focus:ring-1 focus:ring-emerald-400 outline-none"
            rows={2}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setResolvingAlertId(null);
                setResolveNotes('');
              }}
              className="px-3 py-1 text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                resolveAlert(resolvingAlertId, 'Lead Operator', resolveNotes || 'Standard SOP resolution');
                setResolvingAlertId(null);
                setResolveNotes('');
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Resolution
            </button>
          </div>
        </div>
      )}

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-400 text-xs">
            No alerts found matching current filter criteria.
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isEmergency = alert.severity === 'EMERGENCY';
            const isCritical = alert.severity === 'CRITICAL';
            const isWarning = alert.severity === 'WARNING';

            return (
              <div
                key={alert.id}
                className={`bg-slate-900 border rounded-xl p-4 transition-all shadow-sm ${
                  alert.status === 'RESOLVED'
                    ? 'border-slate-800 opacity-60'
                    : isEmergency
                    ? 'border-rose-500/80 bg-rose-950/20'
                    : isCritical
                    ? 'border-rose-600/60 bg-rose-950/10'
                    : isWarning
                    ? 'border-amber-600/50 bg-amber-950/10'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        isEmergency
                          ? 'bg-rose-600 text-white animate-pulse'
                          : isCritical
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : isWarning
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-slate-800 text-cyan-400'
                      }`}
                    >
                      {isEmergency || isCritical ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                            isEmergency
                              ? 'bg-rose-600 text-white'
                              : isCritical
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : isWarning
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          }`}
                        >
                          {alert.severity}
                        </span>

                        <span className="text-xs font-mono font-bold text-slate-200">
                          {alert.sensorId} • {alert.sensorName}
                        </span>

                        <span className="text-[10px] text-slate-400">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-slate-100 mt-1">
                        {alert.message}
                      </h4>

                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        {alert.detail}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-mono text-slate-400">
                        <span>Triggered Value: <strong className="text-rose-400">{alert.triggeredValue}°C</strong></span>
                        <span>Threshold Limit: <strong className="text-slate-300">{alert.thresholdValue}°C</strong></span>
                        <span>Zone: <span className="text-cyan-400">{alert.zone}</span></span>
                      </div>

                      {/* Audit Trail Details */}
                      {(alert.acknowledgedBy || alert.investigatedBy || alert.resolvedBy) && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap gap-3">
                          {alert.acknowledgedBy && (
                            <span className="text-emerald-400">
                              ✓ Acknowledged by {alert.acknowledgedBy} at {new Date(alert.acknowledgedAt!).toLocaleTimeString()}
                            </span>
                          )}
                          {alert.investigatedBy && (
                            <span className="text-cyan-400">
                              🔍 Assigned to {alert.investigatedBy}
                            </span>
                          )}
                          {alert.resolvedBy && (
                            <span className="text-purple-400">
                              ★ Resolved by {alert.resolvedBy}: "{alert.rootCauseNotes}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for this alert */}
                  <div className="flex flex-wrap items-center gap-1.5 self-start">
                    {alert.status === 'ACTIVE' && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id, 'Shift Operator')}
                        className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Acknowledge
                      </button>
                    )}

                    {alert.status !== 'RESOLVED' && (
                      <>
                        <button
                          onClick={() => {
                            investigateAlert(alert.id, 'Lead Engineer');
                            setSelectedSensorId(alert.sensorId);
                            if (onInspectSensor) onInspectSensor(alert.sensorId);
                          }}
                          className="flex items-center gap-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-200 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Search className="w-3.5 h-3.5 text-cyan-400" />
                          Investigate
                        </button>

                        <button
                          onClick={() => setAssigningAlertId(assigningAlertId === alert.id ? null : alert.id)}
                          className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          Assign
                        </button>

                        <button
                          onClick={() => setResolvingAlertId(alert.id)}
                          className="flex items-center gap-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          Resolve
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Inline Assign Drawer */}
                {assigningAlertId === alert.id && (
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2">
                    <span className="text-slate-400 text-xs">Assign incident to:</span>
                    <select
                      value={assigneeName}
                      onChange={e => setAssigneeName(e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 outline-none"
                    >
                      {engineers.map(eng => (
                        <option key={eng} value={eng}>{eng}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        assignAlert(alert.id, assigneeName);
                        setAssigningAlertId(null);
                      }}
                      className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
                    >
                      Confirm Assignment
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
