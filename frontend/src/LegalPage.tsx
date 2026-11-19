import React, { useState, useMemo, useEffect } from 'react';
import { SynapsysLogo } from './SynapsysLogo';
import { MeanderDivider } from './components/motion';

export interface LegalPageProps {
  initialTab?: 'terms' | 'privacy';
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onBackHome?: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({
  initialTab = 'terms',
  isDarkMode = true,
  onToggleTheme,
  onBackHome,
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSectionId, setActiveSectionId] = useState<string>('');

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Update browser document title
  useEffect(() => {
    document.title = activeTab === 'terms'
      ? 'Terms & Conditions · SynapSYS SCADA Enterprise'
      : 'Enterprise Privacy Policy · SynapSYS SCADA Enterprise';
  }, [activeTab]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleBack = () => {
    if (onBackHome) {
      onBackHome();
    } else if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    }
  };

  const termsSections = useMemo(() => [
    {
      id: 'term-scope',
      num: '01',
      title: 'Scope & Industrial Operating License',
      summary: 'Commercial subscription authorization for factory telemetry and spatial digital twins.',
      content: `SynapSYS Systems Inc. grants the subscriber organization a commercial, non-exclusive, worldwide subscription license to deploy, configure, and monitor industrial manufacturing telemetry across connected facility production cells, edge nodes, and digital twin runtime instances. This license encompasses OPC-UA client drivers (IEC 62541), MQTT Sparkplug B edge publisher agents, REST telemetry ingestion endpoints, and spatial supervisory dashboards. Deployment is authorized across all licensed plant facilities and authorized operational personnel.`,
    },
    {
      id: 'term-safety',
      num: '02',
      title: 'Supervisory Control, Safety Interlocks & E-Stop Primacy',
      summary: 'Hardware primacy of physical emergency stops and functional safety systems.',
      content: `The SynapSYS software suite operates as an industrial supervisory monitoring, visualization, and OEE analytics layer. Subscriber acknowledges and agrees that all physical safety systems—including hardwired Emergency Stop (E-Stop) pushbuttons, safety light curtains, safety PLCs (SIL 3 / PLe per ISO 13849-1 and IEC 62061), and mechanical interlocks—retain autonomous hardware primacy. The SynapSYS Industrial Copilot and remote reset commands provide diagnostic assistance and supervisory dispatch; under no circumstances do software controls supersede or bypass physical machine guarding or local safety regulations.`,
    },
    {
      id: 'term-ownership',
      num: '03',
      title: 'Data Ownership & Proprietary Manufacturing Telemetry',
      summary: '100% exclusive subscriber intellectual property and zero third-party monetization.',
      content: `The subscriber organization retains 100% exclusive and unconditional ownership of all machine telemetry, raw sensor readings (temperatures, vibrations, acoustic signatures, hydraulic pressures, electrical load curves), work order dispatch records, and calculated OEE performance metrics. SynapSYS claims zero ownership, title, or intellectual property rights over subscriber operational data. Subscriber data is never sold, licensed, or shared with third parties or external model providers.`,
    },
    {
      id: 'term-sla',
      num: '04',
      title: 'Enterprise Service Level Agreement (SLA)',
      summary: '99.98% telemetry ingestion availability and sub-50ms local edge processing.',
      content: `SynapSYS commits to a 99.98% monthly availability SLA for edge telemetry ingestion buses and supervisory dashboard endpoints. Telemetry transport latency targets are engineered for <50ms local edge processing and <250ms worldwide cloud synchronization. In the event of network disconnection, local edge broker buffers maintain continuous telemetry spooling for up to 72 hours, automatically back-filling historical records upon reconnect with zero packet loss.`,
    },
    {
      id: 'term-connectors',
      num: '05',
      title: 'Industrial Connectors & Protocol Compliance',
      summary: 'Support for open OT standards (OPC-UA, MQTT, Modbus) with Purdue Level 2/3 boundary rules.',
      content: `Subscribers may connect industrial equipment utilizing standard industrial protocols including OPC-UA (IEC 62541), MQTT Sparkplug B, Modbus TCP, and Ethernet/IP. Subscribers are responsible for maintaining OT/IT boundary segmentation and firewall policies (Purdue Enterprise Reference Architecture Level 2/3) to secure machine networks from unauthorized external access. SynapSYS edge agents require read-only access to operational PLC data blocks unless explicit supervisory write commands are enabled with multi-factor authentication.`,
    },
    {
      id: 'term-advisory',
      num: '06',
      title: 'Predictive Diagnostics & Machine Health Advisory',
      summary: 'Probabilistic AI guidance requiring qualified human engineer validation.',
      content: `Predictive maintenance metrics, Remaining Useful Life (RUL) projections, and ultrasonic acoustic anomaly classifications generated by SynapSYS AI engines are probabilistic diagnostic calculations designed to assist certified reliability engineers and maintenance personnel. Maintenance actions, component replacements, and operational setpoint changes remain the physical responsibility of certified plant engineering personnel.`,
    },
    {
      id: 'term-extraction',
      num: '07',
      title: 'Data Extraction, Portability & Contract Termination',
      summary: 'Open data portability in Apache Parquet, CSV, and ISO 22400 JSON-LD formats.',
      content: `Upon contract termination or subscription expiration, subscriber possesses a guaranteed 60-day window to export complete historical telemetry, production ledgers, and loss categorization archives in standard open formats, including Apache Parquet, CSV, and ISO 22400 JSON schemas. Following the extraction grace period, plant databases are cryptographically purged in accordance with DoD 5220.22-M sanitization standards with written certificates of erasure.`,
    },
  ], []);

  const privacySections = useMemo(() => [
    {
      id: 'priv-collection',
      num: '01',
      title: 'Information Collected & Industrial Scope',
      summary: 'Operational machine telemetry and authenticated operator identity attributes.',
      content: `We collect and process operational data strictly necessary for manufacturing telemetry and plant supervisory monitoring. This includes: (a) Machine telemetry: PLC node identifiers, cycle times, thermal values, vibration spectrums, power usage, and alarm codes; (b) Authorized user data: Work email addresses, cryptographic password hashes, full names, plant location assignments, and role-based permissions (Administrator, Reliability Engineer, Shift Operator); (c) Audit records: Cryptographically signed session tokens and operational setpoint modification timestamps.`,
    },
    {
      id: 'priv-no-monetization',
      num: '02',
      title: 'Strict Zero-Monetization Policy',
      summary: 'Zero data reselling, zero advertising networks, zero commercial telemetry sharing.',
      content: `SynapSYS does NOT sell, rent, monetize, or commercialize subscriber manufacturing data, production volume figures, or personal operator information to any data brokers, marketing firms, or external vendors. All processed telemetry is strictly utilized to compute plant KPIs, visualize digital twin layouts, and deliver subscribed analytics services.`,
    },
    {
      id: 'priv-sovereignty',
      num: '03',
      title: 'Data Sovereignty & On-Premises Isolation',
      summary: 'Geographic residency compliance and air-gapped defense facility options.',
      content: `SynapSYS supports strict data residency compliance. Subscriber data is stored within isolated, single-tenant or enterprise-partitioned databases located in the subscriber's selected geographic region (including United States, European Union, APAC, and India). For defense, aerospace, or air-gapped critical infrastructure facilities, SynapSYS supports 100% on-premises edge deployments with zero cloud outbound connectivity.`,
    },
    {
      id: 'priv-security',
      num: '04',
      title: 'Cybersecurity Architecture & IEC 62443 Compliance',
      summary: 'TLS 1.3 transport, AES-256 CMEK storage, and mandatory TOTP 2FA.',
      content: `Our telemetry transmission and persistence architecture aligns with IEC 62443-4-2 industrial cybersecurity standards. All communications leverage TLS 1.3 encryption with Perfect Forward Secrecy. Data at rest is encrypted using AES-256 with customer-managed encryption key (CMEK) capability. Multi-factor authentication (MFA/TOTP) is mandatory for supervisory setpoint modifications, and all administrative actions generate tamper-evident audit logs.`,
    },
    {
      id: 'priv-cookies',
      num: '05',
      title: 'Cookies & Session Persistence Policy',
      summary: 'Zero marketing cookies; strictly operational tokens and theme caching.',
      content: `SynapSYS does NOT deploy third-party advertising cookies, marketing tracking pixels, or cross-site monitoring scripts. Browser local storage and cookies are utilized exclusively for essential operational capabilities: maintaining authenticated cryptographic JWT sessions, preserving user-selected dark/light theme preferences, and caching active facility selections.`,
    },
    {
      id: 'priv-rights',
      num: '06',
      title: 'Data Subject Rights (GDPR / CCPA / DPDP Compliance)',
      summary: 'Full access, rectification, portability, and deletion requests for operators.',
      content: `In compliance with the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and applicable international data protection laws, authorized users and organizations hold the right to: access all stored personal and facility telemetry, request immediate data corrections, obtain complete data portability archives, or request full account and telemetry deletion upon enterprise decommissioning.`,
    },
  ], []);

  const currentSections = activeTab === 'terms' ? termsSections : privacySections;
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return currentSections;
    const q = searchQuery.toLowerCase().trim();
    return currentSections.filter(
      (s) => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q) || s.summary.toLowerCase().includes(q)
    );
  }, [currentSections, searchQuery]);

  const scrollToClause = (clauseId: string) => {
    setActiveSectionId(clauseId);
    const element = document.getElementById(clauseId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen w-full bg-g-bg text-g-text font-sans flex flex-col selection:bg-g-blue selection:text-white">
      {/* Top Fixed Header */}
      <header className="sticky top-0 z-40 w-full border-b border-g-border bg-g-surface/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="group flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-g-blue rounded-lg pr-2"
          >
            <SynapsysLogo variant="horizontal" size="sm" isDarkMode={isDarkMode} />
          </button>
          <span className="hidden sm:inline-block text-g-border font-light" aria-hidden="true">|</span>
          <span className="hidden sm:inline-block text-xs font-mono text-g-textSecondary uppercase tracking-wider">
            Legal & Regulatory Governance
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            title="Print or save as PDF"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-g-border bg-g-surfaceElevated hover:bg-g-surfaceSubtle text-g-textSecondary hover:text-g-text text-xs font-medium cursor-pointer transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2m-8 0h8v4H8v-4z" />
            </svg>
            <span>Print / PDF</span>
          </button>

          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-8 h-8 rounded-lg border border-g-border bg-g-surfaceElevated hover:bg-g-surfaceSubtle flex items-center justify-center text-g-textSecondary hover:text-g-text cursor-pointer transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode ? (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleBack}
            className="px-3.5 py-1.5 rounded-lg bg-g-blue hover:bg-g-blueHover text-white text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>← Back to Overview</span>
          </button>
        </div>
      </header>

      {/* Decorative Meander Divider */}
      <MeanderDivider opacity={0.35} />

      {/* Page Title & Breadcrumb Hero */}
      <div className="w-full border-b border-g-borderSubtle bg-g-surfaceSubtle/50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-g-blue mb-1.5">
              <span>LEGAL REPOSITORY</span>
              <span>/</span>
              <span className="uppercase text-g-textSecondary">
                {activeTab === 'terms' ? 'TERMS & CONDITIONS' : 'PRIVACY POLICY'}
              </span>
            </div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-g-text tracking-wide">
              {activeTab === 'terms'
                ? 'Master Industrial Subscription & Service Agreement'
                : 'Enterprise Privacy Policy & Industrial Data Sovereignty'}
            </h1>
            <p className="text-sm text-g-textSecondary mt-1 max-w-3xl leading-relaxed">
              {activeTab === 'terms'
                ? 'Legal and functional operating terms governing high-availability plant telemetry, edge runtime instances, and spatial digital twins.'
                : 'Enterprise data residency, cybersecurity architecture, and zero-monetization standards governing industrial manufacturing records.'}
            </p>
          </div>

          <div className="flex-shrink-0 flex items-center gap-2 p-1.5 rounded-xl bg-g-surface border border-g-border shadow-sm">
            <button
              type="button"
              onClick={() => {
                setActiveTab('terms');
                setSearchQuery('');
                if (typeof window !== 'undefined') window.history.replaceState({}, '', '/terms');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'terms'
                  ? 'bg-g-blue text-white shadow-sm'
                  : 'text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Terms & Conditions</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20 text-white/90">
                v2.4
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('privacy');
                setSearchQuery('');
                if (typeof window !== 'undefined') window.history.replaceState({}, '', '/privacy');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'privacy'
                  ? 'bg-g-blue text-white shadow-sm'
                  : 'text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated'
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Privacy Policy</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                IEC 62443
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout with Sticky Sidebar */}
      <div className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Navigation Sidebar */}
          <aside className="lg:col-span-4 sticky top-20 space-y-5">
            {/* Search Input Box */}
            <div className="p-4 rounded-xl bg-g-surface border border-g-border shadow-sm space-y-3">
              <label htmlFor="legal-search" className="block text-xs font-semibold text-g-text uppercase tracking-wider font-mono">
                Search Documentation
              </label>
              <div className="relative">
                <input
                  id="legal-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter clauses, SLA, data rights..."
                  className="w-full pl-8 pr-3 py-2 rounded-lg bg-g-surfaceElevated border border-g-border text-g-text text-xs placeholder-g-textMuted focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue"
                />
                <svg
                  className="w-3.5 h-3.5 text-g-textMuted absolute left-2.5 top-1/2 -translate-y-1/2"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                </svg>
              </div>
            </div>

            {/* Table of Contents Index */}
            <div className="p-4 rounded-xl bg-g-surface border border-g-border shadow-sm space-y-3">
              <h3 className="text-xs font-semibold text-g-text uppercase tracking-wider font-mono">
                Clause Directory
              </h3>
              <nav aria-label="Clauses table of contents" className="space-y-1">
                {currentSections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => scrollToClause(sec.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      activeSectionId === sec.id
                        ? 'bg-g-blue/15 text-g-blue font-semibold border-l-2 border-g-blue'
                        : 'text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated'
                    }`}
                  >
                    <span className="truncate pr-2">{sec.title}</span>
                    <span className="font-mono text-[10px] text-g-textMuted flex-shrink-0">
                      SEC {sec.num}
                    </span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Industrial Compliance Badges */}
            <div className="p-4 rounded-xl bg-g-surface border border-g-border shadow-sm space-y-3">
              <h3 className="text-xs font-semibold text-g-text uppercase tracking-wider font-mono">
                Verified Industrial Standards
              </h3>
              <ul className="space-y-2 text-xs text-g-textSecondary">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span><strong>ISO 22400:</strong> Manufacturing Operations OEE</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span><strong>IEC 62541:</strong> OPC-UA Interoperability Standard</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span><strong>IEC 62443-4-2:</strong> Industrial Network Security</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span><strong>ISO 27001:</strong> Information Security Management</span>
                </li>
              </ul>
            </div>
          </aside>

          {/* Right Main Content Stream */}
          <main className="lg:col-span-8 space-y-6">
            {/* Metadata Bar */}
            <div className="p-4 rounded-xl bg-g-surface border border-g-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-g-text font-medium">
                  Legal Entity: SynapSYS Systems Inc.
                </span>
                <span className="text-g-textMuted font-mono">· Effective Date: Nov 2026</span>
              </div>
              <span className="font-mono text-g-textMuted text-[11px]">
                Governing Law: Delaware Corporate / International OT Standard
              </span>
            </div>

            {/* Clause Articles */}
            {filteredSections.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-g-surface border border-g-border text-g-textMuted text-sm">
                No matching legal clauses found for "{searchQuery}".
              </div>
            ) : (
              <div className="space-y-6">
                {filteredSections.map((sec) => (
                  <article
                    key={sec.id}
                    id={sec.id}
                    className="p-6 rounded-xl bg-g-surface border border-g-border shadow-sm space-y-3 transition-colors hover:border-g-borderSubtle"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-g-borderSubtle pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-g-surfaceElevated border border-g-border text-g-blue">
                          SECTION {sec.num}
                        </span>
                        <h2 className="font-cinzel text-lg font-bold text-g-text">
                          {sec.title}
                        </h2>
                      </div>
                    </div>

                    <p className="text-xs font-medium text-g-blue italic pl-0.5">
                      {sec.summary}
                    </p>

                    <p className="text-sm text-g-textSecondary leading-relaxed pl-0.5">
                      {sec.content}
                    </p>
                  </article>
                ))}
              </div>
            )}

            {/* Bottom Actions Card */}
            <div className="p-6 rounded-xl bg-g-surfaceElevated border border-g-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-cinzel font-semibold text-sm text-g-text">
                  Questions regarding industrial compliance or legal audit?
                </h4>
                <p className="text-xs text-g-textSecondary mt-0.5">
                  Contact our enterprise regulatory office at <span className="font-mono text-g-blue">legal@synapsys.com</span>
                </p>
              </div>

              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-lg bg-g-blue hover:bg-g-blueHover text-white text-xs font-semibold cursor-pointer transition-colors shadow-sm whitespace-nowrap"
              >
                Accept & Return to Overview
              </button>
            </div>
          </main>
        </div>
      </div>

      {/* Clean Footer */}
      <footer className="border-t border-g-border bg-g-surfaceSubtle py-8 px-4 sm:px-6 lg:px-8 mt-12 text-center text-xs text-g-textMuted">
        <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} SynapSYS Systems Inc. All rights reserved.</span>
          <span>Industrial Telemetry & SCADA Governance · IEC 62443 / ISO 22400 Certified</span>
        </div>
      </footer>
    </div>
  );
};

export default LegalPage;
