import test from 'node:test';
import assert from 'node:assert/strict';
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
} from './driftEngine';
import { MachineLimits } from '../types/telemetry';

const testLimits: MachineLimits = {
  nominalTemp: 100,
  warningHigh: 110,
  criticalHigh: 125,
  emergencyHigh: 140,
  warningLow: 90,
  criticalLow: 80,
  maxRateOfChange: 5, // 5°C per min
  driftThresholdPercent: 5,
};

test('Rolling baseline converges towards new steady-state', () => {
  let baseline = calculateRollingBaseline(100, null);
  assert.equal(baseline, 100);

  // Apply step change to 120 over 10 steps
  for (let i = 0; i < 10; i++) {
    baseline = calculateRollingBaseline(120, baseline, 0.2);
  }
  // Baseline should have moved towards 120 (> 115)
  assert.ok(baseline > 115 && baseline <= 120);
});

test('Absolute and percentage deviations compute correctly', () => {
  assert.equal(calculateAbsoluteDeviation(110, 100), 10);
  assert.equal(calculateAbsoluteDeviation(95, 100), 5);

  const pct = calculatePercentDeviation(110, 100);
  assert.equal(pct, 10);
});

test('Rate of change reflects temperature change per minute', () => {
  // 10°C increase over 30,000 ms (0.5 minute) = +20°C/min
  const roc = calculateRateOfChange(110, 100, 30000);
  assert.equal(roc, 20);

  // Negative rate of change
  const rocNeg = calculateRateOfChange(95, 100, 60000);
  assert.equal(rocNeg, -5);
});

test('Flatline detection identifies stuck sensors', () => {
  const normalReadings = [100.1, 100.4, 99.8, 100.2, 100.0, 99.9];
  assert.equal(detectFlatline(normalReadings), false);

  const flatlineReadings = [100.0, 100.0, 100.0, 100.0, 100.0, 100.0];
  assert.equal(detectFlatline(flatlineReadings), true);
});

test('Missing data detection trips on excessive gap', () => {
  assert.equal(detectMissingData(1000, 5000), false);
  assert.equal(detectMissingData(6000, 5000), true);
});

test('Anomaly score scales with temperature breach, velocity, and missing status', () => {
  // Nominal temperature and stable velocity -> low anomaly score (< 0.25)
  const scoreNominal = computeAnomalyScore(100, 100, 0.1, testLimits);
  assert.ok(scoreNominal < 0.25, `Expected low score, got ${scoreNominal}`);

  // High temperature and high rate of change -> high anomaly score (> 0.70)
  const scoreCritical = computeAnomalyScore(130, 115, 8.0, testLimits);
  assert.ok(scoreCritical > 0.70, `Expected high score, got ${scoreCritical}`);

  // Missing sensor triggers high alert score
  const scoreMissing = computeAnomalyScore(100, 100, 0, testLimits, false, true);
  assert.ok(scoreMissing >= 0.9, `Expected >= 0.9 for missing, got ${scoreMissing}`);
});

test('Time-to-threshold estimator projects minutes and uncertainty', () => {
  // Temp is 105, target critical is 125, rising at 2°C/min -> 10 minutes
  const prediction = estimateTimeToThreshold(105, 125, 2.0);
  assert.equal(prediction.minutes, 10);
  assert.ok(prediction.uncertaintyMin !== null && prediction.uncertaintyMin > 0);

  // Negative rate while needing to increase -> returns null
  const noPrediction = estimateTimeToThreshold(105, 125, -2.0);
  assert.equal(noPrediction.minutes, null);
});

test('Sensor trust score decreases on noise, packet loss, or flatline', () => {
  const healthyTrust = calculateSensorTrustScore(30, false, false, 0, 0.1);
  assert.equal(healthyTrust, 100);

  const flatlineTrust = calculateSensorTrustScore(30, true, false, 0, 0.1);
  assert.ok(flatlineTrust <= 45, `Expected trust <= 45 for flatline, got ${flatlineTrust}`);

  const noisyTrust = calculateSensorTrustScore(12, false, false, 0.2, 3.0);
  assert.ok(noisyTrust < healthyTrust);
});

test('Hysteresis prevents flickering between alert states', () => {
  // Temp crosses warning threshold (110)
  let severity = evaluateSeverityWithHysteresis(111, testLimits, 'NORMAL', 2.0);
  assert.equal(severity, 'WARNING');

  // Temp drops slightly to 109.5 (still within 2.0°C hysteresis of 110: 110 - 2 = 108)
  severity = evaluateSeverityWithHysteresis(109.5, testLimits, 'WARNING', 2.0);
  assert.equal(severity, 'WARNING'); // Remains WARNING due to hysteresis

  // Temp drops below 108 -> returns to NORMAL
  severity = evaluateSeverityWithHysteresis(107.5, testLimits, 'WARNING', 2.0);
  assert.equal(severity, 'NORMAL');
});
