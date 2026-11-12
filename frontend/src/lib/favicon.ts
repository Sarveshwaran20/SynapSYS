import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useDocumentVisible } from './motion';

export type FaviconRouteMode = 'landing' | 'login' | 'loading' | 'dashboard';
export type FaviconHealthStatus = 'nominal' | 'warning' | 'critical' | 'syncing';

export interface DynamicFaviconOptions {
  enabled?: boolean;
  mode: FaviconRouteMode;
  status: FaviconHealthStatus;
  alarmCount?: number;
  oeePct?: number;
  isDarkMode?: boolean;
}

const DEFAULT_TITLE = 'SynapSYS — Industrial SCADA & Manufacturing Analytics';

const STATUS_COLORS: Record<FaviconHealthStatus, { stroke: string; badge: string; accent: string }> = {
  nominal: { stroke: '#10B981', badge: '#10B981', accent: '#4C8DF6' },
  warning: { stroke: '#F59E0B', badge: '#F59E0B', accent: '#60A5FA' },
  critical: { stroke: '#F43F5E', badge: '#F43F5E', accent: '#F43F5E' },
  syncing: { stroke: '#4C8DF6', badge: '#8A5CF6', accent: '#60A5FA' },
};

function buildFaviconSvg(
  phaseIdx: number,
  options: DynamicFaviconOptions
): string {
  const palette = STATUS_COLORS[options.status] || STATUS_COLORS.nominal;
  const dark = options.isDarkMode ?? true;
  const fillStart = dark ? '#172030' : '#FFFFFF';
  const fillEnd = dark ? '#0B0F17' : '#F1F5F9';
  const conduitBase = palette.accent;
  const conduitTip = options.status === 'critical' ? '#FB7185' : '#8A5CF6';
  const coreColor = dark ? '#F8FAFC' : '#0F172A';
  const angle = (phaseIdx % 4) * 90;
  const pulseRadius = phaseIdx % 2 === 0 ? 3.5 : 5.1;
  const pulseOpacity = phaseIdx % 2 === 0 ? 0.35 : 0.72;
  const alarms = options.alarmCount || 0;

  const badgeMarkup =
    options.status === 'critical' && alarms > 0
      ? `<circle cx="38.5" cy="9.5" r="8.5" fill="${palette.badge}" stroke="${dark ? '#0B0F17' : '#FFFFFF'}" stroke-width="2"/><text x="38.5" y="12.8" text-anchor="middle" font-family="sans-serif" font-size="10.5" font-weight="700" fill="#FFFFFF">${alarms > 9 ? '!' : alarms}</text>`
      : options.mode === 'dashboard' || options.mode === 'loading'
      ? `<circle cx="39.5" cy="8.5" r="5.5" fill="${palette.badge}" opacity="${phaseIdx % 2 === 0 ? '1' : '0.68'}" stroke="${dark ? '#0B0F17' : '#FFFFFF'}" stroke-width="1.8"/>`
      : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <defs>
    <linearGradient id="g" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${fillStart}"/>
      <stop offset="100%" stop-color="${fillEnd}"/>
    </linearGradient>
    <linearGradient id="s" x1="15" y1="14" x2="33" y2="34" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${conduitBase}"/>
      <stop offset="100%" stop-color="${conduitTip}"/>
    </linearGradient>
  </defs>
  <polygon points="15.3,3.5 32.7,3.5 44.5,15.3 44.5,32.7 32.7,44.5 15.3,44.5 3.5,32.7 3.5,15.3" fill="url(#g)" stroke="${palette.stroke}" stroke-width="2.4"/>
  <g transform="rotate(${angle} 24 24)">
    <path d="M 24 8.6 A 15.4 15.4 0 0 1 39.4 24" stroke="${conduitBase}" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M 24 39.4 A 15.4 15.4 0 0 1 8.6 24" stroke="${conduitTip}" stroke-width="2.1" stroke-linecap="round"/>
  </g>
  <path d="M 31 15.5 H 22 L 17.5 20 V 21.5 L 30.5 26.5 V 28 L 26 32.5 H 17" stroke="url(#s)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="24" cy="24" r="${pulseRadius}" fill="${palette.stroke}" fill-opacity="${pulseOpacity}"/>
  <circle cx="24" cy="24" r="2.9" fill="${coreColor}"/>
  ${badgeMarkup}
</svg>`;
}

function applyFaviconSvg(svgMarkup: string): void {
  if (typeof document === 'undefined') return;
  try {
    const head = document.head;
    if (!head || typeof document.querySelector !== 'function') return;
    let iconLink = document.querySelector('link[data-synapsys-favicon="true"]') as HTMLLinkElement | null;
    if (!iconLink) {
      const existingIcon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (existingIcon) {
        iconLink = existingIcon;
      } else if (typeof document.createElement === 'function') {
        iconLink = document.createElement('link') as HTMLLinkElement;
        iconLink.rel = 'icon';
        head.appendChild(iconLink);
      }
    }
    if (!iconLink) return;
    iconLink.type = 'image/svg+xml';
    iconLink.setAttribute?.('data-synapsys-favicon', 'true');
    iconLink.href = `data:image/svg+xml,${encodeURIComponent(svgMarkup)}`;
  } catch {
    // No-op in synthetic DOM environments without full link metadata support
  }
}

export function useDynamicFavicon(options: DynamicFaviconOptions): void {
  const shouldReduce = useReducedMotion();
  const isDocVisible = useDocumentVisible();
  const phaseRef = useRef(0);

  const { enabled = true, mode, status, alarmCount = 0, oeePct, isDarkMode = true } = options;

  // Update browser tab title cleanly for live situational awareness
  useEffect(() => {
    if (!enabled || typeof document === 'undefined') return;
    try {
      if (mode === 'loading') {
        document.title = 'Synchronizing... · SynapSYS SCADA';
      } else if (mode === 'login') {
        document.title = 'Workspace Sign In · SynapSYS SCADA';
      } else if (mode === 'dashboard') {
        if (alarmCount > 0) {
          document.title = `[${alarmCount} ALARM${alarmCount > 1 ? 'S' : ''}] SynapSYS SCADA`;
        } else if (typeof oeePct === 'number' && !Number.isNaN(oeePct)) {
          document.title = `[${oeePct.toFixed(1)}% OEE] SynapSYS SCADA`;
        } else {
          document.title = DEFAULT_TITLE;
        }
      } else {
        document.title = DEFAULT_TITLE;
      }
    } catch {
      // Safe guard for read-only synthetic documents
    }
  }, [enabled, mode, alarmCount, oeePct]);

  // Animate dynamic SVG favicon when tab is visible and reduced motion is off
  useEffect(() => {
    if (!enabled) return;
    const renderCurrent = () => {
      applyFaviconSvg(
        buildFaviconSvg(phaseRef.current, {
          mode,
          status,
          alarmCount,
          oeePct,
          isDarkMode,
        })
      );
    };

    renderCurrent();

    if (shouldReduce || !isDocVisible) {
      return;
    }

    const intervalMs =
      status === 'critical' || mode === 'loading' ? 550 : 900;
    const timer = window.setInterval(() => {
      phaseRef.current = (phaseRef.current + 1) % 4;
      renderCurrent();
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [enabled, mode, status, alarmCount, oeePct, isDarkMode, shouldReduce, isDocVisible]);
}

