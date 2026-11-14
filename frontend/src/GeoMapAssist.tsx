import React, { useState, useRef, useCallback, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  RegionGeoBound,
  REGION_GEO_BOUNDS,
} from './lib/manufacturingHubs';

export type { ManufacturingHub, RegionViewboxConfig, RegionGeoBound };
export {
  MANUFACTURING_HUBS,
  latLonToMapXY,
  mapXYToLatLon,
  findClosestManufacturingHub,
  suggestRegionFromCoordinates,
  REGION_VIEWBOXES,
  REGION_GEO_BOUNDS,
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

interface GeocodeSuggestion {
  name: string;
  display_name: string;
  lat: number;
  lon: number;
  type?: string;
  isLocalHub?: boolean;
}

// Marker Icon Generators matching Midnight Marble SCADA Theme
const createReticleIcon = () => {
  return L.divIcon({
    className: 'synapsys-reticle-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: `
      <div style="position:relative; width:40px; height:40px; display:flex; align-items:center; justify-content:center; cursor:grab;">
        <div style="position:absolute; width:40px; height:40px; border-radius:50%; background:rgba(76,141,246,0.18); border:1.5px dashed #4C8DF6;" class="animate-reticle-rotate"></div>
        <div style="position:absolute; width:22px; height:22px; border-radius:50%; background:rgba(76,141,246,0.35); border:1.5px solid #F1F3F6; box-shadow:0 0 10px rgba(76,141,246,0.6);"></div>
        <div style="width:8px; height:8px; border-radius:50%; background:#4C8DF6; box-shadow:0 0 8px #4C8DF6;"></div>
        <div style="position:absolute; width:1.5px; height:38px; background:#4C8DF6; opacity:0.85; pointer-events:none;"></div>
        <div style="position:absolute; height:1.5px; width:38px; background:#4C8DF6; opacity:0.85; pointer-events:none;"></div>
      </div>
    `,
  });
};

const createHubIcon = (hub: ManufacturingHub, isSelected: boolean) => {
  return L.divIcon({
    className: 'synapsys-hub-marker',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `
      <div style="position:relative; width:18px; height:18px; display:flex; align-items:center; justify-content:center; cursor:pointer;" title="${hub.city} - ${hub.region_name}">
        <div style="width:${isSelected ? '12px' : '8px'}; height:${isSelected ? '12px' : '8px'}; border-radius:50%; background:${isSelected ? '#4C8DF6' : '#A7B0BC'}; border:2px solid #080A0D; box-shadow:0 0 6px ${isSelected ? '#4C8DF6' : 'rgba(0,0,0,0.6)'};"></div>
      </div>
    `,
  });
};

const createSiteIcon = (site: ProductionSite, isActive: boolean) => {
  return L.divIcon({
    className: 'synapsys-site-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `
      <div style="position:relative; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer;" title="${site.name} (${site.region})">
        <div style="transform:rotate(45deg); width:14px; height:14px; background:${isActive ? '#3FB27F' : '#4C8DF6'}; border:2px solid #F1F3F6; box-shadow:0 0 10px ${isActive ? 'rgba(63,178,127,0.8)' : 'rgba(76,141,246,0.8)'}; display:flex; align-items:center; justify-content:center;">
          <div style="width:4px; height:4px; border-radius:50%; background:#F1F3F6;"></div>
        </div>
      </div>
    `,
  });
};

// Reverse geocode lat/lon to human readable address
const reverseGeocode = async (lat: number, lon: number): Promise<string | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' },
      }
    );
    clearTimeout(timeoutId);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.display_name) {
      return data.display_name;
    }
  } catch {
    // Offline or network error - fallback gracefully
  }
  return null;
};

// Forward geocode query to candidates
const searchAddressGeocode = async (query: string): Promise<GeocodeSuggestion[]> => {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  // Local manufacturing hubs matches (instant & offline resilient)
  const localMatches: GeocodeSuggestion[] = MANUFACTURING_HUBS.filter(
    (h) =>
      h.city.toLowerCase().includes(q) ||
      h.region_name.toLowerCase().includes(q) ||
      h.full_location.toLowerCase().includes(q) ||
      h.facility_type.toLowerCase().includes(q)
  ).map((h) => ({
    name: `${h.city} (${h.region_name})`,
    display_name: h.full_location,
    lat: h.lat,
    lon: h.lon,
    type: 'Industrial Hub',
    isLocalHub: true,
  }));

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' },
      }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const remoteMatches: GeocodeSuggestion[] = data.map((item: any) => ({
          name: item.name || item.display_name.split(',')[0],
          display_name: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          type: item.type || item.class || 'Address',
          isLocalHub: false,
        }));

        const combined = [...localMatches];
        for (const rem of remoteMatches) {
          if (!combined.some((c) => Math.hypot(c.lat - rem.lat, c.lon - rem.lon) < 0.05)) {
            combined.push(rem);
          }
        }
        return combined.slice(0, 6);
      }
    }
  } catch {
    // Fall back to local matches
  }

  return localMatches.slice(0, 6);
};

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
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const corridorOverlayRef = useRef<L.Rectangle | null>(null);
  const corridorHaloRef = useRef<L.Rectangle | null>(null);
  const hubsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const sitesLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [activeRegion, setActiveRegion] = useState<string | undefined>(selectedRegion);
  const [viewMode, setViewMode] = useState<'world' | 'corridor'>(selectedRegion ? 'corridor' : 'world');
  const [tileStyle, setTileStyle] = useState<'carto_dark' | 'osm_standard'>('carto_dark');
  const [hoverCoords, setHoverCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number }>({
    lat: currentLatitude,
    lon: currentLongitude,
  });

  // Address search state
  const [addressInput, setAddressInput] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync activeRegion with prop
  useEffect(() => {
    if (selectedRegion && selectedRegion !== activeRegion) {
      setActiveRegion(selectedRegion);
      setViewMode('corridor');
    }
  }, [selectedRegion]);

  // Synchronize pin position when coordinate props change externally
  useEffect(() => {
    if (
      currentLatitude !== undefined &&
      currentLongitude !== undefined &&
      (Math.abs(currentLatitude - selectedCoords.lat) > 0.0001 ||
        Math.abs(currentLongitude - selectedCoords.lon) > 0.0001)
    ) {
      setSelectedCoords({ lat: currentLatitude, lon: currentLongitude });
      if (markerRef.current) {
        markerRef.current.setLatLng([currentLatitude, currentLongitude]);
      }
    }
  }, [currentLatitude, currentLongitude]);

  // Apply location and notify parent
  const applyLocation = useCallback(
    async (lat: number, lon: number, explicitLocationName?: string) => {
      setSelectedCoords({ lat, lon });

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lon]);
      }

      let locName = explicitLocationName;
      if (!locName) {
        const reversed = await reverseGeocode(lat, lon);
        if (reversed) {
          locName = reversed;
        } else {
          const closest = findClosestManufacturingHub(lat, lon);
          const dist = Math.hypot(closest.lat - lat, closest.lon - lon);
          if (dist < 0.8) {
            locName = closest.full_location;
          } else {
            const latDir = lat >= 0 ? 'N' : 'S';
            const lonDir = lon >= 0 ? 'E' : 'W';
            locName = `${closest.city} Sector (${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir})`;
          }
        }
      }

      const inferredRegion = suggestRegionFromCoordinates(lat, lon);
      const closestHub = findClosestManufacturingHub(lat, lon);
      const chosenRegion = activeRegion || inferredRegion;

      const baseName = locName.split(',')[0].trim();
      onSelectLocation({
        location: locName,
        latitude: lat,
        longitude: lon,
        suggestedRegion: chosenRegion,
        suggestedFacilityType: closestHub.facility_type,
        suggestedName: `${baseName} Facility`,
      });

      setSearchFeedback(`Coordinates pinned: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`);
      setTimeout(() => setSearchFeedback(null), 3500);
    },
    [activeRegion, onSelectLocation]
  );

  // Address search query debounced autocomplete
  useEffect(() => {
    if (!addressInput.trim() || addressInput.length < 2) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchAddressGeocode(addressInput.trim());
      setAddressSuggestions(results);
      setShowSuggestions(results.length > 0);
      setIsSearching(false);
    }, 320);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [addressInput]);

  // Execute address search selection
  const handleSelectSuggestion = (item: GeocodeSuggestion) => {
    setShowSuggestions(false);
    setAddressInput(item.display_name);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([item.lat, item.lon], 13, { duration: 1.4 });
    }

    applyLocation(item.lat, item.lon, item.display_name);
  };

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!addressInput.trim()) return;

    setIsSearching(true);
    const results = await searchAddressGeocode(addressInput.trim());
    setIsSearching(false);

    if (results.length > 0) {
      handleSelectSuggestion(results[0]);
    } else {
      setSearchFeedback(`No matching address found for "${addressInput}".`);
      setTimeout(() => setSearchFeedback(null), 4000);
    }
  };

  // Switch Tile Style
  const setTileLayer = useCallback((style: 'carto_dark' | 'osm_standard', map: L.Map) => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    if (style === 'carto_dark') {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map);
    } else {
      tileLayerRef.current = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);
    }
  }, []);

  // Update corridor highlight overlays on the map
  const updateCorridorOverlay = useCallback(
    (regionKey: string | undefined, mode: 'world' | 'corridor', map: L.Map) => {
      // Remove previous overlay
      if (corridorOverlayRef.current) {
        map.removeLayer(corridorOverlayRef.current);
        corridorOverlayRef.current = null;
      }
      if (corridorHaloRef.current) {
        map.removeLayer(corridorHaloRef.current);
        corridorHaloRef.current = null;
      }

      if (!regionKey || !REGION_GEO_BOUNDS[regionKey]) return;

      const bound = REGION_GEO_BOUNDS[regionKey];

      // Draw highlighted regional corridor rectangle
      corridorOverlayRef.current = L.rectangle(bound.bounds, {
        color: '#4C8DF6',
        weight: 2,
        opacity: 0.95,
        fill: true,
        fillColor: '#4C8DF6',
        fillOpacity: 0.14,
        dashArray: '5, 5',
      }).addTo(map);

      // Outer tactical boundary halo
      corridorHaloRef.current = L.rectangle(bound.bounds, {
        color: '#38BDF8',
        weight: 1,
        opacity: 0.5,
        fill: false,
      }).addTo(map);

      if (mode === 'corridor') {
        map.flyToBounds(bound.bounds, {
          padding: [45, 45],
          maxZoom: 8,
          duration: 1.2,
        });
      } else {
        map.flyTo([22, 10], 2, { duration: 1.2 });
      }
    },
    []
  );

  // Initialize Leaflet Map on Mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialLat = currentLatitude || 20.5937;
    const initialLon = currentLongitude || 78.9629;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: selectedRegion && REGION_GEO_BOUNDS[selectedRegion] ? REGION_GEO_BOUNDS[selectedRegion].zoom : 4,
      zoomControl: false,
      attributionControl: true,
      minZoom: 2,
      maxZoom: 18,
      worldCopyJump: true,
    });

    mapInstanceRef.current = map;

    // Zoom controls bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer
    setTileLayer(tileStyle, map);

    // Initialize Pin Marker (Draggable Reticle)
    const pin = L.marker([initialLat, initialLon], {
      icon: createReticleIcon(),
      draggable: true,
      zIndexOffset: 1000,
    }).addTo(map);

    pin.on('dragend', () => {
      const pos = pin.getLatLng();
      applyLocation(pos.lat, pos.lng);
    });

    markerRef.current = pin;

    // Layer groups for Hubs and Sites
    hubsLayerGroupRef.current = L.layerGroup().addTo(map);
    sitesLayerGroupRef.current = L.layerGroup().addTo(map);

    // Map Click Listener
    map.on('click', (e: L.LeafletMouseEvent) => {
      applyLocation(e.latlng.lat, e.latlng.lng);
    });

    // Map Mousemove Telemetry
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setHoverCoords({ lat: e.latlng.lat, lon: e.latlng.lng });
    });

    map.on('mouseout', () => {
      setHoverCoords(null);
    });

    // Refresh size to avoid grey tiles inside modals
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (selectedRegion && REGION_GEO_BOUNDS[selectedRegion]) {
        updateCorridorOverlay(selectedRegion, 'corridor', map);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync Tile Style changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTileLayer(tileStyle, mapInstanceRef.current);
    }
  }, [tileStyle, setTileLayer]);

  // Sync Corridor Overlay when region or viewMode changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      updateCorridorOverlay(activeRegion, viewMode, mapInstanceRef.current);
    }
  }, [activeRegion, viewMode, updateCorridorOverlay]);

  // Sync Hubs Layer
  useEffect(() => {
    if (!hubsLayerGroupRef.current) return;
    hubsLayerGroupRef.current.clearLayers();

    // If isolated in corridor mode, only show hubs of that region; otherwise show all
    const hubsToShow =
      viewMode === 'corridor' && activeRegion
        ? MANUFACTURING_HUBS.filter((h) => h.gateway_region === activeRegion)
        : MANUFACTURING_HUBS;

    hubsToShow.forEach((hub) => {
      const isSelected = Math.hypot(hub.lat - selectedCoords.lat, hub.lon - selectedCoords.lon) < 0.2;
      const marker = L.marker([hub.lat, hub.lon], {
        icon: createHubIcon(hub, isSelected),
      });

      marker.bindTooltip(`<strong>${hub.city}</strong><br/>${hub.region_name}`, {
        direction: 'top',
        offset: [0, -8],
      });

      marker.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([hub.lat, hub.lon], 11, { duration: 1.0 });
        }
        applyLocation(hub.lat, hub.lon, hub.full_location);
      });

      marker.addTo(hubsLayerGroupRef.current!);
    });
  }, [viewMode, activeRegion, selectedCoords, applyLocation]);

  // Sync Deployed Sites Layer
  useEffect(() => {
    if (!sitesLayerGroupRef.current) return;
    sitesLayerGroupRef.current.clearLayers();

    deployedSites.forEach((site) => {
      const sLat = site.latitude ?? (site.id.includes('us') ? 42.3314 : site.id.includes('eu') ? 48.7758 : 35.4437);
      const sLon = site.longitude ?? (site.id.includes('us') ? -83.0458 : site.id.includes('eu') ? 9.1829 : 139.638);
      const isCurrentActive = activeSiteId === site.id;

      const marker = L.marker([sLat, sLon], {
        icon: createSiteIcon(site, isCurrentActive),
      });

      marker.bindTooltip(`<strong>${site.name}</strong><br/>Region: ${site.region}`, {
        direction: 'top',
        offset: [0, -12],
      });

      marker.on('click', (e: L.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        if (onSelectSite) onSelectSite(site.id);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([sLat, sLon], 12, { duration: 1.0 });
        }
        applyLocation(sLat, sLon, site.location || site.name);
      });

      marker.addTo(sitesLayerGroupRef.current!);
    });
  }, [deployedSites, activeSiteId, onSelectSite, applyLocation]);

  const activeRegionConfig = activeRegion ? REGION_GEO_BOUNDS[activeRegion] : undefined;

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
                {mode === 'radar_view' ? 'GLOBAL PLANT DIRECTORY' : 'OPENSTREETMAP FACILITY ASSIST'}
              </span>
              <span className="id-tag">
                {activeRegion ? activeRegion : 'OPENMAPS TELEMETRY'}
              </span>
            </div>
            <p className="text-[12px] text-silver font-sans mt-0.5">
              Interactive global OpenStreetMap cartography. Search any facility address, street, or city to position the telemetry pin.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tile layer toggle */}
          <button
            type="button"
            onClick={() => setTileStyle(tileStyle === 'carto_dark' ? 'osm_standard' : 'carto_dark')}
            className="px-2.5 py-1 rounded-[2px] text-[11px] font-mono border border-line bg-graphite hover:bg-slate text-silver hover:text-marble transition-colors cursor-pointer"
            title="Toggle OpenStreetMap tile styling"
          >
            {tileStyle === 'carto_dark' ? 'Tile: Dark SCADA' : 'Tile: OSM Standard'}
          </button>

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
      </div>

      {/* Address Search Bar with Live Geocoder Autocomplete */}
      <div className="p-3 bg-graphite/70 border-b border-line">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onFocus={() => {
                if (addressSuggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder="Search global address, street, plant or city (e.g., 400 Renaissance Ctr, Detroit or Peelamedu, Coimbatore)..."
              className="w-full pl-9 pr-8 py-2 rounded-[2px] bg-slate border border-line text-marble text-sm focus:outline-none focus:border-aegean font-sans placeholder:text-silver/60"
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
            {addressInput && (
              <button
                type="button"
                onClick={() => {
                  setAddressInput('');
                  setAddressSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="absolute right-2.5 top-2.5 text-xs text-silver hover:text-marble p-0.5 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="btn-aegean px-3.5 py-2 text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isSearching ? (
              <span className="inline-block w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m9-9H3" />
              </svg>
            )}
            <span>Locate Address</span>
          </button>
        </form>

        {/* Live Search Suggestions Dropdown */}
        {showSuggestions && addressSuggestions.length > 0 && (
          <div className="absolute left-3 right-3 mt-1.5 z-30 bg-basalt border border-line rounded-[2px] shadow-2xl overflow-hidden max-h-60 overflow-y-auto no-scrollbar">
            <div className="px-3 py-1.5 bg-slate border-b border-line text-[11px] font-mono text-silver flex items-center justify-between">
              <span>OpenStreetMap Geocoding Matches</span>
              <span className="text-aegean">{addressSuggestions.length} candidates</span>
            </div>
            {addressSuggestions.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSuggestion(item)}
                className="px-3 py-2 border-b border-line/60 hover:bg-graphite cursor-pointer transition-colors flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-marble text-xs truncate font-sans">{item.name}</div>
                  <div className="text-[11px] text-silver truncate font-sans">{item.display_name}</div>
                </div>
                <div className="text-right shrink-0">
                  <span className="id-tag text-[10px] block">{item.type || 'Location'}</span>
                  <span className="text-[10px] font-mono text-silver/80">
                    {item.lat.toFixed(2)}°, {item.lon.toFixed(2)}°
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feedback / Notification banner */}
        {searchFeedback && (
          <div className="mt-2 text-xs font-mono text-aegean bg-slate/90 px-2.5 py-1 rounded-[2px] border border-line flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-aegean"></span>
            <span>{searchFeedback}</span>
          </div>
        )}
      </div>

      {/* Main Leaflet Map Canvas Container */}
      <div className="relative select-none">
        {/* Top Floating Map Controls */}
        <div className="absolute top-2.5 left-3 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
          {activeRegionConfig && (
            <div className="px-2.5 py-1 rounded-[2px] bg-basalt/90 border border-line backdrop-blur-sm text-xs font-mono text-marble shadow">
              Corridor: <span className="text-aegean font-semibold">{activeRegionConfig.title}</span>
            </div>
          )}

          {activeRegion && (
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'world' ? 'corridor' : 'world')}
              className="px-2.5 py-1 rounded-[2px] text-xs font-mono border border-line bg-graphite/90 hover:bg-slate text-marble transition-colors cursor-pointer shadow backdrop-blur-sm"
              title={viewMode === 'world' ? 'Focus selected regional corridor' : 'View entire world map'}
            >
              {viewMode === 'world' ? 'Focus Corridor ⌖' : 'World View ⛶'}
            </button>
          )}
        </div>

        {/* Live Coordinate Telemetry readout */}
        <div className="absolute top-2.5 right-3 z-10 pointer-events-none font-mono text-[12px] bg-basalt/90 px-2.5 py-1 rounded-[2px] border border-line text-marble shadow backdrop-blur-sm">
          {hoverCoords ? (
            <span>
              Cursor: {Math.abs(hoverCoords.lat).toFixed(3)}°{hoverCoords.lat >= 0 ? 'N' : 'S'},{' '}
              {Math.abs(hoverCoords.lon).toFixed(3)}°{hoverCoords.lon >= 0 ? 'E' : 'W'}
            </span>
          ) : (
            <span>
              Pin: {Math.abs(selectedCoords.lat).toFixed(3)}°{selectedCoords.lat >= 0 ? 'N' : 'S'},{' '}
              {Math.abs(selectedCoords.lon).toFixed(3)}°{selectedCoords.lon >= 0 ? 'E' : 'W'}
            </span>
          )}
        </div>

        {/* Real Leaflet Map DOM Node */}
        <div
          ref={mapContainerRef}
          className="w-full h-[320px] sm:h-[380px] bg-obsidian relative synapsys-leaflet-map z-0 cursor-crosshair"
        />

        {/* Map Legend Strip */}
        <div className="px-4 py-2 bg-basalt border-t border-line flex flex-wrap items-center justify-between gap-2 text-[12px] font-sans text-silver">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rotate-45 bg-laurel border border-white/50"></span>
              <span>Active Plant Deployment</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-silver"></span>
              <span>Industrial Hub</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-aegean border border-white"></span>
              <span>Selected Pin (Draggable)</span>
            </span>
            {activeRegion && (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-2 border border-dashed border-aegean bg-aegean/20"></span>
                <span>Highlighted Corridor</span>
              </span>
            )}
          </div>
          <div className="text-marble font-mono font-semibold text-[12px]">
            LAT: {selectedCoords.lat.toFixed(4)}° | LON: {selectedCoords.lon.toFixed(4)}°
          </div>
        </div>
      </div>

      {/* Regional Gateway Corridor Switcher Strip */}
      <div className="p-3 bg-slate border-b border-line">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-cinzel font-bold text-silver uppercase tracking-wider">
            Regional Edge Gateways
          </span>
          <span className="text-[11px] font-mono text-silver">
            Click corridor to highlight region on world map
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              setActiveRegion(undefined);
              setViewMode('world');
            }}
            className={`px-2.5 py-1 rounded-[2px] transition-all cursor-pointer whitespace-nowrap ${
              !activeRegion ? 'btn-aegean text-marble' : 'btn-secondary'
            }`}
          >
            All Corridors (World)
          </button>
          {Object.entries(REGION_GEO_BOUNDS).map(([regKey, regVal]) => {
            const isSelected = activeRegion === regKey;
            return (
              <button
                key={regKey}
                type="button"
                onClick={() => {
                  setActiveRegion(regKey);
                  setViewMode('corridor');
                }}
                title={regVal.title}
                className={`px-2.5 py-1 rounded-[2px] transition-all cursor-pointer whitespace-nowrap ${
                  isSelected ? 'btn-aegean text-marble font-semibold' : 'btn-secondary'
                }`}
              >
                {regKey}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Location Telemetry Bar */}
      <div className="p-4 bg-slate flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-[2px] bg-laurel shrink-0"></span>
          <span className="text-silver font-sans text-xs shrink-0">Selected Geographic Anchor:</span>
          <strong className="text-marble font-sans text-xs truncate">
            {currentLocation || `${selectedCoords.lat.toFixed(4)}°, ${selectedCoords.lon.toFixed(4)}°`}
          </strong>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="id-tag text-xs font-mono">
            Gateway: {activeRegion || suggestRegionFromCoordinates(selectedCoords.lat, selectedCoords.lon)}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn-aegean px-4 py-1.5 text-xs font-semibold uppercase tracking-wider cursor-pointer"
            >
              Apply to Facility
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeoMapAssist;
