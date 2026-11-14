import React, { useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { ProductionSite, UserProfile } from '../../types';
import { GeoLocationData } from '../../GeoMapAssist';
import { SynapsysLogo } from '../../SynapsysLogo';
import { MANUFACTURING_HUBS } from '../../lib/manufacturingHubs';

const LazyGeoMapAssist = lazy(() => import('../../GeoMapAssist'));

export interface PlantSetupOnboardingProps {
  currentUser: UserProfile;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
  onPlantCommissioned: (site: ProductionSite) => void;
}

export const PlantSetupOnboarding: React.FC<PlantSetupOnboardingProps> = ({
  currentUser,
  isDarkMode,
  onToggleTheme,
  onLogout,
  onPlantCommissioned,
}) => {
  const isOperator = currentUser.role === 'operator';
  const roleLabel =
    currentUser.role === 'owner'
      ? 'Company Owner'
      : currentUser.role === 'manager'
      ? 'Plant Manager'
      : currentUser.role === 'admin'
      ? 'Plant Supervisor / Admin'
      : 'Floor Operator';

  const initialPrefix = (currentUser.company_name || currentUser.company_domain.split('.')[0])
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-');

  const [form, setForm] = useState({
    name: `${currentUser.company_name || 'Primary'} Manufacturing Facility 01`,
    id: `synapsys-mfg-${initialPrefix}-01`.replace(/-+/g, '-'),
    region: 'asia-south1',
    location: 'Coimbatore, Tamil Nadu, India',
    latitude: 11.0168,
    longitude: 76.9558,
    facility_type: 'Advanced Precision Manufacturing & Assembly',
    active_lines: 8,
    target_capacity: 4200,
    nominal_oee: 88.5,
  });

  const [showMapAssist, setShowMapAssist] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleApplyPreset = (preset: {
    name: string;
    id: string;
    region: string;
    location: string;
    latitude: number;
    longitude: number;
    facility_type: string;
    active_lines: number;
    target_capacity: number;
    nominal_oee: number;
  }) => {
    setForm((prev) => ({
      ...prev,
      ...preset,
      name: `${currentUser.company_name || 'SynapSYS'} - ${preset.name}`,
      id: `synapsys-mfg-${initialPrefix}-${preset.id.split('-').pop()}`.replace(/-+/g, '-'),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!form.name.trim() || !form.id.trim()) {
      setErrorMessage('Please provide a valid facility name and deployment slug.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<ProductionSite> = {
        name: form.name.trim(),
        id: form.id.trim(),
        region: form.region,
        location: form.location.trim(),
        latitude: form.latitude,
        longitude: form.longitude,
        facility_type: form.facility_type,
        active_lines: form.active_lines,
        target_capacity: form.target_capacity,
        nominal_oee: form.nominal_oee,
        company_domain: currentUser.company_domain,
        company_name: currentUser.company_name,
        status: 'active',
        created_at: new Date().toISOString(),
      };

      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server returned HTTP ${res.status}`);
      }

      const createdSite: ProductionSite = await res.json();

      // Persist to local storage for instant dashboard sync
      localStorage.setItem('synapsys_current_project', createdSite.id);
      localStorage.setItem('synapsys_production_sites', JSON.stringify([createdSite]));
      localStorage.setItem(
        'synapsys_auth_user',
        JSON.stringify({
          ...currentUser,
          assigned_facility: createdSite.id,
        })
      );

      onPlantCommissioned(createdSite);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to commission plant. Please verify network connectivity.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-g-bg text-g-text flex flex-col justify-between font-sans transition-colors duration-200">
      {/* Header Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-g-border bg-g-surface/90 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <SynapsysLogo className="h-7 w-auto text-g-blue" />
          <span className="font-mono text-xs uppercase tracking-wider text-g-textSecondary border-l border-g-border pl-3 hidden sm:inline">
            Plant Onboarding & Commissioning
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* User Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-g-surfaceElevated border border-g-border text-xs">
            <span className="font-semibold text-g-text">{currentUser.full_name}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-g-blue/15 text-g-blue border border-g-blue/30 uppercase font-bold">
              {currentUser.role}
            </span>
            <span className="text-g-textMuted font-mono border-l border-g-border pl-2">
              {currentUser.company_name}
            </span>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-lg bg-g-surfaceElevated border border-g-border text-g-textSecondary hover:text-g-text text-xs cursor-pointer"
            title="Toggle Theme"
          >
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg border border-rose-500/30 hover:border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold cursor-pointer transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        {isOperator ? (
          /* Operator Notice Screen: Operator cannot provision plant */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-2xl bg-g-surface border border-amber-500/40 text-center max-w-xl mx-auto shadow-lg space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-g-text">Plant Commissioning Required</h2>
            <p className="text-sm text-g-textSecondary leading-relaxed">
              No active production facility has been commissioned for{' '}
              <strong className="text-g-text">{currentUser.company_name}</strong> yet. Only authorized{' '}
              <strong className="text-amber-300">Company Owners, Plant Managers, or Admins</strong> can configure and set up production plants.
            </p>
            <div className="p-3.5 rounded-lg bg-g-surfaceElevated border border-g-border text-xs text-g-textMuted text-left font-mono leading-relaxed">
              Please contact your Company Owner or Plant Manager to initialize your company plant. Once set up and running, floor operators will be granted immediate access.
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="w-full py-2.5 rounded-lg bg-g-blue hover:bg-g-blueHover text-white text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              Sign Out & Return to Login
            </button>
          </motion.div>
        ) : (
          /* Owner / Manager / Admin Setup Wizard */
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Hero Banner */}
            <div className="p-6 sm:p-7 rounded-2xl bg-g-surface border border-g-blue/30 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-g-blue/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-g-blueLight text-g-blue border border-g-blue/30">
                  Initial Facility Commissioning
                </span>
                <span className="text-xs font-mono text-g-textSecondary">
                  Authorized Role: <strong className="text-g-text">{roleLabel}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-g-text tracking-tight">
                Commission Your First Production Plant
              </h1>
              <p className="text-xs sm:text-sm text-g-textSecondary mt-1.5 max-w-3xl leading-relaxed">
                Welcome to SynapSYS, <strong className="text-g-text">{currentUser.full_name}</strong>. Organization{' '}
                <strong className="text-g-blue">{currentUser.company_name}</strong> does not have an active production plant yet.
                Configure your facility parameters, regional edge gateway, and geographical coordinates to launch live telemetry.
              </p>

              {/* Quick Preset Buttons */}
              <div className="mt-4 pt-4 border-t border-g-border/60 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-g-textMuted">Quick Corridors:</span>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset({
                      name: 'Coimbatore Precision Tooling 07',
                      id: 'in-coimbatore',
                      region: 'asia-south1',
                      location: 'Coimbatore, Tamil Nadu, India',
                      latitude: 11.0168,
                      longitude: 76.9558,
                      facility_type: 'Precision Tooling & Pump Machining',
                      active_lines: 12,
                      target_capacity: 4800,
                      nominal_oee: 89.2,
                    })
                  }
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-pointer transition-colors"
                >
                  Coimbatore Tooling (India)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset({
                      name: 'Austin Gigafactory 05',
                      id: 'us-austin',
                      region: 'us-south1',
                      location: 'Austin, TX, USA',
                      latitude: 30.2223,
                      longitude: -97.6171,
                      facility_type: 'EV Powertrain & Battery Cell',
                      active_lines: 14,
                      target_capacity: 5200,
                      nominal_oee: 89.2,
                    })
                  }
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-g-surfaceElevated hover:border-g-blue text-g-text border border-g-border cursor-pointer transition-colors"
                >
                  Austin Gigafactory (USA)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyPreset({
                      name: 'Munich Press Shop 03',
                      id: 'eu-munich',
                      region: 'europe-west3',
                      location: 'Munich, Germany',
                      latitude: 48.1351,
                      longitude: 11.582,
                      facility_type: 'Precision Stamping & BiW Assembly',
                      active_lines: 8,
                      target_capacity: 3800,
                      nominal_oee: 87.5,
                    })
                  }
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-g-surfaceElevated hover:border-g-blue text-g-text border border-g-border cursor-pointer transition-colors"
                >
                  Munich Press Shop (Germany)
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-7 rounded-2xl bg-g-surface border border-g-border shadow-sm space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Facility Name */}
                <div>
                  <label className="block text-xs font-semibold text-g-text mb-1">
                    Facility Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        name: val,
                        id: `synapsys-mfg-${val.toLowerCase().replace(/[^a-z0-9]/g, '-')}`.replace(/-+/g, '-'),
                      }));
                    }}
                    placeholder="e.g. OWASP Coimbatore Advanced Manufacturing"
                    className="w-full px-3.5 py-2 rounded-lg bg-g-surfaceElevated border border-g-border text-g-text focus:outline-none focus:border-g-blue text-xs font-sans"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-xs font-semibold text-g-text mb-1">
                    Deployment ID / Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.id}
                    onChange={(e) => setForm({ ...form, id: e.target.value })}
                    placeholder="synapsys-mfg-..."
                    className="w-full px-3.5 py-2 rounded-lg bg-g-surfaceElevated border border-g-border text-g-text focus:outline-none focus:border-g-blue text-xs font-mono"
                  />
                </div>

                {/* Regional Edge Gateway */}
                <div>
                  <label className="block text-xs font-semibold text-g-text mb-1">
                    Regional Edge Gateway *
                  </label>
                  <select
                    value={form.region}
                    onChange={(e) => {
                      const reg = e.target.value;
                      const primaryHub = MANUFACTURING_HUBS.find((h) => h.gateway_region === reg);
                      if (primaryHub) {
                        setForm((prev) => ({
                          ...prev,
                          region: reg,
                          location: primaryHub.full_location,
                          latitude: primaryHub.lat,
                          longitude: primaryHub.lon,
                          facility_type: primaryHub.facility_type,
                        }));
                      } else {
                        setForm((prev) => ({ ...prev, region: reg }));
                      }
                    }}
                    className="w-full px-3.5 py-2 rounded-lg bg-g-surfaceElevated border border-g-border text-g-text focus:outline-none focus:border-g-blue text-xs cursor-pointer"
                  >
                    <option value="asia-south1">asia-south1 (Mumbai / Chennai / Coimbatore, India)</option>
                    <option value="us-south1">us-south1 (Austin, Texas, USA)</option>
                    <option value="us-east4">us-east4 (N. Virginia / Detroit, USA)</option>
                    <option value="us-west1">us-west1 (Oregon, USA)</option>
                    <option value="europe-west3">europe-west3 (Frankfurt / Stuttgart, Germany)</option>
                    <option value="europe-west1">europe-west1 (Belgium, EU)</option>
                    <option value="europe-west2">europe-west2 (London, UK)</option>
                    <option value="asia-northeast1">asia-northeast1 (Tokyo / Yokohama, Japan)</option>
                    <option value="asia-southeast1">asia-southeast1 (Jurong, Singapore)</option>
                  </select>
                </div>

                {/* Facility Domain */}
                <div>
                  <label className="block text-xs font-semibold text-g-text mb-1">
                    Facility Domain / Industry Type *
                  </label>
                  <select
                    value={form.facility_type}
                    onChange={(e) => setForm({ ...form, facility_type: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg bg-g-surfaceElevated border border-g-border text-g-text focus:outline-none focus:border-g-blue text-xs cursor-pointer"
                  >
                    <option value="Advanced Precision Manufacturing & Assembly">Advanced Precision Manufacturing & Assembly</option>
                    <option value="EV Powertrain & Battery Cell">EV Powertrain & Battery Cell</option>
                    <option value="Precision Stamping & BiW Assembly">Precision Stamping & BiW Assembly</option>
                    <option value="Aerospace Machining & Turbine Impeller">Aerospace Machining & Turbine Impeller</option>
                    <option value="Semiconductor Fab & Cleanroom">Semiconductor Fab & Cleanroom</option>
                    <option value="Robotics Assembly & Testing Cell">Robotics Assembly & Testing Cell</option>
                    <option value="Medical Device Cleanroom Fabrication">Medical Device Cleanroom Fabrication</option>
                  </select>
                </div>

                {/* Geographic Location & OpenStreetMap */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-g-text">
                      Geographic Location & OpenStreetMap Reticle *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowMapAssist(!showMapAssist)}
                      className="text-[11px] font-mono text-g-blue hover:underline cursor-pointer"
                    >
                      {showMapAssist ? 'Collapse Map' : 'Expand Interactive Map'}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Coimbatore, Tamil Nadu, India"
                    className="w-full px-3.5 py-2 rounded-lg bg-g-surfaceElevated border border-g-border text-g-text focus:outline-none focus:border-g-blue text-xs font-sans mb-2"
                  />

                  {showMapAssist && (
                    <div className="rounded-xl overflow-hidden border border-g-border/80">
                      <Suspense fallback={<div className="p-8 text-center text-xs font-mono text-g-textMuted">Loading OpenStreetMap Picker...</div>}>
                        <LazyGeoMapAssist
                          currentLocation={form.location}
                          currentLatitude={form.latitude}
                          currentLongitude={form.longitude}
                          selectedRegion={form.region}
                          onSelectLocation={(geo: GeoLocationData) => {
                            setForm((prev) => ({
                              ...prev,
                              location: geo.location,
                              latitude: geo.latitude,
                              longitude: geo.longitude,
                              region: geo.suggestedRegion || prev.region,
                              facility_type: geo.suggestedFacilityType || prev.facility_type,
                            }));
                          }}
                          mode="picker"
                        />
                      </Suspense>
                    </div>
                  )}
                </div>

                {/* Active Lines Count */}
                <div>
                  <label className="block text-xs font-semibold text-g-text mb-1">
                    Active Production Lines
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="64"
                    value={form.active_lines}
                    onChange={(e) => setForm({ ...form, active_lines: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2 rounded-lg bg-g-surfaceElevated border border-g-border text-g-text focus:outline-none focus:border-g-blue text-xs font-mono"
                  />
                </div>

                {/* Shift Target Capacity */}
                <div>
                  <label className="block text-xs font-semibold text-g-text mb-1">
                    Shift Target Output (Units)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={form.target_capacity}
                    onChange={(e) => setForm({ ...form, target_capacity: parseInt(e.target.value) || 1000 })}
                    className="w-full px-3.5 py-2 rounded-lg bg-g-surfaceElevated border border-g-border text-g-text focus:outline-none focus:border-g-blue text-xs font-mono"
                  />
                </div>

                {/* Nominal Target OEE */}
                <div>
                  <label className="block text-xs font-semibold text-g-text mb-1">
                    Nominal Target OEE (%)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="100"
                    step="0.1"
                    value={form.nominal_oee}
                    onChange={(e) => setForm({ ...form, nominal_oee: parseFloat(e.target.value) || 85.0 })}
                    className="w-full px-3.5 py-2 rounded-lg bg-g-surfaceElevated border border-g-border text-g-text focus:outline-none focus:border-g-blue text-xs font-mono"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-g-border flex items-center justify-between">
                <span className="text-[11px] text-g-textMuted font-mono">
                  Commissioning seeds live machinery & enables supervisor access.
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-lg bg-g-blue hover:bg-g-blueHover text-white font-semibold text-xs tracking-wider uppercase flex items-center gap-2 cursor-pointer disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Commissioning Live Facility...</span>
                    </>
                  ) : (
                    <span>Commission & Launch Live Plant &rarr;</span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-3 px-6 text-center text-xs text-g-textMuted border-t border-g-border/60">
        SynapSYS Industrial SCADA &bull; Isolated Multi-Tenant Manufacturing Operations
      </footer>
    </div>
  );
};

export default PlantSetupOnboarding;
