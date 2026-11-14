import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { ProductionSite } from './types';
import {
  ManufacturingHub,
  MANUFACTURING_HUBS,
  latLonToMapXY,
  mapXYToLatLon,
  findClosestManufacturingHub,
  suggestRegionFromCoordinates,
  RegionViewboxConfig,
  REGION_VIEWBOXES,
} from './lib/manufacturingHubs';

export type { ManufacturingHub, RegionViewboxConfig };
export {
  MANUFACTURING_HUBS,
  latLonToMapXY,
  mapXYToLatLon,
  findClosestManufacturingHub,
  suggestRegionFromCoordinates,
  REGION_VIEWBOXES,
};

export interface GeoLocationData {
  location: string;
  latitude: number;
  longitude: number;
  suggestedRegion: string;
  suggestedFacilityType?: string;
  suggestedName?: string;
}

export interface GeoMapAssistProps {
  currentLocation: string;
  currentLatitude?: number;
  currentLongitude?: number;
  selectedRegion?: string;
  onSelectLocation: (data: GeoLocationData) => void;
  deployedSites?: ProductionSite[];
  onSelectSite?: (siteId: string) => void;
  activeSiteId?: string;
  mode?: 'picker' | 'radar_view';
  onClose?: () => void;
}



export const GeoMapAssist: React.FC<GeoMapAssistProps> = ({
  currentLocation,
  currentLatitude = 11.0168,
  currentLongitude = 76.9558,
  selectedRegion,
  onSelectLocation,
  deployedSites = [],
  onSelectSite,
  activeSiteId,
  mode = 'picker',
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [continentFilter, setContinentFilter] = useState<string>('All');
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lon: number; x: number; y: number } | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number }>({
    lat: currentLatitude,
    lon: currentLongitude,
  });
  const [viewMode, setViewMode] = useState<'regional' | 'global'>('regional');

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Sync selected region when prop changes: snap to primary hub of that region if current coords are in another region
  useEffect(() => {
    if (selectedRegion) {
      const regHubs = MANUFACTURING_HUBS.filter((h) => h.gateway_region === selectedRegion);
      if (regHubs.length > 0) {
        const closest = findClosestManufacturingHub(selectedCoords.lat, selectedCoords.lon);
        if (closest.gateway_region !== selectedRegion) {
          const primary = regHubs[0];
          setSelectedCoords({ lat: primary.lat, lon: primary.lon });
          onSelectLocation({
            location: primary.full_location,
            latitude: primary.lat,
            longitude: primary.lon,
            suggestedRegion: primary.gateway_region,
            suggestedFacilityType: primary.facility_type,
            suggestedName: `${primary.city} Facility`,
          });
        }
      }
      const vb = REGION_VIEWBOXES[selectedRegion];
      if (vb) {
        setContinentFilter(vb.continent);
      }
    }
  }, [selectedRegion]);

  // Compute active SVG viewport and scale factor
  const currentVb = useMemo(() => {
    if (viewMode === 'regional' && selectedRegion && REGION_VIEWBOXES[selectedRegion]) {
      return REGION_VIEWBOXES[selectedRegion];
    }
    return {
      x: 0,
      y: 0,
      w: 800,
      h: 400,
      title: 'WGS-84 Global Map Projection',
      continent: 'All' as const,
    };
  }, [viewMode, selectedRegion]);

  const scale = currentVb.w / 800;

  // Filter hubs based on search input & continent tab
  const filteredHubs = useMemo(() => {
    let list = MANUFACTURING_HUBS;
    if (continentFilter !== 'All') {
      list = list.filter((h) => h.continent === continentFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (h) =>
          h.city.toLowerCase().includes(q) ||
          h.region_name.toLowerCase().includes(q) ||
          h.full_location.toLowerCase().includes(q) ||
          h.facility_type.toLowerCase().includes(q) ||
          h.cluster_desc.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchTerm, continentFilter]);

  // Displayed hubs: when regional view is active with selectedRegion, ONLY show hubs of that region
  const displayedHubs = useMemo(() => {
    if (viewMode === 'regional' && selectedRegion) {
      let regList = MANUFACTURING_HUBS.filter((h) => h.gateway_region === selectedRegion);
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        regList = regList.filter(
          (h) =>
            h.city.toLowerCase().includes(q) ||
            h.region_name.toLowerCase().includes(q) ||
            h.full_location.toLowerCase().includes(q) ||
            h.facility_type.toLowerCase().includes(q)
        );
      }
      return regList;
    }
    return filteredHubs;
  }, [viewMode, selectedRegion, searchTerm, filteredHubs]);

  // Deployed production facilities visible on map
  const displayedSites = useMemo(() => {
    if (viewMode === 'regional' && selectedRegion) {
      return deployedSites.filter((s) => s.region === selectedRegion);
    }
    return deployedSites;
  }, [deployedSites, selectedRegion, viewMode]);

  // Handle map click to place pin
  const handleMapClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const clickX = currentVb.x + ((e.clientX - rect.left) / rect.width) * currentVb.w;
      const clickY = currentVb.y + ((e.clientY - rect.top) / rect.height) * currentVb.h;

      const { lat, lon } = mapXYToLatLon(clickX, clickY);
      setSelectedCoords({ lat, lon });

      // In regional mode, prioritize closest hub within this regional cluster
      const regionalPool =
        viewMode === 'regional' && selectedRegion
          ? MANUFACTURING_HUBS.filter((h) => h.gateway_region === selectedRegion)
          : MANUFACTURING_HUBS;
      const pool = regionalPool.length > 0 ? regionalPool : MANUFACTURING_HUBS;

      let closest = pool[0];
      let minDistance = Infinity;
      for (const hub of pool) {
        const dLat = hub.lat - lat;
        const dLon = (hub.lon - lon) * Math.cos(((lat + hub.lat) / 2) * (Math.PI / 180));
        const distSq = dLat * dLat + dLon * dLon;
        if (distSq < minDistance) {
          minDistance = distSq;
          closest = hub;
        }
      }

      const distToHub = Math.hypot(closest.lat - lat, closest.lon - lon);
      let locName: string;
      if (distToHub < 4.0) {
        locName = closest.full_location;
      } else {
        const latDir = lat >= 0 ? 'N' : 'S';
        const lonDir = lon >= 0 ? 'E' : 'W';
        locName = `${closest.city} Sector (${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir})`;
      }

      onSelectLocation({
        location: locName,
        latitude: lat,
        longitude: lon,
        suggestedRegion: selectedRegion || closest.gateway_region,
        suggestedFacilityType: closest.facility_type,
        suggestedName: `${closest.city} Facility`,
      });
    },
    [currentVb, viewMode, selectedRegion, onSelectLocation]
  );

  // Mouse move over map for live coordinate telemetry
  const handleMapMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = currentVb.x + ((e.clientX - rect.left) / rect.width) * currentVb.w;
      const y = currentVb.y + ((e.clientY - rect.top) / rect.height) * currentVb.h;
      const { lat, lon } = mapXYToLatLon(x, y);
      setHoverCoords({ lat, lon, x, y });
    },
    [currentVb]
  );

  const handleMapMouseLeave = useCallback(() => {
    setHoverCoords(null);
  }, []);

  // Pick a preset hub
  const handleSelectHub = (hub: ManufacturingHub) => {
    setSelectedCoords({ lat: hub.lat, lon: hub.lon });
    onSelectLocation({
      location: hub.full_location,
      latitude: hub.lat,
      longitude: hub.lon,
      suggestedRegion: hub.gateway_region,
      suggestedFacilityType: hub.facility_type,
      suggestedName: `${hub.city} Plant`,
    });
  };

  const pinPos = latLonToMapXY(selectedCoords.lat, selectedCoords.lon);

  return (
    <div className="monumental-card bg-slate border border-line rounded-[2px] overflow-hidden shadow-modal-stone animate-fadeIn text-marble">
      {/* Header HUD Banner */}
      <div className="px-4 py-3 bg-basalt border-b border-line flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[2px] bg-graphite border border-line flex items-center justify-center text-aegean">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-cinzel text-sm font-bold text-marble tracking-wider">
                {mode === 'radar_view' ? 'GLOBAL PLANT DIRECTORY' : 'GEOGRAPHIC SITE ASSISTANT'}
              </span>
              <span className="id-tag">
                {mode === 'radar_view' ? 'GLOBAL DIRECTORY' : 'WGS-84 COORDINATES'}
              </span>
            </div>
            <p className="text-[13px] text-silver font-sans mt-0.5">
              {mode === 'radar_view'
                ? 'Interactive global view of all deployed manufacturing facilities. Click any facility node to switch supervisory telemetry stream.'
                : 'Click anywhere on the interactive world map to set geographic coordinates or select a recognized industrial manufacturing corridor.'}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary p-1.5 rounded-[2px] text-silver hover:text-marble transition-colors cursor-pointer"
            title="Close Map Assist"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Main Interactive Vector Map Canvas */}
      <div className="relative bg-obsidian border-b border-line overflow-hidden select-none">
        {/* Map Coordinates & Region Mode Banner */}
        <div className="absolute top-2.5 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
          <span className="font-sans text-[12px] sm:text-[13px] text-silver tracking-wide font-medium">
            {currentVb.title}
          </span>
          {selectedRegion && (
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'regional' ? 'global' : 'regional')}
              className="px-2 py-0.5 rounded text-[11px] font-mono border border-line bg-graphite/90 hover:bg-basalt text-marble transition-colors cursor-pointer"
              title={viewMode === 'regional' ? 'Switch to WGS-84 Global View' : 'Focus on Regional Edge Gateway'}
            >
              {viewMode === 'regional' ? 'Global View ⛶' : `Focus ${selectedRegion} ⌖`}
            </button>
          )}
        </div>
        <div className="absolute top-2.5 right-3 z-10 pointer-events-none font-mono text-[13px] text-marble">
          {hoverCoords ? (
            <span>
              Cursor: {Math.abs(hoverCoords.lat).toFixed(2)}°{hoverCoords.lat >= 0 ? 'N' : 'S'}, {Math.abs(hoverCoords.lon).toFixed(2)}°{hoverCoords.lon >= 0 ? 'E' : 'W'}
            </span>
          ) : (
            <span>Pin: {Math.abs(selectedCoords.lat).toFixed(2)}°{selectedCoords.lat >= 0 ? 'N' : 'S'}, {Math.abs(selectedCoords.lon).toFixed(2)}°{selectedCoords.lon >= 0 ? 'E' : 'W'}</span>
          )}
        </div>

        <svg
          ref={svgRef}
          viewBox={`${currentVb.x} ${currentVb.y} ${currentVb.w} ${currentVb.h}`}
          className="w-full h-auto max-h-[300px] sm:max-h-[340px] cursor-crosshair block"
          onClick={handleMapClick}
          onMouseMove={handleMapMouseMove}
          onMouseLeave={handleMapMouseLeave}
        >
          <defs>
            {/* Subtle Grid Pattern */}
            <pattern id="tacGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="0.8" fill="rgba(169, 178, 190, 0.14)" />
            </pattern>
          </defs>

          {/* Obsidian Sea Background */}
          <rect width="800" height="400" fill="#0A0C0F" />
          <rect width="800" height="400" fill="url(#tacGrid)" />

          {/* Graticule Latitude / Longitude Lines */}
          <g stroke="rgba(52, 61, 73, 0.45)" strokeWidth={Math.max(0.3, 0.8 * scale)} strokeDasharray={`${Math.max(1, 3 * scale)} ${Math.max(1, 3 * scale)}`}>
            {/* Longitude meridians */}
            <line x1="133.3" y1="0" x2="133.3" y2="400" />
            <line x1="266.6" y1="0" x2="266.6" y2="400" />
            <line x1="400.0" y1="0" x2="400.0" y2="400" stroke="rgba(169, 178, 190, 0.25)" strokeWidth={Math.max(0.35, 1 * scale)} strokeDasharray={`${Math.max(1.2, 4 * scale)} ${Math.max(0.6, 2 * scale)}`} />
            <line x1="533.3" y1="0" x2="533.3" y2="400" />
            <line x1="666.6" y1="0" x2="666.6" y2="400" />

            {/* Latitude parallels */}
            <line x1="0" y1="66.6" x2="800" y2="66.6" />
            <line x1="0" y1="133.3" x2="800" y2="133.3" stroke="rgba(52, 61, 73, 0.65)" />
            <line x1="0" y1="200.0" x2="800" y2="200.0" stroke="rgba(169, 178, 190, 0.35)" strokeWidth={Math.max(0.4, 1.2 * scale)} strokeDasharray={`${Math.max(1.5, 6 * scale)} ${Math.max(0.8, 3 * scale)}`} />
            <line x1="0" y1="266.6" x2="800" y2="266.6" stroke="rgba(52, 61, 73, 0.65)" />
            <line x1="0" y1="333.3" x2="800" y2="333.3" />
          </g>

          {/* Continental Landmasses (Slate & Line Stone Carving) */}
          <g fill="#181D24" stroke="#343D49" strokeWidth={Math.max(0.4, 1.2 * scale)}>
            {/* North America */}
            <path d="M 60,30 L 120,25 L 180,25 L 230,45 L 260,85 L 245,100 L 260,125 L 240,150 L 205,170 L 180,185 L 185,210 L 200,230 L 195,245 L 175,235 L 160,200 L 140,180 L 115,165 L 110,140 L 95,120 L 70,85 L 50,60 Z" />

            {/* Greenland */}
            <path d="M 280,30 L 340,25 L 360,50 L 330,95 L 290,90 Z" />

            {/* South America */}
            <path d="M 200,240 L 240,245 L 275,260 L 305,290 L 295,330 L 265,370 L 245,390 L 235,360 L 230,310 L 210,270 Z" />

            {/* Europe */}
            <path d="M 370,80 L 400,65 L 430,70 L 470,85 L 460,115 L 430,125 L 400,135 L 375,130 L 370,105 Z" />

            {/* United Kingdom & Ireland */}
            <path d="M 365,85 L 375,80 L 375,95 L 365,100 Z" />

            {/* Africa */}
            <path d="M 365,145 L 420,140 L 480,170 L 485,200 L 470,245 L 440,310 L 415,340 L 385,320 L 370,250 L 350,190 L 355,160 Z" />

            {/* Madagascar */}
            <path d="M 495,280 L 505,285 L 495,320 L 485,315 Z" />

            {/* Asia & Eurasia Continental Mass */}
            <path d="M 470,85 L 550,60 L 630,55 L 700,70 L 750,90 L 740,120 L 710,135 L 670,145 L 650,170 L 630,195 L 600,190 L 595,170 L 575,185 L 565,150 L 520,140 L 490,125 L 465,115 Z" />

            {/* Indian Subcontinent */}
            <path
              d="M 545,150 L 575,150 L 595,165 L 585,185 L 572,215 L 558,185 L 545,165 Z"
              fill="#212831"
              stroke="#A9B2BE"
              strokeWidth={Math.max(0.4, 1.2 * scale)}
              strokeDasharray={`${Math.max(1, 4 * scale)} ${Math.max(0.4, 1 * scale)}`}
            />

            {/* Sri Lanka */}
            <path d="M 575,220 L 580,223 L 577,232 L 572,228 Z" fill="#A9B2BE" fillOpacity="0.4" />

            {/* Japan Archipelago */}
            <path d="M 700,115 L 720,110 L 715,135 L 695,140 Z" fill="#212831" stroke="#A9B2BE" strokeWidth={Math.max(0.35, 1 * scale)} />

            {/* Southeast Asia & Indonesia */}
            <path d="M 610,205 L 640,210 L 660,240 L 640,260 L 610,245 Z" />
            <path d="M 645,260 L 690,265 L 680,280 L 640,275 Z" />

            {/* Australia */}
            <path d="M 670,285 L 730,280 L 760,310 L 750,350 L 700,370 L 660,340 L 650,300 Z" />

            {/* New Zealand */}
            <path d="M 770,360 L 780,355 L 775,390 L 765,385 Z" />
          </g>

          {/* Verified Manufacturing Hubs Scatter Pings on Map (Strictly filtered in regional mode) */}
          {displayedHubs.map((hub) => {
            const pt = latLonToMapXY(hub.lat, hub.lon);
            const isSelected = Math.hypot(hub.lat - selectedCoords.lat, hub.lon - selectedCoords.lon) < 0.5;
            return (
              <g
                key={hub.id}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectHub(hub);
                }}
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? Math.max(2.4, 6.5 * scale) : Math.max(1.8, 4 * scale)}
                  fill={isSelected ? '#3B7DD8' : '#A9B2BE'}
                  fillOpacity={isSelected ? 1 : 0.8}
                  stroke="#0A0C0F"
                  strokeWidth={Math.max(0.4, 1.5 * scale)}
                />
                {isSelected && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={Math.max(4.5, 11 * scale)}
                    fill="none"
                    stroke="#3B7DD8"
                    strokeWidth={Math.max(0.4, 1.5 * scale)}
                    strokeDasharray={`${Math.max(0.8, 2 * scale)} ${Math.max(0.8, 2 * scale)}`}
                  />
                )}
                <text
                  x={pt.x + Math.max(2.5, 7 * scale)}
                  y={pt.y + Math.max(1.0, 3 * scale)}
                  fontSize={Math.max(2.8, 9 * scale)}
                  fontFamily="'Inter', sans-serif"
                  fontWeight="600"
                  fill={isSelected ? '#ECEFF3' : '#A9B2BE'}
                  className="pointer-events-none select-none opacity-90 group-hover:opacity-100"
                >
                  {hub.city}
                </text>
              </g>
            );
          })}

          {/* Deployed Production Facilities Pins */}
          {displayedSites.map((site) => {
            const sLat = site.latitude ?? (site.id.includes('us') ? 42.3314 : site.id.includes('eu') ? 48.7758 : 35.4437);
            const sLon = site.longitude ?? (site.id.includes('us') ? -83.0458 : site.id.includes('eu') ? 9.1829 : 139.638);
            const sPt = latLonToMapXY(sLat, sLon);
            const isCurrentActive = activeSiteId === site.id;
            const pS = Math.max(2.6, 8 * scale);

            return (
              <g
                key={site.id}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectSite) onSelectSite(site.id);
                  setSelectedCoords({ lat: sLat, lon: sLon });
                }}
              >
                <polygon
                  points={`${sPt.x},${sPt.y - pS} ${sPt.x + pS},${sPt.y} ${sPt.x},${sPt.y + pS} ${sPt.x - pS},${sPt.y}`}
                  fill={isCurrentActive ? '#3FA56B' : '#3B7DD8'}
                  fillOpacity="0.9"
                  stroke="#ECEFF3"
                  strokeWidth={Math.max(0.3, 1 * scale)}
                />
                <circle cx={sPt.x} cy={sPt.y} r={Math.max(0.8, 2 * scale)} fill="#ECEFF3" />
                <text
                  x={sPt.x}
                  y={sPt.y - Math.max(3.5, 11 * scale)}
                  fontSize={Math.max(3.0, 10 * scale)}
                  fontFamily="'Cinzel', serif"
                  fontWeight="bold"
                  textAnchor="middle"
                  fill={isCurrentActive ? '#3FA56B' : '#ECEFF3'}
                  className="pointer-events-none select-none"
                >
                  {site.name.replace(/\s*\(Production Live\)/i, '').replace(/Plant\s*\d+|Site\s*\d+|Cell\s*\d+/i, '').trim()}
                </text>
              </g>
            );
          })}

          {/* Active Target Reticle at selected coordinates */}
          <g transform={`translate(${pinPos.x}, ${pinPos.y})`} className="pointer-events-none">
            <circle cx="0" cy="0" r={Math.max(4.5, 15 * scale)} fill="rgba(59, 125, 216, 0.14)" stroke="#3B7DD8" strokeWidth={Math.max(0.35, 1 * scale)} strokeDasharray={`${Math.max(1, 3 * scale)} ${Math.max(1, 3 * scale)}`} />
            <circle cx="0" cy="0" r={Math.max(2.5, 8 * scale)} fill="none" stroke="#ECEFF3" strokeWidth={Math.max(0.35, 1.2 * scale)} />
            <circle cx="0" cy="0" r={Math.max(0.8, 2.5 * scale)} fill="#3B7DD8" />
            <line x1={-Math.max(3.5, 12 * scale)} y1="0" x2={-Math.max(1.5, 5 * scale)} y2="0" stroke="#3B7DD8" strokeWidth={Math.max(0.4, 1.5 * scale)} />
            <line x1={Math.max(1.5, 5 * scale)} y1="0" x2={Math.max(3.5, 12 * scale)} y2="0" stroke="#3B7DD8" strokeWidth={Math.max(0.4, 1.5 * scale)} />
            <line x1="0" y1={-Math.max(3.5, 12 * scale)} x2="0" y2={-Math.max(1.5, 5 * scale)} stroke="#3B7DD8" strokeWidth={Math.max(0.4, 1.5 * scale)} />
            <line x1="0" y1={Math.max(1.5, 5 * scale)} x2="0" y2={Math.max(3.5, 12 * scale)} stroke="#3B7DD8" strokeWidth={Math.max(0.4, 1.5 * scale)} />
          </g>

          {/* Live mouse hover cursor reticle */}
          {hoverCoords && (
            <g transform={`translate(${hoverCoords.x}, ${hoverCoords.y})`} className="pointer-events-none opacity-75">
              <circle cx="0" cy="0" r={Math.max(1.8, 5 * scale)} fill="none" stroke="#A9B2BE" strokeWidth={Math.max(0.3, 1 * scale)} strokeDasharray={`${Math.max(0.8, 2 * scale)} ${Math.max(0.8, 2 * scale)}`} />
              <line x1={-Math.max(2.5, 8 * scale)} y1="0" x2={Math.max(2.5, 8 * scale)} y2="0" stroke="#A9B2BE" strokeWidth={Math.max(0.25, 0.8 * scale)} />
              <line x1="0" y1={-Math.max(2.5, 8 * scale)} x2="0" y2={Math.max(2.5, 8 * scale)} stroke="#A9B2BE" strokeWidth={Math.max(0.25, 0.8 * scale)} />
            </g>
          )}
        </svg>

        {/* Legend Strip at bottom of map */}
        <div className="px-4 py-2 bg-basalt border-t border-line flex flex-wrap items-center justify-between gap-2 text-[13px] font-sans text-silver">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-laurel"></span>
              <span>Active Plant Deployment</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-silver"></span>
              <span>Verified Manufacturing Hub</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-aegean"></span>
              <span>Selected Facility Pin</span>
            </span>
          </div>
          <div className="text-marble font-mono font-semibold text-[13px]">
            LAT: {selectedCoords.lat.toFixed(4)}° | LON: {selectedCoords.lon.toFixed(4)}°
          </div>
        </div>
      </div>

      {/* Interactive Hub Search, Continent Filter & Rapid Selection Chips */}
      <div className="p-4 space-y-3 bg-slate">
        {/* Regional Filter Banner if isolated */}
        {viewMode === 'regional' && selectedRegion && (
          <div className="px-3 py-2 rounded-[2px] bg-graphite border border-line flex items-center justify-between gap-2 text-xs font-mono">
            <span className="text-silver">
              Gateway Isolation Active: Showing verified manufacturing hubs in <strong className="text-aegean">{selectedRegion}</strong> ({displayedHubs.length} available).
            </span>
            <button
              type="button"
              onClick={() => setViewMode('global')}
              className="text-aegean hover:underline cursor-pointer shrink-0"
            >
              Show All Global Corridors
            </button>
          </div>
        )}

        {/* Search bar & Continent Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search global manufacturing cities (e.g., Coimbatore, Austin, Stuttgart)..."
              className="w-full pl-9 pr-3 py-2 rounded-[2px] bg-graphite border border-line text-marble text-sm focus:outline-none focus:border-aegean font-sans"
            />
            <svg
              className="w-4 h-4 text-silver absolute left-2.5 top-2.5 pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
            </svg>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2 text-sm text-silver hover:text-marble p-0.5 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Continent Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar whitespace-nowrap text-[13px] font-cinzel font-semibold">
            {(['All', 'India/South Asia', 'Americas', 'Europe', 'East Asia & APAC'] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setContinentFilter(c);
                  if (viewMode === 'regional') setViewMode('global');
                }}
                className={`px-3 py-1.5 rounded-[2px] transition-all cursor-pointer ${
                  continentFilter === c
                    ? 'btn-aegean text-marble'
                    : 'btn-secondary'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Hub Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[200px] overflow-y-auto no-scrollbar pr-1">
          {displayedHubs.map((hub) => {
            const isSelected = Math.hypot(hub.lat - selectedCoords.lat, hub.lon - selectedCoords.lon) < 0.5;
            return (
              <div
                key={hub.id}
                onClick={() => handleSelectHub(hub)}
                className={`p-3 rounded-[2px] border text-sm cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-graphite border-aegean text-marble'
                    : 'bg-basalt border-line hover:border-silver text-marble'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-cinzel font-bold text-marble block leading-tight">{hub.city}</span>
                    <span className="text-[13px] text-silver font-sans">{hub.region_name}</span>
                  </div>
                  <span className="id-tag whitespace-nowrap">
                    {hub.gateway_region}
                  </span>
                </div>
                <p className="text-[13px] text-silver/80 mt-1.5 line-clamp-1 font-sans">{hub.cluster_desc}</p>
                <div className="flex items-center justify-between text-[13px] font-sans text-silver mt-2 pt-1.5 border-t border-line">
                  <span className="tabular-nums">
                    {hub.lat.toFixed(2)}°N, {hub.lon.toFixed(2)}°E
                  </span>
                  <span className="text-aegean font-semibold">Select</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Location Telemetry Bar */}
        <div className="p-3 rounded-[2px] bg-graphite border border-line flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-[2px] bg-laurel"></span>
            <span className="text-silver font-sans text-[13px]">Selected Geographic Anchor:</span>
            <strong className="text-marble font-sans font-semibold">
              {currentLocation || `${selectedCoords.lat.toFixed(4)}°, ${selectedCoords.lon.toFixed(4)}°`}
            </strong>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="id-tag">
              Gateway: {suggestRegionFromCoordinates(selectedCoords.lat, selectedCoords.lon)}
            </span>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="btn-aegean px-3.5 py-1.5 text-[13px] cursor-pointer"
              >
                Apply to Facility
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeoMapAssist;
