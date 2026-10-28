/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  FactoryZone,
  AlertSeverity,
  AlertStatus,
  SensorMetadata,
  TelemetryPoint,
  SensorAnalysis,
  IndustrialAlert,
  WhatIfParameters,
  UniversalDocument,
} from '../types/telemetry';
import { INITIAL_SENSORS } from '../utils/sensorRegistry';
import {
  calculateRollingBaseline,
  calculateAbsoluteDeviation,
  calculatePercentDeviation,
  calculateRateOfChange,
  detectFlatline,
  detectMissingData,
  computeAnomalyScore,
  estimateTimeToThreshold,
  calculateSensorTrustScore,
  evaluateSeverityWithHysteresis,
} from '../utils/driftEngine';

export interface TelemetryContextType {
  // Sensors & Configuration
  sensors: SensorMetadata[];
  updateSensorLimits: (sensorId: string, newLimits: Partial<SensorMetadata['limits']>) => void;
  updateSensorOffset: (sensorId: string, offset: number) => void;
  
  // Telemetry Time-Series
  history: Record<string, TelemetryPoint[]>; // sensorId -> points
  analyses: Record<string, SensorAnalysis>; // sensorId -> live analysis
  selectedSensorId: string;
  setSelectedSensorId: (id: string) => void;
  selectedZone: FactoryZone | 'ALL';
  setSelectedZone: (zone: FactoryZone | 'ALL') => void;

  // Simulation Controls
  isPaused: boolean;
  togglePause: () => void;
  simSpeed: number; // 0.5, 1, 2, 5, 10
  setSimSpeed: (speed: number) => void;
  resetSimulation: () => void;
  
  // Anomaly Injection
  injectAnomaly: (
    sensorId: string,
    type: 'DRIFT_UP' | 'DRIFT_DOWN' | 'SPIKE' | 'DROP' | 'NOISE' | 'FLATLINE' | 'OFFLINE' | 'RECOVER'
  ) => void;
  activeOverrides: Record<string, { type: string; intensity: number; remainingSec: number }>;

  // Alerts
  alerts: IndustrialAlert[];
  unreadAlertCount: number;
  criticalModalAlert: IndustrialAlert | null;
  dismissCriticalModal: () => void;
  acknowledgeAlert: (alertId: string, user: string) => void;
  investigateAlert: (alertId: string, user: string) => void;
  assignAlert: (alertId: string, assignee: string) => void;
  resolveAlert: (alertId: string, user: string, rootCause: string) => void;
  clearResolvedAlerts: () => void;

  // Audio & Notification Settings
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  showModalOnCritical: boolean;
  setShowModalOnCritical: (show: boolean) => void;
  browserNotificationsEnabled: boolean;
  requestBrowserNotifications: () => Promise<boolean>;

  // What-If Simulator
  whatIfParams: WhatIfParameters;
  setWhatIfParams: React.Dispatch<React.SetStateAction<WhatIfParameters>>;
  resetWhatIfParams: () => void;

  // Universal Document Integration
  importedDocuments: UniversalDocument[];
  addImportedDocument: (doc: UniversalDocument) => void;
  activeHistoricalDataset: UniversalDocument | null;
  setActiveHistoricalDataset: (doc: UniversalDocument | null) => void;
  viewHistoricalAlongside: boolean;
  setViewHistoricalAlongside: (view: boolean) => void;
}

const TelemetryContext = createContext<TelemetryContextType | null>(null);

// Audio Alert Synthesizer
function playAlarmTone(severity: AlertSeverity) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = severity === 'EMERGENCY' ? 'sawtooth' : severity === 'CRITICAL' ? 'triangle' : 'sine';
    const freq = severity === 'EMERGENCY' ? 880 : severity === 'CRITICAL' ? 660 : 440;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Beep pattern
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Ignore audio autoplay restrictions
  }
}

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sensors, setSensors] = useState<SensorMetadata[]>(INITIAL_SENSORS);
  const [selectedSensorId, setSelectedSensorId] = useState<string>('F-101');
  const [selectedZone, setSelectedZone] = useState<FactoryZone | 'ALL'>('ALL');

  // Simulation Controls
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [activeOverrides, setActiveOverrides] = useState<Record<string, { type: string; intensity: number; remainingSec: number }>>({});

  // Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [showModalOnCritical, setShowModalOnCritical] = useState<boolean>(true);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState<boolean>(false);

  // Critical Alert Modal
  const [criticalModalAlert, setCriticalModalAlert] = useState<IndustrialAlert | null>(null);

  // What-If Simulator
  const [whatIfParams, setWhatIfParams] = useState<WhatIfParameters>({
    sensorCalibrationOffset: 0,
    coolingEfficiencyBoost: 0,
    loadReductionPercent: 0,
    replaceFaultySensor: false,
  });

  const resetWhatIfParams = useCallback(() => {
    setWhatIfParams({
      sensorCalibrationOffset: 0,
      coolingEfficiencyBoost: 0,
      loadReductionPercent: 0,
      replaceFaultySensor: false,
    });
  }, []);

  // Universal Document Imports
  const [importedDocuments, setImportedDocuments] = useState<UniversalDocument[]>([]);
  const [activeHistoricalDataset, setActiveHistoricalDataset] = useState<UniversalDocument | null>(null);
  const [viewHistoricalAlongside, setViewHistoricalAlongside] = useState<boolean>(false);

  // Alerts with localStorage fallback
  const [alerts, setAlerts] = useState<IndustrialAlert[]>(() => {
    try {
      const saved = localStorage.getItem('thermodrift_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const alertCooldownRef = useRef<Record<string, number>>({}); // sensorId:metric -> timestamp

  // Initialize Telemetry History
  const [history, setHistory] = useState<Record<string, TelemetryPoint[]>>(() => {
    const initialHist: Record<string, TelemetryPoint[]> = {};
    const now = Date.now();
    const count = 30; // 30 historical seed points (1 per 2 seconds)

    INITIAL_SENSORS.forEach(sensor => {
      const points: TelemetryPoint[] = [];
      let temp = sensor.limits.nominalTemp;
      let baseline = temp;

      for (let i = count; i >= 0; i--) {
        const time = now - i * 2000;
        // Minor natural fluctuation
        const jitter = (Math.sin(i * 0.4) + (Math.random() - 0.5) * 0.6) * (sensor.limits.nominalTemp > 200 ? 0.8 : 0.2);
        temp = sensor.limits.nominalTemp + jitter;
        baseline = 0.08 * temp + 0.92 * baseline;

        points.push({
          timestamp: time,
          sensorId: sensor.id,
          temperature: Math.round(temp * 100) / 100,
          baseline: Math.round(baseline * 100) / 100,
          rateOfChange: 0.05,
          anomalyScore: 0.04,
          isAnomaly: false,
          snrDb: 32.0,
          isSimulated: true,
        });
      }
      initialHist[sensor.id] = points;
    });

    return initialHist;
  });

  // Calculate live analyses for all sensors
  const analyses = useMemo(() => {
    const result: Record<string, SensorAnalysis> = {};
    const now = Date.now();

    sensors.forEach(sensor => {
      const points = history[sensor.id] || [];
      const latest = points[points.length - 1];
      const previous = points[points.length - 2] || latest;

      if (!latest) {
        result[sensor.id] = {
          sensorId: sensor.id,
          currentTemp: sensor.limits.nominalTemp,
          currentBaseline: sensor.limits.nominalTemp,
          absDeviation: 0,
          percentDeviation: 0,
          rateOfChangePerMin: 0,
          anomalyScore: 0,
          isFlatline: false,
          isMissingData: true,
          persistentViolationCount: 0,
          trustScore: 0,
          timeToWarningMin: null,
          timeToCriticalMin: null,
          timeToThresholdUncertaintyMin: null,
          severity: 'NORMAL',
          lastUpdated: now,
        };
        return;
      }

      // Check flatline over last 10 points
      const recentTemps = points.slice(-10).map(p => p.temperature);
      const isFlatline = detectFlatline(recentTemps, 0.005);
      const isMissing = sensor.status === 'OFFLINE' || detectMissingData(now - latest.timestamp, 8000);

      const absDev = calculateAbsoluteDeviation(latest.temperature, latest.baseline);
      const pctDev = calculatePercentDeviation(latest.temperature, latest.baseline);
      const deltaMs = latest.timestamp - (previous?.timestamp || latest.timestamp - 2000);
      const roc = calculateRateOfChange(latest.temperature, previous?.temperature || latest.temperature, deltaMs);

      // What-if simulator adjustments if applied to selected sensor
      let effectiveTemp = latest.temperature;
      if (selectedSensorId === sensor.id) {
        effectiveTemp += whatIfParams.sensorCalibrationOffset;
        if (whatIfParams.coolingEfficiencyBoost > 0) {
          effectiveTemp -= (effectiveTemp - sensor.limits.nominalTemp) * (whatIfParams.coolingEfficiencyBoost / 100);
        }
        if (whatIfParams.loadReductionPercent > 0) {
          effectiveTemp -= (effectiveTemp - sensor.limits.nominalTemp) * (whatIfParams.loadReductionPercent / 100) * 0.8;
        }
      }

      const score = computeAnomalyScore(effectiveTemp, latest.baseline, roc, sensor.limits, isFlatline, isMissing);
      const trust = calculateSensorTrustScore(latest.snrDb, isFlatline, isMissing, 0, 0.15);

      const prevSeverity = 'NORMAL';
      const severity = evaluateSeverityWithHysteresis(effectiveTemp, sensor.limits, prevSeverity, 1.2);

      // Estimate time to critical
      const targetCrit = sensor.limits.criticalHigh;
      const targetWarn = sensor.limits.warningHigh;
      const timeToCrit = estimateTimeToThreshold(effectiveTemp, targetCrit, roc);
      const timeToWarn = estimateTimeToThreshold(effectiveTemp, targetWarn, roc);

      // Persistent violation count
      const violationCount = points.slice(-8).filter(p => p.temperature >= sensor.limits.warningHigh).length;

      result[sensor.id] = {
        sensorId: sensor.id,
        currentTemp: Math.round(effectiveTemp * 100) / 100,
        currentBaseline: latest.baseline,
        absDeviation: Math.round(absDev * 100) / 100,
        percentDeviation: Math.round(pctDev * 10) / 10,
        rateOfChangePerMin: Math.round(roc * 100) / 100,
        anomalyScore: score,
        isFlatline,
        isMissingData: isMissing,
        persistentViolationCount: violationCount,
        trustScore: whatIfParams.replaceFaultySensor && selectedSensorId === sensor.id ? 99 : trust,
        timeToWarningMin: timeToWarn.minutes,
        timeToCriticalMin: timeToCrit.minutes,
        timeToThresholdUncertaintyMin: timeToCrit.uncertaintyMin,
        severity,
        lastUpdated: latest.timestamp,
      };
    });

    return result;
  }, [sensors, history, selectedSensorId, whatIfParams]);

  // Alert generation effect
  const triggerAlert = useCallback((
    sensor: SensorMetadata,
    severity: AlertSeverity,
    metric: IndustrialAlert['metric'],
    triggeredVal: number,
    thresholdVal: number,
    message: string,
    detail: string
  ) => {
    const key = `${sensor.id}:${metric}`;
    const now = Date.now();
    const lastTriggered = alertCooldownRef.current[key] || 0;
    // 25-second cooldown to deduplicate repetitive noise
    if (now - lastTriggered < 25000) {
      return;
    }
    alertCooldownRef.current[key] = now;

    const newAlert: IndustrialAlert = {
      id: `ALT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sensorId: sensor.id,
      sensorName: sensor.name,
      equipmentName: sensor.equipmentName,
      zone: sensor.zone,
      severity,
      status: 'ACTIVE',
      message,
      detail,
      triggeredValue: Math.round(triggeredVal * 10) / 10,
      thresholdValue: Math.round(thresholdVal * 10) / 10,
      metric,
      timestamp: now,
    };

    setAlerts(prev => {
      const updated = [newAlert, ...prev.slice(0, 99)];
      try {
        localStorage.setItem('thermodrift_alerts', JSON.stringify(updated));
      } catch {
        // storage overflow fallback
      }
      return updated;
    });

    // Sound alert
    if (soundEnabled && (severity === 'CRITICAL' || severity === 'EMERGENCY')) {
      playAlarmTone(severity);
    }

    // Critical Event modal
    if (showModalOnCritical && (severity === 'CRITICAL' || severity === 'EMERGENCY')) {
      setCriticalModalAlert(newAlert);
    }

    // Browser Notification
    if (browserNotificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(`[${severity}] ${sensor.name}`, {
          body: message,
          icon: '/favicon.ico',
        });
      } catch {
        // Notification permission or iframe restriction
      }
    }
  }, [soundEnabled, showModalOnCritical, browserNotificationsEnabled]);

  // Simulation Clock Tick (runs every 1000ms / simSpeed)
  useEffect(() => {
    if (isPaused) return;

    const intervalMs = Math.max(100, Math.round(1000 / simSpeed));
    const interval = setInterval(() => {
      const now = Date.now();

      // Decrement override timers
      setActiveOverrides(prev => {
        const next: typeof prev = {};
        Object.entries(prev).forEach(([sId, item]) => {
          if (item.remainingSec > 1) {
            next[sId] = { ...item, remainingSec: item.remainingSec - 1 };
          }
        });
        return next;
      });

      setHistory(prevHist => {
        const updated: Record<string, TelemetryPoint[]> = { ...prevHist };

        sensors.forEach(sensor => {
          const points = prevHist[sensor.id] || [];
          const lastPoint = points[points.length - 1];
          let currentTemp = lastPoint ? lastPoint.temperature : sensor.limits.nominalTemp;
          let baseline = lastPoint ? lastPoint.baseline : sensor.limits.nominalTemp;
          let snrDb = 30.0;
          let isSimulated = true;

          const override = activeOverrides[sensor.id];

          if (sensor.status === 'OFFLINE' || override?.type === 'OFFLINE') {
            // Sensor offline: no new reading generated, simulating packet drop
            return;
          }

          if (override?.type === 'FLATLINE') {
            // Stuck sensor: repeat exactly the same value
            currentTemp = lastPoint ? lastPoint.temperature : sensor.limits.nominalTemp;
            snrDb = 12.0;
          } else if (override?.type === 'DRIFT_UP') {
            // Gradual positive drift
            currentTemp += (0.6 + Math.random() * 0.4);
            baseline = calculateRollingBaseline(currentTemp, baseline, 0.04); // Slower baseline tracks slowly
          } else if (override?.type === 'DRIFT_DOWN') {
            // Gradual negative drift
            currentTemp -= (0.5 + Math.random() * 0.3);
            baseline = calculateRollingBaseline(currentTemp, baseline, 0.04);
          } else if (override?.type === 'SPIKE') {
            // Sudden thermal surge
            currentTemp += (8.0 + Math.random() * 5.0);
            snrDb = 22.0;
          } else if (override?.type === 'DROP') {
            // Sudden thermal drop
            currentTemp -= (7.0 + Math.random() * 4.0);
          } else if (override?.type === 'NOISE') {
            // Erratic readings
            currentTemp += (Math.random() - 0.5) * 12.0;
            snrDb = 8.5;
          } else {
            // Normal realistic stochastic process
            // Slight natural drift + mean-reversion toward nominal
            const deviationFromNominal = currentTemp - sensor.limits.nominalTemp;
            const meanReversionPull = -0.04 * deviationFromNominal;
            const thermalNoise = (Math.random() - 0.5) * (sensor.limits.nominalTemp > 300 ? 0.9 : 0.25);
            currentTemp = currentTemp + meanReversionPull + thermalNoise;
            baseline = calculateRollingBaseline(currentTemp, baseline, 0.06);
          }

          const deltaMs = lastPoint ? now - lastPoint.timestamp : 1000;
          const roc = calculateRateOfChange(currentTemp, lastPoint?.temperature || currentTemp, deltaMs);
          const score = computeAnomalyScore(
            currentTemp,
            baseline,
            roc,
            sensor.limits,
            override?.type === 'FLATLINE',
            false
          );

          const newPoint: TelemetryPoint = {
            timestamp: now,
            sensorId: sensor.id,
            temperature: Math.round(currentTemp * 100) / 100,
            baseline: Math.round(baseline * 100) / 100,
            rateOfChange: Math.round(roc * 100) / 100,
            anomalyScore: score,
            isAnomaly: score > 0.65,
            snrDb,
            isSimulated,
          };

          // Check rules for alert trigger
          if (currentTemp >= sensor.limits.emergencyHigh) {
            triggerAlert(
              sensor,
              'EMERGENCY',
              'HIGH_TEMPERATURE',
              currentTemp,
              sensor.limits.emergencyHigh,
              `Emergency thermal trip breached on ${sensor.name}`,
              `Core temperature reached ${currentTemp.toFixed(1)}°C, exceeding safety limit ${sensor.limits.emergencyHigh}°C.`
            );
          } else if (currentTemp >= sensor.limits.criticalHigh) {
            triggerAlert(
              sensor,
              'CRITICAL',
              'HIGH_TEMPERATURE',
              currentTemp,
              sensor.limits.criticalHigh,
              `Critical high temperature on ${sensor.name}`,
              `Reading ${currentTemp.toFixed(1)}°C is above critical threshold ${sensor.limits.criticalHigh}°C.`
            );
          } else if (currentTemp >= sensor.limits.warningHigh) {
            triggerAlert(
              sensor,
              'WARNING',
              'HIGH_TEMPERATURE',
              currentTemp,
              sensor.limits.warningHigh,
              `Temperature drift warning on ${sensor.name}`,
              `Reading ${currentTemp.toFixed(1)}°C exceeds warning threshold ${sensor.limits.warningHigh}°C.`
            );
          }

          if (Math.abs(roc) > sensor.limits.maxRateOfChange) {
            triggerAlert(
              sensor,
              'WARNING',
              'DRIFT_VELOCITY',
              roc,
              sensor.limits.maxRateOfChange,
              `Excessive thermal velocity on ${sensor.name}`,
              `Rate of change is ${roc.toFixed(1)}°C/min (limit: ${sensor.limits.maxRateOfChange}°C/min).`
            );
          }

          if (override?.type === 'FLATLINE') {
            triggerAlert(
              sensor,
              'WARNING',
              'FLATLINE',
              0,
              0.01,
              `Stuck ADC / Flatline output detected on ${sensor.name}`,
              `Sensor signal variance has frozen below detection threshold.`
            );
          }

          // Maintain rolling window of 90 points (3 minutes of 2s resolution)
          const newPoints = [...points, newPoint].slice(-90);
          updated[sensor.id] = newPoints;
        });

        return updated;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [isPaused, simSpeed, sensors, activeOverrides, triggerAlert]);

  // Anomaly Injection Action
  const injectAnomaly = useCallback((
    sensorId: string,
    type: 'DRIFT_UP' | 'DRIFT_DOWN' | 'SPIKE' | 'DROP' | 'NOISE' | 'FLATLINE' | 'OFFLINE' | 'RECOVER'
  ) => {
    if (type === 'RECOVER') {
      setActiveOverrides(prev => {
        const next = { ...prev };
        delete next[sensorId];
        return next;
      });
      setSensors(prev =>
        prev.map(s => (s.id === sensorId ? { ...s, status: 'ONLINE' } : s))
      );
      return;
    }

    if (type === 'OFFLINE') {
      setSensors(prev =>
        prev.map(s => (s.id === sensorId ? { ...s, status: 'OFFLINE' } : s))
      );
    }

    setActiveOverrides(prev => ({
      ...prev,
      [sensorId]: { type, intensity: 1.0, remainingSec: 45 },
    }));
  }, []);

  // Simulation Controls
  const togglePause = useCallback(() => setIsPaused(p => !p), []);
  
  const resetSimulation = useCallback(() => {
    setActiveOverrides({});
    setSensors(INITIAL_SENSORS);
    const now = Date.now();
    const newHist: Record<string, TelemetryPoint[]> = {};
    INITIAL_SENSORS.forEach(sensor => {
      newHist[sensor.id] = [
        {
          timestamp: now,
          sensorId: sensor.id,
          temperature: sensor.limits.nominalTemp,
          baseline: sensor.limits.nominalTemp,
          rateOfChange: 0,
          anomalyScore: 0.05,
          isAnomaly: false,
          snrDb: 32.0,
          isSimulated: true,
        },
      ];
    });
    setHistory(newHist);
  }, []);

  // Sensor Configuration
  const updateSensorLimits = useCallback((sensorId: string, newLimits: Partial<SensorMetadata['limits']>) => {
    setSensors(prev =>
      prev.map(s => (s.id === sensorId ? { ...s, limits: { ...s.limits, ...newLimits } } : s))
    );
  }, []);

  const updateSensorOffset = useCallback((sensorId: string, offset: number) => {
    setSensors(prev =>
      prev.map(s => (s.id === sensorId ? { ...s, currentOffset: offset } : s))
    );
  }, []);

  // Alert Actions
  const unreadAlertCount = useMemo(() => {
    return alerts.filter(a => a.status === 'ACTIVE').length;
  }, [alerts]);

  const dismissCriticalModal = useCallback(() => setCriticalModalAlert(null), []);

  const acknowledgeAlert = useCallback((alertId: string, user: string) => {
    setAlerts(prev =>
      prev.map(a =>
        a.id === alertId
          ? { ...a, status: 'ACKNOWLEDGED' as AlertStatus, acknowledgedAt: Date.now(), acknowledgedBy: user }
          : a
      )
    );
  }, []);

  const investigateAlert = useCallback((alertId: string, user: string) => {
    setAlerts(prev =>
      prev.map(a =>
        a.id === alertId
          ? { ...a, status: 'INVESTIGATING' as AlertStatus, investigatedAt: Date.now(), investigatedBy: user }
          : a
      )
    );
  }, []);

  const assignAlert = useCallback((alertId: string, assignee: string) => {
    setAlerts(prev =>
      prev.map(a =>
        a.id === alertId
          ? {
              ...a,
              detail: `${a.detail} [Assigned to: ${assignee}]`,
              investigatedBy: assignee,
            }
          : a
      )
    );
  }, []);

  const resolveAlert = useCallback((alertId: string, user: string, rootCause: string) => {
    setAlerts(prev =>
      prev.map(a =>
        a.id === alertId
          ? {
              ...a,
              status: 'RESOLVED' as AlertStatus,
              resolvedAt: Date.now(),
              resolvedBy: user,
              rootCauseNotes: rootCause,
            }
          : a
      )
    );
  }, []);

  const clearResolvedAlerts = useCallback(() => {
    setAlerts(prev => prev.filter(a => a.status !== 'RESOLVED'));
  }, []);

  const requestBrowserNotifications = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) return false;
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setBrowserNotificationsEnabled(granted);
      return granted;
    } catch {
      return false;
    }
  }, []);

  const addImportedDocument = useCallback((doc: UniversalDocument) => {
    setImportedDocuments(prev => [doc, ...prev]);
    setActiveHistoricalDataset(doc);
  }, []);

  return (
    <TelemetryContext.Provider
      value={{
        sensors,
        updateSensorLimits,
        updateSensorOffset,
        history,
        analyses,
        selectedSensorId,
        setSelectedSensorId,
        selectedZone,
        setSelectedZone,
        isPaused,
        togglePause,
        simSpeed,
        setSimSpeed,
        resetSimulation,
        injectAnomaly,
        activeOverrides,
        alerts,
        unreadAlertCount,
        criticalModalAlert,
        dismissCriticalModal,
        acknowledgeAlert,
        investigateAlert,
        assignAlert,
        resolveAlert,
        clearResolvedAlerts,
        soundEnabled,
        setSoundEnabled,
        showModalOnCritical,
        setShowModalOnCritical,
        browserNotificationsEnabled,
        requestBrowserNotifications,
        whatIfParams,
        setWhatIfParams,
        resetWhatIfParams,
        importedDocuments,
        addImportedDocument,
        activeHistoricalDataset,
        setActiveHistoricalDataset,
        viewHistoricalAlongside,
        setViewHistoricalAlongside,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export function useTelemetry(): TelemetryContextType {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
}
