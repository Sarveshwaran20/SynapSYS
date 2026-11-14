/**
 * Dynamic Multi-Currency & Regional Valuation Engine for SynapSYS Industrial SCADA.
 * Automatically resolves the currency symbol, FX rates, tariffs, and industrial contract
 * baselines matching the active facility's country and geographic location.
 */

export interface SiteCurrency {
  code: string;
  symbol: string;
  name: string;
  country: string;
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
  latitude?: number;
  longitude?: number;
} | null): SiteCurrency {
  if (!site) {
    return {
      code: 'USD',
      symbol: '$',
      name: 'US Dollar',
      country: 'United States',
      unitBaseline: 85,
      downtimeHourlyRate: 1200,
      scrapUnitCost: 45,
      powerTariff: 0.14,
      powerTariffLabel: '$0.14 / kWh',
      fxRate: 1.0,
    };
  }

  const loc = (site.location || '').toLowerCase();
  const name = (site.name || '').toLowerCase();
  const id = (site.id || '').toLowerCase();
  const r = (site.region || '').toLowerCase();
  const lat = site.latitude;
  const lon = site.longitude;

  // 1. India & South Asia (INR ₹)
  if (
    loc.includes('india') || loc.includes('tamil nadu') || loc.includes('karnataka') ||
    loc.includes('maharashtra') || loc.includes('gujarat') || loc.includes('haryana') ||
    loc.includes('coimbatore') || loc.includes('chennai') || loc.includes('bengaluru') ||
    loc.includes('bangalore') || loc.includes('pune') || loc.includes('sanand') ||
    loc.includes('ahmedabad') || loc.includes('gurugram') || loc.includes('manesar') ||
    loc.includes('mumbai') || loc.includes('delhi') || name.includes('coimbatore') ||
    name.includes('chennai') || id.includes('in-') || id.includes('india') ||
    id.includes('coimbatore') || id.includes('chennai') || r === 'asia-south1' ||
    (lat !== undefined && lon !== undefined && lat >= 6 && lat <= 38 && lon >= 68 && lon <= 97)
  ) {
    return {
      code: 'INR',
      symbol: '₹',
      name: 'Indian Rupee',
      country: 'India',
      unitBaseline: 7200,
      downtimeHourlyRate: 95000,
      scrapUnitCost: 3800,
      powerTariff: 11.50,
      powerTariffLabel: '₹11.50 / kWh',
      fxRate: 86.0,
    };
  }

  // 2. Japan (JPY ¥)
  if (
    loc.includes('japan') || loc.includes('tokyo') || loc.includes('yokohama') ||
    loc.includes('osaka') || loc.includes('nagoya') || loc.includes('kanagawa') ||
    name.includes('yokohama') || name.includes('tokyo') || id.includes('jp-') ||
    id.includes('tokyo') || id.includes('yokohama') ||
    (r === 'asia-northeast1' && !loc.includes('korea') && !loc.includes('ulsan') && !name.includes('korea')) ||
    (lat !== undefined && lon !== undefined && lat >= 30 && lat <= 46 && lon >= 129 && lon <= 146)
  ) {
    return {
      code: 'JPY',
      symbol: '¥',
      name: 'Japanese Yen',
      country: 'Japan',
      unitBaseline: 13000,
      downtimeHourlyRate: 180000,
      scrapUnitCost: 7000,
      powerTariff: 28.00,
      powerTariffLabel: '¥28.00 / kWh',
      fxRate: 155.0,
    };
  }

  // 3. South Korea (KRW ₩)
  if (
    loc.includes('korea') || loc.includes('ulsan') || loc.includes('seoul') ||
    loc.includes('incheon') || loc.includes('busan') || name.includes('ulsan') ||
    name.includes('korea') || id.includes('kr-') || id.includes('ulsan') ||
    (lat !== undefined && lon !== undefined && lat >= 34 && lat <= 39 && lon >= 125 && lon <= 130)
  ) {
    return {
      code: 'KRW',
      symbol: '₩',
      name: 'South Korean Won',
      country: 'South Korea',
      unitBaseline: 115000,
      downtimeHourlyRate: 1600000,
      scrapUnitCost: 60000,
      powerTariff: 180.00,
      powerTariffLabel: '₩180 / kWh',
      fxRate: 1400.0,
    };
  }

  // 4. Taiwan (TWD NT$)
  if (
    loc.includes('taiwan') || loc.includes('hsinchu') || loc.includes('taipei') ||
    loc.includes('taichung') || name.includes('hsinchu') || name.includes('taiwan') ||
    id.includes('tw-') || id.includes('hsc') || r === 'asia-east1' ||
    (lat !== undefined && lon !== undefined && lat >= 21 && lat <= 26 && lon >= 119 && lon <= 123)
  ) {
    return {
      code: 'TWD',
      symbol: 'NT$',
      name: 'New Taiwan Dollar',
      country: 'Taiwan',
      unitBaseline: 2750,
      downtimeHourlyRate: 38000,
      scrapUnitCost: 1450,
      powerTariff: 4.20,
      powerTariffLabel: 'NT$4.20 / kWh',
      fxRate: 32.5,
    };
  }

  // 5. Singapore (SGD S$)
  if (
    loc.includes('singapore') || loc.includes('jurong') || loc.includes('tuas') ||
    name.includes('singapore') || id.includes('sg-') || r === 'asia-southeast1' ||
    (lat !== undefined && lon !== undefined && lat >= 1.1 && lat <= 1.5 && lon >= 103.5 && lon <= 104.1)
  ) {
    return {
      code: 'SGD',
      symbol: 'S$',
      name: 'Singapore Dollar',
      country: 'Singapore',
      unitBaseline: 115,
      downtimeHourlyRate: 1600,
      scrapUnitCost: 60,
      powerTariff: 0.32,
      powerTariffLabel: 'S$0.32 / kWh',
      fxRate: 1.35,
    };
  }

  // 6. United Kingdom (GBP £)
  if (
    loc.includes('united kingdom') || loc.includes('uk') || loc.includes('england') ||
    loc.includes('scotland') || loc.includes('wales') || loc.includes('london') ||
    loc.includes('birmingham') || loc.includes('coventry') || loc.includes('manchester') ||
    name.includes('birmingham') || name.includes('coventry') || id.includes('uk-') ||
    r === 'europe-west2' ||
    (lat !== undefined && lon !== undefined && lat >= 49.5 && lat <= 59.5 && lon >= -8.5 && lon <= 2.0)
  ) {
    return {
      code: 'GBP',
      symbol: '£',
      name: 'British Pound',
      country: 'United Kingdom',
      unitBaseline: 68,
      downtimeHourlyRate: 960,
      scrapUnitCost: 36,
      powerTariff: 0.24,
      powerTariffLabel: '£0.24 / kWh',
      fxRate: 0.79,
    };
  }

  // 7. Switzerland (CHF CHF)
  if (
    loc.includes('switzerland') || loc.includes('zurich') || loc.includes('geneva') ||
    loc.includes('basel') || name.includes('zurich') || id.includes('ch-')
  ) {
    return {
      code: 'CHF',
      symbol: 'CHF',
      name: 'Swiss Franc',
      country: 'Switzerland',
      unitBaseline: 76,
      downtimeHourlyRate: 1050,
      scrapUnitCost: 40,
      powerTariff: 0.26,
      powerTariffLabel: 'CHF 0.26 / kWh',
      fxRate: 0.90,
    };
  }

  // 8. Eurozone (Germany, France, Austria, Italy, Spain, etc. - EUR €)
  if (
    loc.includes('germany') || loc.includes('deutschland') || loc.includes('stuttgart') ||
    loc.includes('munich') || loc.includes('frankfurt') || loc.includes('france') ||
    loc.includes('toulouse') || loc.includes('paris') || loc.includes('austria') ||
    loc.includes('graz') || loc.includes('vienna') || loc.includes('italy') ||
    loc.includes('milan') || loc.includes('spain') || loc.includes('madrid') ||
    loc.includes('netherlands') || loc.includes('amsterdam') || loc.includes('belgium') ||
    loc.includes('brussels') || loc.includes('ireland') || loc.includes('portugal') ||
    loc.includes('finland') || loc.includes('greece') || name.includes('stuttgart') ||
    name.includes('munich') || name.includes('toulouse') || id.includes('de-') ||
    id.includes('fr-') || id.includes('at-') || id.includes('eu-') || id.includes('frankfurt') ||
    r === 'europe-west3' || r === 'europe-west1' || r === 'europe-west4' ||
    (lat !== undefined && lon !== undefined && lat >= 36 && lat <= 60 && lon >= -10 && lon <= 25)
  ) {
    const euroCountry = loc.includes('france') || loc.includes('toulouse')
      ? 'France'
      : loc.includes('austria') || loc.includes('graz')
      ? 'Austria'
      : loc.includes('italy')
      ? 'Italy'
      : loc.includes('spain')
      ? 'Spain'
      : 'Germany';
    return {
      code: 'EUR',
      symbol: '€',
      name: 'Euro',
      country: euroCountry,
      unitBaseline: 78,
      downtimeHourlyRate: 1100,
      scrapUnitCost: 42,
      powerTariff: 0.28,
      powerTariffLabel: '€0.28 / kWh',
      fxRate: 0.92,
    };
  }

  // 9. Mexico (MXN Mex$)
  if (
    loc.includes('mexico') || loc.includes('monterrey') || loc.includes('guadalajara') ||
    loc.includes('nuevo león') || name.includes('monterrey') || id.includes('mx-') ||
    id.includes('monterrey') ||
    (lat !== undefined && lon !== undefined && lat >= 14 && lat <= 33 && lon >= -118 && lon <= -86)
  ) {
    return {
      code: 'MXN',
      symbol: 'Mex$',
      name: 'Mexican Peso',
      country: 'Mexico',
      unitBaseline: 1700,
      downtimeHourlyRate: 24000,
      scrapUnitCost: 900,
      powerTariff: 2.80,
      powerTariffLabel: 'Mex$2.80 / kWh',
      fxRate: 20.2,
    };
  }

  // 10. Canada (CAD CA$)
  if (
    loc.includes('canada') || loc.includes('toronto') || loc.includes('montreal') ||
    loc.includes('vancouver') || loc.includes('ontario') || loc.includes('quebec') ||
    name.includes('toronto') || id.includes('ca-')
  ) {
    return {
      code: 'CAD',
      symbol: 'CA$',
      name: 'Canadian Dollar',
      country: 'Canada',
      unitBaseline: 118,
      downtimeHourlyRate: 1650,
      scrapUnitCost: 62,
      powerTariff: 0.19,
      powerTariffLabel: 'CA$0.19 / kWh',
      fxRate: 1.40,
    };
  }

  // 11. Australia (AUD A$)
  if (
    loc.includes('australia') || loc.includes('sydney') || loc.includes('melbourne') ||
    loc.includes('brisbane') || name.includes('sydney') || id.includes('au-') ||
    r.includes('australia')
  ) {
    return {
      code: 'AUD',
      symbol: 'A$',
      name: 'Australian Dollar',
      country: 'Australia',
      unitBaseline: 130,
      downtimeHourlyRate: 1850,
      scrapUnitCost: 70,
      powerTariff: 0.29,
      powerTariffLabel: 'A$0.29 / kWh',
      fxRate: 1.54,
    };
  }

  // 12. China (CNY ¥)
  if (
    loc.includes('china') || loc.includes('shanghai') || loc.includes('shenzhen') ||
    loc.includes('beijing') || loc.includes('guangzhou') || name.includes('shanghai') ||
    id.includes('cn-')
  ) {
    return {
      code: 'CNY',
      symbol: '¥',
      name: 'Chinese Yuan',
      country: 'China',
      unitBaseline: 620,
      downtimeHourlyRate: 8800,
      scrapUnitCost: 330,
      powerTariff: 0.85,
      powerTariffLabel: '¥0.85 / kWh',
      fxRate: 7.25,
    };
  }

  // 13. Brazil (BRL R$)
  if (
    loc.includes('brazil') || loc.includes('brasil') || loc.includes('são paulo') ||
    loc.includes('sao paulo') || loc.includes('rio') || name.includes('paulo') ||
    id.includes('br-')
  ) {
    return {
      code: 'BRL',
      symbol: 'R$',
      name: 'Brazilian Real',
      country: 'Brazil',
      unitBaseline: 480,
      downtimeHourlyRate: 6800,
      scrapUnitCost: 250,
      powerTariff: 0.80,
      powerTariffLabel: 'R$0.80 / kWh',
      fxRate: 5.75,
    };
  }

  // 14. Sweden (SEK kr)
  if (loc.includes('sweden') || loc.includes('stockholm') || loc.includes('gothenburg') || id.includes('se-')) {
    return {
      code: 'SEK',
      symbol: 'kr',
      name: 'Swedish Krona',
      country: 'Sweden',
      unitBaseline: 920,
      downtimeHourlyRate: 13000,
      scrapUnitCost: 490,
      powerTariff: 1.80,
      powerTariffLabel: '1.80 kr / kWh',
      fxRate: 10.8,
    };
  }

  // 15. Poland (PLN zł)
  if (loc.includes('poland') || loc.includes('warsaw') || loc.includes('krakow') || id.includes('pl-')) {
    return {
      code: 'PLN',
      symbol: 'zł',
      name: 'Polish Zloty',
      country: 'Poland',
      unitBaseline: 350,
      downtimeHourlyRate: 4900,
      scrapUnitCost: 185,
      powerTariff: 0.95,
      powerTariffLabel: '0.95 zł / kWh',
      fxRate: 4.10,
    };
  }

  // 16. Turkey (TRY ₺)
  if (loc.includes('turkey') || loc.includes('türkiye') || loc.includes('istanbul') || loc.includes('bursa') || id.includes('tr-')) {
    return {
      code: 'TRY',
      symbol: '₺',
      name: 'Turkish Lira',
      country: 'Turkey',
      unitBaseline: 2900,
      downtimeHourlyRate: 41000,
      scrapUnitCost: 1550,
      powerTariff: 3.80,
      powerTariffLabel: '₺3.80 / kWh',
      fxRate: 34.5,
    };
  }

  // 17. UAE (AED AED)
  if (loc.includes('uae') || loc.includes('emirates') || loc.includes('dubai') || loc.includes('abu dhabi')) {
    return {
      code: 'AED',
      symbol: 'AED',
      name: 'UAE Dirham',
      country: 'United Arab Emirates',
      unitBaseline: 312,
      downtimeHourlyRate: 4400,
      scrapUnitCost: 165,
      powerTariff: 0.44,
      powerTariffLabel: 'AED 0.44 / kWh',
      fxRate: 3.67,
    };
  }

  // 18. Saudi Arabia (SAR SAR)
  if (loc.includes('saudi') || loc.includes('riyadh') || loc.includes('jeddah')) {
    return {
      code: 'SAR',
      symbol: 'SAR',
      name: 'Saudi Riyal',
      country: 'Saudi Arabia',
      unitBaseline: 318,
      downtimeHourlyRate: 4500,
      scrapUnitCost: 170,
      powerTariff: 0.38,
      powerTariffLabel: 'SAR 0.38 / kWh',
      fxRate: 3.75,
    };
  }

  // 19. Thailand (THB ฿)
  if (loc.includes('thailand') || loc.includes('bangkok') || loc.includes('rayong')) {
    return {
      code: 'THB',
      symbol: '฿',
      name: 'Thai Baht',
      country: 'Thailand',
      unitBaseline: 3000,
      downtimeHourlyRate: 42000,
      scrapUnitCost: 1600,
      powerTariff: 4.60,
      powerTariffLabel: '฿4.60 / kWh',
      fxRate: 35.0,
    };
  }

  // 20. Vietnam (VND ₫)
  if (loc.includes('vietnam') || loc.includes('hanoi') || loc.includes('ho chi minh')) {
    return {
      code: 'VND',
      symbol: '₫',
      name: 'Vietnamese Dong',
      country: 'Vietnam',
      unitBaseline: 2150000,
      downtimeHourlyRate: 30000000,
      scrapUnitCost: 1150000,
      powerTariff: 2000,
      powerTariffLabel: '2,000 ₫ / kWh',
      fxRate: 25400.0,
    };
  }

  // 21. Indonesia (IDR Rp)
  if (loc.includes('indonesia') || loc.includes('jakarta') || loc.includes('cikarang')) {
    return {
      code: 'IDR',
      symbol: 'Rp',
      name: 'Indonesian Rupiah',
      country: 'Indonesia',
      unitBaseline: 1350000,
      downtimeHourlyRate: 19000000,
      scrapUnitCost: 720000,
      powerTariff: 1500,
      powerTariffLabel: 'Rp 1,500 / kWh',
      fxRate: 16000.0,
    };
  }

  // 22. Malaysia (MYR RM)
  if (loc.includes('malaysia') || loc.includes('kuala lumpur') || loc.includes('penang')) {
    return {
      code: 'MYR',
      symbol: 'RM',
      name: 'Malaysian Ringgit',
      country: 'Malaysia',
      unitBaseline: 380,
      downtimeHourlyRate: 5400,
      scrapUnitCost: 200,
      powerTariff: 0.50,
      powerTariffLabel: 'RM 0.50 / kWh',
      fxRate: 4.45,
    };
  }

  // 23. Philippines (PHP ₱)
  if (loc.includes('philippines') || loc.includes('manila') || loc.includes('cebu') || loc.includes('laguna')) {
    return {
      code: 'PHP',
      symbol: '₱',
      name: 'Philippine Peso',
      country: 'Philippines',
      unitBaseline: 4900,
      downtimeHourlyRate: 69000,
      scrapUnitCost: 2600,
      powerTariff: 11.0,
      powerTariffLabel: '₱11.0 / kWh',
      fxRate: 58.0,
    };
  }

  // 24. South Africa (ZAR R)
  if (loc.includes('south africa') || loc.includes('johannesburg') || loc.includes('durban')) {
    return {
      code: 'ZAR',
      symbol: 'R',
      name: 'South African Rand',
      country: 'South Africa',
      unitBaseline: 1550,
      downtimeHourlyRate: 22000,
      scrapUnitCost: 820,
      powerTariff: 2.80,
      powerTariffLabel: 'R 2.80 / kWh',
      fxRate: 18.2,
    };
  }

  // 25. Default / Americas: United States (USD $)
  return {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    country: 'United States',
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
  decimals?: number
): string {
  const dec = decimals !== undefined
    ? decimals
    : (currency.code === 'JPY' || currency.code === 'KRW' || currency.code === 'VND' || currency.code === 'IDR' || currency.code === 'INR' ? 0 : 2);

  return `${currency.symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  })}`;
}
