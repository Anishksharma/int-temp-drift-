/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import {
  parseDelimitedText,
  parseJsonDocument,
  profileColumns,
  validateAndMapTelemetry,
} from '../utils/universalParser';
import {
  UniversalDocument,
  UniversalColumnProfile,
  TelemetryColumnMapping,
} from '../types/telemetry';
import {
  FileSpreadsheet,
  Upload,
  FileText,
  BarChart2,
  Table,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Search,
} from 'lucide-react';

// Sample preloaded datasets
const SAMPLE_DATASETS = [
  {
    name: 'Industrial_Thermal_Telemetry_Shift2.csv',
    description: 'High-frequency plant thermocouple recordings with temperature and pressure',
    content: `timestamp,sensor_tag,equipment,temperature_c,pressure_bar,power_kw
2026-10-28T06:00:00Z,F-101,Furnace Continuous Annealer,849.2,3.2,142.5
2026-10-28T06:05:00Z,F-101,Furnace Continuous Annealer,850.5,3.2,143.0
2026-10-28T06:10:00Z,F-101,Furnace Continuous Annealer,853.1,3.3,144.2
2026-10-28T06:15:00Z,F-101,Furnace Continuous Annealer,858.4,3.4,146.1
2026-10-28T06:20:00Z,F-101,Furnace Continuous Annealer,865.2,3.5,148.8
2026-10-28T06:25:00Z,F-101,Furnace Continuous Annealer,874.0,3.6,151.2
2026-10-28T06:30:00Z,F-101,Furnace Continuous Annealer,886.5,3.7,155.0
2026-10-28T06:35:00Z,F-101,Furnace Continuous Annealer,899.8,3.9,159.4
2026-10-28T06:40:00Z,F-101,Furnace Continuous Annealer,912.4,4.1,164.0
2026-10-28T06:45:00Z,F-101,Furnace Continuous Annealer,926.1,4.3,170.2`,
  },
  {
    name: 'Global_Supply_Chain_Logistics.csv',
    description: 'Universal business document: Shipments, freight cost, transit days, on-time status',
    content: `shipment_id,origin,destination,carrier,freight_cost_usd,transit_days,on_time
SHP-1001,Rotterdam,Singapore,Maersk,4200,24,true
SHP-1002,Hamburg,Shanghai,Hapag-Lloyd,3850,28,true
SHP-1003,Shanghai,Los Angeles,CMA CGM,5100,16,false
SHP-1004,Singapore,Dubai,Ocean Network,2950,11,true
SHP-1005,Yokohama,Seattle,ONE Line,4800,14,true
SHP-1006,Busan,Rotterdam,Evergreen,6200,32,false
SHP-1007,Antwerp,Santos,MSC,4400,21,true
SHP-1008,Dubai,Mumbai,Emirates Line,1850,5,true`,
  },
  {
    name: 'Turbine_Vibration_Energy.json',
    description: 'JSON format telemetry: RPM, vibration RMS, temperature, efficiency',
    content: JSON.stringify(
      [
        { epoch_ms: 1793264400000, turbine_id: 'TB-01', rpm: 3600, temp_c: 72.4, vibration_rms: 1.8 },
        { epoch_ms: 1793264460000, turbine_id: 'TB-01', rpm: 3602, temp_c: 73.1, vibration_rms: 1.9 },
        { epoch_ms: 1793264520000, turbine_id: 'TB-01', rpm: 3598, temp_c: 74.5, vibration_rms: 2.1 },
        { epoch_ms: 1793264580000, turbine_id: 'TB-01', rpm: 3605, temp_c: 78.2, vibration_rms: 3.4 },
        { epoch_ms: 1793264640000, turbine_id: 'TB-01', rpm: 3610, temp_c: 84.6, vibration_rms: 4.8 },
      ],
      null,
      2
    ),
  },
];

export const UniversalDocumentEngine: React.FC<{ onNavigateToTelemetry?: () => void }> = ({
  onNavigateToTelemetry,
}) => {
  const { addImportedDocument, setViewHistoricalAlongside } = useTelemetry();

  // Active document state
  const [activeDoc, setActiveDoc] = useState<UniversalDocument | null>(() => {
    // Load initial sample document
    const sample = SAMPLE_DATASETS[0];
    const { columns, rows } = parseDelimitedText(sample.content);
    const profiles = profileColumns(columns, rows);
    return {
      id: 'DOC-INIT-1',
      fileName: sample.name,
      fileSize: sample.content.length,
      uploadedAt: Date.now(),
      rowCount: rows.length,
      columns,
      profiles,
      rows,
    };
  });

  const [rawTextInput, setRawTextInput] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'EXPLORE' | 'CHART' | 'SCHEMA_MAP'>('EXPLORE');
  const [tableSearch, setTableSearch] = useState<string>('');

  // Dynamic Chart Configuration
  const [chartXCol, setChartXCol] = useState<string>('');
  const [chartYCol, setChartYCol] = useState<string>('');

  // Schema Mapping Form State
  const [mapping, setMapping] = useState<TelemetryColumnMapping>({
    timestampCol: '',
    sensorIdCol: '',
    temperatureCol: '',
    unit: '°C',
  });
  const [mapValidationMessage, setMapValidationMessage] = useState<string | null>(null);

  // Auto-suggest column mapping when activeDoc changes
  React.useEffect(() => {
    if (!activeDoc) return;
    const timeCol = activeDoc.columns.find(c => activeDoc.profiles[c]?.isLikelyTimestamp) || activeDoc.columns[0];
    const tempCol = activeDoc.columns.find(c => activeDoc.profiles[c]?.isLikelyTemperature) || activeDoc.columns.find(c => activeDoc.profiles[c]?.type === 'number');
    const sensorCol = activeDoc.columns.find(c => activeDoc.profiles[c]?.isLikelySensorId) || '';

    setMapping({
      timestampCol: timeCol || '',
      sensorIdCol: sensorCol || '',
      temperatureCol: tempCol || '',
      unit: tempCol?.toLowerCase().includes('_f') ? '°F' : '°C',
    });

    // Default chart columns
    if (activeDoc.columns.length > 0) {
      setChartXCol(timeCol || activeDoc.columns[0]);
      setChartYCol(tempCol || activeDoc.columns.find(c => activeDoc.profiles[c]?.type === 'number') || activeDoc.columns[1] || '');
    }
  }, [activeDoc]);

  // Load a pre-built sample dataset
  const loadSample = (sample: typeof SAMPLE_DATASETS[0]) => {
    try {
      let parsed: { columns: string[]; rows: Record<string, any>[] };
      if (sample.name.endsWith('.json')) {
        parsed = parseJsonDocument(sample.content);
      } else {
        parsed = parseDelimitedText(sample.content);
      }

      const profiles = profileColumns(parsed.columns, parsed.rows);
      const newDoc: UniversalDocument = {
        id: `DOC-${Date.now()}`,
        fileName: sample.name,
        fileSize: sample.content.length,
        uploadedAt: Date.now(),
        rowCount: parsed.rows.length,
        columns: parsed.columns,
        profiles,
        rows: parsed.rows,
      };

      setActiveDoc(newDoc);
    } catch (err) {
      alert('Failed to load sample: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Handle file drop/upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        let parsed: { columns: string[]; rows: Record<string, any>[] };
        if (file.name.endsWith('.json')) {
          parsed = parseJsonDocument(text);
        } else {
          parsed = parseDelimitedText(text);
        }

        const profiles = profileColumns(parsed.columns, parsed.rows);
        const newDoc: UniversalDocument = {
          id: `DOC-${Date.now()}`,
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: Date.now(),
          rowCount: parsed.rows.length,
          columns: parsed.columns,
          profiles,
          rows: parsed.rows,
        };

        setActiveDoc(newDoc);
      } catch (err) {
        alert('File parsing failed: ' + (err instanceof Error ? err.message : String(err)));
      }
    };
    reader.readAsText(file);
  };

  // Handle Raw Text Paste
  const handlePasteSubmit = () => {
    if (!rawTextInput.trim()) return;
    try {
      let parsed: { columns: string[]; rows: Record<string, any>[] };
      if (rawTextInput.trim().startsWith('{') || rawTextInput.trim().startsWith('[')) {
        parsed = parseJsonDocument(rawTextInput);
      } else {
        parsed = parseDelimitedText(rawTextInput);
      }

      const profiles = profileColumns(parsed.columns, parsed.rows);
      const newDoc: UniversalDocument = {
        id: `DOC-PASTED-${Date.now()}`,
        fileName: 'Pasted_Data_Snippet.csv',
        fileSize: rawTextInput.length,
        uploadedAt: Date.now(),
        rowCount: parsed.rows.length,
        columns: parsed.columns,
        profiles,
        rows: parsed.rows,
      };

      setActiveDoc(newDoc);
      setRawTextInput('');
    } catch (err) {
      alert('Pasted text parse error: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Map & Inject into Industrial Telemetry
  const handleExecuteTelemetryMapping = () => {
    if (!activeDoc) return;
    const { telemetry, errors, warningCount } = validateAndMapTelemetry(activeDoc.rows, mapping);

    if (errors.length > 0) {
      setMapValidationMessage(`Validation Error: ${errors[0]}`);
      return;
    }

    if (telemetry.length === 0) {
      setMapValidationMessage('No valid telemetry points could be parsed from selected columns.');
      return;
    }

    const updatedDoc: UniversalDocument = {
      ...activeDoc,
      mappedTelemetry: telemetry,
    };

    addImportedDocument(updatedDoc);
    setViewHistoricalAlongside(true);
    setMapValidationMessage(`Successfully mapped ${telemetry.length} points! (${warningCount} records flagged/cleaned). Ready for parallel oscilloscope analysis.`);

    if (onNavigateToTelemetry) {
      setTimeout(() => onNavigateToTelemetry(), 1200);
    }
  };

  // Filtered rows for explorer table
  const displayedRows = useMemo(() => {
    if (!activeDoc) return [];
    if (!tableSearch) return activeDoc.rows.slice(0, 50);

    const q = tableSearch.toLowerCase();
    return activeDoc.rows.filter(r =>
      Object.values(r).some(val => String(val).toLowerCase().includes(q))
    ).slice(0, 50);
  }, [activeDoc, tableSearch]);

  return (
    <div className="space-y-4 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Universal Document Dashboard & Industrial Schema Mapper
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-type profiling, general dataset exploration, and schema validation into historical telemetry streams
          </p>
        </div>

        {/* Quick Sample Load Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400">Load Sample:</span>
          {SAMPLE_DATASETS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => loadSample(sample)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1 rounded text-xs font-medium transition-colors"
            >
              Sample {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Upload & Ingestion Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Upload Box */}
        <label className="bg-slate-900 border-2 border-dashed border-slate-800 hover:border-cyan-500/80 rounded-xl p-4 flex items-center justify-center gap-3 cursor-pointer transition-colors text-xs text-slate-300">
          <Upload className="w-5 h-5 text-cyan-400" />
          <div>
            <span className="font-semibold text-slate-100 block">Upload Document (CSV, TSV, JSON)</span>
            <span className="text-[10px] text-slate-400">Click to browse file from device</span>
          </div>
          <input type="file" accept=".csv,.tsv,.json,.txt" onChange={handleFileUpload} className="hidden" />
        </label>

        {/* Paste Snippet Box */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-2">
          <textarea
            value={rawTextInput}
            onChange={e => setRawTextInput(e.target.value)}
            placeholder="Paste raw CSV or JSON snippet here to parse instantly..."
            className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 text-xs p-2 rounded-lg font-mono outline-none resize-none h-12"
          />
          <button
            onClick={handlePasteSubmit}
            disabled={!rawTextInput.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white px-3 py-2 rounded-lg text-xs font-semibold shrink-0 transition-colors"
          >
            Parse Text
          </button>
        </div>
      </div>

      {activeDoc ? (
        <div className="space-y-4">
          {/* Document Overview KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-mono font-bold">Document Name</span>
              <span className="text-sm font-bold text-slate-100 truncate block mt-1 font-mono">
                {activeDoc.fileName}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-mono font-bold">Total Rows</span>
              <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">
                {activeDoc.rowCount.toLocaleString()}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-mono font-bold">Detected Columns</span>
              <span className="text-xl font-bold font-mono text-slate-100 mt-1 block">
                {activeDoc.columns.length}
              </span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl">
              <span className="text-slate-400 block text-[10px] uppercase font-mono font-bold">Industrial Ready?</span>
              <span className="text-xs font-bold mt-1 block font-mono text-emerald-400">
                {activeDoc.columns.some(c => activeDoc.profiles[c]?.isLikelyTemperature)
                  ? '✓ Auto-Detected Temp Stream'
                  : 'Universal Tabular Doc'}
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setActiveTab('EXPLORE')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'EXPLORE'
                  ? 'bg-slate-800 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-4 h-4" /> Data Explorer & Profiles
            </button>
            <button
              onClick={() => setActiveTab('CHART')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'CHART'
                  ? 'bg-slate-800 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-4 h-4" /> Dynamic Chart Builder
            </button>
            <button
              onClick={() => setActiveTab('SCHEMA_MAP')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'SCHEMA_MAP'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-cyan-400 hover:text-cyan-300'
              }`}
            >
              <Cpu className="w-4 h-4" /> Map to Industrial Telemetry
            </button>
          </div>

          {/* TAB 1: DATA EXPLORER & PROFILES */}
          {activeTab === 'EXPLORE' && (
            <div className="space-y-4">
              {/* Column Statistical Profiles Summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
                  Automatic Schema & Column Profiles
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {activeDoc.columns.map(col => {
                    const prof = activeDoc.profiles[col];
                    if (!prof) return null;
                    return (
                      <div key={col} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-200 truncate">{col}</span>
                          <span className="text-[10px] bg-slate-800 text-cyan-300 font-mono px-1.5 py-0.5 rounded">
                            {prof.type}
                          </span>
                        </div>
                        <div className="mt-2 space-y-1 text-[11px] text-slate-400 font-mono">
                          <div>Nulls: {prof.nullCount} ({((prof.nullCount / activeDoc.rowCount) * 100).toFixed(0)}%)</div>
                          <div>Uniques: {prof.uniqueCount}</div>
                          {prof.min !== undefined && <div>Min: {prof.min} | Max: {prof.max}</div>}
                          {prof.mean !== undefined && <div>Mean: {prof.mean}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Table with Search */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    Tabular Records Preview (First 50 Rows)
                  </h3>
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter records..."
                      value={tableSearch}
                      onChange={e => setTableSearch(e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-slate-200 px-2.5 py-1 rounded text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase border-b border-slate-800">
                      <tr>
                        {activeDoc.columns.map(c => (
                          <th key={c} className="py-2.5 px-3 font-semibold">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {displayedRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          {activeDoc.columns.map(c => (
                            <td key={c} className="py-2 px-3 text-slate-300 whitespace-nowrap">
                              {row[c] !== null && row[c] !== undefined ? String(row[c]) : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DYNAMIC CHART BUILDER */}
          {activeTab === 'CHART' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Universal Visual Chart Builder
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 mr-1.5">X-Axis Column:</span>
                    <select
                      value={chartXCol}
                      onChange={e => setChartXCol(e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1 outline-none font-mono"
                    >
                      {activeDoc.columns.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span className="text-slate-400 mr-1.5">Y-Axis Metric:</span>
                    <select
                      value={chartYCol}
                      onChange={e => setChartYCol(e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2 py-1 outline-none font-mono"
                    >
                      {activeDoc.columns.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Render Simple Interactive Chart */}
              {chartYCol && activeDoc.profiles[chartYCol]?.type === 'number' ? (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <div className="h-64 flex items-end gap-1.5 pt-4 px-2">
                    {displayedRows.slice(0, 30).map((r, i) => {
                      const val = Number(r[chartYCol]);
                      const maxVal = activeDoc.profiles[chartYCol]?.max || 100;
                      const heightPercent = isNaN(val) ? 0 : Math.max(5, Math.min(100, (val / maxVal) * 100));

                      return (
                        <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                          <div
                            className="w-full bg-cyan-500 hover:bg-cyan-400 rounded-t transition-all"
                            style={{ height: `${heightPercent}%` }}
                          />
                          <span className="text-[9px] font-mono text-slate-400 mt-1 truncate max-w-[40px]">
                            {String(r[chartXCol] || i).slice(-5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center text-[11px] text-slate-400 mt-2 font-mono">
                    Plotting {chartYCol} across {chartXCol} (30 sample bins)
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-950 rounded-xl border border-slate-800">
                  Please select a numeric column for the Y-Axis to render visualization.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SCHEMA MAPPER TO INDUSTRIAL TELEMETRY */}
          {activeTab === 'SCHEMA_MAP' && (
            <div className="bg-slate-900 border border-cyan-500/80 rounded-xl p-5 space-y-4 shadow-lg">
              <div>
                <h3 className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Industrial Telemetry Schema Mapping & Validation Pipeline
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Map this uploaded document's schema into the industrial telemetry engine. Validates temperature units, handles ISO/Epoch timestamps, detects missing intervals, and prepares data for parallel analysis alongside live simulated feeds.
                </p>
              </div>

              {mapValidationMessage && (
                <div
                  className={`p-3 rounded-lg text-xs font-semibold ${
                    mapValidationMessage.startsWith('Validation Error')
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  }`}
                >
                  {mapValidationMessage}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Timestamp Column:
                  </label>
                  <select
                    value={mapping.timestampCol}
                    onChange={e => setMapping({ ...mapping, timestampCol: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded p-2 font-mono outline-none"
                  >
                    <option value="">-- Select Column --</option>
                    {activeDoc.columns.map(c => (
                      <option key={c} value={c}>
                        {c} {activeDoc.profiles[c]?.isLikelyTimestamp ? '(Suggested Time)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Temperature Reading Column:
                  </label>
                  <select
                    value={mapping.temperatureCol}
                    onChange={e => setMapping({ ...mapping, temperatureCol: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded p-2 font-mono outline-none"
                  >
                    <option value="">-- Select Column --</option>
                    {activeDoc.columns.map(c => (
                      <option key={c} value={c}>
                        {c} {activeDoc.profiles[c]?.isLikelyTemperature ? '(Suggested Temp)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Sensor / Probe Identifier Column:
                  </label>
                  <select
                    value={mapping.sensorIdCol}
                    onChange={e => setMapping({ ...mapping, sensorIdCol: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded p-2 font-mono outline-none"
                  >
                    <option value="">-- None (Auto-assign Probe ID) --</option>
                    {activeDoc.columns.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Input Temperature Unit:
                  </label>
                  <select
                    value={mapping.unit}
                    onChange={e => setMapping({ ...mapping, unit: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded p-2 font-mono outline-none"
                  >
                    <option value="°C">Celsius (°C)</option>
                    <option value="°F">Fahrenheit (°F) - Auto convert</option>
                    <option value="K">Kelvin (K) - Auto convert</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleExecuteTelemetryMapping}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-4 py-2 rounded-lg text-xs flex items-center gap-2 transition-colors shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Validate & Map Historical Stream
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
