export type FactoryZone = 
  | 'Furnace and Heat Treatment'
  | 'Industrial Cooling'
  | 'Motor and Bearing Assembly'
  | 'Process Pipeline and Storage';

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';

export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED';

export interface MachineLimits {
  nominalTemp: number; // e.g. 850°C for furnace, 4°C for chiller
  warningHigh: number;
  criticalHigh: number;
  emergencyHigh: number;
  warningLow?: number;
  criticalLow?: number;
  maxRateOfChange: number; // °C per minute max acceptable
  driftThresholdPercent: number; // e.g. 5% drift from baseline
}

export interface SensorMetadata {
  id: string;
  name: string;
  zone: FactoryZone;
  equipmentId: string;
  equipmentName: string;
  type: 'Thermocouple Type-K' | 'RTD PT100' | 'Infrared Pyrometer' | 'Semiconductor IC' | 'Fiber Optic Distributed';
  unit: '°C' | '°F';
  installedDate: string;
  lastCalibratedDate: string;
  nominalSamplingRateHz: number;
  limits: MachineLimits;
  status: 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'MAINTENANCE';
  currentOffset: number; // calibration offset
}

export interface TelemetryPoint {
  timestamp: number; // ms epoch
  sensorId: string;
  temperature: number; // in °C
  baseline: number; // rolling baseline in °C
  rateOfChange: number; // °C/min
  anomalyScore: number; // 0 to 1
  isAnomaly: boolean;
  snrDb: number; // signal to noise ratio in dB
  isSimulated?: boolean;
}

export interface SensorAnalysis {
  sensorId: string;
  currentTemp: number;
  currentBaseline: number;
  absDeviation: number; // |T - baseline|
  percentDeviation: number; // (|T - baseline| / baseline) * 100
  rateOfChangePerMin: number; // dT/dt °C/min
  anomalyScore: number; // 0 - 1
  isFlatline: boolean;
  isMissingData: boolean;
  persistentViolationCount: number; // consecutive breaches
  trustScore: number; // 0 - 100%
  timeToWarningMin: number | null; // estimated minutes until warning limit
  timeToCriticalMin: number | null; // estimated minutes until critical limit
  timeToThresholdUncertaintyMin: number | null;
  severity: AlertSeverity | 'NORMAL';
  lastUpdated: number;
}

export interface IndustrialAlert {
  id: string;
  sensorId: string;
  sensorName: string;
  equipmentName: string;
  zone: FactoryZone;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  detail: string;
  triggeredValue: number;
  thresholdValue: number;
  metric: 'HIGH_TEMPERATURE' | 'LOW_TEMPERATURE' | 'DRIFT_VELOCITY' | 'ANOMALY_SCORE' | 'FLATLINE' | 'OFFLINE';
  timestamp: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  investigatedAt?: number;
  investigatedBy?: string;
  resolvedAt?: number;
  resolvedBy?: string;
  rootCauseNotes?: string;
}

export interface CaseStudyStep {
  timeOffsetSec: number;
  title: string;
  description: string;
  phenomenon: string;
  actionRequired: string;
  systemTemp: number;
  anomalyScore: number;
  alertTriggered?: AlertSeverity;
}

export interface CaseStudy {
  id: string;
  title: string;
  zone: FactoryZone;
  equipment: string;
  durationSec: number;
  description: string;
  rootCause: string;
  preventionSOP: string;
  steps: CaseStudyStep[];
  baselineTemp: number;
  criticalLimit: number;
}

export interface WhatIfParameters {
  sensorCalibrationOffset: number; // -10 to +10 °C
  coolingEfficiencyBoost: number; // 0% to 50%
  loadReductionPercent: number; // 0% to 50%
  replaceFaultySensor: boolean;
}

export interface UniversalColumnProfile {
  name: string;
  type: 'number' | 'string' | 'date' | 'boolean';
  sampleValues: any[];
  nullCount: number;
  uniqueCount: number;
  min?: number;
  max?: number;
  mean?: number;
  isLikelyTimestamp?: boolean;
  isLikelyTemperature?: boolean;
  isLikelySensorId?: boolean;
}

export interface UniversalDocument {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedAt: number;
  rowCount: number;
  columns: string[];
  profiles: Record<string, UniversalColumnProfile>;
  rows: Record<string, any>[];
  mappedTelemetry?: TelemetryPoint[];
}

export interface TelemetryColumnMapping {
  timestampCol: string;
  sensorIdCol: string;
  temperatureCol: string;
  unit: '°C' | '°F' | 'K';
  equipmentCol?: string;
  zoneCol?: string;
}
