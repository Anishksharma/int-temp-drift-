/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { useTelemetry } from '../../context/TelemetryContext';
import { FactoryZone } from '../../types/telemetry';

export const DriftVelocityRadar: React.FC<{ height?: number }> = ({ height = 260 }) => {
  const { sensors, analyses } = useTelemetry();

  // Compute average drift velocity (absolute °C/min) per zone
  const zoneVelocities = useMemo(() => {
    const zones: Record<FactoryZone, { sum: number; count: number; maxAllowable: number }> = {
      'Furnace and Heat Treatment': { sum: 0, count: 0, maxAllowable: 4.5 },
      'Industrial Cooling': { sum: 0, count: 0, maxAllowable: 2.2 },
      'Motor and Bearing Assembly': { sum: 0, count: 0, maxAllowable: 3.5 },
      'Process Pipeline and Storage': { sum: 0, count: 0, maxAllowable: 3.0 },
    };

    sensors.forEach(sensor => {
      const analysis = analyses[sensor.id];
      if (analysis) {
        zones[sensor.zone].sum += Math.abs(analysis.rateOfChangePerMin);
        zones[sensor.zone].count += 1;
      }
    });

    return Object.entries(zones).map(([zone, data], index) => {
      const avg = data.count > 0 ? data.sum / data.count : 0;
      const normalizedRatio = Math.min(1.2, avg / data.maxAllowable); // 0 to 1.2
      return {
        zone: zone as FactoryZone,
        shortName: zone.replace(' and ', ' & ').replace(' Assembly', '').replace(' Treatment', ''),
        velocity: Math.round(avg * 100) / 100,
        maxAllowable: data.maxAllowable,
        ratio: normalizedRatio,
        angle: (index * 90 - 45) * (Math.PI / 180), // 4 axes at 45, 135, 225, 315 deg
      };
    });
  }, [sensors, analyses]);

  // Center & radius for radar SVG
  const cx = 140;
  const cy = 130;
  const maxR = 85;

  // Compute polygon points for current velocity
  const polygonPoints = zoneVelocities
    .map(z => {
      const r = Math.max(10, Math.min(maxR * 1.1, z.ratio * maxR));
      const x = cx + r * Math.cos(z.angle);
      const y = cy + r * Math.sin(z.angle);
      return `${x},${y}`;
    })
    .join(' ');

  // Compute safe operating envelope polygon (ratio = 0.5)
  const safeEnvelopePoints = zoneVelocities
    .map(z => {
      const r = maxR * 0.55;
      const x = cx + r * Math.cos(z.angle);
      const y = cy + r * Math.sin(z.angle);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Drift Velocity Radar
          </h3>
          <p className="text-[11px] text-slate-400">Multivariate thermal rate vector (°C/min) across zones</p>
        </div>
        <span className="text-[10px] bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 px-2 py-0.5 rounded font-mono">
          Polar Vector 4-Axis
        </span>
      </div>

      <div className="relative flex items-center justify-center" style={{ height: `${height}px` }}>
        <svg viewBox="0 0 280 260" className="w-full h-full max-w-[280px]">
          {/* Concentric Grid Circles */}
          {[0.25, 0.5, 0.75, 1.0].map((frac, idx) => (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={maxR * frac}
              fill="none"
              stroke="#1e293b"
              strokeWidth="1"
              strokeDasharray={frac === 0.5 ? '2 2' : 'none'}
            />
          ))}

          {/* Cross Axes */}
          {zoneVelocities.map((z, idx) => {
            const x = cx + maxR * Math.cos(z.angle);
            const y = cy + maxR * Math.sin(z.angle);
            return (
              <line
                key={idx}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="#334155"
                strokeWidth="1"
              />
            );
          })}

          {/* Safe Envelope Polygon */}
          <polygon
            points={safeEnvelopePoints}
            fill="#06b6d4"
            fillOpacity="0.06"
            stroke="#0891b2"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          {/* Current Live Drift Polygon */}
          <polygon
            points={polygonPoints}
            fill="#f97316"
            fillOpacity="0.28"
            stroke="#f97316"
            strokeWidth="2"
          />

          {/* Live Data Points */}
          {zoneVelocities.map((z, idx) => {
            const r = Math.max(10, Math.min(maxR * 1.1, z.ratio * maxR));
            const x = cx + r * Math.cos(z.angle);
            const y = cy + r * Math.sin(z.angle);
            const isHot = z.velocity > z.maxAllowable * 0.5;
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="4"
                className={isHot ? 'fill-orange-400 stroke-orange-200' : 'fill-cyan-400 stroke-cyan-100'}
                strokeWidth="1.5"
              />
            );
          })}

          {/* Axis Labels */}
          {zoneVelocities.map((z, idx) => {
            const labelR = maxR + 25;
            const x = cx + labelR * Math.cos(z.angle);
            const y = cy + labelR * Math.sin(z.angle) + 4;
            return (
              <text
                key={idx}
                x={x}
                y={y}
                textAnchor="middle"
                className="fill-slate-400 text-[10px] font-medium"
              >
                {z.shortName}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-800 text-[11px]">
        {zoneVelocities.map((z, i) => (
          <div key={i} className="flex items-center justify-between bg-slate-800/40 px-2 py-1 rounded">
            <span className="text-slate-400 truncate pr-1">{z.shortName}:</span>
            <span
              className={`font-mono font-semibold ${
                z.velocity > z.maxAllowable * 0.6 ? 'text-amber-400' : 'text-slate-200'
              }`}
            >
              {z.velocity.toFixed(2)} °C/m
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
