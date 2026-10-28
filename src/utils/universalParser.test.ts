import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDelimitedText, parseJsonDocument, profileColumns, validateAndMapTelemetry } from './universalParser';

test('parseDelimitedText parses CSV correctly with numeric conversion', () => {
  const csv = `timestamp,sensor_id,temperature_c,pressure_bar
2026-10-28T08:00:00Z,S-101,842.5,4.2
2026-10-28T08:01:00Z,S-101,844.0,4.3
2026-10-28T08:02:00Z,S-101,846.8,4.2`;

  const { columns, rows } = parseDelimitedText(csv);
  assert.equal(columns.length, 4);
  assert.equal(rows.length, 3);
  assert.equal(rows[0]['temperature_c'], 842.5);
  assert.equal(rows[0]['sensor_id'], 'S-101');
});

test('profileColumns identifies date, temperature, and calculates stats', () => {
  const columns = ['timestamp', 'sensor_id', 'temp_deg'];
  const rows = [
    { timestamp: '2026-10-28T08:00:00Z', sensor_id: 'S-1', temp_deg: 100 },
    { timestamp: '2026-10-28T08:01:00Z', sensor_id: 'S-1', temp_deg: 110 },
    { timestamp: '2026-10-28T08:02:00Z', sensor_id: 'S-1', temp_deg: 120 },
  ];

  const profiles = profileColumns(columns, rows);
  assert.equal(profiles['timestamp'].isLikelyTimestamp, true);
  assert.equal(profiles['temp_deg'].isLikelyTemperature, true);
  assert.equal(profiles['temp_deg'].mean, 110);
  assert.equal(profiles['temp_deg'].min, 100);
  assert.equal(profiles['temp_deg'].max, 120);
});

test('validateAndMapTelemetry auto-converts Fahrenheit and generates baseline', () => {
  const rows = [
    { time: '2026-10-28T08:00:00Z', probe: 'P-1', reading_f: 212 }, // 100°C
    { time: '2026-10-28T08:01:00Z', probe: 'P-1', reading_f: 230 }, // 110°C
  ];

  const result = validateAndMapTelemetry(rows, {
    timestampCol: 'time',
    sensorIdCol: 'probe',
    temperatureCol: 'reading_f',
    unit: '°F',
  });

  assert.equal(result.errors.length, 0);
  assert.equal(result.telemetry.length, 2);
  assert.equal(Math.round(result.telemetry[0].temperature), 100);
  assert.equal(Math.round(result.telemetry[1].temperature), 110);
});
