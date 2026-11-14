/**
 * Dynamic Multi-Currency & Regional Valuation Engine for SynapSYS Industrial SCADA.
 * Automatically derives currency symbol, formatting, FX rates, and industrial contract
 * baselines from the active facility's geographic location and edge gateway region.
 */

export interface SiteCurrency {
  code: 'INR' | 'USD' | 'EUR' | 'JPY' | 'GBP' | 'SGD';
  symbol: string;
  name: string;
  unitBaseline: number;
  downtimeHourlyRate: number;
  scrapUnitCost: number;
  powerTariff: number;
  powerTariffLabel: string;
  fxRate: number;
}

export function getCurrencyForSite(site?: {
  region?: string;
  location?: string;
  name?: string;
  id?: string;
} | null): SiteCurrency {
  if (!site) {
    return {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
      unitBaseline: 85,
      downtimeHourlyRate: 1200,
      scrapUnitCost: 45,
      powerTariff: 0.14,
      powerTariffLabel: '$0.14 / kWh',
      fxRate: 1.0,
    };
  }

  const r = (site.region || '').toLowerCase();
  const loc = (site.location || '').toLowerCase();
  const name = (site.name || '').toLowerCase();
  const id = (site.id || '').toLowerCase();

  // India & South Asia (INR)
  if (
    r === 'asia-south1' ||
    loc.includes('india') || loc.includes('coimbatore') || loc.includes('chennai') ||
    loc.includes('bengaluru') || loc.includes('bangalore') || loc.includes('pune') ||
    loc.includes('sanand') || loc.includes('ahmedabad') || loc.includes('gurugram') ||
    loc.includes('mumbai') || loc.includes('delhi') || loc.includes('tamil nadu') ||
    name.includes('coimbatore') || name.includes('chennai') || id.includes('in-') ||
    id.includes('india') || id.includes('chennai') || id.includes('coimbatore')
  ) {
    return {
      code: 'INR',
      symbol: '₹',
      name: 'Indian Rupee',
      unitBaseline: 7200,
      downtimeHourlyRate: 95000,
      scrapUnitCost: 3800,
      powerTariff: 11.50,
      powerTariffLabel: '₹11.50 / kWh',
      fxRate: 86.0,
    };
  }

  // Europe (EUR / GBP)
  if (
    r.startsWith('europe') ||
    loc.includes('germany') || loc.includes('stuttgart') || loc.includes('munich') ||
    loc.includes('frankfurt') || loc.includes('france') || loc.includes('toulouse') ||
    loc.includes('austria') || loc.includes('graz') || name.includes('stuttgart') ||
    name.includes('munich') || id.includes('eu-') || id.includes('frankfurt')
  ) {
    if (r === 'europe-west2' || loc.includes('uk') || loc.includes('london') || loc.includes('birmingham')) {
      return {
        code: 'GBP',
        symbol: '£',
        name: 'British Pound',
        unitBaseline: 68,
        downtimeHourlyRate: 960,
        scrapUnitCost: 36,
        powerTariff: 0.24,
        powerTariffLabel: '£0.24 / kWh',
        fxRate: 0.79,
      };
    }
    return {
      code: 'EUR',
      symbol: '€',
      name: 'Euro',
      unitBaseline: 78,
      downtimeHourlyRate: 1100,
      scrapUnitCost: 42,
      powerTariff: 0.28,
      powerTariffLabel: '€0.28 / kWh',
      fxRate: 0.92,
    };
  }

  // Japan & East Asia (JPY)
  if (
    r === 'asia-northeast1' || r === 'asia-east1' ||
    loc.includes('japan') || loc.includes('tokyo') || loc.includes('yokohama') ||
    loc.includes('korea') || loc.includes('ulsan') || loc.includes('taiwan') ||
    loc.includes('hsinchu') || name.includes('yokohama') || id.includes('apac-tokyo') ||
    id.includes('yokohama')
  ) {
    return {
      code: 'JPY',
      symbol: '¥',
      name: 'Japanese Yen',
      unitBaseline: 13000,
      downtimeHourlyRate: 180000,
      scrapUnitCost: 7000,
      powerTariff: 28.00,
      powerTariffLabel: '¥28.00 / kWh',
      fxRate: 155.0,
    };
  }

  // Singapore & Southeast Asia (SGD)
  if (
    r === 'asia-southeast1' ||
    loc.includes('singapore') || loc.includes('jurong') || name.includes('singapore')
  ) {
    return {
      code: 'SGD',
      symbol: 'S$',
      name: 'Singapore Dollar',
      unitBaseline: 115,
      downtimeHourlyRate: 1600,
      scrapUnitCost: 60,
      powerTariff: 0.32,
      powerTariffLabel: 'S$0.32 / kWh',
      fxRate: 1.35,
    };
  }

  // Default: US Dollar (Americas)
  return {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    unitBaseline: 85,
    downtimeHourlyRate: 1200,
    scrapUnitCost: 45,
    powerTariff: 0.14,
    powerTariffLabel: '$0.14 / kWh',
    fxRate: 1.0,
  };
}

export function formatCurrency(
  amount: number,
  currency: SiteCurrency,
  decimals: number = 0
): string {
  return `${currency.symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
