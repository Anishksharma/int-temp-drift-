/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { TelemetryPoint, SensorMetadata, SensorAnalysis } from '../../types/telemetry';

interface TelemetryChartProps {
  sensor: SensorMetadata;
  points: TelemetryPoint[];
  analysis?: SensorAnalysis;
  historicalPoints?: TelemetryPoint[];
  height?: number;
  showProjection?: boolean;
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  sensor,
  points,
  analysis,
  historicalPoints,
  height = 320,
  showProjection = true,
}) => {
  const [range, setRange] = useState<'1m' | '3m' | '5m' | 'ALL'>('3m');
  const [showBaseline, setShowBaseline] = useState<boolean>(true);
  const [showLimits, setShowLimits] = useState<boolean>(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Filter points based on range
  const activePoints = useMemo(() => {
    if (range === '1m') return points.slice(-30);
    if (range === '3m') return points.slice(-60);
    if (range === '5m') return points.slice(-90);
    return points;
  }, [points, range]);

  if (!activePoints || activePoints.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-500 text-xs"
        style={{ height: `${height}px` }}
      >
        Awaiting telemetry time-series stream...
      </div>
    );
  }

  // Calculate scales (min and max temperatures)
  const temps = activePoints.map(p => p.temperature);
  const baselines = activePoints.map(p => p.baseline);
  let allValues = [...temps, ...baselines];

  if (showLimits) {
    allValues.push(sensor.limits.nominalTemp, sensor.limits.warningHigh, sensor.limits.criticalHigh);
    if (sensor.limits.warningLow) allValues.push(sensor.limits.warningLow);
  }

  if (historicalPoints && historicalPoints.length > 0) {
    allValues.push(...historicalPoints.slice(-50).map(p => p.temperature));
  }

  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const padding = Math.max(2, (rawMax - rawMin) * 0.12);
  const yMin = Math.floor(rawMin - padding);
  const yMax = Math.ceil(rawMax + padding);
  const ySpan = Math.max(1, yMax - yMin);

  // Chart SVG Coordinates
  const svgWidth = 800;
  const svgHeight = height;
  const padLeft = 55;
  const padRight = showProjection ? 90 : 30;
  const padTop = 25;
  const padBottom = 35;
  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  const getX = (index: number, total: number) => {
    if (total <= 1) return padLeft;
    return padLeft + (index / (total - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return padTop + chartHeight - ((clamped - yMin) / ySpan) * chartHeight;
  };

  // Build SVG Paths
  const tempPath = activePoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx, activePoints.length).toFixed(1)},${getY(p.temperature).toFixed(1)}`)
    .join(' ');

  const baselinePath = activePoints
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx, activePoints.length).toFixed(1)},${getY(p.baseline).toFixed(1)}`)
    .join(' ');

  // Gradient area fill under raw temperature curve
  const areaPath = `${tempPath} L ${getX(activePoints.length - 1, activePoints.length)},${padTop + chartHeight} L ${padLeft},${padTop + chartHeight} Z`;

  // Historical overlay path if present
  let histPath = '';
  if (historicalPoints && historicalPoints.length > 0) {
    const histSlice = historicalPoints.slice(-activePoints.length);
    histPath = histSlice
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx, histSlice.length).toFixed(1)},${getY(p.temperature).toFixed(1)}`)
      .join(' ');
  }

  // Projection forward cone
  const lastPoint = activePoints[activePoints.length - 1];
  const lastX = getX(activePoints.length - 1, activePoints.length);
  const lastY = getY(lastPoint.temperature);
  const roc = analysis?.rateOfChangePerMin || 0;
  // Project forward 3 simulated minutes
  const projectedTemp = lastPoint.temperature + roc * 2.5;
  const projX = svgWidth - 15;
  const projY = getY(projectedTemp);
  const uncertainty = Math.max(1.5, Math.abs(roc) * 0.8 + 1.0);
  const projUpperY = getY(projectedTemp + uncertainty);
  const projLowerY = getY(projectedTemp - uncertainty);
  const conePath = `M ${lastX},${lastY} L ${projX},${projUpperY} L ${projX},${projLowerY} Z`;

  // Grid steps
  const gridSteps = 5;
  const gridValues = Array.from({ length: gridSteps }, (_, i) => yMin + (i * ySpan) / (gridSteps - 1));

  const hoveredPoint = hoverIndex !== null && activePoints[hoverIndex] ? activePoints[hoverIndex] : lastPoint;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col shadow-sm">
      {/* Chart Top Controls & Legends */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div>
            <h4 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              {sensor.id} Telemetry Time-Series Oscilloscope
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-mono">
              <span>Nominal: {sensor.limits.nominalTemp}°C</span>
              <span>•</span>
              <span className="text-amber-400">Warn: {sensor.limits.warningHigh}°C</span>
              <span>•</span>
              <span className="text-rose-400">Crit: {sensor.limits.criticalHigh}°C</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Toggles */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg text-[11px]">
            <button
              onClick={() => setShowBaseline(b => !b)}
              className={`px-2 py-1 rounded transition-colors ${
                showBaseline ? 'bg-slate-700 text-cyan-300 font-medium' : 'text-slate-400'
              }`}
            >
              Baseline
            </button>
            <button
              onClick={() => setShowLimits(l => !l)}
              className={`px-2 py-1 rounded transition-colors ${
                showLimits ? 'bg-slate-700 text-rose-300 font-medium' : 'text-slate-400'
              }`}
            >
              Limits
            </button>
          </div>

          {/* Range Buttons */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg text-[11px] font-mono">
            {(['1m', '3m', '5m', 'ALL'] as const).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2 py-1 rounded transition-colors ${
                  range === r ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto cursor-crosshair select-none"
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const relX = (e.clientX - rect.left) * (svgWidth / rect.width);
            const clampedX = Math.max(padLeft, Math.min(padLeft + chartWidth, relX));
            const frac = (clampedX - padLeft) / chartWidth;
            const idx = Math.min(activePoints.length - 1, Math.max(0, Math.round(frac * (activePoints.length - 1))));
            setHoverIndex(idx);
          }}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="coneGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid Lines & Y-Axis Labels */}
          {gridValues.map((val, idx) => {
            const y = getY(val);
            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-500 text-[10px] font-mono"
                >
                  {val.toFixed(1)}°
                </text>
              </g>
            );
          })}

          {/* Threshold Lines */}
          {showLimits && (
            <>
              {/* Critical High */}
              <line
                x1={padLeft}
                y1={getY(sensor.limits.criticalHigh)}
                x2={svgWidth - padRight}
                y2={getY(sensor.limits.criticalHigh)}
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={svgWidth - padRight + 6}
                y={getY(sensor.limits.criticalHigh) + 3}
                className="fill-rose-400 text-[9px] font-mono font-semibold"
              >
                CRIT {sensor.limits.criticalHigh}°
              </text>

              {/* Warning High */}
              <line
                x1={padLeft}
                y1={getY(sensor.limits.warningHigh)}
                x2={svgWidth - padRight}
                y2={getY(sensor.limits.warningHigh)}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <text
                x={svgWidth - padRight + 6}
                y={getY(sensor.limits.warningHigh) + 3}
                className="fill-amber-400 text-[9px] font-mono font-semibold"
              >
                WARN {sensor.limits.warningHigh}°
              </text>
            </>
          )}

          {/* Area Fill */}
          <path d={areaPath} fill="url(#tempGradient)" />

          {/* Historical Telemetry Path if present */}
          {histPath && (
            <path
              d={histPath}
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
          )}

          {/* Rolling Baseline Curve */}
          {showBaseline && (
            <path
              d={baselinePath}
              fill="none"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}

          {/* Raw Temperature Line */}
          <path
            d={tempPath}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Projection Shaded Cone */}
          {showProjection && showLimits && Math.abs(roc) > 0.05 && (
            <g>
              <path d={conePath} fill="url(#coneGradient)" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
              <line
                x1={lastX}
                y1={lastY}
                x2={projX}
                y2={projY}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="3 2"
              />
              <text
                x={projX}
                y={projY - 6}
                textAnchor="end"
                className="fill-amber-400 text-[9px] font-mono font-medium"
              >
                Projected {projectedTemp.toFixed(1)}°
              </text>
            </g>
          )}

          {/* Hover Crosshair & Dot */}
          {hoverIndex !== null && activePoints[hoverIndex] && (
            <g>
              <line
                x1={getX(hoverIndex, activePoints.length)}
                y1={padTop}
                x2={getX(hoverIndex, activePoints.length)}
                y2={padTop + chartHeight}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoverIndex, activePoints.length)}
                cy={getY(activePoints[hoverIndex].temperature)}
                r="5"
                fill="#22d3ee"
                stroke="#0f172a"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Hover Readout Bar */}
        <div className="flex flex-wrap items-center justify-between text-xs bg-slate-950/70 border-t border-slate-800 px-3 py-2 mt-1 rounded-b-lg font-mono">
          <div className="flex items-center gap-4">
            <span className="text-slate-400">
              Time:{' '}
              <strong className="text-slate-200">
                {new Date(hoveredPoint.timestamp).toLocaleTimeString()}
              </strong>
            </span>
            <span className="text-cyan-400">
              Temp: <strong className="text-cyan-300">{hoveredPoint.temperature.toFixed(2)}°C</strong>
            </span>
            {showBaseline && (
              <span className="text-slate-400">
                Baseline:{' '}
                <strong className="text-slate-300">{hoveredPoint.baseline.toFixed(2)}°C</strong>
              </span>
            )}
            <span className="text-amber-400">
              dT/dt:{' '}
              <strong className="text-amber-300">
                {hoveredPoint.rateOfChange > 0 ? '+' : ''}
                {hoveredPoint.rateOfChange.toFixed(2)}°C/m
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-purple-400">
              Anomaly Score:{' '}
              <strong className="text-purple-300">{hoveredPoint.anomalyScore.toFixed(3)}</strong>
            </span>
            {hoveredPoint.isAnomaly && (
              <span className="bg-rose-950 text-rose-300 px-2 py-0.5 rounded text-[10px] font-bold border border-rose-800">
                ANOMALY FLAGGED
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
