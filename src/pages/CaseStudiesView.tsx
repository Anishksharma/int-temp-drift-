/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { CASE_STUDIES } from '../utils/caseStudiesData';
import { CaseStudy, CaseStudyStep } from '../types/telemetry';
import {
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Flame,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';

export const CaseStudiesView: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string>(CASE_STUDIES[0].id);
  const activeCase = CASE_STUDIES.find(c => c.id === selectedCaseId) || CASE_STUDIES[0];

  // Simulation execution state
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simTimeSec, setSimTimeSec] = useState<number>(0);

  // Playback timer
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setSimTimeSec(prev => {
          const next = prev + 1;
          if (next >= activeCase.durationSec) {
            setIsPlaying(false);
            return activeCase.durationSec;
          }
          // Determine step index based on timeline offset
          for (let i = activeCase.steps.length - 1; i >= 0; i--) {
            if (next >= activeCase.steps[i].timeOffsetSec) {
              setCurrentStepIndex(i);
              break;
            }
          }
          return next;
        });
      }, 300); // 300ms per simulated second
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeCase]);

  // Reset when switching cases
  const switchCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setIsPlaying(false);
    setSimTimeSec(0);
    setCurrentStepIndex(0);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setSimTimeSec(0);
    setCurrentStepIndex(0);
  };

  const currentStep = activeCase.steps[currentStepIndex];

  // SVG Chart points for the entire timeline
  const chartW = 750;
  const chartH = 220;
  const padL = 50;
  const padR = 30;
  const padT = 20;
  const padB = 30;

  const minTemp = Math.min(...activeCase.steps.map(s => s.systemTemp), activeCase.baselineTemp) - 5;
  const maxTemp = Math.max(...activeCase.steps.map(s => s.systemTemp), activeCase.criticalLimit) + 5;
  const tempSpan = Math.max(1, maxTemp - minTemp);

  const getX = (sec: number) => padL + (sec / activeCase.durationSec) * (chartW - padL - padR);
  const getY = (temp: number) => padT + (chartH - padT - padB) - ((temp - minTemp) / tempSpan) * (chartH - padT - padB);

  // Trajectory curve
  const pathD = activeCase.steps
    .map((s, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(s.timeOffsetSec).toFixed(1)},${getY(s.systemTemp).toFixed(1)}`)
    .join(' ');

  // Current playhead position
  const playheadX = getX(simTimeSec);
  const interpTemp = currentStep ? currentStep.systemTemp : activeCase.baselineTemp;
  const playheadY = getY(interpTemp);

  return (
    <div className="space-y-4 p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-100">
              Interactive Industrial Disaster Case Studies
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Four reproducible thermal anomaly incident simulations with root causes and early-warning response timelines
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              isPlaying ? 'bg-amber-600 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Start Simulation'}</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <div className="px-2 font-mono text-xs text-cyan-300 font-bold border-l border-slate-700">
            T+ {simTimeSec}s / {activeCase.durationSec}s
          </div>
        </div>
      </div>

      {/* Case Study Selection Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
        {CASE_STUDIES.map((c, idx) => {
          const isSelected = c.id === selectedCaseId;
          return (
            <button
              key={c.id}
              onClick={() => switchCase(c.id)}
              className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-950/70 border-cyan-500/80 ring-1 ring-cyan-500/40 text-cyan-100'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block mb-1">
                  Case 0{idx + 1} • {c.zone.split(' ')[0]}
                </span>
                <h4 className="text-xs font-bold line-clamp-2">{c.title}</h4>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Crit: {c.criticalLimit}°C</span>
                <span className="text-cyan-400 font-medium">{c.durationSec}s Sim</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Case Study Timeline Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Interactive Graph & Event Sequence (2 spans) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-100">{activeCase.title}</h3>
              <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                Target: {activeCase.equipment}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{activeCase.description}</p>
          </div>

          {/* SVG Timeline Chart */}
          <div className="relative bg-slate-950 p-2 rounded-xl border border-slate-800">
            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto">
              {/* Critical Limit Line */}
              <line
                x1={padL}
                y1={getY(activeCase.criticalLimit)}
                x2={chartW - padR}
                y2={getY(activeCase.criticalLimit)}
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="4 3"
              />
              <text
                x={chartW - padR - 5}
                y={getY(activeCase.criticalLimit) - 5}
                textAnchor="end"
                className="fill-rose-400 font-mono text-[10px] font-bold"
              >
                CRITICAL LIMIT: {activeCase.criticalLimit}°C
              </text>

              {/* Baseline Line */}
              <line
                x1={padL}
                y1={getY(activeCase.baselineTemp)}
                x2={chartW - padR}
                y2={getY(activeCase.baselineTemp)}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={chartW - padR - 5}
                y={getY(activeCase.baselineTemp) + 12}
                textAnchor="end"
                className="fill-slate-400 font-mono text-[10px]"
              >
                BASELINE: {activeCase.baselineTemp}°C
              </text>

              {/* Incident Temperature Trajectory Curve */}
              <path
                d={pathD}
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Event Step Markers */}
              {activeCase.steps.map((step, idx) => {
                const x = getX(step.timeOffsetSec);
                const y = getY(step.systemTemp);
                const isPassed = simTimeSec >= step.timeOffsetSec;
                return (
                  <g key={idx} className="cursor-pointer" onClick={() => {
                    setSimTimeSec(step.timeOffsetSec);
                    setCurrentStepIndex(idx);
                  }}>
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      className={
                        step.alertTriggered === 'EMERGENCY'
                          ? 'fill-rose-600 stroke-white'
                          : step.alertTriggered === 'CRITICAL'
                          ? 'fill-rose-500 stroke-rose-200'
                          : step.alertTriggered === 'WARNING'
                          ? 'fill-amber-400 stroke-amber-100'
                          : 'fill-cyan-400 stroke-cyan-100'
                      }
                      strokeWidth="1.5"
                    />
                    <text
                      x={x}
                      y={chartH - 10}
                      textAnchor="middle"
                      className="fill-slate-400 text-[9px] font-mono"
                    >
                      {step.timeOffsetSec}s
                    </text>
                  </g>
                );
              })}

              {/* Live Playhead Line */}
              <line
                x1={playheadX}
                y1={padT}
                x2={playheadX}
                y2={chartH - padB}
                stroke="#f59e0b"
                strokeWidth="2"
              />
              <circle cx={playheadX} cy={playheadY} r="7" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>

          {/* Current Step Spotlight Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Step {currentStepIndex + 1} of {activeCase.steps.length} • T+ {currentStep?.timeOffsetSec}s
              </span>
              {currentStep?.alertTriggered && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    currentStep.alertTriggered === 'EMERGENCY'
                      ? 'bg-rose-600 text-white'
                      : currentStep.alertTriggered === 'CRITICAL'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {currentStep.alertTriggered} ALERT ACTIVATED
                </span>
              )}
            </div>

            <h4 className="text-sm font-bold text-slate-100">{currentStep?.title}</h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">{currentStep?.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Physical Telemetry & Anomaly Score
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-lg font-bold font-mono text-cyan-300">
                    {currentStep?.systemTemp.toFixed(1)}°C
                  </span>
                  <span className="text-[11px] font-mono text-purple-400">
                    Anomaly Score: {currentStep?.anomalyScore.toFixed(2)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{currentStep?.phenomenon}</p>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Standard Operating Response Required
                </span>
                <p className="text-[11px] text-emerald-300 font-medium mt-1">
                  {currentStep?.actionRequired}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Root Cause Analysis & Prevention SOP (1 span) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-cyan-400" />
                Root Cause Engineering Analysis
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                {activeCase.rootCause}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                Prevention SOP Guidelines
              </h3>
              <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 whitespace-pre-line font-mono text-[11px]">
                {activeCase.preventionSOP}
              </div>
            </div>
          </div>

          <div className="bg-cyan-950/40 border border-cyan-800/60 p-3 rounded-lg text-xs text-cyan-200">
            <span className="font-bold block mb-1">Early Warning Benefit:</span>
            ThermoDrift alerted operators 18 minutes prior to emergency failure threshold, preventing $140,000 in unplanned equipment downtime.
          </div>
        </div>
      </div>
    </div>
  );
};
