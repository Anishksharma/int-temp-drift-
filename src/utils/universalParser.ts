/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UniversalColumnProfile, UniversalDocument, TelemetryColumnMapping, TelemetryPoint } from '../types/telemetry';

/**
 * Universal CSV/TSV/JSON Parser.
 * Robustly parses text into typed row arrays and calculates column profiles.
 */
export function parseDelimitedText(text: string, delimiter?: string): { columns: string[]; rows: Record<string, any>[] } {
  const lines = text.trim().split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) {
    return { columns: [], rows: [] };
  }

  // Auto-detect delimiter if not provided: comma, tab, or semicolon
  if (!delimiter) {
    const firstLine = lines[0];
    const commas = (firstLine.match(/,/g) || []).length;
    const tabs = (firstLine.match(/\t/g) || []).length;
    const semis = (firstLine.match(/;/g) || []).length;
    if (tabs > commas && tabs > semis) delimiter = '\t';
    else if (semis > commas && semis > tabs) delimiter = ';';
    else delimiter = ',';
  }

  // Regex-aware CSV split handling quoted commas
  const splitLine = (line: string, delim: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delim && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const rawHeaders = splitLine(lines[0], delimiter);
  const columns = rawHeaders.map((h, idx) => h.replace(/^["']|["']$/g, '').trim() || `col_${idx + 1}`);

  const rows: Record<string, any>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i], delimiter);
    const row: Record<string, any> = {};
    for (let c = 0; c < columns.length; c++) {
      const colName = columns[c];
      const rawVal = values[c] !== undefined ? values[c].replace(/^["']|["']$/g, '').trim() : '';
      
      // Auto-cast types
      if (rawVal === '' || rawVal.toLowerCase() === 'null' || rawVal.toLowerCase() === 'na' || rawVal === '-') {
        row[colName] = null;
      } else if (!isNaN(Number(rawVal)) && rawVal !== '') {
        row[colName] = Number(rawVal);
      } else if (rawVal.toLowerCase() === 'true') {
        row[colName] = true;
      } else if (rawVal.toLowerCase() === 'false') {
        row[colName] = false;
      } else {
        row[colName] = rawVal;
      }
    }
    rows.push(row);
  }

  return { columns, rows };
}

/**
 * Universal JSON Parser for arrays of records or nested objects
 */
export function parseJsonDocument(jsonString: string): { columns: string[]; rows: Record<string, any>[] } {
  try {
    const parsed = JSON.parse(jsonString);
    let items: any[] = [];
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (typeof parsed === 'object' && parsed !== null) {
      // Find the first array property (e.g. { data: [...], items: [...] })
      const arrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
      if (arrayKey) {
        items = parsed[arrayKey];
      } else {
        items = [parsed];
      }
    }

    if (items.length === 0) return { columns: [], rows: [] };

    // Extract all unique columns
    const colSet = new Set<string>();
    items.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(k => colSet.add(k));
      }
    });

    const columns = Array.from(colSet);
    const rows = items.map(item => {
      const row: Record<string, any> = {};
      columns.forEach(col => {
        row[col] = item[col] !== undefined ? item[col] : null;
      });
      return row;
    });

    return { columns, rows };
  } catch (err) {
    throw new Error('Invalid JSON format: ' + (err instanceof Error ? err.message : String(err)));
  }
}

/**
 * Generates statistical profiles for every column in the dataset
 */
export function profileColumns(columns: string[], rows: Record<string, any>[]): Record<string, UniversalColumnProfile> {
  const profiles: Record<string, UniversalColumnProfile> = {};

  columns.forEach(col => {
    let nullCount = 0;
    let numberCount = 0;
    let dateCount = 0;
    let boolCount = 0;
    let stringCount = 0;
    const values: any[] = [];
    const uniqueValues = new Set<string>();
    const numericValues: number[] = [];

    rows.forEach(row => {
      const val = row[col];
      if (val === null || val === undefined || val === '') {
        nullCount++;
      } else {
        values.push(val);
        uniqueValues.add(String(val));
        if (typeof val === 'number') {
          numberCount++;
          numericValues.push(val);
        } else if (typeof val === 'boolean') {
          boolCount++;
        } else if (typeof val === 'string') {
          // Check if valid date string
          const dateTest = Date.parse(val);
          if (!isNaN(dateTest) && (val.includes('-') || val.includes('/') || val.includes('T') || val.includes(':'))) {
            dateCount++;
          } else {
            stringCount++;
          }
        }
      }
    });

    // Determine dominant type
    let dominantType: 'number' | 'string' | 'date' | 'boolean' = 'string';
    const totalValid = values.length;
    if (totalValid > 0) {
      if (numberCount / totalValid > 0.7) dominantType = 'number';
      else if (dateCount / totalValid > 0.7) dominantType = 'date';
      else if (boolCount / totalValid > 0.7) dominantType = 'boolean';
      else dominantType = 'string';
    }

    const colLower = col.toLowerCase();
    const isLikelyTimestamp = 
      dominantType === 'date' || 
      colLower.includes('time') || 
      colLower.includes('date') || 
      colLower.includes('epoch') || 
      colLower === 'ts';

    const isLikelyTemperature = 
      dominantType === 'number' && 
      (colLower.includes('temp') || 
       colLower.includes('thermal') || 
       colLower.includes('deg') || 
       colLower.includes('celsius') || 
       colLower.includes('fahrenheit') || 
       colLower.includes('t_') || 
       colLower.endsWith('_c') || 
       colLower.endsWith('_f'));

    const isLikelySensorId = 
      colLower.includes('sensor') || 
      colLower.includes('device') || 
      colLower.includes('channel') || 
      colLower.includes('probe') || 
      colLower.includes('node') || 
      colLower.includes('tag');

    let min: number | undefined;
    let max: number | undefined;
    let mean: number | undefined;

    if (numericValues.length > 0) {
      min = Math.min(...numericValues);
      max = Math.max(...numericValues);
      mean = Math.round((numericValues.reduce((a, b) => a + b, 0) / numericValues.length) * 100) / 100;
    }

    profiles[col] = {
      name: col,
      type: dominantType,
      sampleValues: values.slice(0, 5),
      nullCount,
      uniqueCount: uniqueValues.size,
      min,
      max,
      mean,
      isLikelyTimestamp,
      isLikelyTemperature,
      isLikelySensorId,
    };
  });

  return profiles;
}

/**
 * Validates and converts imported tabular data into normalized Industrial TelemetryPoints
 */
export function validateAndMapTelemetry(
  rows: Record<string, any>[],
  mapping: TelemetryColumnMapping
): { telemetry: TelemetryPoint[]; errors: string[]; warningCount: number } {
  const telemetry: TelemetryPoint[] = [];
  const errors: string[] = [];
  let warningCount = 0;

  if (!mapping.timestampCol || !mapping.temperatureCol) {
    return { telemetry: [], errors: ['Both Timestamp and Temperature columns must be mapped.'], warningCount: 0 };
  }

  let runningBaseline: number | null = null;
  let prevTemp: number | null = null;
  let prevTime: number | null = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rawTime = row[mapping.timestampCol];
    const rawTemp = row[mapping.temperatureCol];
    const rawSensor = mapping.sensorIdCol ? row[mapping.sensorIdCol] : 'IMPORTED_PROBE_1';

    // Parse Timestamp
    let timestampMs: number;
    if (typeof rawTime === 'number') {
      // If seconds epoch (e.g. 1700000000), multiply to ms
      timestampMs = rawTime < 10000000000 ? rawTime * 1000 : rawTime;
    } else if (typeof rawTime === 'string') {
      const parsed = Date.parse(rawTime);
      if (isNaN(parsed)) {
        if (i < 5) errors.push(`Row ${i + 1}: Unrecognized timestamp '${rawTime}'`);
        warningCount++;
        continue;
      }
      timestampMs = parsed;
    } else {
      warningCount++;
      continue;
    }

    // Parse Temperature
    let tempC = Number(rawTemp);
    if (isNaN(tempC)) {
      warningCount++;
      continue;
    }

    // Unit Conversion
    if (mapping.unit === '°F') {
      tempC = (tempC - 32) * (5 / 9);
    } else if (mapping.unit === 'K') {
      tempC = tempC - 273.15;
    }

    // Extreme Sanity Validation (e.g. Below absolute zero or melting point of tungsten > 3422°C)
    if (tempC < -273.15 || tempC > 2500) {
      if (i < 5) errors.push(`Row ${i + 1}: Physic-violating temperature ${tempC.toFixed(1)}°C flagged.`);
      warningCount++;
      continue;
    }

    // Rolling Baseline & Rate of change
    if (runningBaseline === null) runningBaseline = tempC;
    else runningBaseline = 0.08 * tempC + 0.92 * runningBaseline;

    let rateOfChange = 0;
    if (prevTemp !== null && prevTime !== null && timestampMs > prevTime) {
      const deltaMinutes = (timestampMs - prevTime) / 60000;
      if (deltaMinutes > 0) {
        rateOfChange = (tempC - prevTemp) / deltaMinutes;
      }
    }

    prevTemp = tempC;
    prevTime = timestampMs;

    // Fast surrogate anomaly score for historical stream
    const tempDev = Math.abs(tempC - runningBaseline);
    const isAnomaly = tempDev > 12.0 || Math.abs(rateOfChange) > 10.0;
    const anomalyScore = Math.min(1.0, Math.max(0.05, tempDev / 25.0));

    telemetry.push({
      timestamp: timestampMs,
      sensorId: String(rawSensor || 'IMPORTED_PROBE_1'),
      temperature: Math.round(tempC * 100) / 100,
      baseline: Math.round(runningBaseline * 100) / 100,
      rateOfChange: Math.round(rateOfChange * 100) / 100,
      anomalyScore: Math.round(anomalyScore * 100) / 100,
      isAnomaly,
      snrDb: 28.5,
      isSimulated: false,
    });
  }

  // Sort by timestamp ascending
  telemetry.sort((a, b) => a.timestamp - b.timestamp);

  return { telemetry, errors, warningCount };
}
