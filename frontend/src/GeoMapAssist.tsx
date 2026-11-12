import React, { useState, useMemo, useRef, useCallback } from 'react';
import { ProductionSite } from './types';

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
  onSelectLocation: (data: GeoLocationData) => void;
  deployedSites?: ProductionSite[];
  onSelectSite?: (siteId: string) => void;
  activeSiteId?: string;
  mode?: 'picker' | 'radar_view';
  onClose?: () => void;
}

export interface ManufacturingHub {
  id: string;
  city: string;
  region_name: string;
  full_location: string;
  lat: number;
  lon: number;
  gateway_region: string;
  facility_type: string;
  cluster_desc: string;
  continent: 'India/South Asia' | 'Americas' | 'Europe' | 'East Asia & APAC';
}

export const MANUFACTURING_HUBS: ManufacturingHub[] = [
  // India & South Asia
  {
    id: 'in-cbe',
    city: 'Coimbatore',
    region_name: 'Tamil Nadu, India',
    full_location: 'Coimbatore, Tamil Nadu, India',
    lat: 11.0168,
    lon: 76.9558,
    gateway_region: 'asia-south1',
    facility_type: 'Automotive Components, Precision Motors & Textile Machinery',
    cluster_desc: 'Tier-1 Auto Engineering, Electric Motors & Sub-Micron Tooling Hub',
    continent: 'India/South Asia',
  },
  {
    id: 'in-maa',
    city: 'Chennai',
    region_name: 'Tamil Nadu, India',
    full_location: 'Chennai, Tamil Nadu, India',
    lat: 13.0827,
    lon: 80.2707,
    gateway_region: 'asia-south1',
    facility_type: 'Automotive Powertrain & EV Manufacturing Corridor',
    cluster_desc: 'Detroit of South Asia — Major Automobile & EV Assembly Plants',
    continent: 'India/South Asia',
  },
  {
    id: 'in-blr',
    city: 'Bengaluru',
    region_name: 'Karnataka, India',
    full_location: 'Bengaluru, Karnataka, India',
    lat: 12.9716,
    lon: 77.5946,
    gateway_region: 'asia-south1',
    facility_type: 'Aerospace Machining & Precision Electronics Fab',
    cluster_desc: 'Defense Aerostructures, ISRO Aerospace & Microelectronics Hub',
    continent: 'India/South Asia',
  },
  {
    id: 'in-pnq',
    city: 'Pune',
    region_name: 'Maharashtra, India',
    full_location: 'Pune, Maharashtra, India',
    lat: 18.5204,
    lon: 73.8567,
    gateway_region: 'asia-south1',
    facility_type: 'Heavy Industrial Machinery & Chassis Fabrication',
    cluster_desc: 'Commercial Vehicle Foundry, Forging & Powertrain Ecosystem',
    continent: 'India/South Asia',
  },
  {
    id: 'in-amd',
    city: 'Sanand / Ahmedabad',
    region_name: 'Gujarat, India',
    full_location: 'Sanand, Gujarat, India',
    lat: 23.0225,
    lon: 72.5714,
    gateway_region: 'asia-south1',
    facility_type: 'Semiconductor ATMP Fab & High-Speed EV Assembly',
    cluster_desc: 'Advanced Semiconductor Assembly & Automotive Megaplant Cluster',
    continent: 'India/South Asia',
  },
  {
    id: 'in-del',
    city: 'Gurugram / Manesar',
    region_name: 'Haryana, India',
    full_location: 'Gurugram, Haryana, India',
    lat: 28.4595,
    lon: 77.0266,
    gateway_region: 'asia-south1',
    facility_type: 'Automotive Assembly & Robotics Automation',
    cluster_desc: 'Northern Industrial Corridor — High-Volume Passenger Vehicle Plants',
    continent: 'India/South Asia',
  },

  // Americas
  {
    id: 'us-det',
    city: 'Detroit',
    region_name: 'Michigan, USA',
    full_location: 'Detroit, MI, USA',
    lat: 42.3314,
    lon: -83.0458,
    gateway_region: 'us-east4',
    facility_type: 'Automotive Powertrain & Battery Cell',
    cluster_desc: 'Global Automotive Powertrain & Battery Cell Innovation Corridor',
    continent: 'Americas',
  },
  {
    id: 'us-atx',
    city: 'Austin',
    region_name: 'Texas, USA',
    full_location: 'Austin, TX, USA',
    lat: 30.2672,
    lon: -97.7431,
    gateway_region: 'us-south1',
    facility_type: 'EV Powertrain & Battery Cell',
    cluster_desc: 'Next-Gen EV Gigafactory & Silicon Semiconductor Foundry Hub',
    continent: 'Americas',
  },
  {
    id: 'us-fmt',
    city: 'Fremont',
    region_name: 'California, USA',
    full_location: 'Fremont, CA, USA',
    lat: 37.5485,
    lon: -121.9886,
    gateway_region: 'us-west1',
    facility_type: 'Robotics Assembly & Testing Cell',
    cluster_desc: 'Silicon Valley Advanced Hardware & Autonomous Robotics Fab',
    continent: 'Americas',
  },
  {
    id: 'mx-mty',
    city: 'Monterrey',
    region_name: 'Nuevo León, Mexico',
    full_location: 'Monterrey, Mexico',
    lat: 25.6866,
    lon: -100.3161,
    gateway_region: 'us-south1',
    facility_type: 'Precision Stamping & Tier-1 Heavy Castings',
    cluster_desc: 'Nearshoring Automotive Megacluster & High-Tonnage Forging',
    continent: 'Americas',
  },

  // Europe
  {
    id: 'de-str',
    city: 'Stuttgart',
    region_name: 'Baden-Württemberg, Germany',
    full_location: 'Stuttgart, Germany',
    lat: 48.7758,
    lon: 9.1829,
    gateway_region: 'europe-west3',
    facility_type: 'Precision Stamping & BiW Assembly',
    cluster_desc: 'Baden-Württemberg High-Precision Automotive Engineering & Tooling',
    continent: 'Europe',
  },
  {
    id: 'de-muc',
    city: 'Munich',
    region_name: 'Bavaria, Germany',
    full_location: 'Munich, Germany',
    lat: 48.1351,
    lon: 11.5820,
    gateway_region: 'europe-west3',
    facility_type: 'Automotive Powertrain & Smart Robotics',
    cluster_desc: 'Bavarian Advanced Mobility, Mechatronics & Autonomous Drives',
    continent: 'Europe',
  },
  {
    id: 'fr-tls',
    city: 'Toulouse',
    region_name: 'Occitanie, France',
    full_location: 'Toulouse, France',
    lat: 43.6047,
    lon: 1.4442,
    gateway_region: 'europe-west1',
    facility_type: 'Aerospace Machining & Turbine Impeller',
    cluster_desc: 'European Aerospace Capital — Airbus Final Assembly & Avionics',
    continent: 'Europe',
  },
  {
    id: 'at-grz',
    city: 'Graz',
    region_name: 'Styria, Austria',
    full_location: 'Graz, Austria',
    lat: 47.0707,
    lon: 15.4395,
    gateway_region: 'europe-west3',
    facility_type: 'Specialty Contract Vehicle Manufacturing',
    cluster_desc: 'Magna Steyr Complete Vehicle Stamping, Assembly & Paint Center',
    continent: 'Europe',
  },

  // East Asia & APAC
  {
    id: 'jp-yok',
    city: 'Yokohama',
    region_name: 'Kanagawa, Japan',
    full_location: 'Yokohama, Japan',
    lat: 35.4437,
    lon: 139.6380,
    gateway_region: 'asia-northeast1',
    facility_type: 'Semiconductor & Precision Optics',
    cluster_desc: 'Sub-Micron Metrology, LiDAR Sensors & Cleanroom Optics Cell',
    continent: 'East Asia & APAC',
  },
  {
    id: 'sg-jur',
    city: 'Jurong',
    region_name: 'Singapore',
    full_location: 'Jurong, Singapore',
    lat: 1.3329,
    lon: 103.7436,
    gateway_region: 'asia-southeast1',
    facility_type: 'Semiconductor Fab & Cleanroom',
    cluster_desc: 'Advanced 300mm Wafer Cleanroom Fab & Silicon Photon Packaging',
    continent: 'East Asia & APAC',
  },
  {
    id: 'tw-hsc',
    city: 'Hsinchu',
    region_name: 'Taiwan',
    full_location: 'Hsinchu Science Park, Taiwan',
    lat: 24.7820,
    lon: 120.9997,
    gateway_region: 'asia-east1',
    facility_type: 'Semiconductor Fab & Cleanroom',
    cluster_desc: 'World Silicon Center — Advanced EUV Lithography Semiconductor Fabs',
    continent: 'East Asia & APAC',
  },
  {
    id: 'kr-uls',
    city: 'Ulsan',
    region_name: 'South Korea',
    full_location: 'Ulsan, South Korea',
    lat: 35.5384,
    lon: 129.3114,
    gateway_region: 'asia-northeast1',
    facility_type: 'Automotive Powertrain & Battery Cell',
    cluster_desc: 'World Largest Single Automobile Manufacturing Complex & Battery Packs',
    continent: 'East Asia & APAC',
  },
];

export function latLonToMapXY(lat: number, lon: number, width: number = 800, height: number = 400): { x: number; y: number } {
  // Equirectangular projection
  const clampedLon = Math.max(-180, Math.min(180, lon));
  const clampedLat = Math.max(-85, Math.min(85, lat));
  const x = ((clampedLon + 180.0) / 360.0) * width;
  const y = ((90.0 - clampedLat) / 180.0) * height;
  return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
}

export function mapXYToLatLon(x: number, y: number, width: number = 800, height: number = 400): { lat: number; lon: number } {
  const lon = (x / width) * 360.0 - 180.0;
  const lat = 90.0 - (y / height) * 180.0;
  return {
    lat: Math.round(Math.max(-85, Math.min(85, lat)) * 10000) / 10000,
    lon: Math.round(Math.max(-180, Math.min(180, lon)) * 10000) / 10000,
  };
}

export function findClosestManufacturingHub(lat: number, lon: number): ManufacturingHub {
  let closest = MANUFACTURING_HUBS[0];
  let minDistance = Infinity;

  for (const hub of MANUFACTURING_HUBS) {
    const dLat = hub.lat - lat;
    const dLon = (hub.lon - lon) * Math.cos(((lat + hub.lat) / 2) * (Math.PI / 180));
    const distSq = dLat * dLat + dLon * dLon;
    if (distSq < minDistance) {
      minDistance = distSq;
      closest = hub;
    }
  }

  return closest;
}

export function suggestRegionFromCoordinates(lat: number, lon: number): string {
  // Rough geographic bounding box heuristics for regional edge gateways
  if (lon >= 65 && lon <= 95 && lat >= 5 && lat <= 38) {
    return 'asia-south1'; // India / South Asia
  }
  if (lon >= 95 && lon <= 150 && lat >= -12 && lat <= 48) {
    if (lat >= 25 && lon >= 125) return 'asia-northeast1'; // Japan/Korea
    if (lon >= 115 && lon <= 125 && lat >= 20 && lat <= 26) return 'asia-east1'; // Taiwan
    return 'asia-southeast1'; // Singapore / Southeast Asia
  }
  if (lon >= -15 && lon <= 45 && lat >= 35 && lat <= 70) {
    if (lon >= 5 && lon <= 20) return 'europe-west3'; // Germany / Central EU
    return 'europe-west1'; // Western Europe
  }
  if (lon >= -130 && lon <= -60 && lat >= 15 && lat <= 60) {
    if (lat <= 36 && lon >= -108 && lon <= -88) return 'us-south1'; // Texas / South
    if (lon <= -115) return 'us-west1'; // California / West
    return 'us-east4'; // Detroit / East
  }
  return 'us-central1';
}

export const GeoMapAssist: React.FC<GeoMapAssistProps> = ({
  currentLocation,
  currentLatitude = 11.0168,
  currentLongitude = 76.9558,
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

  const svgRef = useRef<SVGSVGElement | null>(null);

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

  // Handle map click to place pin
  const handleMapClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 800;
      const clickY = ((e.clientY - rect.top) / rect.height) * 400;

      const { lat, lon } = mapXYToLatLon(clickX, clickY);
      setSelectedCoords({ lat, lon });

      const closest = findClosestManufacturingHub(lat, lon);
      const suggestedReg = suggestRegionFromCoordinates(lat, lon);

      // If clicked very close to a known hub (< 4 degrees), snap to that hub name
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
        suggestedRegion: suggestedReg || closest.gateway_region,
        suggestedFacilityType: closest.facility_type,
        suggestedName: `${closest.city} Facility`,
      });
    },
    [onSelectLocation]
  );

  // Mouse move over map for live coordinate telemetry
  const handleMapMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 400;
    const { lat, lon } = mapXYToLatLon(x, y);
    setHoverCoords({ lat, lon, x, y });
  }, []);

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
        {/* Map Coordinates Banner */}
        <div className="absolute top-2.5 left-3 z-10 pointer-events-none font-sans text-[13px] text-silver tracking-wide">
          WGS-84 Global Map Projection
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
          viewBox="0 0 800 400"
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
          <g stroke="rgba(52, 61, 73, 0.45)" strokeWidth="0.8" strokeDasharray="3 3">
            {/* Longitude meridians */}
            <line x1="133.3" y1="0" x2="133.3" y2="400" />
            <line x1="266.6" y1="0" x2="266.6" y2="400" />
            <line x1="400.0" y1="0" x2="400.0" y2="400" stroke="rgba(169, 178, 190, 0.25)" strokeWidth="1" strokeDasharray="4 2" />
            <line x1="533.3" y1="0" x2="533.3" y2="400" />
            <line x1="666.6" y1="0" x2="666.6" y2="400" />

            {/* Latitude parallels */}
            <line x1="0" y1="66.6" x2="800" y2="66.6" />
            <line x1="0" y1="133.3" x2="800" y2="133.3" stroke="rgba(52, 61, 73, 0.65)" />
            <line x1="0" y1="200.0" x2="800" y2="200.0" stroke="rgba(169, 178, 190, 0.35)" strokeWidth="1.2" strokeDasharray="6 3" />
            <line x1="0" y1="266.6" x2="800" y2="266.6" stroke="rgba(52, 61, 73, 0.65)" />
            <line x1="0" y1="333.3" x2="800" y2="333.3" />
          </g>

          {/* Continental Landmasses (Slate & Line Stone Carving) */}
          <g fill="#181D24" stroke="#343D49" strokeWidth="1.2">
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
              strokeWidth="1.2"
              strokeDasharray="4 1"
            />

            {/* Sri Lanka */}
            <path d="M 575,220 L 580,223 L 577,232 L 572,228 Z" fill="#A9B2BE" fillOpacity="0.4" />

            {/* Japan Archipelago */}
            <path d="M 700,115 L 720,110 L 715,135 L 695,140 Z" fill="#212831" stroke="#A9B2BE" strokeWidth="1" />

            {/* Southeast Asia & Indonesia */}
            <path d="M 610,205 L 640,210 L 660,240 L 640,260 L 610,245 Z" />
            <path d="M 645,260 L 690,265 L 680,280 L 640,275 Z" />

            {/* Australia */}
            <path d="M 670,285 L 730,280 L 760,310 L 750,350 L 700,370 L 660,340 L 650,300 Z" />

            {/* New Zealand */}
            <path d="M 770,360 L 780,355 L 775,390 L 765,385 Z" />
          </g>

          {/* Verified Manufacturing Hubs Scatter Pings on Map */}
          {MANUFACTURING_HUBS.map((hub) => {
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
                  r={isSelected ? '6.5' : '4'}
                  fill={isSelected ? '#3B7DD8' : '#A9B2BE'}
                  fillOpacity={isSelected ? 1 : 0.75}
                  stroke="#0A0C0F"
                  strokeWidth="1.5"
                />
                {isSelected && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="11"
                    fill="none"
                    stroke="#3B7DD8"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}
                <text
                  x={pt.x + 7}
                  y={pt.y + 3}
                  fontSize="9"
                  fontFamily="'Inter', sans-serif"
                  fontWeight="600"
                  fill={isSelected ? '#ECEFF3' : '#A9B2BE'}
                  className="pointer-events-none select-none opacity-85 group-hover:opacity-100"
                >
                  {hub.city}
                </text>
              </g>
            );
          })}

          {/* Deployed Production Facilities Pins */}
          {deployedSites.map((site) => {
            const sLat = site.latitude ?? (site.id.includes('us') ? 42.3314 : site.id.includes('eu') ? 48.7758 : 35.4437);
            const sLon = site.longitude ?? (site.id.includes('us') ? -83.0458 : site.id.includes('eu') ? 9.1829 : 139.638);
            const sPt = latLonToMapXY(sLat, sLon);
            const isCurrentActive = activeSiteId === site.id;

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
                  points={`${sPt.x},${sPt.y - 8} ${sPt.x + 8},${sPt.y} ${sPt.x},${sPt.y + 8} ${sPt.x - 8},${sPt.y}`}
                  fill={isCurrentActive ? '#3FA56B' : '#3B7DD8'}
                  fillOpacity="0.9"
                  stroke="#ECEFF3"
                  strokeWidth="1"
                />
                <circle cx={sPt.x} cy={sPt.y} r="2" fill="#ECEFF3" />
                <text
                  x={sPt.x}
                  y={sPt.y - 11}
                  fontSize="10"
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
            <circle cx="0" cy="0" r="15" fill="rgba(59, 125, 216, 0.14)" stroke="#3B7DD8" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="0" cy="0" r="8" fill="none" stroke="#ECEFF3" strokeWidth="1.2" />
            <circle cx="0" cy="0" r="2.5" fill="#3B7DD8" />
            <line x1="-12" y1="0" x2="-5" y2="0" stroke="#3B7DD8" strokeWidth="1.5" />
            <line x1="5" y1="0" x2="12" y2="0" stroke="#3B7DD8" strokeWidth="1.5" />
            <line x1="0" y1="-12" x2="0" y2="-5" stroke="#3B7DD8" strokeWidth="1.5" />
            <line x1="0" y1="5" x2="0" y2="12" stroke="#3B7DD8" strokeWidth="1.5" />
          </g>

          {/* Live mouse hover cursor reticle */}
          {hoverCoords && (
            <g transform={`translate(${hoverCoords.x}, ${hoverCoords.y})`} className="pointer-events-none opacity-75">
              <circle cx="0" cy="0" r="5" fill="none" stroke="#A9B2BE" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="-8" y1="0" x2="8" y2="0" stroke="#A9B2BE" strokeWidth="0.8" />
              <line x1="0" y1="-8" x2="0" y2="8" stroke="#A9B2BE" strokeWidth="0.8" />
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
                onClick={() => setContinentFilter(c)}
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
          {filteredHubs.map((hub) => {
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
