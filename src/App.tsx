/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { TelemetryProvider, useTelemetry } from './context/TelemetryContext';
import { SimulationControlBar } from './components/common/SimulationControlBar';
import { CriticalAlertModal } from './components/alerts/CriticalAlertModal';
import { CommandCenter } from './pages/CommandCenter';
import { FactoryDigitalTwin } from './pages/FactoryDigitalTwin';
import { LiveTelemetryView } from './pages/LiveTelemetryView';
import { DriftIntelligence } from './pages/DriftIntelligence';
import { AlertsView } from './pages/AlertsView';
import { CaseStudiesView } from './pages/CaseStudiesView';
import { EquipmentHealth } from './pages/EquipmentHealth';
import { SensorManagement } from './pages/SensorManagement';
import { ReportsAndSettings } from './pages/ReportsAndSettings';
import { UniversalDocumentEngine } from './pages/UniversalDocumentEngine';
import {
  LayoutDashboard,
  Layers,
  Activity,
  BrainCircuit,
  Bell,
  BookOpen,
  HeartPulse,
  SlidersHorizontal,
  Settings,
  FileSpreadsheet,
  Flame,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';

type PageId =
  | 'command-center'
  | 'digital-twin'
  | 'telemetry'
  | 'drift-ai'
  | 'alerts'
  | 'case-studies'
  | 'equipment'
  | 'sensors'
  | 'reports'
  | 'universal-docs';

const NAV_ITEMS: { id: PageId; label: string; icon: React.ReactNode; isUniversal?: boolean }[] = [
  { id: 'command-center', label: 'Command Center', icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'digital-twin', label: 'Factory Digital Twin', icon: <Layers className="w-4 h-4" /> },
  { id: 'telemetry', label: 'Live Telemetry', icon: <Activity className="w-4 h-4" /> },
  { id: 'drift-ai', label: 'AI Drift Intelligence', icon: <BrainCircuit className="w-4 h-4" /> },
  { id: 'alerts', label: 'Alerts & Incidents', icon: <Bell className="w-4 h-4" /> },
  { id: 'case-studies', label: 'Case Studies', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'equipment', label: 'Equipment Health', icon: <HeartPulse className="w-4 h-4" /> },
  { id: 'sensors', label: 'Sensor Management', icon: <SlidersHorizontal className="w-4 h-4" /> },
  { id: 'reports', label: 'Reports & Settings', icon: <Settings className="w-4 h-4" /> },
  { id: 'universal-docs', label: 'Universal Document Engine', icon: <FileSpreadsheet className="w-4 h-4 text-emerald-400" />, isUniversal: true },
];

const MainLayout: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageId>('command-center');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const { unreadAlertCount } = useTelemetry();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top SCADA Master Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-lg bg-slate-800 text-slate-300"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setCurrentPage('command-center')}
          >
            <div className="p-1.5 rounded-lg bg-cyan-600/30 text-cyan-400 border border-cyan-500/40">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-extrabold tracking-wider text-slate-100 uppercase font-mono">
                  ThermoDrift SCADA
                </h1>
                <span className="hidden sm:inline-block text-[9px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/80 px-1.5 py-0.5 rounded">
                  v2.4 RT-EARLY-WARNING
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Industrial Temperature Drift Detection & Early Warning System
              </p>
            </div>
          </div>
        </div>

        {/* Universal Mode Switcher & Alerts Badge in Header */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentPage('universal-docs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              currentPage === 'universal-docs'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Universal Document Engine</span>
          </button>

          <button
            onClick={() => setCurrentPage('alerts')}
            className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            aria-label="Open Alerts"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            {unreadAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-mono font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                {unreadAlertCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Primary Navigation Ribbon (Desktop) */}
      <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 border-b border-slate-800/80 px-4 py-1.5 overflow-x-auto text-xs font-medium">
        {NAV_ITEMS.map(item => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                isActive
                  ? item.isUniversal
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : item.isUniversal
                  ? 'text-emerald-400 hover:bg-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.id === 'alerts' && unreadAlertCount > 0 && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-rose-600 text-white'
                  }`}
                >
                  {unreadAlertCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden bg-slate-900 border-b border-slate-800 p-3 space-y-1 text-xs">
          {NAV_ITEMS.map(item => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg ${
                  isActive ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.id === 'alerts' && unreadAlertCount > 0 && (
                  <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                    {unreadAlertCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}

      {/* Simulation Master Controller */}
      <SimulationControlBar />

      {/* Main Page Content */}
      <main className="flex-1 pb-12">
        {currentPage === 'command-center' && (
          <CommandCenter onNavigateToPage={p => setCurrentPage(p as PageId)} />
        )}
        {currentPage === 'digital-twin' && <FactoryDigitalTwin />}
        {currentPage === 'telemetry' && <LiveTelemetryView />}
        {currentPage === 'drift-ai' && <DriftIntelligence />}
        {currentPage === 'alerts' && <AlertsView onInspectSensor={() => setCurrentPage('telemetry')} />}
        {currentPage === 'case-studies' && <CaseStudiesView />}
        {currentPage === 'equipment' && <EquipmentHealth />}
        {currentPage === 'sensors' && <SensorManagement />}
        {currentPage === 'reports' && <ReportsAndSettings />}
        {currentPage === 'universal-docs' && (
          <UniversalDocumentEngine onNavigateToTelemetry={() => setCurrentPage('telemetry')} />
        )}
      </main>

      {/* Takeover Modal for Emergency/Critical Alerts */}
      <CriticalAlertModal />
    </div>
  );
};

export default function App() {
  return (
    <TelemetryProvider>
      <MainLayout />
    </TelemetryProvider>
  );
}
