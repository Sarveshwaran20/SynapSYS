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
  {
    id: 'uk-bir',
    city: 'Birmingham / Coventry',
    region_name: 'West Midlands, UK',
    full_location: 'Birmingham, West Midlands, UK',
    lat: 52.4862,
    lon: -1.8904,
    gateway_region: 'europe-west2',
    facility_type: 'Automotive Powertrain & Battery Gigafactory',
    cluster_desc: 'UK Automotive Heartlands & Clean Propulsion Corridor',
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

export interface RegionViewboxConfig {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  continent: 'India/South Asia' | 'Americas' | 'Europe' | 'East Asia & APAC';
}

export const REGION_VIEWBOXES: Record<string, RegionViewboxConfig> = {
  'asia-south1': { x: 520, y: 120, w: 100, h: 90, title: 'India & South Asia Corridor (asia-south1)', continent: 'India/South Asia' },
  'asia-northeast1': { x: 665, y: 95, w: 70, h: 60, title: 'Japan & Korea Archipelagos (asia-northeast1)', continent: 'East Asia & APAC' },
  'asia-southeast1': { x: 595, y: 170, w: 75, h: 65, title: 'Singapore & Straits Corridor (asia-southeast1)', continent: 'East Asia & APAC' },
  'asia-east1': { x: 635, y: 120, w: 70, h: 60, title: 'Taiwan Silicon Corridor (asia-east1)', continent: 'East Asia & APAC' },
  'europe-west3': { x: 385, y: 65, w: 75, h: 65, title: 'Germany & Central Europe (europe-west3)', continent: 'Europe' },
  'europe-west1': { x: 360, y: 70, w: 80, h: 70, title: 'Western Europe & France (europe-west1)', continent: 'Europe' },
  'europe-west2': { x: 355, y: 65, w: 70, h: 60, title: 'UK & Midlands Corridor (europe-west2)', continent: 'Europe' },
  'us-east4': { x: 180, y: 75, w: 80, h: 70, title: 'US East & Great Lakes (us-east4)', continent: 'Americas' },
  'us-south1': { x: 145, y: 105, w: 80, h: 70, title: 'US South & Texas Triangle (us-south1)', continent: 'Americas' },
  'us-west1': { x: 95, y: 85, w: 75, h: 65, title: 'US Pacific Coast Corridor (us-west1)', continent: 'Americas' },
};

