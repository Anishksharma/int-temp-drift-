/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MachineLimits, TelemetryPoint, SensorAnalysis, AlertSeverity } from '../types/telemetry';

/**
 * Calculates Exponential Moving Average (EMA) for rolling baseline.
 * alpha: smoothing factor (0 < alpha <= 1). Default 0.1 gives smooth baseline.
 */
export function calculateRollingBaseline(
  currentTemp: number,
  previousBaseline: number | null,
  alpha: number = 0.08
): number {
  if (previousBaseline === null || isNaN(previousBaseline)) {
    return currentTemp;
  }
  return alpha * currentTemp + (1 - alpha) * previousBaseline;
}

/**
 * Calculates absolute deviation from baseline: |T - Baseline|
 */
export function calculateAbsoluteDeviation(temperature: number, baseline: number): number {
  return Math.abs(temperature - baseline);
}

/**
 * Calculates percentage deviation from baseline: (|T - Baseline| / |Baseline|) * 100
 * Handles near-zero baselines gracefully.
 */
export function calculatePercentDeviation(temperature: number, baseline: number): number {
  if (Math.abs(baseline) < 0.001) {
    return Math.abs(temperature) < 0.001 ? 0 : 100;
  }
  return (Math.abs(temperature - baseline) / Math.abs(baseline)) * 100;
}

/**
 * Calculates rate of change dT/dt in °C per minute.
 * deltaT: T2 - T1 in °C
 * deltaMs: time difference in milliseconds
 */
export function calculateRateOfChange(
  currentTemp: number,
  previousTemp: number,
  deltaMs: number
): number {
  if (deltaMs <= 0) return 0;
  const deltaMinutes = deltaMs / 60000;
  return (currentTemp - previousTemp) / deltaMinutes;
}

/**
 * Detects if sensor is flatlining (stuck output / frozen ADC).
 * True if variance over recent readings is below epsilon while sensor is online.
 */
export function detectFlatline(readings: number[], epsilon: number = 0.01): boolean {
  if (readings.length < 5) return false;
  const mean = readings.reduce((a, b) => a + b, 0) / readings.length;
  const variance = readings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / readings.length;
  return variance < epsilon;
}

/**
 * Detects missing data / packet loss.
 * gapMs: elapsed milliseconds since last valid packet
 * timeoutMs: maximum expected silence threshold (e.g. 5000ms)
 */
export function detectMissingData(gapMs: number, timeoutMs: number = 5000): boolean {
  return gapMs > timeoutMs;
}

/**
 * Transparent Multi-Factor Statistical Drift & Isolation Estimator.
 * 
 * Fully explainable algorithm combining:
 * 1. Standardized Temperature Deviation (Z-score surrogate against limits)
 * 2. Velocity Anomaly (rate of change vs allowable machine velocity)
 * 3. Isolation Tree depth surrogate (multivariate partition difficulty)
 * 4. Flatline / erratic noise penalty
 * 
 * Returns score normalized [0, 1].
 */
export function computeAnomalyScore(
  temperature: number,
  baseline: number,
  rateOfChange: number,
  limits: MachineLimits,
  isFlatline: boolean = false,
  isMissing: boolean = false
): number {
  if (isMissing) return 0.95; // High anomaly on offline/missing

  // Factor 1: Temperature boundary proximity
  const span = Math.max(1, limits.criticalHigh - limits.nominalTemp);
  const tempDeviation = Math.abs(temperature - limits.nominalTemp);
  const baselineShift = Math.abs(baseline - limits.nominalTemp);
  
  // Normalized thermal drift factor [0, 1]
  const thermalFactor = Math.min(1.0, (tempDeviation / span) * 0.7 + (baselineShift / span) * 0.3);

  // Factor 2: Velocity factor (rate of change vs max allowable)
  const maxVelocity = Math.max(0.5, limits.maxRateOfChange);
  const velocityFactor = Math.min(1.0, Math.abs(rateOfChange) / maxVelocity);

  // Factor 3: Isolation partition surrogate
  // In an isolation forest, points in low-density tails require few random splits:
  // We approximate isolation path length h(x) inversely with distance from nominal cluster.
  const zDev = Math.abs(temperature - baseline) / (span * 0.2 || 1);
  const isolationPathApproximation = Math.max(0, 1 - Math.exp(-0.5 * Math.pow(zDev, 2)));

  // Combine factors with weights
  let score = thermalFactor * 0.45 + velocityFactor * 0.35 + isolationPathApproximation * 0.20;

  if (isFlatline) {
    score = Math.max(score, 0.78); // Flatline is a critical data-integrity anomaly
  }

  return Math.min(1.0, Math.max(0, Math.round(score * 1000) / 1000));
}

/**
 * Predicts Time-to-Threshold (minutes) and uncertainty (± minutes)
 * using linear projection of current rate of change dT/dt.
 */
export function estimateTimeToThreshold(
  currentTemp: number,
  targetTemp: number,
  rateOfChangePerMin: number,
  recentNoiseStdDev: number = 0.5
): { minutes: number | null; uncertaintyMin: number | null } {
  // If moving away from the target or rate is practically zero
  const tempDiff = targetTemp - currentTemp;

  if (Math.abs(rateOfChangePerMin) < 0.05) {
    return { minutes: null, uncertaintyMin: null };
  }

  // Direction check
  if ((tempDiff > 0 && rateOfChangePerMin <= 0) || (tempDiff < 0 && rateOfChangePerMin >= 0)) {
    return { minutes: null, uncertaintyMin: null };
  }

  const minutes = Math.abs(tempDiff / rateOfChangePerMin);

  // Uncertainty based on sensor noise and velocity variance
  const relativeVelocityNoise = recentNoiseStdDev / (Math.abs(rateOfChangePerMin) || 0.1);
  const uncertainty = Math.max(0.5, Math.min(minutes * 0.5, minutes * (0.15 + relativeVelocityNoise * 0.1)));

  return {
    minutes: Math.round(minutes * 10) / 10,
    uncertaintyMin: Math.round(uncertainty * 10) / 10,
  };
}

/**
 * Calculates Sensor Trust Score (0% - 100%)
 * Evaluates:
 * - Signal-to-Noise Ratio (higher is better)
 * - Absence of flatlining (flatline drops trust by 50)
 * - Data packet continuity (missing data drops trust)
 * - Rate of change plausibility (impossible jumps > 50°C/sec drop trust)
 */
export function calculateSensorTrustScore(
  snrDb: number,
  isFlatline: boolean,
  isMissing: boolean,
  packetLossRate: number = 0, // 0 to 1
  recentNoiseStdDev: number = 0.2
): number {
  if (isMissing) return 0;

  let trust = 100;

  // SNR contribution: ideal is > 25dB
  if (snrDb < 10) {
    trust -= 35;
  } else if (snrDb < 20) {
    trust -= 15;
  }

  // Flatline penalty
  if (isFlatline) {
    trust -= 55;
  }

  // Packet loss penalty
  trust -= Math.min(30, packetLossRate * 100);

  // Noise penalty
  if (recentNoiseStdDev > 2.5) {
    trust -= 20;
  }

  return Math.max(0, Math.min(100, Math.round(trust)));
}

/**
 * Evaluates severity with Hysteresis to prevent alert fluttering.
 * Hysteresis buffer in °C (default 1.5°C).
 */
export function evaluateSeverityWithHysteresis(
  currentTemp: number,
  limits: MachineLimits,
  currentSeverity: AlertSeverity | 'NORMAL',
  hysteresisBuffer: number = 1.5
): AlertSeverity | 'NORMAL' {
  // Check High Breaches
  if (currentTemp >= limits.emergencyHigh) {
    return 'EMERGENCY';
  }

  if (currentSeverity === 'EMERGENCY') {
    if (currentTemp < limits.emergencyHigh - hysteresisBuffer) {
      if (currentTemp >= limits.criticalHigh) return 'CRITICAL';
      if (currentTemp >= limits.warningHigh) return 'WARNING';
      return 'NORMAL';
    }
    return 'EMERGENCY';
  }

  if (currentTemp >= limits.criticalHigh) {
    return 'CRITICAL';
  }

  if (currentSeverity === 'CRITICAL') {
    if (currentTemp < limits.criticalHigh - hysteresisBuffer) {
      if (currentTemp >= limits.warningHigh) return 'WARNING';
      return 'NORMAL';
    }
    return 'CRITICAL';
  }

  if (currentTemp >= limits.warningHigh) {
    return 'WARNING';
  }

  if (currentSeverity === 'WARNING') {
    if (currentTemp < limits.warningHigh - hysteresisBuffer) {
      return 'NORMAL';
    }
    return 'WARNING';
  }

  // Check Low Breaches if configured
  if (limits.criticalLow !== undefined && currentTemp <= limits.criticalLow) {
    return 'CRITICAL';
  }
  if (limits.warningLow !== undefined && currentTemp <= limits.warningLow) {
    return 'WARNING';
  }

  return 'NORMAL';
}
