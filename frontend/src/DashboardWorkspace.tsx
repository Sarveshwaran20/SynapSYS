import { Suspense, lazy, useState, useEffect, useCallback, useMemo, useId, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { GeoLocationData } from './GeoMapAssist';
import { SynapsysLogo } from './SynapsysLogo';
import { RomanMedallion } from './MotionComponents';
import { useDynamicFavicon } from './lib/favicon';
import {
  DEFAULT_FIREBASE_STATUS,
  fetchFirebaseStatus,
  type FirebaseConnectionStatus,
} from './lib/firebase';
import { dur, ease, useDocumentVisible } from './lib/motion';
import {
  Reveal,
  RevealGroup,
  RevealItem,
  RevealText,
  RevealWords,
  AnimatedNumber,
  SpotlightCard,
  GrowBar,
  StatusDot,
  MeanderDivider,
  SlidingTabGroup,
  SlidingTabIndicator,
  SlidingTabContent,
  PipelineFlow,
  ScrollProgressBar,
  MotionButton,
  MotionModal,
  MotionDrawer,
  MotionPopover,
  MotionToast,
  MotionTableBody,
  MotionTableRow,
  MotionSparklinePath,
  RadialGauge,
  ChunkPanelFallback,
} from './components/motion';
import {
  DashboardResponse,
  MachineDashboardState,
  AlarmEvent,
  CopilotMessage,
  DetailedWorkOrder,
  ProductionSite,
  UserProfile,
} from './types';
import { getCurrencyForSite, SiteCurrency } from './lib/currency';
import { MANUFACTURING_HUBS } from './lib/manufacturingHubs';
import { SingularityBackdrop } from './components/dashboard/SingularityBackdrop';

const LazyGeoMapAssist = lazy(() => import('./GeoMapAssist'));
const LazyDigitalTwinFloor = lazy(() =>
  import('./components/twin/DigitalTwinFloor').then((m) => ({
    default: m.DigitalTwinFloor,
  }))
);
const LazyFleetScopeDeck = lazy(() =>
  import('./components/dashboard/FleetScopeDeck').then((m) => ({
    default: m.FleetScopeDeck,
  }))
);
const LazyOeeWaterfallCard = lazy(() =>
  import('./components/dashboard/OeeWaterfallCard').then((m) => ({
    default: m.OeeWaterfallCard,
  }))
);
const LazyFirebaseCloudPanel = lazy(() =>
  import('./components/dashboard/FirebaseCloudPanel').then((m) => ({
    default: m.FirebaseCloudPanel,
  }))
);
const LazyInventoryManagementDeck = lazy(() =>
  import('./components/dashboard/InventoryManagementDeck').then((m) => ({
    default: m.InventoryManagementDeck,
  }))
);
const LazyAcousticResonanceLab = lazy(() =>
  import('./components/dashboard/AcousticResonanceLab').then((m) => ({
    default: m.AcousticResonanceLab,
  }))
);

// Initial baseline data for immediate presentation
const INITIAL_DASHBOARD: DashboardResponse = {
  summary: {
    overall_plant_oee: 89.4,
    overall_availability: 93.2,
    overall_performance: 97.5,
    overall_quality: 98.4,
    total_output: 184,
    total_target: 910,
    total_good: 181,
    total_scrap: 3,
    total_machines: 3,
    running_machines: 2,
    idle_machines: 1,
    down_machines: 0,
    active_alarms_count: 1,
    last_updated: new Date().toISOString(),
    takt_time_sec: 12.0,
    mean_line_speed_sec: 12.4,
    shift_name: 'Shift 1 (Day)',
    shift_elapsed_pct: 68.0,
    energy: {
      total_power_kw: 79.3,
      specific_energy_kwh_per_unit: 0.43,
      carbon_intensity_gco2_per_unit: 165.5,
      energy_cost_usd: 69.78,
      green_energy_pct: 44.5,
    },
    financial_roi: {
      revenue_generated_usd: 27880.0,
      downtime_cost_usd: 435.67,
      scrap_waste_cost_usd: 135.0,
      net_shift_value_usd: 27309.33,
      potential_savings_usd: 390.0,
      currency_symbol: '$',
      currency_code: 'USD',
      unit_baseline: 85,
      downtime_hourly_rate: 1200,
      scrap_unit_cost: 45,
    },
  },
  machines: [
    {
      machine_id: 'CNC-101',
      machine_name: '5-Axis CNC Milling Center',
      site_id: 'synapsys-mfg-prod-us',
      status: 'Running',
      timestamp: new Date().toISOString(),
      location: 'Bay 02 - Machining Cell A',
      operator: 'K. Miller [Shift 1]',
      output_count: 899,
      target_output: 250,
      good_count: 871,
      scrap_count: 28,
      cycle_time_sec: 12.1,
      ideal_cycle_time_sec: 12.0,
      uptime_seconds: 10840.0,
      downtime_seconds: 180.0,
      oee_metrics: {
        availability: 0.970,
        performance: 0.922,
        quality: 0.969,
        oee: 0.866,
        oee_percentage: 86.6,
        benchmark_status: 'World-Class',
      },
      active_alarm: null,
      alarm_severity: 'None',
      alarm_acknowledged: false,
      alarm_duration_sec: 0,
      recent_cycle_times: [12.1, 12.3, 11.9, 12.4, 12.0, 12.2, 12.1, 12.1],
      sensors: {
        temperature_c: 53.7,
        vibration_mm_s: 1.45,
        power_kw: 24.1,
        pressure_bar: 6.4,
      },
      predictive: {
        anomaly_score: 14.5,
        health_status: 'Optimal',
        remaining_useful_life_hrs: 280,
        component_at_risk: 'Spindle Ceramic Bearings',
        root_cause_analysis: 'Harmonic vibration nominal. Spindle operating within 99.4% confidence interval.',
      },
      work_order: {
        order_id: 'WO-84920',
        part_number: 'PN-4820-T6',
        part_name: 'Aerospace Turbine Impeller',
        customer: 'Pratt & Whitney Aerostructures',
        batch_target: 250,
        batch_completed: 899,
        start_time: '06:00 UTC',
        estimated_completion: '13:30 UTC',
      },
      losses: {
        equipment_failure_sec: 12.0,
        setup_adjustment_sec: 8.0,
        idling_minor_stops_sec: 12.0,
        reduced_speed_sec: 14.4,
        process_defects_units: 1,
        startup_rejects_units: 0,
      },
    },
    {
      machine_id: 'INJ-202',
      machine_name: 'Hydraulic Injection Press',
      site_id: 'synapsys-mfg-prod-us',
      status: 'Running',
      timestamp: new Date().toISOString(),
      location: 'Bay 04 - Polymers Line',
      operator: 'T. Vance [Shift 1]',
      output_count: 1488,
      target_output: 500,
      good_count: 1451,
      scrap_count: 37,
      cycle_time_sec: 6.7,
      ideal_cycle_time_sec: 6.5,
      uptime_seconds: 9940.0,
      downtime_seconds: 140.0,
      oee_metrics: {
        availability: 0.973,
        performance: 0.838,
        quality: 0.976,
        oee: 0.797,
        oee_percentage: 79.7,
        benchmark_status: 'Acceptable',
      },
      active_alarm: null,
      alarm_severity: 'None',
      alarm_acknowledged: false,
      alarm_duration_sec: 0,
      recent_cycle_times: [6.4, 6.7, 6.5, 6.6, 6.5, 6.8, 6.7],
      sensors: {
        temperature_c: 53.3,
        vibration_mm_s: 1.59,
        power_kw: 24.4,
        pressure_bar: 142.0,
      },
      predictive: {
        anomaly_score: 16.2,
        health_status: 'Optimal',
        remaining_useful_life_hrs: 340,
        component_at_risk: 'Platen Proportional Valve',
        root_cause_analysis: 'Hydraulic pressure profile stable. Oil viscosity and temperature nominal.',
      },
      work_order: {
        order_id: 'WO-84921',
        part_number: 'PN-9104-ABS',
        part_name: 'Automotive Sensor Housing',
        customer: 'Apex Precision Assembly',
        batch_target: 500,
        batch_completed: 1488,
        start_time: '06:00 UTC',
        estimated_completion: '12:45 UTC',
      },
      losses: {
        equipment_failure_sec: 0.0,
        setup_adjustment_sec: 10.0,
        idling_minor_stops_sec: 12.0,
        reduced_speed_sec: 8.4,
        process_defects_units: 1,
        startup_rejects_units: 0,
      },
    },
    {
      machine_id: 'WLD-303',
      machine_name: 'Robotic Arc Welding Cell',
      site_id: 'synapsys-mfg-prod-us',
      status: 'Running',
      timestamp: new Date().toISOString(),
      location: 'Bay 01 - Fabrication Cell C',
      operator: 'A. Chen [Shift 1]',
      output_count: 510,
      target_output: 160,
      good_count: 504,
      scrap_count: 6,
      cycle_time_sec: 16.2,
      ideal_cycle_time_sec: 18.0,
      uptime_seconds: 8260.0,
      downtime_seconds: 90.0,
      oee_metrics: {
        availability: 0.982,
        performance: 0.948,
        quality: 0.982,
        oee: 0.900,
        oee_percentage: 90.0,
        benchmark_status: 'World-Class',
      },
      active_alarm: null,
      alarm_severity: 'None',
      alarm_acknowledged: false,
      alarm_duration_sec: 0,
      recent_cycle_times: [16.2, 16.0, 16.3, 16.1, 16.2, 16.4],
      sensors: {
        temperature_c: 53.1,
        vibration_mm_s: 1.78,
        power_kw: 24.5,
        pressure_bar: 5.8,
      },
      predictive: {
        anomaly_score: 18.0,
        health_status: 'Optimal',
        remaining_useful_life_hrs: 210,
        component_at_risk: 'Wire Feeder Drive Rollers',
        root_cause_analysis: 'Wire feeder tension optimal. Continuous arc stability maintained.',
      },
      work_order: {
        order_id: 'WO-84922',
        part_number: 'PN-3108-CH',
        part_name: 'Structural Chassis Subframe',
        customer: 'Ford EV Platform Group',
        batch_target: 160,
        batch_completed: 510,
        start_time: '06:00 UTC',
        estimated_completion: '14:15 UTC',
      },
      losses: {
        equipment_failure_sec: 0.0,
        setup_adjustment_sec: 12.0,
        idling_minor_stops_sec: 15.0,
        reduced_speed_sec: 5.2,
        process_defects_units: 1,
        startup_rejects_units: 0,
      },
    },
    {
      machine_id: 'BAT-404',
      machine_name: 'Ultrasonic Battery Tab Welder',
      site_id: 'synapsys-mfg-prod-us',
      status: 'Running',
      timestamp: new Date().toISOString(),
      location: 'Bay 03 - Pack Assembly Cell D',
      operator: 'D. Kowalski [Shift 1]',
      output_count: 388,
      target_output: 400,
      good_count: 382,
      scrap_count: 6,
      cycle_time_sec: 8.6,
      ideal_cycle_time_sec: 8.5,
      uptime_seconds: 3340.0,
      downtime_seconds: 45.0,
      oee_metrics: {
        availability: 0.986,
        performance: 0.978,
        quality: 0.984,
        oee: 0.949,
        oee_percentage: 94.9,
        benchmark_status: 'World-Class',
      },
      active_alarm: null,
      alarm_severity: 'None',
      alarm_acknowledged: false,
      alarm_duration_sec: 0,
      recent_cycle_times: [8.5, 8.6, 8.4, 8.7, 8.6, 8.5],
      sensors: {
        temperature_c: 44.2,
        vibration_mm_s: 0.88,
        power_kw: 14.1,
        pressure_bar: 5.4,
      },
      predictive: {
        anomaly_score: 9.4,
        health_status: 'Optimal',
        remaining_useful_life_hrs: 420,
        component_at_risk: 'Sonotrode Horn & Transducer',
        root_cause_analysis: 'Acoustic impedance within 0.2% calibration window. Weld energy uniform.',
      },
      work_order: {
        order_id: 'WO-84923',
        part_number: 'PN-4680-MOD',
        part_name: '4680 Cylindrical Battery Cell Module',
        customer: 'Rivian Fleet Systems',
        batch_target: 400,
        batch_completed: 388,
        start_time: '06:00 UTC',
        estimated_completion: '14:00 UTC',
      },
      losses: {
        equipment_failure_sec: 0.0,
        setup_adjustment_sec: 5.0,
        idling_minor_stops_sec: 8.0,
        reduced_speed_sec: 2.1,
        process_defects_units: 1,
        startup_rejects_units: 0,
      },
    },
  ],
  active_alarms: [],
  connectors: [
    {
      id: 'opc_ua_client',
      name: 'OPC-UA Client Driver (IEC 62541)',
      protocol: 'OPC-UA',
      endpoint: 'opc.tcp://192.168.1.120:4840',
      status: 'Connected',
      packet_rate_hz: 2.0,
      last_heartbeat: 'Live (Subscribed)',
      nodes_mapped: 48,
      security_policy: 'Basic256Sha256 / SignAndEncrypt',
    },
    {
      id: 'mqtt_sparkplug',
      name: 'MQTT Sparkplug B Edge Broker',
      protocol: 'MQTT-SparkplugB',
      endpoint: 'mqtt://edge-gateway.local:1883/spBv1.0/DetroitSite04',
      status: 'Connected',
      packet_rate_hz: 1.0,
      last_heartbeat: 'Live (Subscribed)',
      nodes_mapped: 32,
      security_policy: 'TLS 1.3 / Certificate M-TLS',
    },
    {
      id: 'rest_webhook',
      name: 'REST Ingestion Webhook Gateway',
      protocol: 'REST-Webhook',
      endpoint: 'http://0.0.0.0:8000/api/telemetry',
      status: 'Connected',
      packet_rate_hz: 0.5,
      last_heartbeat: 'Active (201 OK)',
      nodes_mapped: 18,
      security_policy: 'Bearer Token / X-API-Key Auth',
    },
    {
      id: 'modbus_tcp',
      name: 'Modbus TCP Remote IO Gateway',
      protocol: 'Modbus-TCP',
      endpoint: 'tcp://192.168.1.150:502',
      status: 'Standby',
      packet_rate_hz: 0.0,
      last_heartbeat: 'Standby',
      nodes_mapped: 12,
      security_policy: 'Standard Industrial Ethernet',
    },
  ],
};

// ---------------------------------------------------------------------------
// Multi-Site Realistic Fleet Machinery Registry & Fallback Provider
// ---------------------------------------------------------------------------

const STUTTGART_SITE_DATA: DashboardResponse = {
  site_id: 'synapsys-mfg-eu-frankfurt',
  site_name: 'Stuttgart Plant 02 (Automotive Body)',
  summary: {
    overall_plant_oee: 81.2,
    overall_availability: 94.8,
    overall_performance: 89.1,
    overall_quality: 96.2,
    total_output: 1490,
    total_target: 1490,
    total_good: 1442,
    total_scrap: 48,
    total_machines: 4,
    running_machines: 4,
    idle_machines: 0,
    down_machines: 0,
    active_alarms_count: 0,
    last_updated: new Date().toISOString(),
    takt_time_sec: 14.5,
    mean_line_speed_sec: 12.7,
    shift_name: 'Shift 1 (Day)',
    shift_elapsed_pct: 72.0,
    energy: {
      total_power_kw: 114.6,
      specific_energy_kwh_per_unit: 0.61,
      carbon_intensity_gco2_per_unit: 182.0,
      energy_cost_usd: 100.84,
      green_energy_pct: 62.0,
    },
    financial_roi: {
      revenue_generated_usd: 122570.0,
      downtime_cost_usd: 512.0,
      scrap_waste_cost_usd: 2160.0,
      net_shift_value_usd: 119898.0,
      potential_savings_usd: 1850.0,
      currency_symbol: '€',
      currency_code: 'EUR',
      unit_baseline: 78,
      downtime_hourly_rate: 1100,
      scrap_unit_cost: 42,
    },
  },
  machines: [
    {
      machine_id: 'PRS-101',
      machine_name: '2500T Servo Stamping Press',
      site_id: 'synapsys-mfg-eu-frankfurt',
      status: 'Running',
      timestamp: new Date().toISOString(),
      location: 'Bay A1 - Primary Body Line',
      operator: 'H. Weber [Shift 1]',
      output_count: 760,
      target_output: 800,
      good_count: 742,
      scrap_count: 18,
      cycle_time_sec: 5.3,
      ideal_cycle_time_sec: 5.2,
      uptime_seconds: 4028.0,
      downtime_seconds: 120.0,
      oee_metrics: {
        availability: 0.971,
        performance: 0.981,
        quality: 0.976,
        oee: 0.930,
        oee_percentage: 93.0,
        benchmark_status: 'World-Class',
      },
      active_alarm: null,
      alarm_severity: 'None',
      recent_cycle_times: [5.2, 5.3, 5.2, 5.4, 5.3, 5.2],
      sensors: {
        temperature_c: 62.4,
        vibration_mm_s: 2.12,
        power_kw: 48.6,
        pressure_bar: 220.0,
      },
      predictive: {
        anomaly_score: 17.5,
        health_status: 'Optimal',
        remaining_useful_life_hrs: 380,
        component_at_risk: 'Eccentric Drive Bushing',
        root_cause_analysis: 'Hydraulic ram counter-balance pressure within 1.5% design tolerance.',
      },
      work_order: {
        order_id: 'WO-92101',
        part_number: 'PN-ST-882',
        part_name: 'High-Strength Steel Roof Outer Panel',
        customer: 'Mercedes-Benz Group',
        batch_target: 800,
        batch_completed: 760,
        start_time: '06:00 UTC',
        estimated_completion: '13:45 UTC',
      },
      losses: {
        equipment_failure_sec: 0.0,
        setup_adjustment_sec: 14.0,
        idling_minor_stops_sec: 16.0,
        reduced_speed_sec: 7.2,
        process_defects_units: 2,
        startup_rejects_units: 0,
      },
    },
    {
      machine_id: 'ROB-204',
      machine_name: 'Dual-Arm Spot Welding Station',
      site_id: 'synapsys-mfg-eu-frankfurt',
      status: 'Running',
      timestamp: new Date().toISOString(),
      location: 'Bay A2 - Body-in-White Cell',
      operator: 'M. Schmidt [Shift 1]',
      output_count: 210,
      target_output: 220,
      good_count: 204,
      scrap_count: 6,
      cycle_time_sec: 14.7,
      ideal_cycle_time_sec: 14.5,
      uptime_seconds: 3087.0,
      downtime_seconds: 90.0,
      oee_metrics: {
        availability: 0.972,
        performance: 0.986,
        quality: 0.971,
        oee: 0.931,
        oee_percentage: 93.1,
        benchmark_status: 'World-Class',
      },
      active_alarm: null,
      alarm_severity: 'None',
      recent_cycle_times: [14.5, 14.8, 14.6, 14.7, 14.5, 14.6],
      sensors: {
        temperature_c: 48.2,
        vibration_mm_s: 1.34,
        power_kw: 32.1,
        pressure_bar: 6.2,
      },
      predictive: {
        anomaly_score: 12.0,
        health_status: 'Optimal',
        remaining_useful_life_hrs: 410,
        component_at_risk: 'MFDC Spot Inverter Transformer',
        root_cause_analysis: 'Electrode tip dressing current curve verified nominal.',
      },
      work_order: {
        order_id: 'WO-92102',
        part_number: 'PN-ST-904',
        part_name: 'Structural Side Aperture Assembly',
        customer: 'Porsche Motorsport',
        batch_target: 220,
        batch_completed: 210,
        start_time: '06:00 UTC',
        estimated_completion: '14:30 UTC',
      },
      losses: {
        equipment_failure_sec: 0.0,
        setup_adjustment_sec: 8.0,
        idling_minor_stops_sec: 11.0,
        reduced_speed_sec: 4.1,
        process_defects_units: 1,
        startup_rejects_units: 0,
      },
    },
    {
      machine_id: 'LAS-305',
      machine_name: '3D 5-Axis Fiber Laser Trimming Cell',
      site_id: 'synapsys-mfg-eu-frankfurt',
      status: 'Running',
      timestamp: new Date().toISOString(),
      location: 'Bay B1 - Finishing Line',
      operator: 'L. Fischer [Shift 1]',
      output_count: 335,
      target_output: 350,
      good_count: 324,
      scrap_count: 11,
      cycle_time_sec: 9.2,
      ideal_cycle_time_sec: 9.0,
      uptime_seconds: 3082.0,
      downtime_seconds: 80.0,
      oee_metrics: {
        availability: 0.975,
        performance: 0.978,
        quality: 0.967,
        oee: 0.922,
        oee_percentage: 92.2,
        benchmark_status: 'World-Class',
      },
      active_alarm: null,
      alarm_severity: 'None',
      recent_cycle_times: [9.1, 9.3, 9.0, 9.2, 9.2, 9.1],
      sensors: {
        temperature_c: 38.6,
        vibration_mm_s: 0.65,
        power_kw: 21.4,
        pressure_bar: 18.2,
      },
      predictive: {
        anomaly_score: 11.2,
        health_status: 'Optimal',
        remaining_useful_life_hrs: 490,
        component_at_risk: 'Fiber Optic Collimator Mirror',
        root_cause_analysis: 'Laser focal spot size and shield gas purity verified.',
      },
      work_order: {
        order_id: 'WO-92103',
        part_number: 'PN-ST-412',
        part_name: 'Hot-Stamped Boron Steel B-Pillars',
        customer: 'Audi AG',
        batch_target: 350,
        batch_completed: 335,
        start_time: '06:00 UTC',
        estimated_completion: '12:15 UTC',
      },
      losses: {
        equipment_failure_sec: 0.0,
        setup_adjustment_sec: 12.0,
        idling_minor_stops_sec: 8.0,
        reduced_speed_sec: 3.5,
        process_defects_units: 1,
        startup_rejects_units: 0,
      },
    },
    {
      machine_id: 'EDC-402',
      machine_name: 'Cathodic Electro-Dip Coating Tank',
      site_id: 'synapsys-mfg-eu-frankfurt',
      status: 'Running',
      timestamp: new Date().toISOString(),
      location: 'Bay C2 - Surface Coating Line',
      operator: 'K. Braun [Shift 1]',
      output_count: 115,
      target_output: 120,
      good_count: 112,
      scrap_count: 3,
      cycle_time_sec: 22.4,
      ideal_cycle_time_sec: 22.0,
      uptime_seconds: 2576.0,
      downtime_seconds: 70.0,
      oee_metrics: {
        availability: 0.974,
        performance: 0.982,
        quality: 0.974,
        oee: 0.932,
        oee_percentage: 93.2,
        benchmark_status: 'World-Class',
      },
      active_alarm: null,
      alarm_severity: 'None',
      recent_cycle_times: [22.1, 22.5, 22.4, 22.3, 22.5],
      sensors: {
        temperature_c: 29.4,
        vibration_mm_s: 0.92,
        power_kw: 12.5,
        pressure_bar: 3.8,
      },
      predictive: {
        anomaly_score: 14.0,
        health_status: 'Optimal',
        remaining_useful_life_hrs: 550,
        component_at_risk: 'Anolyte Recirculation Impeller',
        root_cause_analysis: 'Bath bath conductivity and solid resin concentration in equilibrium.',
      },
      work_order: {
        order_id: 'WO-92104',
        part_number: 'PN-ST-110',
        part_name: 'Anti-Corrosion E-Coat Primer Bath',
        customer: 'BMW Manufacturing',
        batch_target: 120,
        batch_completed: 115,
        start_time: '06:00 UTC',
        estimated_completion: '15:00 UTC',
      },
      losses: {
        equipment_failure_sec: 0.0,
        setup_adjustment_sec: 8.0,
        idling_minor_stops_sec: 14.0,
        reduced_speed_sec: 2.2,
        process_defects_units: 0,
        startup_rejects_units: 0,
      },
    },
  ],
  active_alarms: [],
  connectors: [
    {
      id: 'opc_ua_stuttgart',
      name: 'Siemens Industrial Edge OPC-UA Driver',
      protocol: 'OPC-UA',
      endpoint: 'opc.tcp://10.20.4.110:4840',
      status: 'Connected',
      packet_rate_hz: 2.5,
      last_heartbeat: 'Live (Subscribed)',
      nodes_mapped: 64,
      security_policy: 'Basic256Sha256 / SignAndEncrypt',
    },
    {
      id: 'mqtt_profinet_gateway',
      name: 'Profinet IRT / MQTT Sparkplug B Bridge',
      protocol: 'MQTT-SparkplugB',
      endpoint: 'mqtt://edge-stuttgart.local:1883/spBv1.0/Stuttgart02',
      status: 'Connected',
      packet_rate_hz: 2.0,
      last_heartbeat: 'Live (Subscribed)',
      nodes_mapped: 42,
      security_policy: 'TLS 1.3 / Certificate M-TLS',
    },
  ],
};

const YOKOHAMA_SITE_DATA: DashboardResponse = {
  site_id: 'synapsys-mfg-apac-tokyo',
  site_name: 'Yokohama Cell 01 (Precision Optics)',
  summary: {
    overall_plant_oee: 89.4,
    overall_availability: 97.6,
    overall_performance: 93.8,
    overall_quality: 97.7,
    total_output: 2560,
    total_target: 2560,
    total_good: 2518,
    total_scrap: 42,
    total_machines: 4,
    running_machines: 4,
    idle_machines: 0,
    down_machines: 0,
    active_alarms_count: 0,
    last_updated: new Date().toISOString(),
    takt_time_sec: 8.5,
    mean_line_speed_sec: 9.8,
    shift_name: 'Shift 1 (Day)',
    shift_elapsed_pct: 65.0,
    energy: {
      total_power_kw: 48.2,
      specific_energy_kwh_per_unit: 0.28,
      carbon_intensity_gco2_per_unit: 142.0,
      energy_cost_usd: 42.42,
      green_energy_pct: 51.8,
    },
    financial_roi: {
      revenue_generated_usd: 32734000.0,
      downtime_cost_usd: 35000.0,
      scrap_waste_cost_usd: 294000.0,
      net_shift_value_usd: 32405000.0,
      potential_savings_usd: 280000.0,
      currency_symbol: '¥',
      currency_code: 'JPY',
      unit_baseline: 13000,
      downtime_hourly_rate: 180000,
      scrap_unit_cost: 7000,
    },
  },
  machines: [
    {
      machine_id: 'OPT-101',
      machine_name: 'Ultra-Precision Diamond Turning Lathe',
      site_id: 'synapsys-mfg-apac-tokyo',
      status: 'Running',
      timestamp: new Date().toISOString(),
      location: 'Bay Alpha - Cleanroom ISO 5',
      operator: 'R. Takahashi [Shift 1]',
      output_count: 86,
      target_output: 90,
      good_count: 85,
      scrap_count: 1,
      cycle_time_sec: 35.4,
      ideal_cycle_time_sec: 35.0,
      uptime_seconds: 3044.0,
      downtime_seconds: 40.0,
      oee_metrics: {
        availability: 0.987,
        performance: 0.989,
        quality: 0.988,
        oee: 0.965,
        oee_percentage: 96.5,
        benchmark_status: 'World-Class',
      },
      active_alarm: null,
      alarm_severity: 'None',
      recent_cycle_times: [35.1, 35.5, 35.2, 35.4, 35.3],
      sensors: {
        temperature_c: 21.2,
        vibration_mm_s: 0.08,
        power_kw: 8.4,
        pressure_bar: 8.5,
      },
      predictive: {
        anomaly_score: 6.2,
        health_status: 'Optimal',
        remaining_useful_life_hrs: 720,
        component_at_risk: 'Aerostatic Air-Bearing Spindle',
        root_cause_analysis: 'Spindle axial runout < 12 nanometers. Cleanroom ISO 5 temperature 20.0°C ± 0.1°C.',
      },
      work_order: {
        order_id: 'WO-77301',
        part_number: 'PN-OPT-08',
        part_name: 'LiDAR Aspherical Fused Silica Lens',
        customer: 'Sony Imaging Systems',
        batch_target: 90,
        batch_completed: 86,
        start_time: '06:00 UTC',
        estimated_completion: '14:45 UTC',
      },
      losses: {
        equipment_failure_sec: 0.0,
        setup_adjustment_sec: 15.0,
        idling_minor_stops_sec: 5.0,
        reduced_speed_sec: 2.0,
        process_defects_units: 0,
        startup_rejects_units: 0,
      },
    },
    {
      machine_id: 'SMT-202',
      machine_name: 'High-Speed SMT Pick & Place System',
      site_id: 'synapsys-mfg-apac-tokyo',
      status: 'Running',
      timestamp: new Date().toISOString(),
      location: 'Bay Beta - Electronics Line 1',
      operator: 'Y. Tanaka [Shift 1]',
      output_count: 1180,
      target_output: 1200,
      good_count: 1162,
      scrap_count: 18,
      cycle_time_sec: 4.3,
      ideal_cycle_time_sec: 4.2,
      uptime_seconds: 5074.0,
      downtime_seconds: 60.0,
      oee_metrics: {
        availability: 0.988,
        performance: 0.977,
        quality: 0.985,
        oee: 0.951,
        oee_percentage: 95.1,
        benchmark_status: 'World-Class',
      },
      active_alarm: null,
      alarm_severity: 'None',
      recent_cycle_times: [4.2, 4.3, 4.2, 4.4, 4.3, 4.2],
      sensors: {
        temperature_c: 32.4,
        vibration_mm_s: 0.45,
        power_kw: 16.2,
        pressure_bar: -0.85,
      },
      predictive: {
        anomaly_score: 9.8,
        health_status: 'Optimal',
        remaining_useful_life_hrs: 450,
        component_at_risk: 'Rotary Vacuum Placement Nozzle',
        root_cause_analysis: 'Pickup vacuum pressure uniform across all 16 turret heads.',
      },
      work_order: {
        order_id: 'WO-77302',
        part_number: 'PN-ECU-77',
        part_name: 'Automotive Radar 77GHz Transceiver Board',
        customer: 'Denso Corporation',
        batch_target: 1200,
        batch_completed: 1180,
        start_time: '06:00 UTC',
        estimated_completion: '12:30 UTC',
      },
      losses: {
        equipment_failure_sec: 0.0,
        setup_adjustment_sec: 10.0,
        idling_minor_stops_sec: 8.0,
        reduced_speed_sec: 4.8,
        process_defects_units: 1,
        startup_rejects_units: 0,
      },
    },
    {
      machine_id: 'AOI-303',
      machine_name: '3D Automated Optical Inspector',
      site_id: 'synapsys-mfg-apac-tokyo',
      status: 'Running',
      timestamp: new Date().toISOString(),
      location: 'Bay Beta - QA Inspection Cell',
      operator: 'K. Sato [Shift 1]',
      output_count: 840,
      target_output: 850,
      good_count: 825,
      scrap_count: 15,
      cycle_time_sec: 6.1,
      ideal_cycle_time_sec: 6.0,
      uptime_seconds: 5124.0,
      downtime_seconds: 45.0,
      oee_metrics: {
        availability: 0.991,
        performance: 0.984,
        quality: 0.982,
        oee: 0.957,
        oee_percentage: 95.7,
        benchmark_status: 'World-Class',
      },
      active_alarm: null,
      alarm_severity: 'None',
      recent_cycle_times: [6.0, 6.2, 6.1, 6.0, 6.1, 6.2],
      sensors: {
        temperature_c: 24.6,
        vibration_mm_s: 0.22,
        power_kw: 6.8,
        pressure_bar: 5.0,
      },
      predictive: {
        anomaly_score: 8.1,
        health_status: 'Optimal',
        remaining_useful_life_hrs: 580,
        component_at_risk: 'Moiré Telecentric Projection Lens',
        root_cause_analysis: 'High-speed camera calibration and illumination LEDs within 99.8% stability.',
      },
      work_order: {
        order_id: 'WO-77303',
        part_number: 'PN-QA-44',
        part_name: 'Sub-Micron BGA Solder Joint Metrology',
        customer: 'Renesas Electronics',
        batch_target: 850,
        batch_completed: 840,
        start_time: '06:00 UTC',
        estimated_completion: '13:00 UTC',
      },
      losses: {
        equipment_failure_sec: 0.0,
        setup_adjustment_sec: 8.0,
        idling_minor_stops_sec: 6.0,
        reduced_speed_sec: 3.2,
        process_defects_units: 1,
        startup_rejects_units: 0,
      },
    },
    {
      machine_id: 'ENC-401',
      machine_name: 'Hermetic Ultrasonic Wire Bonder',
      site_id: 'synapsys-mfg-apac-tokyo',
      status: 'Running',
      timestamp: new Date().toISOString(),
      location: 'Bay Gamma - Micro-Packaging Cell',
      operator: 'H. Nakamura [Shift 1]',
      output_count: 410,
      target_output: 420,
      good_count: 402,
      scrap_count: 8,
      cycle_time_sec: 11.2,
      ideal_cycle_time_sec: 11.0,
      uptime_seconds: 4592.0,
      downtime_seconds: 50.0,
      oee_metrics: {
        availability: 0.989,
        performance: 0.982,
        quality: 0.980,
        oee: 0.952,
        oee_percentage: 95.2,
        benchmark_status: 'World-Class',
      },
      active_alarm: null,
      alarm_severity: 'None',
      recent_cycle_times: [11.0, 11.3, 11.1, 11.2, 11.1],
      sensors: {
        temperature_c: 28.1,
        vibration_mm_s: 0.35,
        power_kw: 9.2,
        pressure_bar: 4.8,
      },
      predictive: {
        anomaly_score: 10.4,
        health_status: 'Optimal',
        remaining_useful_life_hrs: 620,
        component_at_risk: 'Piezo Transducer Horn',
        root_cause_analysis: 'Wire loop tension and bond shear strength exceed MIL-STD-883 standards.',
      },
      work_order: {
        order_id: 'WO-77304',
        part_number: 'PN-MEMS-02',
        part_name: 'MEMS Inertial Measurement Unit Wire Loops',
        customer: 'Panasonic Avionics',
        batch_target: 420,
        batch_completed: 410,
        start_time: '06:00 UTC',
        estimated_completion: '14:15 UTC',
      },
      losses: {
        equipment_failure_sec: 0.0,
        setup_adjustment_sec: 12.0,
        idling_minor_stops_sec: 9.0,
        reduced_speed_sec: 2.8,
        process_defects_units: 1,
        startup_rejects_units: 0,
      },
    },
  ],
  active_alarms: [],
  connectors: [
    {
      id: 'fanuc_focas_yokohama',
      name: 'Fanuc FOCAS2 High-Precision CNC Gateway',
      protocol: 'OPC-UA',
      endpoint: 'opc.tcp://172.16.8.101:4840',
      status: 'Connected',
      packet_rate_hz: 3.0,
      last_heartbeat: 'Live (Subscribed)',
      nodes_mapped: 52,
      security_policy: 'Basic256Sha256 / SignAndEncrypt',
    },
    {
      id: 'mqtt_cleanroom_telemetry',
      name: 'Cleanroom Sensor Mesh & Sparkplug B Broker',
      protocol: 'MQTT-SparkplugB',
      endpoint: 'mqtt://edge-yokohama.local:1883/spBv1.0/Yokohama01',
      status: 'Connected',
      packet_rate_hz: 1.5,
      last_heartbeat: 'Live (Subscribed)',
      nodes_mapped: 28,
      security_policy: 'TLS 1.3 / Certificate M-TLS',
    },
  ],
};

function generateCustomSiteMockData(siteId: string, siteName: string = 'Production Facility', siteObj?: ProductionSite | null): DashboardResponse {
  const slug = siteId.replace('synapsys-mfg-', '').replace('site-', '').replace(/-/g, ' ').trim().toUpperCase();
  const prefix = siteId.split('-').pop()?.slice(0, 3).toUpperCase() || 'AST';
  const siteCur = getCurrencyForSite(siteObj || { id: siteId, name: siteName });
  const revGen = Math.round(1318 * siteCur.unitBaseline);
  const dtCost = Math.round((140 / 3600) * siteCur.downtimeHourlyRate * 100) / 100;
  const scrapCost = Math.round(32 * siteCur.scrapUnitCost);
  const netShift = Math.round((revGen - dtCost - scrapCost) * 100) / 100;

  return {
    site_id: siteId,
    site_name: siteName,
    summary: {
      overall_plant_oee: 87.5,
      overall_availability: 96.5,
      overall_performance: 92.8,
      overall_quality: 97.6,
      total_output: 1350,
      total_target: 1350,
      total_good: 1318,
      total_scrap: 32,
      total_machines: 3,
      running_machines: 3,
      idle_machines: 0,
      down_machines: 0,
      active_alarms_count: 0,
      last_updated: new Date().toISOString(),
      takt_time_sec: 12.0,
      mean_line_speed_sec: 10.5,
      shift_name: 'Shift 1 (Day)',
      shift_elapsed_pct: 70.0,
      energy: {
        total_power_kw: 68.5,
        specific_energy_kwh_per_unit: 0.42,
        carbon_intensity_gco2_per_unit: 155.0,
        energy_cost_usd: 58.20,
        green_energy_pct: 55.0,
      },
      financial_roi: {
        revenue_generated_usd: revGen,
        downtime_cost_usd: dtCost,
        scrap_waste_cost_usd: scrapCost,
        net_shift_value_usd: netShift,
        potential_savings_usd: Math.round((dtCost * 0.65 + scrapCost * 0.8) * 100) / 100,
        currency_symbol: siteCur.symbol,
        currency_code: siteCur.code,
        unit_baseline: siteCur.unitBaseline,
        downtime_hourly_rate: siteCur.downtimeHourlyRate,
        scrap_unit_cost: siteCur.scrapUnitCost,
      },
    },
    machines: [
      {
        machine_id: `${prefix}-101`,
        machine_name: 'High-Precision CNC Multi-Spindle Cell',
        site_id: siteId,
        status: 'Running',
        timestamp: new Date().toISOString(),
        location: 'Bay 01 - Primary Machining Area',
        operator: 'J. Reynolds [Shift 1]',
        output_count: 295,
        target_output: 300,
        good_count: 289,
        scrap_count: 6,
        cycle_time_sec: 13.6,
        ideal_cycle_time_sec: 13.5,
        uptime_seconds: 4012.0,
        downtime_seconds: 60.0,
        oee_metrics: {
          availability: 0.985,
          performance: 0.993,
          quality: 0.980,
          oee: 0.958,
          oee_percentage: 95.8,
          benchmark_status: 'World-Class',
        },
        active_alarm: null,
        alarm_severity: 'None',
        recent_cycle_times: [13.4, 13.6, 13.5, 13.7, 13.5],
        sensors: {
          temperature_c: 48.6,
          vibration_mm_s: 1.25,
          power_kw: 22.4,
          pressure_bar: 6.8,
        },
        predictive: {
          anomaly_score: 10.2,
          health_status: 'Optimal',
          remaining_useful_life_hrs: 410,
          component_at_risk: 'Drive Spindle Roller Bearing Stack',
          root_cause_analysis: 'Bearing harmonic frequencies verified nominal.',
        },
        work_order: {
          order_id: `WO-${prefix}-701`,
          part_number: `PN-${prefix}-01`,
          part_name: `Precision Subassembly Component (${slug})`,
          customer: `${slug} Partner Operations`,
          batch_target: 300,
          batch_completed: 295,
          start_time: '06:00 UTC',
          estimated_completion: '14:00 UTC',
        },
        losses: {
          equipment_failure_sec: 0.0,
          setup_adjustment_sec: 8.0,
          idling_minor_stops_sec: 12.0,
          reduced_speed_sec: 3.0,
          process_defects_units: 1,
          startup_rejects_units: 0,
        },
      },
      {
        machine_id: `${prefix}-202`,
        machine_name: 'Automated Robotic Fabrication Cell',
        site_id: siteId,
        status: 'Running',
        timestamp: new Date().toISOString(),
        location: 'Bay 02 - Assembly & Joining',
        operator: 'C. Morgan [Shift 1]',
        output_count: 440,
        target_output: 450,
        good_count: 428,
        scrap_count: 12,
        cycle_time_sec: 9.4,
        ideal_cycle_time_sec: 9.2,
        uptime_seconds: 4136.0,
        downtime_seconds: 80.0,
        oee_metrics: {
          availability: 0.981,
          performance: 0.979,
          quality: 0.973,
          oee: 0.934,
          oee_percentage: 93.4,
          benchmark_status: 'World-Class',
        },
        active_alarm: null,
        alarm_severity: 'None',
        recent_cycle_times: [9.2, 9.4, 9.3, 9.5, 9.3],
        sensors: {
          temperature_c: 42.1,
          vibration_mm_s: 1.15,
          power_kw: 28.5,
          pressure_bar: 5.9,
        },
        predictive: {
          anomaly_score: 11.5,
          health_status: 'Optimal',
          remaining_useful_life_hrs: 380,
          component_at_risk: 'Servo Harmonic Drive Reducer',
          root_cause_analysis: 'Robotic joint positional repeatability < 0.03 mm.',
        },
        work_order: {
          order_id: `WO-${prefix}-702`,
          part_number: `PN-${prefix}-02`,
          part_name: `Structural Frame Bracket (${slug})`,
          customer: `${slug} Partner Operations`,
          batch_target: 450,
          batch_completed: 440,
          start_time: '06:00 UTC',
          estimated_completion: '14:00 UTC',
        },
        losses: {
          equipment_failure_sec: 0.0,
          setup_adjustment_sec: 10.0,
          idling_minor_stops_sec: 14.0,
          reduced_speed_sec: 4.5,
          process_defects_units: 1,
          startup_rejects_units: 0,
        },
      },
      {
        machine_id: `${prefix}-303`,
        machine_name: 'Inline Automated Quality & Laser Metrology',
        site_id: siteId,
        status: 'Running',
        timestamp: new Date().toISOString(),
        location: 'Bay 03 - End-of-Line QA',
        operator: 'E. Davis [Shift 1]',
        output_count: 590,
        target_output: 600,
        good_count: 578,
        scrap_count: 12,
        cycle_time_sec: 7.2,
        ideal_cycle_time_sec: 7.0,
        uptime_seconds: 4248.0,
        downtime_seconds: 50.0,
        oee_metrics: {
          availability: 0.988,
          performance: 0.972,
          quality: 0.980,
          oee: 0.941,
          oee_percentage: 94.1,
          benchmark_status: 'World-Class',
        },
        active_alarm: null,
        alarm_severity: 'None',
        recent_cycle_times: [7.0, 7.3, 7.1, 7.2, 7.1],
        sensors: {
          temperature_c: 28.4,
          vibration_mm_s: 0.42,
          power_kw: 14.2,
          pressure_bar: 5.2,
        },
        predictive: {
          anomaly_score: 8.6,
          health_status: 'Optimal',
          remaining_useful_life_hrs: 510,
          component_at_risk: 'High-Resolution Laser Interferometer',
          root_cause_analysis: 'Laser optical calibration nominal.',
        },
        work_order: {
          order_id: `WO-${prefix}-703`,
          part_number: `PN-${prefix}-03`,
          part_name: `Certified Inspection Lot (${slug})`,
          customer: `${slug} Partner Operations`,
          batch_target: 600,
          batch_completed: 590,
          start_time: '06:00 UTC',
          estimated_completion: '14:00 UTC',
        },
        losses: {
          equipment_failure_sec: 0.0,
          setup_adjustment_sec: 6.0,
          idling_minor_stops_sec: 10.0,
          reduced_speed_sec: 3.1,
          process_defects_units: 1,
          startup_rejects_units: 0,
        },
      },
    ],
    active_alarms: [],
    connectors: [
      {
        id: `opc_ua_${prefix.toLowerCase()}`,
        name: `${slug} Plant Fieldbus OPC-UA`,
        protocol: 'OPC-UA',
        endpoint: `opc.tcp://192.168.10.10:4840`,
        status: 'Connected',
        packet_rate_hz: 2.0,
        last_heartbeat: 'Live (Subscribed)',
        nodes_mapped: 36,
        security_policy: 'Basic256Sha256 / SignAndEncrypt',
      },
    ],
  };
}

const COIMBATORE_SITE_DATA: DashboardResponse = {
  site_id: 'synapsys-mfg-in-coimbatore',
  site_name: 'Coimbatore Precision 01 (Precision Tooling & Motors)',
  summary: {
    overall_plant_oee: 88.2,
    overall_availability: 95.4,
    overall_performance: 94.1,
    overall_quality: 98.2,
    total_output: 418,
    total_target: 450,
    total_good: 412,
    total_scrap: 6,
    total_machines: 3,
    running_machines: 3,
    idle_machines: 0,
    down_machines: 0,
    active_alarms_count: 0,
    last_updated: new Date().toISOString(),
    takt_time_sec: 11.5,
    mean_line_speed_sec: 10.8,
    shift_name: 'Shift 1 (Day)',
    shift_elapsed_pct: 70.0,
    energy: {
      total_power_kw: 68.4,
      specific_energy_kwh_per_unit: 0.38,
      carbon_intensity_gco2_per_unit: 148.0,
      energy_cost_usd: 54.8,
      green_energy_pct: 58.5,
    },
    financial_roi: {
      revenue_generated_usd: 2966400.0,
      downtime_cost_usd: 1187.5,
      scrap_waste_cost_usd: 22800.0,
      net_shift_value_usd: 2942412.5,
      potential_savings_usd: 19000.0,
      currency_symbol: '₹',
      currency_code: 'INR',
      unit_baseline: 7200,
      downtime_hourly_rate: 95000,
      scrap_unit_cost: 3800,
    },
  },
  machines: [
    {
      machine_id: 'CBE-101',
      machine_name: '5-Axis Precision Vertical Machining Center',
      site_id: 'synapsys-mfg-in-coimbatore',
      status: 'Running',
      timestamp: new Date().toISOString(),
      location: 'Bay 01 - High-Precision Milling Line',
      operator: 'S. Ramanathan [Shift 1]',
      output_count: 148,
      target_output: 150,
      good_count: 146,
      scrap_count: 2,
      cycle_time_sec: 11.8,
      ideal_cycle_time_sec: 11.5,
      uptime_seconds: 5200.0,
      downtime_seconds: 35.0,
      oee_metrics: {
        availability: 0.985,
        performance: 0.965,
        quality: 0.986,
        oee: 0.938,
        oee_percentage: 93.8,
        benchmark_status: 'World-Class',
      },
      active_alarm: null,
      alarm_severity: 'None',
      alarm_acknowledged: false,
      alarm_duration_sec: 0,
      recent_cycle_times: [11.8, 11.6, 11.7, 11.9, 11.8],
      sensors: {
        temperature_c: 49.2,
        vibration_mm_s: 1.15,
        power_kw: 21.8,
        pressure_bar: 6.8,
      },
      predictive: {
        anomaly_score: 9.4,
        health_status: 'Optimal',
        remaining_useful_life_hrs: 480,
        component_at_risk: 'Spindle Roller Thrust Bearings',
        root_cause_analysis: 'Acoustic vibration nominal. Hydrodynamic lubrication within optimal ISO-VG68 bounds.',
      },
      work_order: {
        order_id: 'WO-CBE-701',
        part_number: 'PN-EV-ROTOR-55',
        part_name: 'Traction Motor High-Torque Rotor Shaft',
        customer: 'Ather Energy & Tata EV Powertrain',
        batch_target: 150,
        batch_completed: 148,
        start_time: '06:00 IST',
        estimated_completion: '14:00 IST',
      },
      losses: {
        equipment_failure_sec: 0.0,
        setup_adjustment_sec: 12.0,
        idling_minor_stops_sec: 8.0,
        reduced_speed_sec: 5.0,
        process_defects_units: 1,
        startup_rejects_units: 0,
      },
    },
    {
      machine_id: 'CBE-202',
      machine_name: 'Automated Sub-Micron Cylindrical Grinder',
      site_id: 'synapsys-mfg-in-coimbatore',
      status: 'Running',
      timestamp: new Date().toISOString(),
      location: 'Bay 02 - Micro-Finishing Cell',
      operator: 'M. Anand [Shift 1]',
      output_count: 140,
      target_output: 150,
      good_count: 138,
      scrap_count: 2,
      cycle_time_sec: 12.2,
      ideal_cycle_time_sec: 12.0,
      uptime_seconds: 5120.0,
      downtime_seconds: 40.0,
      oee_metrics: {
        availability: 0.980,
        performance: 0.955,
        quality: 0.985,
        oee: 0.922,
        oee_percentage: 92.2,
        benchmark_status: 'World-Class',
      },
      active_alarm: null,
      alarm_severity: 'None',
      alarm_acknowledged: false,
      alarm_duration_sec: 0,
      recent_cycle_times: [12.2, 12.1, 12.3, 12.2, 12.1],
      sensors: {
        temperature_c: 46.5,
        vibration_mm_s: 0.95,
        power_kw: 18.4,
        pressure_bar: 5.8,
      },
      predictive: {
        anomaly_score: 8.8,
        health_status: 'Optimal',
        remaining_useful_life_hrs: 520,
        component_at_risk: 'Diamond Dressing Roll',
        root_cause_analysis: 'Grinding wheel surface geometry calibrated. Dressing interval nominal.',
      },
      work_order: {
        order_id: 'WO-CBE-702',
        part_number: 'PN-HYD-SPOOL-12',
        part_name: 'Servo Proportional Valve Spool',
        customer: 'L&T Heavy Engineering',
        batch_target: 150,
        batch_completed: 140,
        start_time: '06:00 IST',
        estimated_completion: '14:30 IST',
      },
      losses: {
        equipment_failure_sec: 0.0,
        setup_adjustment_sec: 10.0,
        idling_minor_stops_sec: 10.0,
        reduced_speed_sec: 6.0,
        process_defects_units: 1,
        startup_rejects_units: 0,
      },
    },
    {
      machine_id: 'CBE-303',
      machine_name: 'Laser Precision Welder & Inspection Cell',
      site_id: 'synapsys-mfg-in-coimbatore',
      status: 'Running',
      timestamp: new Date().toISOString(),
      location: 'Bay 03 - Laser Cell',
      operator: 'V. Sundaram [Shift 1]',
      output_count: 130,
      target_output: 150,
      good_count: 128,
      scrap_count: 2,
      cycle_time_sec: 11.2,
      ideal_cycle_time_sec: 11.0,
      uptime_seconds: 5300.0,
      downtime_seconds: 25.0,
      oee_metrics: {
        availability: 0.990,
        performance: 0.970,
        quality: 0.984,
        oee: 0.945,
        oee_percentage: 94.5,
        benchmark_status: 'World-Class',
      },
      active_alarm: null,
      alarm_severity: 'None',
      alarm_acknowledged: false,
      alarm_duration_sec: 0,
      recent_cycle_times: [11.2, 11.1, 11.3, 11.2, 11.0],
      sensors: {
        temperature_c: 44.8,
        vibration_mm_s: 0.85,
        power_kw: 28.2,
        pressure_bar: 7.2,
      },
      predictive: {
        anomaly_score: 7.2,
        health_status: 'Optimal',
        remaining_useful_life_hrs: 600,
        component_at_risk: 'Beam Collimating Optics',
        root_cause_analysis: 'Laser cavity thermal stability verified. Optic transmission 99.8%.',
      },
      work_order: {
        order_id: 'WO-CBE-703',
        part_number: 'PN-BATT-BUSBAR-04',
        part_name: 'High-Current EV Battery Busbar Link',
        customer: 'Ola Electric Megaplant',
        batch_target: 150,
        batch_completed: 130,
        start_time: '06:00 IST',
        estimated_completion: '14:15 IST',
      },
      losses: {
        equipment_failure_sec: 0.0,
        setup_adjustment_sec: 8.0,
        idling_minor_stops_sec: 6.0,
        reduced_speed_sec: 4.0,
        process_defects_units: 1,
        startup_rejects_units: 0,
      },
    },
  ],
  active_alarms: [],
  connectors: [
    {
      id: 'opc_ua_cbe',
      name: 'Coimbatore Plant Fieldbus OPC-UA (Tamil Nadu)',
      protocol: 'OPC-UA',
      endpoint: 'opc.tcp://10.24.10.10:4840',
      status: 'Connected',
      packet_rate_hz: 2.0,
      last_heartbeat: 'Live (Subscribed)',
      nodes_mapped: 48,
      security_policy: 'Basic256Sha256 / SignAndEncrypt',
    },
  ],
};

function getMockDataForSite(siteId: string, siteName?: string, siteObj?: ProductionSite | null): DashboardResponse {
  if (siteId === 'synapsys-mfg-in-coimbatore') return COIMBATORE_SITE_DATA;
  if (siteId === 'synapsys-mfg-eu-frankfurt') return STUTTGART_SITE_DATA;
  if (siteId === 'synapsys-mfg-apac-tokyo') return YOKOHAMA_SITE_DATA;
  if (siteId === 'synapsys-mfg-prod-us') return INITIAL_DASHBOARD;
  return generateCustomSiteMockData(siteId, siteName, siteObj);
}

const DEFAULT_PRODUCTION_SITES: ProductionSite[] = [
  {
    id: 'synapsys-mfg-in-coimbatore',
    name: 'Coimbatore Precision 01 (Precision Tooling & Motors)',
    region: 'asia-south1',
    location: 'Coimbatore, Tamil Nadu, India',
    latitude: 11.0168,
    longitude: 76.9558,
    facility_type: 'Automotive Components, Precision Motors & Textile Machinery',
    active_lines: 10,
    target_capacity: 4500,
    nominal_oee: 88.2,
    status: 'active',
  },
  {
    id: 'synapsys-mfg-prod-us',
    name: 'Detroit Site 04 (Production Live)',
    region: 'us-east4',
    location: 'Detroit, MI, USA',
    latitude: 42.3314,
    longitude: -83.0458,
    facility_type: 'Automotive Powertrain & Battery Cell',
    active_lines: 12,
    target_capacity: 5000,
    nominal_oee: 86.5,
    status: 'active',
  },
  {
    id: 'synapsys-mfg-eu-frankfurt',
    name: 'Stuttgart Plant 02 (Automotive Body)',
    region: 'europe-west3',
    location: 'Stuttgart, Germany',
    latitude: 48.7758,
    longitude: 9.1829,
    facility_type: 'Precision Stamping & BiW Assembly',
    active_lines: 8,
    target_capacity: 3500,
    nominal_oee: 81.2,
    status: 'active',
  },
  {
    id: 'synapsys-mfg-apac-tokyo',
    name: 'Yokohama Cell 01 (Precision Optics)',
    region: 'asia-northeast1',
    location: 'Yokohama, Japan',
    latitude: 35.4437,
    longitude: 139.6380,
    facility_type: 'Semiconductor & Precision Optics',
    active_lines: 6,
    target_capacity: 2800,
    nominal_oee: 89.4,
    status: 'active',
  },
  {
    id: 'synapsys-mfg-uk-midlands',
    name: 'UK Midlands Plant 03 (Propulsion Systems)',
    region: 'europe-west2',
    location: 'Birmingham, West Midlands, UK',
    latitude: 52.4862,
    longitude: -1.8904,
    facility_type: 'Automotive Powertrain & Clean Propulsion',
    active_lines: 7,
    target_capacity: 3200,
    nominal_oee: 84.6,
    status: 'active',
  },
  {
    id: 'synapsys-mfg-sg-jurong',
    name: 'Jurong Cleanroom Fab 05 (Advanced Packaging)',
    region: 'asia-southeast1',
    location: 'Jurong, Singapore',
    latitude: 1.3329,
    longitude: 103.7436,
    facility_type: 'Semiconductor Fab & Cleanroom',
    active_lines: 5,
    target_capacity: 2200,
    nominal_oee: 91.5,
    status: 'active',
  },
  {
    id: 'synapsys-mfg-mx-monterrey',
    name: 'Monterrey Advanced Stamping 06 (Tier-1 Castings)',
    region: 'us-south1',
    location: 'Monterrey, Nuevo León, Mexico',
    latitude: 25.6866,
    longitude: -100.3161,
    facility_type: 'Precision Stamping & Tier-1 Heavy Castings',
    active_lines: 9,
    target_capacity: 4100,
    nominal_oee: 83.8,
    status: 'active',
  },
];

function Sparkline({ points, ideal }: { points: number[]; ideal: number }) {
  const uid = useId().replace(/:/g, '');
  const gradId = `spark-fill-${uid}`;
  if (!points || points.length < 2) return <div className="h-8 text-g-textMuted text-xs flex items-center">Awaiting data...</div>;

  const valid = points.filter((p) => p > 0);
  if (valid.length < 2) {
    return (
      <div className="h-8 flex items-center text-xs text-g-textMuted font-mono">
        Nominal
      </div>
    );
  }

  const w = 180;
  const h = 30;
  const p = 3;
  const min = Math.min(...valid, ideal * 0.94);
  const max = Math.max(...valid, ideal * 1.06);
  const rng = max - min || 1;

  const pts = valid.map((val, i) => {
    const x = p + (i / (valid.length - 1)) * (w - 2 * p);
    const y = h - p - ((val - min) / rng) * (h - 2 * p);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const idealY = (h - p - ((ideal - min) / rng) * (h - 2 * p)).toFixed(1);
  const pathD = `M ${pts.join(' L ')}`;

  const firstPt = pts[0].split(',');
  const firstX = Number(firstPt[0]);
  const lastPt = pts[pts.length - 1].split(',');
  const lastX = Number(lastPt[0]);
  const lastY = Number(lastPt[1]);
  const areaD = `${pathD} L ${lastX.toFixed(1)},${h} L ${firstX.toFixed(1)},${h} Z`;

  return (
    <div className="w-full h-8 flex items-center">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8 overflow-visible">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--g-blue)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--g-blue)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1={idealY} x2={w} y2={idealY} stroke="var(--g-border)" strokeDasharray="2 2" strokeWidth="1" />
        <path d={areaD} fill={`url(#${gradId})`} />
        <MotionSparklinePath d={pathD} stroke="var(--g-blue)" strokeWidth={1.75} />
        <circle cx={lastX} cy={lastY} r="4.8" fill="var(--g-blue)" fillOpacity="0.25" className="synapsys-core-pulse" />
        <circle cx={lastX} cy={lastY} r="2.3" fill="var(--g-blue)" />
      </svg>
    </div>
  );
}

const TUTORIAL_STEPS = [
  {
    stepNumber: 1,
    title: "Multi-Plant Operations & Facility Manager",
    subtitle: "Global Supervisory Control & Plant Provisioning",
    badge: "STEP 1 OF 6 // MULTI-SITE ARCHITECTURE",
    shortTitle: "1. Sites",
    actionTab: "overview",
    content:
      "SynapSYS provides unified supervisory management across distributed global manufacturing facilities. Operators can switch live telemetry context between regional production plants—such as Detroit Site 04, Stuttgart Plant 02, and Yokohama Cell 01—or dynamically commission brand new facilities with custom edge gateways.",
    howToUse:
      "Click the Facility pill in the top navigation bar (or from the Operations side drawer) to open the Multi-Plant Facility Manager. From there, select any active facility or click '+ Provision Site' to deploy a new plant with industry presets (e.g., Austin Gigafactory, Munich Press Shop, Singapore Semi Fab).",
    keyPoints: [
      "Dynamic Multi-Plant Switching: Synchronize live telemetry streams across regional cloud/edge gateways (us-east4, europe-west3, asia-northeast1).",
      "Facility Provisioning: Configure industry domains, active production lines, target shift capacity, and nominal target OEE.",
      "Global Context Awareness: Switching active facilities instantly re-scopes all floor twins, shift reports, and OEE calculations across the platform."
    ],
    proTip: "Use the quick deployment presets (Austin Gigafactory, Munich Press Shop, Singapore Semi Fab, Coimbatore Precision) to auto-fill industrial parameters in seconds."
  },
  {
    stepNumber: 2,
    title: "Executive KPI Benchmarking & ISO-22400 OEE",
    subtitle: "Mathematical Telemetry Model: Availability × Performance × Quality",
    badge: "STEP 2 OF 6 // ISO-22400 PERFORMANCE",
    shortTitle: "2. OEE & KPIs",
    actionTab: "overview",
    content:
      "At the top of the platform sits the Executive Performance Strip, calculating plant health every 2 seconds in full accordance with ISO-22400 standards. Overall Equipment Effectiveness (OEE) benchmarks production against the 85.0% World-Class manufacturing standard.",
    howToUse:
      "Click on ANY of the 4 executive KPI cards (Plant OEE, Output Cadence, Economic Net Yield, or Fleet Power) to launch dedicated deep-dive analytics modals with loss decomposition tables and sub-system electrical allocations.",
    keyPoints: [
      "Availability (93.2%): Quantifies active equipment uptime versus unplanned mechanical stoppages and tool changeover downtime.",
      "Performance (97.5%): Measures real-time machine cycle speed against engineered ideal cadence.",
      "Quality (98.4%): Evaluates first-pass conforming batch output against rejected scrap waste.",
      "Shift Economic Yield: Calculates gross revenue, scrap losses, and net shift financial ROI in real time."
    ],
    proTip: "Hover over any metric card to reveal the 'Inspect ↗' analytical link, providing loss distribution tables and electrical allocation diagrams."
  },
  {
    stepNumber: 3,
    title: "Machine Telemetry & Supervisory Controls",
    subtitle: "Real-Time Sensor Bus, Sparklines & Supervisory Controls",
    badge: "STEP 3 OF 6 // SENSOR BUS & CONTROLS",
    shortTitle: "3. Machines",
    actionTab: "overview",
    content:
      "Each machine card represents a physical work center streaming live high-frequency telemetry: spindle bearing temperatures, vibration velocity RMS, active power draw, and cycle duration sparklines. Color-coded status badges show Running (green), Standby (amber), or Down (red).",
    howToUse:
      "Click 'Inspect Asset ↗' or tap the machine card header to open the Supervisory Engineering Drawer. Here you can inspect hardware PLC models (Siemens S7, Fanuc, Allen-Bradley), IP subnet mappings, OPC-UA node IDs, and command safety interlocks.",
    keyPoints: [
      "Cycle Variance Sparkline: Real-time visual waveform showing historical cycle variance relative to engineered standard times.",
      "Remote Safety Interlocks: Safely trigger Emergency Stops (E-Stop) or clear latched faults directly from supervisory control.",
      "Inline Anomaly Alerts: High thermal or vibration excursions trigger visual alerts with direct links to the root-cause diagnostics."
    ],
    proTip: "Use the 'Sort by' dropdown above the fleet to triage machines by lowest OEE first, highest scrap rate, or heaviest power consumption."
  },
  {
    stepNumber: 4,
    title: "Digital Twin 2D Spatial Floor Layout",
    subtitle: "Physical Cell Mapping, AGV Corridors & Safety Zones",
    badge: "STEP 4 OF 6 // SPATIAL 2D DIGITAL TWIN",
    shortTitle: "4. Floor Twin",
    actionTab: "twin",
    content:
      "The Digital Twin tab visualizes the plant shop floor in an interactive vector schematic. Every physical work center is mapped to a dedicated production bay alongside automated conveyor corridors, autonomous guided vehicle (AGV) transit lanes, and safety perimeter interlocks.",
    howToUse:
      "Navigate to 'Digital Twin'. Click any machine bay to inspect its live PLC status, or click the clickable Work Order badge to see the active job. Click the dashed '+ Add asset' slot to commission a new physical work center to the floor.",
    keyPoints: [
      "100% Dynamic Synchronization: Any machine provisioned in Fleet Overview automatically renders on the Digital Twin floor layout.",
      "Interactive Asset Bays: Displays real-time operational status, thermal indicators, active job IDs, and operator designations.",
      "Mobile-Friendly Panning: On mobile devices, swipe horizontally across the floor map to inspect all machining bays and transport lanes."
    ],
    proTip: "Filter the floor map using the status legend or inspect bay telemetry directly from the side drawer."
  },
  {
    stepNumber: 5,
    title: "Industrial Field Connectors & Ingestion Modes",
    subtitle: "OPC-UA, Sparkplug B, Modbus TCP & Shift CSV Replay",
    badge: "STEP 5 OF 6 // PROTOCOL DRIVERS & INGESTION",
    shortTitle: "5. Ingestion",
    actionTab: "connectors",
    content:
      "SynapSYS ingests OT telemetry through industrial protocol drivers including OPC-UA (IEC 62541), MQTT Sparkplug B Edge Brokers, Modbus TCP, and REST Ingestion Webhooks. Operators can monitor packet rates, mapped node addresses, and mutual TLS encryption status.",
    howToUse:
      "Switch ingestion modes under Field Connectors. View connected drivers, toggle individual links, or provision new gateways. Click 'Replay Shift CSV' to stream authentic CNC shift logs.",
    keyPoints: [
      "Field Connectors Registry: Monitor packet rates in Hz, mapped industrial node tags, heartbeat status, and security certificates.",
      "Shift Dataset Replay: Replays authentic manufacturing shift logs with realistic tool wear, cycle variations, and thermal drifts.",
      "Raw CSV Ingestion Studio: Paste RFC-4180 telemetry logs from external historians to immediately recalculate ISO-22400 plant OEE."
    ],
    proTip: "Click 'Replay Shift CSV' from the More menu or Connectors tab to observe dynamic OEE recalculation from authentic machine telemetry records."
  },
  {
    stepNumber: 6,
    title: "ISA-18.2 Alarms, Reports & Copilot AI",
    subtitle: "Incident Triage, Certified Handover & Predictive AI",
    badge: "STEP 6 OF 6 // ISA-18.2 ALARMS & COPILOT",
    shortTitle: "6. Alarms & AI",
    actionTab: "alarms",
    content:
      "SynapSYS incorporates full ISA-18.2 alarm management with priority categorization (P1 Critical vs P2 Advisory). It includes an interactive Fault Simulator for drill training, a Certified Shift Handover Report (ISO-22400 / ISA-95), and an integrated Industrial Copilot for predictive maintenance forecasts.",
    howToUse:
      "Click 'Fault Simulator' in the More menu to simulate a spindle overheat or vibration anomaly. Navigate to 'Alarms' to acknowledge events. Click 'Shift report' to generate or print a certified handover summary, or open 'Copilot AI' to analyze bottlenecks.",
    keyPoints: [
      "ISA-18.2 Alarm Triage: Track fault timestamps, ISA codes (e.g. ALM-E204), failure durations, and record operator acknowledgments.",
      "Certified Shift Handover Report: 1-click generation of ISO-22400 handover documentation with CSV export and print-ready formatting.",
      "Industrial Copilot AI: Ask plain-language questions like 'Analyze our OEE bottlenecks' or 'Predict component wear and RUL'.",
      "Mobile Bottom Bar: On smartphones, use the bottom navigation bar for fast one-thumb switching across Fleet, Floor Twin, Orders, Alarms, and Copilot."
    ],
    proTip: "Query Copilot AI with 'Analyze our OEE bottlenecks today' for a root-cause breakdown based on real-time machine telemetry."
  }
];

const SHIFT_CONFIGS = {
  shift1: {
    id: 'shift1' as const,
    name: 'Day',
    label: 'Day Shift',
    hours: '06:00 – 14:00 UTC',
    supervisor: 'K. Miller',
    elapsedPct: 68,
    taktSec: 12.0,
    target: 3000,
  },
  shift2: {
    id: 'shift2' as const,
    name: 'Swing',
    label: 'Swing Shift',
    hours: '14:00 – 22:00 UTC',
    supervisor: 'E. Rostova',
    elapsedPct: 35,
    taktSec: 10.5,
    target: 3600,
  },
  shift3: {
    id: 'shift3' as const,
    name: 'Night',
    label: 'Night Shift',
    hours: '22:00 – 06:00 UTC',
    supervisor: 'K. Takahashi',
    elapsedPct: 15,
    taktSec: 14.0,
    target: 2400,
  },
};

export interface DashboardWorkspaceProps {
  currentUser: UserProfile;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onLogout: () => void | Promise<void>;
  onOpenShowcase: () => void;
}

export default function DashboardWorkspace({
  currentUser,
  isDarkMode,
  onToggleTheme,
  onLogout,
  onOpenShowcase,
}: DashboardWorkspaceProps) {
  // Multi-Plant Production Sites State
  const [productionSites, setProductionSites] = useState<ProductionSite[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('synapsys_production_sites');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        } catch {
          // ignore
        }
      }
    }
    return DEFAULT_PRODUCTION_SITES;
  });

  const [currentProject, setCurrentProject] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('synapsys_current_project');
      if (saved) return saved;
    }
    return 'synapsys-mfg-prod-us';
  });

  const activeSite = useMemo(() => {
    return productionSites.find((s) => s.id === currentProject) || productionSites[0] || DEFAULT_PRODUCTION_SITES[0];
  }, [productionSites, currentProject]);

  const siteCurrency: SiteCurrency = useMemo(() => {
    return getCurrencyForSite(activeSite);
  }, [activeSite]);

  const [data, setData] = useState<DashboardResponse>(() => {
    return getMockDataForSite(currentProject, activeSite?.name, activeSite);
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'connectors' | 'twin' | 'losses' | 'workorders' | 'alarms' | 'inventory' | 'acoustic_ai'>('overview');
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'idle' | 'down'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchActiveIndex, setSearchActiveIndex] = useState<number>(0);
  const [mobileSearchOpen, setMobileSearchOpen] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const [selectedMachine, setSelectedMachine] = useState<MachineDashboardState | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<DetailedWorkOrder | null>(null);
  const [selectedKpiModal, setSelectedKpiModal] = useState<'oee' | 'production' | 'financial' | 'energy' | null>(null);
  const [sortBy, setSortBy] = useState<'default' | 'oee_asc' | 'scrap_desc' | 'power_desc'>('default');
  const [showShiftReportModal, setShowShiftReportModal] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<string>('--:--:--');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [pollInterval, setPollInterval] = useState<number>(2000);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'cards' | 'health' | 'dense' | 'scope'>('cards');
  const [scopeFocusMachineId, setScopeFocusMachineId] = useState<string | null>(null);
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseConnectionStatus>(DEFAULT_FIREBASE_STATUS);
  const [activeShift, setActiveShift] = useState<'shift1' | 'shift2' | 'shift3'>('shift1');
  const [showEventPopover, setShowEventPopover] = useState<boolean>(false);
  const [eventLog, setEventLog] = useState<
    Array<{ id: string; label: string; category: string; tone: 'blue' | 'emerald' | 'amber' | 'rose'; time: string }>
  >([
    { id: 'evt-init-1', label: 'OPC-UA & Sparkplug B bus synchronized (250Hz)', category: 'Telemetry', tone: 'emerald', time: '00:00' },
    { id: 'evt-init-2', label: 'Shift 1 handover baseline locked · Target 1,250 units', category: 'Shift', tone: 'blue', time: '00:00' },
  ]);
  const pushEvent = useCallback(
    (label: string, category: string, tone: 'blue' | 'emerald' | 'amber' | 'rose' = 'blue') => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setEventLog((prev) => [
        { id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, label, category, tone, time: timeStr },
        ...prev,
      ].slice(0, 8));
    },
    []
  );
  const [showHotkeysModal, setShowHotkeysModal] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(10);
  const [showHarness, setShowHarness] = useState<boolean>(false);
  const [simulatedAlarms, setSimulatedAlarms] = useState<AlarmEvent[]>([]);
  const [showCopilot, setShowCopilot] = useState<boolean>(false);
  const [copilotInput, setCopilotInput] = useState<string>('');
  const [showVortexBg, setShowVortexBg] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('synapsys_vortex_bg');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });
  const [copilotLoading, setCopilotLoading] = useState<boolean>(false);
  const [csvIsLoading, setCsvIsLoading] = useState<boolean>(false);
  const [csvFeedback, setCsvFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [customCsvInput, setCustomCsvInput] = useState<string>('');
  const [showCsvModal, setShowCsvModal] = useState<boolean>(false);
  const [showAddMachineModal, setShowAddMachineModal] = useState<boolean>(false);
  const [showAddConnectorModal, setShowAddConnectorModal] = useState<boolean>(false);
  const [showAddWorkOrderModal, setShowAddWorkOrderModal] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(0);

  const [showAddSiteForm, setShowAddSiteForm] = useState<boolean>(false);
  const [isSubmittingSite, setIsSubmittingSite] = useState<boolean>(false);
  const [showMapAssist, setShowMapAssist] = useState<boolean>(false);
  const [facilityViewMode, setFacilityViewMode] = useState<'list' | 'radar_map'>('list');
  const [newSiteForm, setNewSiteForm] = useState({
    name: 'Austin Gigafactory 05',
    id: 'synapsys-mfg-us-austin',
    region: 'us-south1',
    location: 'Austin, TX, USA',
    latitude: 30.2672,
    longitude: -97.7431,
    facility_type: 'EV Powertrain & Battery Cell',
    active_lines: 10,
    target_capacity: 4500,
    nominal_oee: 88.0,
    status: 'active' as 'active' | 'commissioning' | 'standby',
  });

  useEffect(() => {
    if (!currentUser) return;
    const domain = currentUser.company_domain || 'synapsys.com';
    fetch(`/api/sites?company_domain=${encodeURIComponent(domain)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ProductionSite[] | null) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setProductionSites(data);
          if (!data.some((s) => s.id === currentProject)) {
            setCurrentProject(data[0].id);
          }
        }
      })
      .catch(() => { });
  }, [currentUser]);

  useEffect(() => {
    let active = true;
    fetchFirebaseStatus(false).then((next) => {
      if (active) setFirebaseStatus(next);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('synapsys_production_sites', JSON.stringify(productionSites));
  }, [productionSites]);

  useEffect(() => {
    const domain = currentUser?.company_domain || 'synapsys.com';
    fetch(`/api/sites?company_domain=${encodeURIComponent(domain)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((sites: ProductionSite[]) => {
        if (Array.isArray(sites) && sites.length > 0) {
          setProductionSites(sites);
          if (currentUser?.assigned_facility && sites.some((s) => s.id === currentUser.assigned_facility)) {
            setCurrentProject(currentUser.assigned_facility);
          } else if (!sites.some((s) => s.id === currentProject)) {
            setCurrentProject(sites[0].id);
          }
        }
      })
      .catch(() => {});
  }, [currentUser?.company_domain, currentUser?.assigned_facility]);

  useEffect(() => {
    localStorage.setItem('synapsys_current_project', currentProject);
    const target = productionSites.find((s) => s.id === currentProject);
    setData(getMockDataForSite(currentProject, target?.name, target));
  }, [currentProject, productionSites]);

  useEffect(() => {
    if (!csvFeedback) return;
    const timer = setTimeout(() => {
      setCsvFeedback(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [csvFeedback]);

  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState<boolean>(false);
  const [pendingConnectors, setPendingConnectors] = useState<Record<string, boolean>>({});
  const shouldReduce = useReducedMotion();
  const isDocVisible = useDocumentVisible();

  useEffect(() => {
    const onScroll = () => {
      setIsHeaderScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const unackedAlarmCount = data.active_alarms.filter((a) => !a.acknowledged).length;
  const hasStandbyAssets = data.machines.some((m) => m.status === 'Idle');
  useDynamicFavicon({
    enabled: true,
    mode: 'dashboard',
    status:
      unackedAlarmCount > 0
        ? 'critical'
        : hasStandbyAssets
        ? 'warning'
        : 'nominal',
    alarmCount: unackedAlarmCount,
    oeePct: data.summary.overall_plant_oee,
    isDarkMode,
  });

  const [newMachineForm, setNewMachineForm] = useState({
    machine_id: 'LSR-404',
    machine_name: 'Fiber Laser Cutting Cell',
    location: 'Bay 03 - Laser Fabrication',
    operator: 'M. Rodriguez [Shift 1]',
    ideal_cycle_time_sec: 14.0,
    target_output: 300,
    component: 'High-Power Laser Resonator & Optics',
    plc_controller: 'Siemens S7-1500F (PROFINET)',
    ip_address: '192.168.1.135',
    opc_node_id: 'ns=2;s=LSR404.LaserSource',
    order_id: 'WO-84928',
    part_number: 'PN-9940-SS',
    part_name: 'Laser Cut Impeller Baffle',
    customer: 'Apex Industrial Systems',
  });

  const [newConnectorForm, setNewConnectorForm] = useState({
    name: 'Allen-Bradley EtherNet/IP CIP Driver',
    protocol: 'OPC-UA' as 'OPC-UA' | 'MQTT-SparkplugB' | 'REST-Webhook' | 'Modbus-TCP',
    endpoint: 'opc.tcp://192.168.1.140:4840',
    security_policy: 'Basic256Sha256 / SignAndEncrypt',
    nodes_mapped: 24,
    packet_rate_hz: 1.0,
  });

  const [newWorkOrderForm, setNewWorkOrderForm] = useState({
    machine_id: 'CNC-101',
    order_id: 'WO-84935',
    part_number: 'PN-7821-TI',
    part_name: 'Titanium Rotor Hub',
    customer: 'Boeing Defense',
    batch_target: 350,
    start_time: '08:00 UTC',
    estimated_completion: '16:00 UTC',
  });
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'SynapSYS Industrial Copilot initialized. I have live telemetry context for the active manufacturing plant. Ask me about bottleneck diagnostics, predictive maintenance RUL, or shift yield.',
      timestamp: new Date().toLocaleTimeString(),
      citations: ['ISO-22400 Telemetry Bus', 'Nakajima Six Losses Model'],
    },
  ]);

  const fetchDashboardData = useCallback(async () => {
    const t0 = performance.now();
    const domain = currentUser?.company_domain || '';
    const qs = `site_id=${encodeURIComponent(currentProject)}&company_domain=${encodeURIComponent(domain)}`;
    try {
      let res: Response;
      try {
        res = await fetch(`/api/dashboard?${qs}`, { cache: 'no-store' });
      } catch {
        res = await fetch(`http://localhost:8000/api/dashboard?${qs}`, { cache: 'no-store' });
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: DashboardResponse = await res.json();
      setLatencyMs(Math.round(performance.now() - t0));

      // Filter for unacknowledged alarms only so cleared/acknowledged alarms disappear
      const unackBackendAlarms = (json.active_alarms || []).filter((a) => !a.acknowledged);
      const unackSimulated = simulatedAlarms.filter((s) => !s.acknowledged);
      const mergedAlarms = [...unackBackendAlarms];
      unackSimulated.forEach((sim) => {
        if (!mergedAlarms.some((a) => a.machine_id === sim.machine_id)) {
          mergedAlarms.push(sim);
        }
      });
      const updatedMachines = json.machines.map((m) => {
        const matchingSim = unackSimulated.find((s) => s.machine_id === m.machine_id);
        if (matchingSim) {
          return {
            ...m,
            status: matchingSim.severity === 'Critical' ? ('Down' as const) : ('Idle' as const),
            active_alarm: matchingSim.alarm,
            alarm_severity: matchingSim.severity,
            alarm_acknowledged: false,
          };
        }
        return m;
      });

      setData({
        ...json,
        machines: updatedMachines,
        active_alarms: mergedAlarms,
        summary: {
          ...json.summary,
          active_alarms_count: mergedAlarms.length,
          down_machines: updatedMachines.filter((m) => m.status === 'Down').length,
          idle_machines: updatedMachines.filter((m) => m.status === 'Idle').length,
          running_machines: updatedMachines.filter((m) => m.status === 'Running').length,
        },
      });
      setIsConnected(true);
      setLastSync(new Date().toLocaleTimeString('en-US', { hour12: false }));
    } catch {
      setIsConnected(false);
      // Fallback: If backend is unreachable or running offline, switch to the dedicated site fleet
      const mock = getMockDataForSite(currentProject, activeSite?.name, activeSite);
      const unackSimulated = simulatedAlarms.filter((s) => !s.acknowledged);
      const mergedAlarms = [...unackSimulated];
      const updatedMachines = mock.machines.map((m) => {
        const matchingAlarm = mergedAlarms.find((a) => a.machine_id === m.machine_id && !a.acknowledged);
        if (matchingAlarm) {
          return {
            ...m,
            status: matchingAlarm.severity === 'Critical' ? ('Down' as const) : ('Idle' as const),
            active_alarm: matchingAlarm.alarm,
            alarm_severity: matchingAlarm.severity,
            alarm_acknowledged: false,
          };
        }
        return m;
      });
      setData({
        ...mock,
        machines: updatedMachines,
        active_alarms: mergedAlarms,
        summary: {
          ...mock.summary,
          active_alarms_count: mergedAlarms.length,
          down_machines: updatedMachines.filter((m) => m.status === 'Down').length,
          idle_machines: updatedMachines.filter((m) => m.status === 'Idle').length,
          running_machines: updatedMachines.filter((m) => m.status === 'Running').length,
        },
      });
    }
  }, [currentProject, activeSite?.name, currentUser, simulatedAlarms]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    fetchDashboardData();
    if (!autoRefresh) return;
    const iv = setInterval(fetchDashboardData, pollInterval);
    return () => clearInterval(iv);
  }, [fetchDashboardData, autoRefresh, pollInterval, currentProject]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const targetNode = e.target as Node;
      const inDesktop = searchContainerRef.current?.contains(targetNode);
      const inMobile = mobileSearchContainerRef.current?.contains(targetNode);
      if (!inDesktop && !inMobile) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault();
        setIsSearchOpen(true);
        setSearchActiveIndex(0);
        if (searchInputRef.current && searchInputRef.current.offsetParent !== null) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        } else {
          setMobileSearchOpen(true);
          setTimeout(() => mobileSearchInputRef.current?.focus(), 20);
        }
        return;
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setMobileSearchOpen(false);
        setSelectedMachine(null);
        setSelectedWorkOrder(null);
        setSelectedKpiModal(null);
        setShowShiftReportModal(false);
        setShowAddMachineModal(false);
        setShowAddConnectorModal(false);
        setShowAddWorkOrderModal(false);
        setShowCsvModal(false);
        setShowProjectModal(false);
        setShowProfileModal(false);
        setShowTutorial(false);
        setShowHotkeysModal(false);
        setShowCopilot(false);
      } else if (e.key === '1') {
        setActiveTab('overview');
      } else if (e.key === '2') {
        setActiveTab('connectors');
      } else if (e.key === '3') {
        setActiveTab('twin');
      } else if (e.key === '4') {
        setActiveTab('losses');
      } else if (e.key === '5') {
        setActiveTab('workorders');
      } else if (e.key === '6') {
        setActiveTab('alarms');
      } else if (e.key === '7') {
        setActiveTab('inventory');
      } else if (e.key === ' ') {
        e.preventDefault();
        setAutoRefresh((prev) => !prev);
      } else if (e.key === '?') {
        setShowHotkeysModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleExportTelemetryCsv = () => {
    const headers = [
      'Machine ID',
      'Machine Name',
      'Status',
      'Location',
      'Operator',
      'OEE %',
      'Availability %',
      'Performance %',
      'Quality %',
      'Total Output',
      'Target Output',
      'Good Units',
      'Scrap Units',
      'Cycle Time (s)',
      'Ideal Cycle (s)',
      'Temp (°C)',
      'Vibration (mm/s)',
      'Power (kW)',
      'Active Alarm'
    ];
    const rows = data.machines.map((m) => [
      `"${m.machine_id}"`,
      `"${m.machine_name}"`,
      `"${m.status}"`,
      `"${m.location}"`,
      `"${m.operator}"`,
      m.oee_metrics?.oee_percentage?.toFixed(1) || '0',
      ((m.oee_metrics?.availability || 0) * 100).toFixed(1),
      ((m.oee_metrics?.performance || 0) * 100).toFixed(1),
      ((m.oee_metrics?.quality || 0) * 100).toFixed(1),
      m.output_count,
      m.target_output,
      m.good_count,
      m.scrap_count,
      m.cycle_time_sec,
      m.ideal_cycle_time_sec,
      m.sensors?.temperature_c || 0,
      m.sensors?.vibration_mm_s || 0,
      m.sensors?.power_kw || 0,
      `"${m.active_alarm || 'None'}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `synapsys_telemetry_snapshot_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    link.click();
  };

  const handleDispatchPreventiveOrder = (machine: MachineDashboardState) => {
    const comp = machine.predictive?.component_at_risk || 'Primary Spindle & Bearings';
    setNewWorkOrderForm({
      machine_id: machine.machine_id,
      order_id: `WO-PM-${machine.machine_id}-${Math.floor(100 + Math.random() * 900)}`,
      part_number: `PM-CAL-${machine.machine_id}`,
      part_name: `Preventive Maintenance: ${comp}`,
      customer: `Plant Reliability Engineering (${machine.location})`,
      batch_target: 1,
      start_time: 'Immediate',
      estimated_completion: '+2 hrs (Turnaround)',
    });
    setShowAddWorkOrderModal(true);
  };

  const handleOpenWorkOrder = async (orderId: string, fallbackMachineId?: string) => {
    try {
      let res = await fetch(`/api/workorders/${orderId}`);
      if (!res.ok) {
        res = await fetch(`http://localhost:8000/api/workorders/${orderId}`);
      }
      if (res.ok) {
        const json = await res.json();
        setSelectedWorkOrder(json);
        return;
      }
    } catch (e) {
      console.warn('Backend work order fetch fallback:', e);
    }

    // Client-side fallback if backend is unreachable
    const matchingMachine = data.machines.find(
      (m) => m.work_order?.order_id === orderId || m.machine_id === fallbackMachineId
    ) || data.machines[0];

    const wo = matchingMachine.work_order || {
      order_id: orderId,
      part_number: 'PN-4820-T6',
      part_name: 'Aerospace Turbine Impeller',
      customer: 'Pratt & Whitney Aerostructures',
      batch_target: matchingMachine.target_output || 250,
      batch_completed: matchingMachine.output_count || 214,
      start_time: '06:00 UTC',
      estimated_completion: '13:30 UTC'
    };

    const target = matchingMachine.target_output || 250;
    const completed = matchingMachine.output_count || 214;
    const good = matchingMachine.good_count || 208;
    const scrap = matchingMachine.scrap_count || 6;
    const unitPrice = orderId === 'WO-84920' ? 385 : orderId === 'WO-84921' ? 42.5 : 165;

    setSelectedWorkOrder({
      order_id: wo.order_id,
      machine_id: matchingMachine.machine_id,
      machine_name: matchingMachine.machine_name,
      location: matchingMachine.location || 'Bay 01',
      operator: matchingMachine.operator || 'Shift Operator',
      part_number: wo.part_number,
      part_name: wo.part_name,
      customer: wo.customer,
      batch_target: target,
      batch_completed: completed,
      good_count: good,
      scrap_count: scrap,
      first_pass_yield_pct: completed > 0 ? Number(((good / completed) * 100).toFixed(1)) : 100,
      start_time: wo.start_time,
      estimated_completion: wo.estimated_completion,
      material_spec: orderId === 'WO-84920' ? 'Ti-6Al-4V Grade 5 Aerospace Titanium' : orderId === 'WO-84921' ? 'PA66-GF30 Heat Stabilized Polymer (30% Glass)' : 'AISI 304L Structural Stainless Steel Tubing',
      cad_revision: orderId === 'WO-84920' ? 'DWG-84920-A (Rev D.4)' : orderId === 'WO-84921' ? 'DWG-9104-B (Rev B.1)' : 'DWG-3031-C (Rev E.2)',
      tolerance_class: orderId === 'WO-84920' ? 'ISO 2768-m (±0.012 mm)' : orderId === 'WO-84921' ? 'DIN 16901-130 (±0.05 mm)' : 'AWS D1.1 Structural (±0.25 mm)',
      unit_price_usd: unitPrice,
      total_order_value_usd: target * unitPrice,
      current_value_delivered_usd: good * unitPrice,
      scrap_cost_usd: scrap * unitPrice * 0.45,
      priority: orderId === 'WO-84920' ? 'High / Tier 1 Aerospace' : orderId === 'WO-84921' ? 'Standard Automotive OEM' : 'Critical Structural Tier 1',
      fai_status: orderId === 'WO-84920' ? 'AS9102 Rev C Approved' : orderId === 'WO-84921' ? 'PPAP Level 3 Validated' : 'AWS CWI Certified (#8942)',
      qa_inspector: orderId === 'WO-84920' ? 'E. Hoffman (QA Lead Metrology)' : orderId === 'WO-84921' ? 'R. Patel (Polymer Quality Tech)' : 'D. Zhang (Certified Welding Inspector)',
      routing_steps: [
        { step: 10, operation: 'Raw Material Billet Prep & Pre-Inspection', status: 'Completed', station: 'PREP-01', details: 'Ultrasonic integrity test passed' },
        { step: 20, operation: `Active CNC Production on ${matchingMachine.machine_name}`, status: 'In Progress', station: matchingMachine.machine_id, details: `Telemetry cycle nominal (${matchingMachine.cycle_time_sec.toFixed(1)}s)` },
        { step: 30, operation: 'Secondary Deburr & Precision Cleaning', status: 'Queued', station: 'WASH-02', details: '40kHz immersion tank' },
        { step: 40, operation: 'Zeiss CMM Coordinate Metrology & FAI Signoff', status: 'Queued', station: 'CMM-01', details: 'Inspection report signoff' },
      ]
    });
  };

  const handleExportShiftReportCsv = () => {
    const headers = ['Machine ID', 'Machine Name', 'Status', 'Location', 'Operator', 'OEE (%)', 'Availability (%)', 'Performance (%)', 'Quality (%)', 'Total Output', 'Good Count', 'Scrap Count', 'Temp (C)', 'Power (kW)', 'Vib RMS', 'Work Order', 'Part Name'];
    const rows = data.machines.map((m) => [
      m.machine_id,
      `"${m.machine_name}"`,
      m.status,
      `"${m.location}"`,
      `"${m.operator}"`,
      m.oee_metrics.oee_percentage.toFixed(1),
      (m.oee_metrics.availability * 100).toFixed(1),
      (m.oee_metrics.performance * 100).toFixed(1),
      (m.oee_metrics.quality * 100).toFixed(1),
      m.output_count,
      m.good_count,
      m.scrap_count,
      m.sensors?.temperature_c || 0,
      m.sensors?.power_kw || 0,
      m.sensors?.vibration_mm_s || 0,
      m.work_order?.order_id || 'N/A',
      `"${m.work_order?.part_name || 'N/A'}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `synapsys_shift_handover_report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handleChaosInject = async (type: string) => {
    // 1. Send to backend if connected
    try {
      await fetch(`/api/demo/inject-incident?fault_type=${type}`, { method: 'POST' });
    } catch {
      try {
        await fetch(`http://localhost:8000/api/demo/inject-incident?fault_type=${type}`, { method: 'POST' });
      } catch (e) {
        console.warn('Backend unavailable; fault drill applied locally:', e);
      }
    }

    // 2. Instant Optimistic Client Update: Guaranteed immediate alarm table reflection
    const nowIso = new Date().toISOString();
    if (type === 'restore_all') {
      pushEvent('All plant assets restored to nominal baseline', 'Alarm', 'emerald');
    } else {
      pushEvent(`Diagnostic drill executed (${type.replace(/_/g, ' ')})`, 'Alarm', 'rose');
    }
    if (type === 'spindle_overheat') {
      const newAlarm: AlarmEvent = {
        machine_id: 'CNC-101',
        machine_name: '5-Axis CNC Milling Center',
        alarm: 'Spindle Bearings Thermal Trip (>94°C)',
        severity: 'Critical',
        timestamp: nowIso,
        code: 'ALM-E204',
        category: 'Mechanical',
        duration_sec: 1,
        acknowledged: false,
      };
      setSimulatedAlarms((prev) => [newAlarm, ...prev.filter((a) => a.machine_id !== 'CNC-101')]);
      setData((prev) => {
        const nextAlarms = [newAlarm, ...prev.active_alarms.filter((a) => a.machine_id !== 'CNC-101')];
        const nextMachines = prev.machines.map((m) =>
          m.machine_id === 'CNC-101'
            ? {
              ...m,
              status: 'Down' as const,
              active_alarm: newAlarm.alarm,
              alarm_severity: 'Critical' as const,
              sensors: {
                ...m.sensors,
                temperature_c: 94.5,
                vibration_mm_s: 5.2,
                power_kw: 1.8,
                pressure_bar: m.sensors?.pressure_bar || 6.1,
              },
            }
            : m
        );
        return {
          ...prev,
          machines: nextMachines,
          active_alarms: nextAlarms,
          summary: {
            ...prev.summary,
            active_alarms_count: nextAlarms.length,
            down_machines: nextMachines.filter((m) => m.status === 'Down').length,
          },
        };
      });
      setCsvFeedback({
        type: 'error',
        text: 'DIAGNOSTIC DRILL: Spindle Thermal Trip injected on CNC-101 (ALM-E204) — P1 Critical Alarm Dispatched!',
      });
    } else if (type === 'vibration_anomaly') {
      const newAlarm: AlarmEvent = {
        machine_id: 'CNC-101',
        machine_name: '5-Axis CNC Milling Center',
        alarm: 'High Vibration Harmonic Drift on Axis Y (4.6 mm/s)',
        severity: 'Warning',
        timestamp: nowIso,
        code: 'ALM-W108',
        category: 'Mechanical',
        duration_sec: 1,
        acknowledged: false,
      };
      setSimulatedAlarms((prev) => [newAlarm, ...prev.filter((a) => a.machine_id !== 'CNC-101')]);
      setData((prev) => {
        const nextAlarms = [newAlarm, ...prev.active_alarms.filter((a) => a.machine_id !== 'CNC-101')];
        const nextMachines = prev.machines.map((m) =>
          m.machine_id === 'CNC-101'
            ? {
              ...m,
              status: 'Idle' as const,
              active_alarm: newAlarm.alarm,
              alarm_severity: 'Warning' as const,
              sensors: {
                ...m.sensors,
                temperature_c: m.sensors?.temperature_c || 58.0,
                vibration_mm_s: 4.62,
                power_kw: m.sensors?.power_kw || 18.0,
                pressure_bar: m.sensors?.pressure_bar || 6.1,
              },
            }
            : m
        );
        return {
          ...prev,
          machines: nextMachines,
          active_alarms: nextAlarms,
          summary: {
            ...prev.summary,
            active_alarms_count: nextAlarms.length,
          },
        };
      });
      setCsvFeedback({
        type: 'error',
        text: 'DIAGNOSTIC DRILL: Vibration Harmonic Drift injected on CNC-101 (ALM-W108) — P2 Advisory Alarm Dispatched!',
      });
    } else if (type === 'hydraulic_loss') {
      const newAlarm: AlarmEvent = {
        machine_id: 'INJ-202',
        machine_name: 'Hydraulic Injection Press',
        alarm: 'Hydraulic Manifold Pressure Drop (<85 bar)',
        severity: 'Critical',
        timestamp: nowIso,
        code: 'ALM-P301',
        category: 'Mechanical',
        duration_sec: 1,
        acknowledged: false,
      };
      setSimulatedAlarms((prev) => [newAlarm, ...prev.filter((a) => a.machine_id !== 'INJ-202')]);
      setData((prev) => {
        const nextAlarms = [newAlarm, ...prev.active_alarms.filter((a) => a.machine_id !== 'INJ-202')];
        const nextMachines = prev.machines.map((m) =>
          m.machine_id === 'INJ-202'
            ? {
              ...m,
              status: 'Down' as const,
              active_alarm: newAlarm.alarm,
              alarm_severity: 'Critical' as const,
              sensors: {
                ...m.sensors,
                temperature_c: 72.8,
                vibration_mm_s: m.sensors?.vibration_mm_s || 1.8,
                power_kw: m.sensors?.power_kw || 14.0,
                pressure_bar: 74.2,
              },
            }
            : m
        );
        return {
          ...prev,
          machines: nextMachines,
          active_alarms: nextAlarms,
          summary: {
            ...prev.summary,
            active_alarms_count: nextAlarms.length,
            down_machines: nextMachines.filter((m) => m.status === 'Down').length,
          },
        };
      });
      setCsvFeedback({
        type: 'error',
        text: 'DIAGNOSTIC DRILL: Hydraulic Pressure Drop injected on INJ-202 (ALM-P301) — P1 Critical Alarm Dispatched!',
      });
    } else if (type === 'wire_feed_jam') {
      const newAlarm: AlarmEvent = {
        machine_id: 'WLD-303',
        machine_name: 'Robotic Arc Welding Cell',
        alarm: 'Robotic Arc Wire Feed Drive Motor Stall',
        severity: 'Critical',
        timestamp: nowIso,
        code: 'ALM-W402',
        category: 'Electrical',
        duration_sec: 1,
        acknowledged: false,
      };
      setSimulatedAlarms((prev) => [newAlarm, ...prev.filter((a) => a.machine_id !== 'WLD-303')]);
      setData((prev) => {
        const nextAlarms = [newAlarm, ...prev.active_alarms.filter((a) => a.machine_id !== 'WLD-303')];
        const nextMachines = prev.machines.map((m) =>
          m.machine_id === 'WLD-303'
            ? {
              ...m,
              status: 'Down' as const,
              active_alarm: newAlarm.alarm,
              alarm_severity: 'Critical' as const,
            }
            : m
        );
        return {
          ...prev,
          machines: nextMachines,
          active_alarms: nextAlarms,
          summary: {
            ...prev.summary,
            active_alarms_count: nextAlarms.length,
            down_machines: nextMachines.filter((m) => m.status === 'Down').length,
          },
        };
      });
      setCsvFeedback({
        type: 'error',
        text: 'DIAGNOSTIC DRILL: Wire Feed Drive Stall injected on WLD-303 (ALM-W402) — P1 Critical Alarm Dispatched!',
      });
    } else if (type === 'restore_all') {
      setSimulatedAlarms([]);
      setData((prev) => {
        const nextMachines = prev.machines.map((m) => ({
          ...m,
          status: 'Running' as const,
          active_alarm: null,
          alarm_severity: 'None' as const,
          alarm_acknowledged: false,
          sensors: {
            ...m.sensors,
            temperature_c: 52.0,
            vibration_mm_s: 1.4,
            power_kw: 22.0,
            pressure_bar: m.machine_id === 'INJ-202' ? 160.0 : 6.2,
          },
        }));
        return {
          ...prev,
          machines: nextMachines,
          active_alarms: [],
          summary: {
            ...prev.summary,
            active_alarms_count: 0,
            down_machines: 0,
            running_machines: nextMachines.length,
          },
        };
      });
      setCsvFeedback({
        type: 'success',
        text: 'All machines and telemetry channels restored to nominal operating parameters.',
      });
    }
  };

  const handleAcknowledge = async (id: string) => {
    try {
      await fetch(`/api/alarms/${id}/acknowledge`, { method: 'POST' });
    } catch {
      try {
        await fetch(`http://localhost:8000/api/alarms/${id}/acknowledge`, { method: 'POST' });
      } catch (e) {
        console.warn('Backend unavailable; acknowledged locally:', e);
      }
    }
    // Optimistic local update
    setSimulatedAlarms((prev) => prev.filter((a) => a.machine_id !== id));
    setData((prev) => {
      const nextAlarms = prev.active_alarms.filter((a) => a.machine_id !== id);
      const nextMachines = prev.machines.map((m) =>
        m.machine_id === id
          ? {
            ...m,
            status: 'Running' as const,
            active_alarm: null,
            alarm_severity: 'None' as const,
            alarm_acknowledged: true,
          }
          : m
      );
      return {
        ...prev,
        machines: nextMachines,
        active_alarms: nextAlarms,
        summary: {
          ...prev.summary,
          active_alarms_count: nextAlarms.length,
          down_machines: nextMachines.filter((m) => m.status === 'Down').length,
          running_machines: nextMachines.filter((m) => m.status === 'Running').length,
        },
      };
    });
    setCsvFeedback({
      type: 'success',
      text: `Alarm acknowledged for asset ${id}. Fault cleared from active incident monitor.`,
    });
  };

  const handleAcknowledgeAll = async () => {
    try {
      await fetch('/api/alarms/acknowledge-all', { method: 'POST' });
    } catch {
      try {
        await fetch('http://localhost:8000/api/alarms/acknowledge-all', { method: 'POST' });
      } catch (e) {
        console.warn('Backend unavailable; all acknowledged locally:', e);
      }
    }
    setSimulatedAlarms([]);
    setData((prev) => {
      const nextMachines = prev.machines.map((m) => ({
        ...m,
        status: 'Running' as const,
        active_alarm: null,
        alarm_severity: 'None' as const,
        alarm_acknowledged: true,
      }));
      return {
        ...prev,
        machines: nextMachines,
        active_alarms: [],
        summary: {
          ...prev.summary,
          active_alarms_count: 0,
          down_machines: 0,
          running_machines: nextMachines.length,
        },
      };
    });
    setCsvFeedback({
      type: 'success',
      text: 'All alarms acknowledged across the plant. Zero active alarms detected.',
    });
  };

  const handleMachineCommand = async (machineId: string, action: string) => {
    try {
      await fetch(`/api/machines/${machineId}/command?action=${action}`, { method: 'POST' });
    } catch {
      await fetch(`http://localhost:8000/api/machines/${machineId}/command?action=${action}`, { method: 'POST' });
    }
    fetchDashboardData();
  };

  const handleToggleConnector = async (connectorId: string) => {
    setPendingConnectors((prev) => ({ ...prev, [connectorId]: true }));
    try {
      let res = await fetch(`/api/connectors/${connectorId}/toggle`, { method: 'POST' });
      if (!res.ok) {
        res = await fetch(`http://localhost:8000/api/connectors/${connectorId}/toggle`, { method: 'POST' });
      }
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to toggle connector:', err);
    } finally {
      setPendingConnectors((prev) => {
        const next = { ...prev };
        delete next[connectorId];
        return next;
      });
    }
  };

  const handleChangeDataSourceMode = async (mode: string) => {
    try {
      let res = await fetch('/api/data-source/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) {
        res = await fetch('http://localhost:8000/api/data-source/mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode }),
        });
      }
      fetchDashboardData();
    } catch (err) {
      console.error('Failed to set data source mode:', err);
    }
  };

  const handleLoadSampleCsv = async () => {
    setCsvIsLoading(true);
    setCsvFeedback(null);
    try {
      let sampleRes = await fetch('/api/data-source/sample-csv');
      if (!sampleRes.ok) {
        sampleRes = await fetch('http://localhost:8000/api/data-source/sample-csv');
      }
      const sampleJson = await sampleRes.json();
      if (!sampleJson.csv_data) throw new Error('Empty CSV data');

      let importRes = await fetch('/api/telemetry/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_content: sampleJson.csv_data }),
      });
      if (!importRes.ok) {
        importRes = await fetch('http://localhost:8000/api/telemetry/import-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csv_content: sampleJson.csv_data }),
        });
      }
      const importJson = await importRes.json();
      setCsvFeedback({
        type: 'success',
        text: `Loaded ${importJson.imported_rows} telemetry records from real shift dataset (${sampleJson.filename}). ISO-22400 OEE & Nakajima metrics recalculated.`,
      });
      fetchDashboardData();
    } catch (err) {
      setCsvFeedback({ type: 'error', text: `Failed to load shift dataset: ${String(err)}` });
    } finally {
      setCsvIsLoading(false);
    }
  };

  const handleImportCustomCsv = async (content: string) => {
    if (!content.trim()) return;
    setCsvIsLoading(true);
    setCsvFeedback(null);
    try {
      let importRes = await fetch('/api/telemetry/import-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csv_content: content }),
      });
      if (!importRes.ok) {
        importRes = await fetch('http://localhost:8000/api/telemetry/import-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csv_content: content }),
        });
      }
      const importJson = await importRes.json();
      setCsvFeedback({
        type: 'success',
        text: `Successfully parsed and ingested ${importJson.imported_rows} telemetry rows into engine state.`,
      });
      setShowCsvModal(false);
      setCustomCsvInput('');
      fetchDashboardData();
    } catch (err) {
      setCsvFeedback({ type: 'error', text: `CSV Ingestion Error: ${String(err)}` });
    } finally {
      setCsvIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        handleImportCustomCsv(text);
      }
    };
    reader.readAsText(file);
  };

  const MACHINE_PRESETS = [
    {
      label: 'Fiber Laser Cutter (LSR-404)',
      id: 'LSR-404',
      name: 'Fiber Laser Cutting Cell',
      location: 'Bay 03 - Laser Fabrication',
      operator: 'M. Rodriguez [Shift 1]',
      cycle: 14.0,
      target: 300,
      comp: 'High-Power Laser Resonator & Optics',
      plc: 'Siemens S7-1500F (PROFINET)',
      ip: '192.168.1.135',
      node: 'ns=2;s=LSR404.LaserSource',
      wo: 'WO-84928',
      pn: 'PN-9940-SS',
      pname: 'Laser Cut Impeller Baffle',
      cust: 'Apex Industrial Systems',
    },
    {
      label: 'Stamping Press (STP-505)',
      id: 'STP-505',
      name: 'Automatic Stamping Press 500T',
      location: 'Bay 05 - Heavy Press Line',
      operator: 'D. Kowalski [Shift 1]',
      cycle: 8.0,
      target: 650,
      comp: 'Hydraulic Clutch & Flywheel Brake',
      plc: 'Allen-Bradley ControlLogix 5580',
      ip: '192.168.1.136',
      node: 'ns=2;s=STP505.HydraulicUnit',
      wo: 'WO-84929',
      pn: 'PN-3320-STL',
      pname: 'Chassis Floor Reinforcement Bracket',
      cust: 'General Motors EV',
    },
    {
      label: 'Horizontal CNC (HMC-606)',
      id: 'HMC-606',
      name: 'Horizontal 4-Axis CNC Milling Cell',
      location: 'Bay 02 - Machining Cell B',
      operator: 'R. Patel [Shift 1]',
      cycle: 16.5,
      target: 180,
      comp: 'Twin Pallet Changer & B-Axis Rotary Table',
      plc: 'Fanuc 31i-B5 (IO-Link)',
      ip: '192.168.1.137',
      node: 'ns=2;s=HMC606.Drive.PalletTable',
      wo: 'WO-84931',
      pn: 'PN-6610-AL',
      pname: 'Transmission Gearbox Housing',
      cust: 'BorgWarner PowerDrive',
    },
    {
      label: 'Robotic Polisher (RBT-707)',
      id: 'RBT-707',
      name: 'Robotic Surface Deburring & Polishing',
      location: 'Bay 01 - Finishing Line',
      operator: 'J. Walsh [Shift 1]',
      cycle: 9.5,
      target: 420,
      comp: 'Compliant Spindle & Rotary Abrasive Head',
      plc: 'Beckhoff TwinCAT 3 CX5140 (EtherCAT)',
      ip: '192.168.1.138',
      node: 'ns=4;s=RBT707.CompliantTool',
      wo: 'WO-84932',
      pn: 'PN-1104-TI',
      pname: 'Medical Implant Femoral Component',
      cust: 'Stryker Orthopaedics',
    },
  ];

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...newMachineForm,
      site_id: currentProject,
    };
    try {
      let res: Response;
      try {
        res = await fetch('/api/machines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        res = await fetch('http://localhost:8000/api/machines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Failed to provision machine');
      }
      setCsvFeedback({
        type: 'success',
        text: `Asset ${newMachineForm.machine_id} (${newMachineForm.machine_name}) successfully provisioned into ${activeSite?.name || 'active facility'}!`,
      });
      setShowAddMachineModal(false);
      fetchDashboardData();
    } catch {
      // Local / Offline fallback: commission into client state directly
      const newMach: MachineDashboardState = {
        machine_id: newMachineForm.machine_id,
        machine_name: newMachineForm.machine_name,
        site_id: currentProject,
        status: 'Running',
        timestamp: new Date().toISOString(),
        location: newMachineForm.location,
        operator: newMachineForm.operator,
        output_count: 0,
        target_output: newMachineForm.target_output,
        good_count: 0,
        scrap_count: 0,
        cycle_time_sec: newMachineForm.ideal_cycle_time_sec,
        ideal_cycle_time_sec: newMachineForm.ideal_cycle_time_sec,
        uptime_seconds: 60.0,
        downtime_seconds: 0.0,
        oee_metrics: {
          availability: 1.0,
          performance: 0.95,
          quality: 1.0,
          oee: 0.95,
          oee_percentage: 95.0,
          benchmark_status: 'World-Class',
        },
        active_alarm: null,
        alarm_severity: 'None',
        recent_cycle_times: [newMachineForm.ideal_cycle_time_sec],
        sensors: {
          temperature_c: 45.0,
          vibration_mm_s: 1.1,
          power_kw: 18.5,
          pressure_bar: 6.0,
        },
        predictive: {
          anomaly_score: 5.0,
          health_status: 'Optimal',
          remaining_useful_life_hrs: 600,
          component_at_risk: newMachineForm.component,
          root_cause_analysis: 'Commissioning baseline established. Telemetry stream nominal.',
        },
        work_order: {
          order_id: newMachineForm.order_id,
          part_number: newMachineForm.part_number,
          part_name: newMachineForm.part_name,
          customer: newMachineForm.customer,
          batch_target: newMachineForm.target_output,
          batch_completed: 0,
          start_time: 'Immediate',
          estimated_completion: '+8 hrs',
        },
        losses: {
          equipment_failure_sec: 0,
          setup_adjustment_sec: 0,
          idling_minor_stops_sec: 0,
          reduced_speed_sec: 0,
          process_defects_units: 0,
          startup_rejects_units: 0,
        },
      };

      setData((prev) => ({
        ...prev,
        machines: [...prev.machines.filter((m) => m.machine_id !== newMach.machine_id), newMach],
        summary: {
          ...prev.summary,
          total_machines: prev.machines.length + 1,
          running_machines: prev.summary.running_machines + 1,
          total_target: prev.summary.total_target + newMach.target_output,
        },
      }));

      setCsvFeedback({
        type: 'success',
        text: `Asset ${newMachineForm.machine_id} provisioned locally into ${activeSite?.name || 'facility'}.`,
      });
      setShowAddMachineModal(false);
    }
  };

  const handleDeleteMachine = async (machineId: string) => {
    if (!window.confirm(`Are you sure you want to decommission and remove ${machineId} from the active plant fleet?`)) return;
    try {
      let res = await fetch(`/api/machines/${machineId}`, { method: 'DELETE' });
      if (!res.ok) {
        res = await fetch(`http://localhost:8000/api/machines/${machineId}`, { method: 'DELETE' });
      }
      setSelectedMachine(null);
      setCsvFeedback({
        type: 'success',
        text: `Asset ${machineId} has been decommissioned from active production.`,
      });
      fetchDashboardData();
    } catch (err) {
      alert(`Error decommissioning machine: ${String(err)}`);
    }
  };

  const handleCreateConnector = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res = await fetch('/api/connectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConnectorForm),
      });
      if (!res.ok) {
        res = await fetch('http://localhost:8000/api/connectors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newConnectorForm),
        });
      }
      setShowAddConnectorModal(false);
      setCsvFeedback({
        type: 'success',
        text: `Connector "${newConnectorForm.name}" deployed and streaming live!`,
      });
      fetchDashboardData();
    } catch (err) {
      alert(`Error creating connector: ${String(err)}`);
    }
  };

  const handleDeleteConnector = async (connectorId: string) => {
    try {
      let res = await fetch(`/api/connectors/${connectorId}`, { method: 'DELETE' });
      if (!res.ok) {
        res = await fetch(`http://localhost:8000/api/connectors/${connectorId}`, { method: 'DELETE' });
      }
      fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let res = await fetch('/api/workorders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkOrderForm),
      });
      if (!res.ok) {
        res = await fetch('http://localhost:8000/api/workorders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newWorkOrderForm),
        });
      }
      setShowAddWorkOrderModal(false);
      setCsvFeedback({
        type: 'success',
        text: `Work Order ${newWorkOrderForm.order_id} (${newWorkOrderForm.part_name}) dispatched to ${newWorkOrderForm.machine_id}!`,
      });
      fetchDashboardData();
    } catch (err) {
      alert(`Error dispatching work order: ${String(err)}`);
    }
  };

  // Submit AI Copilot Query
  const handleCopilotSend = async (customPrompt?: string) => {
    const queryText = customPrompt || copilotInput;
    if (!queryText.trim()) return;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString(),
    };
    setCopilotMessages((prev) => [...prev, userMsg]);
    setCopilotInput('');
    setCopilotLoading(true);

    const payload = {
      prompt: queryText,
      site_id: currentProject,
      company_domain: currentUser?.company_domain,
    };

    try {
      let res: Response | null = null;
      try {
        res = await fetch('/api/copilot/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        try {
          res = await fetch('http://localhost:8000/api/copilot/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        } catch {
          res = null;
        }
      }

      if (res && res.ok) {
        const json = await res.json();
        const aiMsg: CopilotMessage = {
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: json.answer,
          timestamp: new Date().toLocaleTimeString(),
          citations: json.citations,
        };
        setCopilotMessages((prev) => [...prev, aiMsg]);
        return;
      }

      // If backend responded with non-200 or was unreachable, synthesize from live client telemetry state
      const pLower = queryText.toLowerCase();
      let fallbackText = '';
      let fallbackCitations: string[] = [];

      if (pLower.includes('asset') || pLower.includes('machine') || pLower.includes('equipment') || pLower.includes('line')) {
        const lines = (data.machines || []).map(
          (m) => `${m.machine_name} (${m.machine_id}): Status ${m.status}, OEE ${m.oee_metrics?.oee_percentage || 0}%, Temp ${m.sensors?.temperature_c || 0}°C, Vibration ${m.sensors?.vibration_mm_s || 0} mm/s`
        );
        fallbackText = `${data.site_name || 'Plant'} floor monitoring: ${data.machines?.length || 0} production assets detected. Asset breakdown: ${lines.join('; ') || 'No equipment registered'}. Current facility cadence is ${data.summary?.mean_line_speed_sec || 0}s cycle time across ${data.summary?.running_machines || 0} active units.`;
        fallbackCitations = [
          `Total Monitored Assets: ${data.machines?.length || 0}`,
          `Running: ${data.summary?.running_machines || 0} | Idle: ${data.summary?.idle_machines || 0} | Down: ${data.summary?.down_machines || 0}`,
          `Active Site: ${data.site_name || 'Active Production Facility'}`,
        ];
      } else if (pLower.includes('bottleneck') || pLower.includes('loss') || pLower.includes('oee')) {
        const lowestM = [...(data.machines || [])].sort((a, b) => (a.oee_metrics?.oee || 0) - (b.oee_metrics?.oee || 0))[0];
        fallbackText = `Facility OEE is currently operating at ${data.summary?.overall_plant_oee || 0}%. Primary line bottleneck is ${lowestM ? `${lowestM.machine_name} (${lowestM.machine_id}) at ${lowestM.oee_metrics?.oee_percentage || 0}% OEE` : 'nominal'}. Planned cadence is ${data.summary?.takt_time_sec || 0}s customer takt.`;
        fallbackCitations = [
          `Overall OEE: ${data.summary?.overall_plant_oee || 0}%`,
          `Target Takt: ${data.summary?.takt_time_sec || 0}s vs Mean: ${data.summary?.mean_line_speed_sec || 0}s`,
          lowestM?.work_order?.order_id ? `Active Work Order: ${lowestM.work_order.order_id}` : `Facility: ${data.site_name || 'Active Production Facility'}`,
        ];
      } else if (pLower.includes('predictive') || pLower.includes('rul') || pLower.includes('failure') || pLower.includes('bearing')) {
        const criticalM = [...(data.machines || [])].sort((a, b) => (b.predictive?.anomaly_score || 0) - (a.predictive?.anomaly_score || 0))[0];
        fallbackText = criticalM
          ? `Predictive anomaly scan evaluated ${data.machines?.length || 0} assets at ${data.site_name || 'Facility'}. Asset ${criticalM.machine_id} presents the highest mechanical risk with Anomaly Score ${criticalM.predictive?.anomaly_score || 0}% (${criticalM.predictive?.health_status || 'Monitored'}). Remaining Useful Life for ${criticalM.predictive?.component_at_risk || 'bearing assembly'} is estimated at ${criticalM.predictive?.remaining_useful_life_hrs || 0} operating hours.`
          : `All machine telemetry indicators are within nominal tolerance. No anomalous degradation detected.`;
        fallbackCitations = criticalM
          ? [
              `Vibration RMS: ${criticalM.sensors?.vibration_mm_s || 0} mm/s`,
              `Core Temp: ${criticalM.sensors?.temperature_c || 0}°C`,
              `RUL Horizon: ${criticalM.predictive?.remaining_useful_life_hrs || 0}h`,
            ]
          : [`Health Status: Nominal`];
      } else if (pLower.includes('alarm') || pLower.includes('incident') || pLower.includes('alert')) {
        const alarms = data.active_alarms || [];
        fallbackText = alarms.length > 0
          ? `There are currently ${alarms.length} active ISA-18.2 alarms logged: ${alarms.map(a => `${a.machine_id} - ${a.alarm} (${a.severity})`).join(', ')}. Operator acknowledgment and root-cause inspection are advised.`
          : `No critical alarms currently flagged for ${data.site_name || 'Facility'}. All machinery running within safe thermal and vibration boundaries.`;
        fallbackCitations = [`Active Alarms: ${alarms.length}`, `Facility: ${data.site_name || 'Active Production Facility'}`];
      } else if (pLower.includes('financial') || pLower.includes('cost') || pLower.includes('roi') || pLower.includes('revenue')) {
        const roi = data.summary?.financial_roi;
        fallbackText = roi
          ? `Current shift at ${data.site_name || 'Facility'} has generated ${siteCurrency.symbol}${(roi.revenue_generated_usd || 0).toLocaleString()} in gross production value across ${data.summary?.total_good || 0} conforming parts. Unplanned downtime losses total -${siteCurrency.symbol}${(roi.downtime_cost_usd || 0).toLocaleString()} and scrap waste is -${siteCurrency.symbol}${(roi.scrap_waste_cost_usd || 0).toLocaleString()}. Net shift economic yield stands at ${siteCurrency.symbol}${(roi.net_shift_value_usd || 0).toLocaleString()}.`
          : `Economic metrics: Overall OEE ${data.summary?.overall_plant_oee || 0}%, output ${data.summary?.total_output || 0} parts.`;
        fallbackCitations = [
          `Gross Value: ${siteCurrency.symbol}${(roi?.revenue_generated_usd || 0).toLocaleString()}`,
          `Downtime Cost: -${siteCurrency.symbol}${(roi?.downtime_cost_usd || 0).toLocaleString()}`,
          `Conforming Parts: ${data.summary?.total_good || 0} / ${data.summary?.total_target || 0}`,
        ];
      } else {
        fallbackText = `${data.site_name || 'Active Production Facility'} operating at ${data.summary?.overall_plant_oee || 0}% OEE with ${data.summary?.running_machines || 0} assets online. Current production output is ${data.summary?.total_output || 0} of ${data.summary?.total_target || 0} scheduled units with ${data.summary?.active_alarms_count || 0} unresolved ISA-18.2 alarms.`;
        fallbackCitations = [
          `Plant OEE: ${data.summary?.overall_plant_oee || 0}%`,
          `Active Assets: ${data.summary?.running_machines || 0} / ${data.machines?.length || 0}`,
          `Active Alarms: ${data.summary?.active_alarms_count || 0}`,
        ];
      }

      const fallbackMsg: CopilotMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString(),
        citations: fallbackCitations,
      };
      setCopilotMessages((prev) => [...prev, fallbackMsg]);
    } catch {
      const fallbackMsg: CopilotMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: `Analysis based on live telemetry: Facility OEE is currently ${data.summary?.overall_plant_oee || 0}% with ${data.summary?.running_machines || 0} active asset(s) and ${data.summary?.active_alarms_count || 0} alarm(s).`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setCopilotMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleGeoLocationSelect = useCallback((geo: GeoLocationData) => {
    setNewSiteForm((prev) => {
      const updated = {
        ...prev,
        location: geo.location,
        latitude: geo.latitude,
        longitude: geo.longitude,
      };
      if (geo.suggestedRegion) {
        updated.region = geo.suggestedRegion;
      }
      if (geo.suggestedFacilityType) {
        updated.facility_type = geo.suggestedFacilityType;
      }
      if (geo.suggestedName && (prev.name === 'Austin Gigafactory 05' || !prev.name.trim())) {
        updated.name = geo.suggestedName;
        updated.id = `synapsys-mfg-${geo.suggestedName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`.replace(/-+/g, '-');
      }
      return updated;
    });
  }, []);

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteForm.name.trim()) return;
    setIsSubmittingSite(true);

    const siteId = (newSiteForm.id.trim() || `synapsys-mfg-${newSiteForm.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`).replace(/-+/g, '-');
    const newSite: ProductionSite = {
      id: siteId,
      name: newSiteForm.name.trim(),
      region: newSiteForm.region.trim() || 'us-central1',
      location: newSiteForm.location.trim() || 'Factory Facility',
      latitude: newSiteForm.latitude,
      longitude: newSiteForm.longitude,
      facility_type: newSiteForm.facility_type,
      active_lines: Number(newSiteForm.active_lines) || 1,
      target_capacity: Number(newSiteForm.target_capacity) || 1000,
      nominal_oee: Number(newSiteForm.nominal_oee) || 85.0,
      status: newSiteForm.status,
      created_at: new Date().toISOString(),
      company_domain: currentUser?.company_domain || 'synapsys.com',
      company_name: currentUser?.company_name || 'SynapSYS Enterprise',
    };

    try {
      await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSite),
      });
    } catch (err) {
      console.warn('Backend sync failed, storing locally:', err);
    }

    setProductionSites((prev) => {
      const exists = prev.some((s) => s.id === siteId);
      if (exists) return prev.map((s) => (s.id === siteId ? newSite : s));
      return [...prev, newSite];
    });

    setCurrentProject(siteId);
    setIsSubmittingSite(false);
    setShowAddSiteForm(false);
    setShowProjectModal(false);
    setCsvFeedback({
      type: 'success',
      text: `Production Site "${newSite.name}" successfully provisioned! Active facility telemetry context switched to ${newSite.region}.`,
    });
  };

  const handleDeleteSite = async (siteId: string, siteName: string) => {
    if (productionSites.length <= 1) {
      setCsvFeedback({ type: 'error', text: 'Cannot decommission the only remaining active production facility.' });
      return;
    }
    try {
      await fetch(`/api/sites/${siteId}`, { method: 'DELETE' });
    } catch {
      // ignore
    }
    setProductionSites((prev) => prev.filter((s) => s.id !== siteId));
    if (currentProject === siteId) {
      const remaining = productionSites.filter((s) => s.id !== siteId);
      if (remaining.length > 0) {
        setCurrentProject(remaining[0].id);
      }
    }
    setCsvFeedback({
      type: 'success',
      text: `Decommissioned production facility "${siteName}".`,
    });
  };

  const handleApplyPresetSite = (preset: Partial<typeof newSiteForm>) => {
    setNewSiteForm((prev) => ({
      ...prev,
      ...preset,
    }));
  };

  const filteredMachines = useMemo(() => {
    const list = data.machines.filter((m) => {
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'running' && m.status === 'Running') ||
        (statusFilter === 'idle' && m.status === 'Idle') ||
        (statusFilter === 'down' && m.status === 'Down');

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        m.machine_id.toLowerCase().includes(q) ||
        m.machine_name.toLowerCase().includes(q) ||
        Boolean(m.location && m.location.toLowerCase().includes(q)) ||
        Boolean(m.operator && m.operator.toLowerCase().includes(q)) ||
        m.status.toLowerCase().includes(q) ||
        Boolean(m.plc_controller && m.plc_controller.toLowerCase().includes(q)) ||
        Boolean(m.work_order && m.work_order.part_name.toLowerCase().includes(q)) ||
        Boolean(m.work_order && m.work_order.order_id.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });

    if (sortBy === 'oee_asc') {
      return [...list].sort((a, b) => a.oee_metrics.oee - b.oee_metrics.oee);
    }
    if (sortBy === 'scrap_desc') {
      return [...list].sort((a, b) => (b.scrap_count || 0) - (a.scrap_count || 0));
    }
    if (sortBy === 'power_desc') {
      return [...list].sort((a, b) => (b.sensors?.power_kw || 0) - (a.sensors?.power_kw || 0));
    }
    return list;
  }, [data.machines, statusFilter, searchQuery, sortBy]);

  const globalSearchCatalog = useMemo(() => {
    type BadgeTone = 'blue' | 'emerald' | 'amber' | 'rose' | 'neutral';
    interface SearchItem {
      id: string;
      category: 'Navigation' | 'Asset' | 'Work Order' | 'Alarm' | 'Connector' | 'Facility' | 'Action';
      title: string;
      subtitle: string;
      badge?: string;
      badgeTone?: BadgeTone;
      keywords: string;
      keepQueryOnSelect?: boolean;
      onSelect: () => void;
    }

    const items: SearchItem[] = [
      {
        id: 'nav-overview',
        category: 'Navigation',
        title: '01 Fleet Overview',
        subtitle: 'Live monitoring, asset cards, KPI deck & shift overview',
        badge: 'Tab 1',
        badgeTone: 'blue',
        keywords: 'fleet overview live monitoring dashboard home main machines',
        onSelect: () => setActiveTab('overview'),
      },
      {
        id: 'nav-connectors',
        category: 'Navigation',
        title: '02 Field Connectors',
        subtitle: 'OPC-UA, MQTT Sparkplug B, Modbus edge ingestion & pipeline',
        badge: 'Tab 2',
        badgeTone: 'blue',
        keywords: 'field connectors opc-ua mqtt sparkplug modbus edge ingestion plc pipeline protocol',
        onSelect: () => setActiveTab('connectors'),
      },
      {
        id: 'nav-twin',
        category: 'Navigation',
        title: '03 Digital Twin',
        subtitle: 'Interactive spatial floor layout, bays, conveyors & AGV lane',
        badge: 'Tab 3',
        badgeTone: 'blue',
        keywords: 'digital twin spatial floor layout bay conveyor agv logistics',
        onSelect: () => setActiveTab('twin'),
      },
      {
        id: 'nav-losses',
        category: 'Navigation',
        title: '04 Loss Analysis',
        subtitle: 'Six Big Losses breakdown (Availability, Performance, Quality)',
        badge: 'Tab 4',
        badgeTone: 'blue',
        keywords: 'loss analysis six big losses downtime scrap speed variance oee',
        onSelect: () => setActiveTab('losses'),
      },
      {
        id: 'nav-workorders',
        category: 'Navigation',
        title: '05 Work Orders',
        subtitle: 'Active production batch tracking & customer MES commitments',
        badge: 'Tab 5',
        badgeTone: 'blue',
        keywords: 'work orders mes batch tracking schedule customer parts',
        onSelect: () => setActiveTab('workorders'),
      },
      {
        id: 'nav-alarms',
        category: 'Navigation',
        title: '06 Alarms & Incidents',
        subtitle: 'ISA-18.2 alarm triage, acknowledgement & fault simulator drills',
        badge: data.active_alarms.filter((a) => !a.acknowledged).length > 0 ? `${data.active_alarms.filter((a) => !a.acknowledged).length} Active` : 'Tab 6',
        badgeTone: data.active_alarms.filter((a) => !a.acknowledged).length > 0 ? 'rose' : 'blue',
        keywords: 'alarms incidents isa-18.2 triage alerts acknowledge fault safety interlocks',
        onSelect: () => setActiveTab('alarms'),
      },
      {
        id: 'nav-inventory',
        category: 'Navigation',
        title: '07 Inventory & Procurement',
        subtitle: 'MRO tooling, spares, verified seller directory, RFQ/PO email dispatches & stock-in receipt',
        badge: 'Tab 7',
        badgeTone: 'emerald',
        keywords: 'inventory procurement vendors suppliers purchase orders mro spares raw materials seller email tooling',
        onSelect: () => setActiveTab('inventory'),
      },
      {
        id: 'view-cards',
        category: 'Navigation',
        title: 'Fleet Cards View',
        subtitle: 'Switch Fleet Overview layout to supervisory cards grid',
        badge: 'View',
        badgeTone: 'neutral',
        keywords: 'cards view grid overview layout machines',
        onSelect: () => {
          setActiveTab('overview');
          setViewMode('cards');
        },
      },
      {
        id: 'view-dense',
        category: 'Navigation',
        title: 'SCADA Dense Table View',
        subtitle: 'Switch Fleet Overview to dense real-time telemetry table',
        badge: 'View',
        badgeTone: 'neutral',
        keywords: 'table dense matrix telemetry list scada',
        onSelect: () => {
          setActiveTab('overview');
          setViewMode('dense');
        },
      },
      {
        id: 'view-health',
        category: 'Navigation',
        title: 'Predictive Health & RUL Matrix',
        subtitle: 'Remaining useful life, anomaly scores & wear risk diagnostics',
        badge: 'View',
        badgeTone: 'neutral',
        keywords: 'health predictive maintenance rul anomaly bearing vibration',
        onSelect: () => {
          setActiveTab('overview');
          setViewMode('health');
        },
      },
      {
        id: 'view-scope',
        category: 'Navigation',
        title: 'Live Signal Oscilloscope (Scope View)',
        subtitle: 'Real-time multi-channel thermal, vibration & power waveform scope',
        badge: 'View',
        badgeTone: 'blue',
        keywords: 'scope oscilloscope waveform signal thermal vibration power frequency trace',
        onSelect: () => {
          setActiveTab('overview');
          setViewMode('scope');
        },
      },
    ];

    for (const m of data.machines) {
      items.push({
        id: `asset-${m.machine_id}`,
        category: 'Asset',
        title: `${m.machine_id} — ${m.machine_name}`,
        subtitle: `${m.location || 'Shop Floor'} • OEE ${m.oee_metrics.oee_percentage.toFixed(1)}% • ${m.sensors?.temperature_c?.toFixed(1) || '0'}°C • ${m.sensors?.power_kw?.toFixed(1) || '0'} kW`,
        badge: m.status,
        badgeTone: m.status === 'Running' ? 'emerald' : m.status === 'Down' ? 'rose' : 'amber',
        keywords: `${m.machine_id} ${m.machine_name} ${m.location || ''} ${m.operator || ''} ${m.status} ${m.plc_controller || ''} ${m.ip_address || ''} ${m.opc_node_id || ''} ${m.active_alarm || ''} ${m.predictive?.component_at_risk || ''} asset equipment machine cell bay`,
        onSelect: () => setSelectedMachine(m),
      });

      if (m.work_order) {
        items.push({
          id: `wo-${m.work_order.order_id}-${m.machine_id}`,
          category: 'Work Order',
          title: `${m.work_order.order_id} — ${m.work_order.part_name}`,
          subtitle: `${m.machine_id} • ${m.work_order.customer} • ${m.output_count}/${m.target_output} pcs`,
          badge: m.work_order.part_number,
          badgeTone: 'blue',
          keywords: `${m.work_order.order_id} ${m.work_order.part_name} ${m.work_order.part_number} ${m.work_order.customer} ${m.machine_id} work order batch job`,
          onSelect: () => handleOpenWorkOrder(m.work_order!.order_id, m.machine_id),
        });
      }
    }

    for (const a of data.active_alarms || []) {
      items.push({
        id: `alarm-${a.machine_id}-${a.code || a.alarm}`,
        category: 'Alarm',
        title: `${a.machine_id} — ${a.alarm}`,
        subtitle: `${a.code || 'ISA-18.2'} • ${a.category || 'Process'} • ${a.acknowledged ? 'Acknowledged' : 'Unresolved'}`,
        badge: a.severity,
        badgeTone: a.severity === 'Critical' ? 'rose' : 'amber',
        keywords: `${a.machine_id} ${a.alarm} ${a.code || ''} ${a.category || ''} ${a.severity} alarm fault incident alert`,
        onSelect: () => setActiveTab('alarms'),
      });
    }

    for (const c of data.connectors || []) {
      items.push({
        id: `conn-${c.id}`,
        category: 'Connector',
        title: c.name,
        subtitle: `${c.protocol} • ${c.endpoint} • ${c.status}`,
        badge: c.status,
        badgeTone: c.status === 'Connected' ? 'emerald' : 'amber',
        keywords: `${c.id} ${c.name} ${c.protocol} ${c.endpoint} ${c.status} connector tag protocol plc edge`,
        onSelect: () => setActiveTab('connectors'),
      });
    }

    for (const s of productionSites) {
      items.push({
        id: `site-${s.id}`,
        category: 'Facility',
        title: `Switch Facility: ${s.name.replace(/\s*\(Production Live\)/i, '')}`,
        subtitle: `${s.location} • ${s.region} • ${s.facility_type}`,
        badge: s.id === currentProject ? 'Active' : 'Site',
        badgeTone: s.id === currentProject ? 'emerald' : 'neutral',
        keywords: `${s.name} ${s.id} ${s.location} ${s.region} ${s.facility_type} facility site plant switch`,
        onSelect: () => {
          setCurrentProject(s.id);
          setCsvFeedback({
            type: 'success',
            text: `Switched manufacturing context to "${s.name}". Edge telemetry synchronized from ${s.region}.`,
          });
        },
      });
    }

    items.push(
      {
        id: 'kpi-oee',
        category: 'Action',
        title: 'Overall Plant OEE Deep-Dive',
        subtitle: `${data.summary.overall_plant_oee.toFixed(1)}% current plant OEE decomposition`,
        badge: 'KPI',
        badgeTone: 'blue',
        keywords: 'oee availability performance quality benchmark deep-dive kpi',
        onSelect: () => setSelectedKpiModal('oee'),
      },
      {
        id: 'kpi-production',
        category: 'Action',
        title: 'Production Output & Quality Yield',
        subtitle: `${data.summary.total_good} conforming / ${data.summary.total_scrap} scrap units`,
        badge: 'KPI',
        badgeTone: 'blue',
        keywords: 'production output scrap conforming yield takt time kpi',
        onSelect: () => setSelectedKpiModal('production'),
      },
      {
        id: 'kpi-financial',
        category: 'Action',
        title: 'Shift Economic Yield & ROI Ledger',
        subtitle: `${siteCurrency.symbol}${(data.summary.financial_roi?.net_shift_value_usd || 0).toLocaleString()} realized net value`,
        badge: 'KPI',
        badgeTone: 'emerald',
        keywords: 'financial roi revenue downtime cost yield ledger money kpi',
        onSelect: () => setSelectedKpiModal('financial'),
      },
      {
        id: 'kpi-energy',
        category: 'Action',
        title: 'Fleet Power & Carbon Telemetry',
        subtitle: `${(data.summary.energy?.total_power_kw || 0).toFixed(1)} kW bus load • ${data.summary.energy?.green_energy_pct || 44.5}% green grid`,
        badge: 'KPI',
        badgeTone: 'emerald',
        keywords: 'power energy kw carbon green grid sustainability tariff kpi',
        onSelect: () => setSelectedKpiModal('energy'),
      },
      {
        id: 'act-copilot',
        category: 'Action',
        title: 'Open Copilot AI Diagnostics',
        subtitle: 'Ask supervisory AI about bottlenecks, faults & OEE optimizations',
        badge: 'AI',
        badgeTone: 'blue',
        keywords: 'copilot ai assistant gemini diagnostics chat',
        onSelect: () => setShowCopilot(true),
      },
      {
        id: 'act-shift-report',
        category: 'Action',
        title: 'Shift Handover Report',
        subtitle: 'Executive shift state, safety signoff & batch variance summary',
        badge: 'Report',
        badgeTone: 'neutral',
        keywords: 'shift report handover summary signoff audit',
        onSelect: () => setShowShiftReportModal(true),
      },
      {
        id: 'act-add-asset',
        category: 'Action',
        title: 'Commission Physical Asset',
        subtitle: 'Add a new PLC-connected cell or machine to the floor',
        badge: '+ Asset',
        badgeTone: 'blue',
        keywords: 'add asset commission new machine cnc robot press plc',
        onSelect: () => setShowAddMachineModal(true),
      },
      {
        id: 'act-add-connector',
        category: 'Action',
        title: 'Deploy Industrial Field Connector',
        subtitle: 'Configure OPC-UA, MQTT Sparkplug B or Modbus TCP endpoint',
        badge: '+ Connector',
        badgeTone: 'blue',
        keywords: 'add connector deploy opc-ua mqtt modbus gateway',
        onSelect: () => setShowAddConnectorModal(true),
      },
      {
        id: 'act-harness',
        category: 'Action',
        title: 'Toggle Fault Simulator Panel',
        subtitle: 'Trigger thermal, bearing, hydraulic or wire-feed test faults',
        badge: 'Simulator',
        badgeTone: 'amber',
        keywords: 'fault simulator injection drill chaos test alarm',
        onSelect: () => setShowHarness((prev) => !prev),
      },
      {
        id: 'act-sites',
        category: 'Action',
        title: 'Production Sites & Radar Map',
        subtitle: 'Manage global plants, coordinates & provision facilities',
        badge: 'Sites',
        badgeTone: 'neutral',
        keywords: 'production sites map radar facilities deploy location',
        onSelect: () => setShowProjectModal(true),
      },
      {
        id: 'act-csv',
        category: 'Action',
        title: 'Raw Shift CSV Telemetry Ingest',
        subtitle: 'Import historian RFC-4180 CSV or export current telemetry CSV',
        badge: 'CSV',
        badgeTone: 'neutral',
        keywords: 'csv import export telemetry ingest historian',
        onSelect: () => setShowCsvModal(true),
      },
      {
        id: 'act-theme',
        category: 'Action',
        title: `Switch to ${isDarkMode ? 'Light' : 'Dark'} Theme`,
        subtitle: 'Toggle display contrast theme across dashboard surfaces',
        badge: 'Theme',
        badgeTone: 'neutral',
        keywords: 'theme dark light mode appearance contrast',
        onSelect: () => onToggleTheme(),
      },
      {
        id: 'act-tutorial',
        category: 'Action',
        title: 'Operations Guide & Keyboard Shortcuts',
        subtitle: 'Walkthrough tutorial and hotkey reference (?)',
        badge: 'Help',
        badgeTone: 'neutral',
        keywords: 'tutorial guide help onboarding shortcuts hotkeys',
        onSelect: () => {
          setTutorialStep(0);
          setShowTutorial(true);
        },
      }
    );

    return items;
  }, [data.machines, data.active_alarms, data.connectors, data.summary, productionSites, currentProject, isDarkMode]);

  const globalSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // Curated quick jumps when search bar is focused with empty query
      const priorityIds = new Set([
        'nav-overview',
        'nav-twin',
        'nav-connectors',
        'nav-workorders',
        'nav-alarms',
        'act-copilot',
      ]);
      const quick = globalSearchCatalog.filter((item) => priorityIds.has(item.id));
      const topAssets = globalSearchCatalog.filter((item) => item.category === 'Asset').slice(0, 3);
      return [...quick, ...topAssets];
    }

    const terms = q.split(/\s+/).filter(Boolean);
    const scored = globalSearchCatalog
      .map((item) => {
        const titleLower = item.title.toLowerCase();
        const subLower = item.subtitle.toLowerCase();
        const hay = `${titleLower} ${subLower} ${item.category.toLowerCase()} ${item.keywords.toLowerCase()}`;
        if (!terms.every((t) => hay.includes(t))) return null;

        let score = 0;
        if (titleLower === q) score += 240;
        else if (titleLower.startsWith(q)) score += 140;
        else if (titleLower.includes(q)) score += 95;
        if (subLower.includes(q)) score += 45;
        if (item.category === 'Navigation') score += 30;
        if (item.category === 'Asset' || item.category === 'Work Order') score += 20;
        if (item.keywords.toLowerCase().includes(q)) score += 15;
        return { item, score };
      })
      .filter((entry): entry is { item: (typeof globalSearchCatalog)[number]; score: number } => entry !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, 9)
      .map((entry) => entry.item);

    return scored;
  }, [globalSearchCatalog, searchQuery]);

  const executeSearchResult = useCallback(
    (item: (typeof globalSearchResults)[number]) => {
      item.onSelect();
      setIsSearchOpen(false);
      setMobileSearchOpen(false);
      setSearchActiveIndex(0);
      if (!item.keepQueryOnSelect) {
        setSearchQuery('');
      }
      searchInputRef.current?.blur();
      mobileSearchInputRef.current?.blur();
    },
    []
  );

  const handleSearchInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const totalCount = globalSearchResults.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsSearchOpen(true);
      if (totalCount > 0) {
        setSearchActiveIndex((prev) => (prev + 1) % totalCount);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsSearchOpen(true);
      if (totalCount > 0) {
        setSearchActiveIndex((prev) => (prev - 1 + totalCount) % totalCount);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (totalCount > 0) {
        const idx = Math.min(searchActiveIndex, totalCount - 1);
        executeSearchResult(globalSearchResults[idx]);
      } else if (searchQuery.trim()) {
        setActiveTab('overview');
        setIsSearchOpen(false);
        setMobileSearchOpen(false);
        searchInputRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (isSearchOpen) {
        setIsSearchOpen(false);
      } else {
        setSearchQuery('');
        setMobileSearchOpen(false);
        e.currentTarget.blur();
      }
    }
  };

  const renderSearchResultsPanel = () => {
    const trimmed = searchQuery.trim();
    const safeIdx = globalSearchResults.length > 0 ? Math.min(searchActiveIndex, globalSearchResults.length - 1) : -1;
    const toneClass = (tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'neutral') => {
      switch (tone) {
        case 'emerald':
          return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25';
        case 'rose':
          return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25';
        case 'amber':
          return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25';
        case 'blue':
          return 'bg-g-blueLight text-g-blue border-g-blue/30';
        default:
          return 'bg-g-surfaceElevated text-g-textSecondary border-g-border';
      }
    };

    return (
      <div role="listbox" aria-label="Global dashboard search results" className="flex flex-col max-h-[65vh] overflow-y-auto">
        <div className="px-3.5 py-2 border-b border-g-border bg-g-surfaceElevated/80 flex items-center justify-between text-[11px] text-g-textSecondary">
          <span className="font-medium">
            {trimmed
              ? `${globalSearchResults.length} match${globalSearchResults.length === 1 ? '' : 'es'} for "${trimmed}"`
              : 'Quick jump: sections, live assets & commands'}
          </span>
          <span className="hidden sm:inline font-mono text-[10px] text-g-textMuted">
            ↑↓ Navigate · ↵ Open · Esc Close
          </span>
        </div>

        {globalSearchResults.length > 0 ? (
          <div className="py-1.5 divide-y divide-g-borderSubtle/50">
            {globalSearchResults.map((item, idx) => {
              const isHighlighted = idx === safeIdx;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={isHighlighted}
                  onMouseEnter={() => setSearchActiveIndex(idx)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => executeSearchResult(item)}
                  className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isHighlighted
                      ? 'bg-g-blueLight/75 text-g-text'
                      : 'hover:bg-g-surfaceElevated/75 text-g-text'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-g-surfaceElevated border border-g-border text-g-textSecondary shrink-0">
                        {item.category}
                      </span>
                      <span className="text-[13px] font-semibold text-g-text truncate">{item.title}</span>
                    </div>
                    <p className="text-xs text-g-textSecondary truncate mt-0.5">{item.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded border ${toneClass(item.badgeTone)}`}>
                        {item.badge}
                      </span>
                    )}
                    <span className={`text-xs font-mono ${isHighlighted ? 'text-g-blue' : 'text-g-textMuted'}`}>↵</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-5 text-center space-y-3">
            <p className="text-xs text-g-textSecondary">
              No views, assets, work orders, or commands matched <span className="font-mono font-semibold text-g-text">"{trimmed}"</span>.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const qCopy = trimmed;
                  setIsSearchOpen(false);
                  setMobileSearchOpen(false);
                  setSearchQuery('');
                  setShowCopilot(true);
                  handleCopilotSend(qCopy);
                }}
                className="px-3 py-1.5 rounded-lg bg-g-blue text-white text-xs font-medium cursor-pointer hover:bg-g-blueHover transition-colors"
              >
                Ask Copilot AI about "{trimmed.slice(0, 24)}{trimmed.length > 24 ? '…' : ''}" →
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSearchQuery('');
                  setSearchActiveIndex(0);
                }}
                className="px-3 py-1.5 rounded-lg bg-g-surfaceElevated border border-g-border text-g-text text-xs font-medium cursor-pointer hover:bg-g-surfaceSubtle transition-colors"
              >
                Clear search
              </button>
            </div>
          </div>
        )}

        {trimmed && (
          <div className="px-3.5 py-2 border-t border-g-border bg-g-surfaceElevated/60 flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setActiveTab('overview');
                setIsSearchOpen(false);
                setMobileSearchOpen(false);
                searchInputRef.current?.blur();
              }}
              className="text-g-blue hover:underline font-medium cursor-pointer flex items-center gap-1.5"
            >
              <span>Filter Fleet Overview assets by "{trimmed}"</span>
              <span>→</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setSearchQuery('');
                setSearchActiveIndex(0);
              }}
              className="text-g-textMuted hover:text-g-text cursor-pointer font-mono text-[11px]"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    );
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <motion.div
      key="page-dashboard"
      initial={shouldReduce ? false : { opacity: 0, y: 8, scale: 0.996 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: shouldReduce ? 0 : 0.28, ease }}
      className="min-h-screen w-full max-w-full overflow-x-hidden bg-g-bg text-g-text font-sans flex flex-col selection:bg-g-blue selection:text-white transition-colors duration-200 relative"
    >
      <ScrollProgressBar showBackToTop={true} />

      {/* Subtle Engineering Blueprint Backdrop & Ambient Gravitational Singularity Vortex */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <SingularityBackdrop isDarkMode={isDarkMode} enabled={showVortexBg} />
        <div className="absolute inset-0 hero-blueprint-grid opacity-20" />
        <div className="absolute -top-40 -right-40 w-[540px] h-[540px] rounded-full hero-ambient-glow-blue opacity-25" />
        <div className="absolute -bottom-48 -left-48 w-[520px] h-[520px] rounded-full hero-ambient-glow-purple opacity-20" />
      </div>

      {/* SynapSYS SaaS Navigation Header */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: dur.base, ease }}
        className={`relative bg-g-surface/92 border-b px-5 sm:px-7 py-3.5 flex items-center justify-between gap-4 z-30 sticky top-0 w-full max-w-full header-scroll-transition ${
          isHeaderScrolled
            ? 'backdrop-blur-md border-g-border shadow-xs'
            : 'border-g-border/50 backdrop-blur-sm'
        }`}
      >
        <div className="flex items-center gap-3.5 shrink-0 min-w-0">
          {/* Navigation Drawer Toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-g-surfaceElevated text-g-textSecondary hover:text-g-text transition-colors cursor-pointer shrink-0 border border-transparent hover:border-g-border"
            title="Open side navigation"
            aria-label="Toggle Side Navigation Drawer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Logo & Facility Context */}
          <div className="flex items-center gap-3.5 min-w-0 shrink-0">
            <div className="group cursor-default flex items-center gap-2">
              <SynapsysLogo variant="horizontal" size="md" isDarkMode={isDarkMode} />
              {currentUser?.company_name && (
                <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-g-border">
                  <span className="w-1.5 h-1.5 rounded-full bg-g-blue"></span>
                  <span className="font-cinzel text-xs font-semibold text-g-text truncate max-w-[180px]">
                    {currentUser.company_name}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowProjectModal(true)}
              className="flex items-center gap-2 text-[13px] text-g-text bg-g-surfaceElevated hover:bg-g-surfaceSubtle px-3.5 py-2 rounded-lg border border-g-border transition-colors cursor-pointer"
              title="Switch facility context"
            >
              <StatusDot status="running" />
              <span className="font-medium truncate max-w-[140px] sm:max-w-[210px]">
                {activeSite?.name.replace(/\s*\(Production Live\)/i, '') || currentProject}
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-g-surface border border-g-border text-cyan-400 font-bold shrink-0">
                {siteCurrency.symbol} {siteCurrency.code}
              </span>
              <svg className="w-4 h-4 text-g-textSecondary ml-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
        </div>

        {/* Global Search Omnibox */}
        <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-lg mx-4 relative z-40">
          <div className="relative w-full">
            <svg className="w-4 h-4 absolute left-3.5 top-2.5 text-g-textSecondary pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              role="combobox"
              aria-expanded={isSearchOpen}
              aria-autocomplete="list"
              aria-label="Global dashboard search"
              placeholder="Search views, assets, work orders, alarms... (/)"
              value={searchQuery}
              onFocus={() => {
                setIsSearchOpen(true);
                setSearchActiveIndex(0);
              }}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
                setSearchActiveIndex(0);
              }}
              onKeyDown={handleSearchInputKeyDown}
              className="w-full bg-g-surfaceElevated border border-g-border rounded-lg text-[13px] text-g-text pl-10 pr-16 py-2 focus:outline-none focus:border-g-blue focus:ring-1 focus:ring-g-blue placeholder-g-textSecondary transition-all"
            />
            <div className="absolute right-2.5 top-1.5 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchActiveIndex(0);
                    searchInputRef.current?.focus();
                  }}
                  className="w-5 h-5 rounded flex items-center justify-center text-g-textMuted hover:text-g-text hover:bg-g-surface transition-colors cursor-pointer text-xs"
                  aria-label="Clear search"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
              <kbd className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-g-surface border border-g-border text-g-textMuted pointer-events-none">/</kbd>
            </div>

            <MotionPopover
              isOpen={isSearchOpen}
              transformOrigin="top center"
              className="absolute left-0 right-0 mt-2 bg-g-surface border border-g-border rounded-xl shadow-2xl overflow-hidden z-50"
            >
              {renderSearchResultsPanel()}
            </MotionPopover>
          </div>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2.5 text-[13px] shrink-0">
          {/* Mobile Search Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !mobileSearchOpen;
              setMobileSearchOpen(next);
              setIsSearchOpen(next);
              if (next) {
                setTimeout(() => mobileSearchInputRef.current?.focus(), 30);
              }
            }}
            className="md:hidden p-2 rounded-lg hover:bg-g-surfaceElevated text-g-textSecondary hover:text-g-text transition-colors cursor-pointer"
            aria-label="Toggle search"
            title="Search dashboard"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </button>
          {/* Live Status Indicator & Refresh */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-g-surfaceElevated text-[13px] transition-colors cursor-pointer"
            title={autoRefresh ? 'Live telemetry streaming. Click to pause.' : 'Telemetry paused. Click to resume.'}
          >
            <StatusDot status={isConnected ? (autoRefresh ? 'live' : 'standby') : 'down'} size="md" />
            <span className="text-[13px] text-g-textSecondary font-medium hidden sm:inline">
              {isConnected ? (autoRefresh ? `Live (${latencyMs}ms)` : 'Paused') : 'Offline'}
            </span>
          </button>

          <button
            onClick={handleManualRefresh}
            className={`p-2 rounded-lg hover:bg-g-surfaceElevated text-g-textSecondary hover:text-g-text transition-colors cursor-pointer ${
              isRefreshing ? 'animate-spin text-g-blue' : ''
            }`}
            title="Force instant telemetry resync"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          {/* Dark / Light Theme Toggle */}
          <button
            onClick={() => onToggleTheme()}
            className="p-2 rounded-lg hover:bg-g-surfaceElevated text-g-textSecondary hover:text-g-text transition-colors cursor-pointer"
            title={isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label="Toggle Dark and Light Mode"
          >
            {isDarkMode ? (
              <svg className="w-4 h-4 text-g-textSecondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-g-textSecondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>

          {/* Gravitational Vortex Backdrop Toggle */}
          <button
            type="button"
            onClick={() => {
              setShowVortexBg((prev) => {
                const next = !prev;
                if (typeof window !== 'undefined') {
                  localStorage.setItem('synapsys_vortex_bg', String(next));
                }
                return next;
              });
            }}
            className={`p-2 rounded-lg transition-all cursor-pointer border ${
              showVortexBg
                ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/25 shadow-xs'
                : 'text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated border-transparent'
            }`}
            title={showVortexBg ? 'Gravitational Vortex FX: Active (click to pause/hide)' : 'Gravitational Vortex FX: Off (click to activate)'}
            aria-label="Toggle Gravitational Vortex Background"
          >
            <svg className={`w-4 h-4 ${showVortexBg ? 'animate-[spin_16s_linear_infinite]' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.25" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a10 10 0 0110 10c0 3.314-1.612 6.25-4.103 8.043M12 22A10 10 0 012 12c0-3.314 1.612-6.25 4.103-8.043" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12a5 5 0 018.66-3.5M17 12a5 5 0 01-8.66 3.5" />
            </svg>
          </button>

          {/* More Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`px-3.5 py-2 rounded-lg text-[13px] font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                showMoreMenu ? 'bg-g-surfaceElevated text-g-text border-g-border' : 'bg-transparent text-g-textSecondary hover:text-g-text border-g-border hover:bg-g-surfaceElevated'
              }`}
            >
              <span>More</span>
              <svg className="w-3.5 h-3.5 text-g-textMuted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <MotionPopover
              isOpen={showMoreMenu}
              className="absolute right-0 mt-1.5 w-60 bg-g-surface border border-g-border rounded-xl shadow-lg py-1.5 z-50 text-[13px]"
            >
                <button
                  onClick={() => { setTutorialStep(0); setShowTutorial(true); setShowMoreMenu(false); }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-g-surfaceElevated text-g-text flex items-center gap-2.5 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-g-textSecondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                  <span>Operations guide</span>
                </button>
                <button
                  onClick={() => { handleLoadSampleCsv(); setShowMoreMenu(false); }}
                  disabled={csvIsLoading}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-g-surfaceElevated text-g-text flex items-center gap-2.5 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-g-textSecondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  <span>{csvIsLoading ? 'Replaying...' : 'Replay shift CSV'}</span>
                </button>
                <button
                  onClick={() => { setShowCopilot(!showCopilot); setShowMoreMenu(false); }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-g-surfaceElevated text-g-text flex items-center gap-2.5 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-g-blue" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/></svg>
                  <span>Copilot AI</span>
                </button>
                <button
                  onClick={() => { setShowHarness(!showHarness); setShowMoreMenu(false); }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-g-surfaceElevated text-g-text flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${data.active_alarms.length > 0 ? 'bg-rose-500' : 'bg-amber-500'}`} />
                    <span>Fault simulator</span>
                  </span>
                  {data.active_alarms.length > 0 && (
                    <span className="px-2 py-0.5 rounded text-xs bg-rose-500/15 text-rose-700 dark:text-rose-400 font-medium">
                      {data.active_alarms.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowVortexBg((prev) => {
                      const next = !prev;
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('synapsys_vortex_bg', String(next));
                      }
                      return next;
                    });
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-g-surfaceElevated text-g-text flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2a10 10 0 0110 10c0 3.314-1.612 6.25-4.103 8.043M12 22A10 10 0 012 12c0-3.314 1.612-6.25 4.103-8.043" />
                    </svg>
                    <span>Gravitational vortex FX</span>
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${showVortexBg ? 'bg-cyan-500/20 text-cyan-300' : 'bg-g-surfaceSubtle text-g-textMuted'}`}>
                    {showVortexBg ? 'ON' : 'OFF'}
                  </span>
                </button>

                <div className="border-t border-g-border my-1" />
                <div className="px-3.5 py-2 text-[13px] text-g-textSecondary flex items-center justify-between">
                  <span>Poll interval</span>
                  <select
                    value={pollInterval}
                    onChange={(e) => setPollInterval(Number(e.target.value))}
                    className="bg-g-surfaceElevated text-g-text rounded px-2 py-1 border border-g-border text-xs focus:outline-none"
                  >
                    <option value={1000}>1s</option>
                    <option value={2000}>2s</option>
                    <option value={5000}>5s</option>
                  </select>
                </div>
                <button
                  onClick={() => { onOpenShowcase(); setShowMoreMenu(false); }}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-g-surfaceElevated text-g-text flex items-center gap-2.5 cursor-pointer"
                >
                  <svg className="w-4 h-4 text-g-textSecondary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  <span>Showcase landing</span>
                </button>
            </MotionPopover>
          </div>

          {/* User Profile */}
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-9 h-9 rounded-full bg-g-surfaceElevated border border-g-border flex items-center justify-center text-sm font-semibold text-g-text hover:border-g-blue/50 transition-colors ml-1 cursor-pointer"
            title={currentUser?.email || 'User profile'}
          >
            {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'D'}
          </button>
        </div>

        {/* Live Telemetry Poll Sweep Hairline */}
        {isConnected && autoRefresh && !shouldReduce && isDocVisible && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden pointer-events-none" aria-hidden="true">
            <div
              className="w-1/3 h-full dash-telemetry-sweep"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, var(--g-blue) 50%, var(--tyrian) 80%, transparent 100%)',
              }}
            />
          </div>
        )}
      </motion.header>

      {/* Mobile Global Search Strip */}
      {mobileSearchOpen && (
        <div ref={mobileSearchContainerRef} className="md:hidden relative z-30 bg-g-surface border-b border-g-border px-4 py-3">
          <div className="relative">
            <svg className="w-4 h-4 absolute left-3 top-2.5 text-g-textSecondary pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref={mobileSearchInputRef}
              type="text"
              placeholder="Search views, assets, work orders, alarms..."
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
                setSearchActiveIndex(0);
              }}
              onKeyDown={handleSearchInputKeyDown}
              className="w-full bg-g-surfaceElevated border border-g-border rounded-lg text-[13px] text-g-text pl-9 pr-14 py-2 focus:outline-none focus:border-g-blue placeholder-g-textSecondary"
            />
            <div className="absolute right-2 top-1.5 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    mobileSearchInputRef.current?.focus();
                  }}
                  className="px-1.5 py-0.5 text-xs text-g-textMuted hover:text-g-text cursor-pointer"
                  aria-label="Clear mobile search"
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen(false);
                  setIsSearchOpen(false);
                }}
                className="px-1.5 py-0.5 text-[11px] font-mono text-g-textSecondary hover:text-g-text cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
          {isSearchOpen && (
            <div className="mt-2 bg-g-surface border border-g-border rounded-xl shadow-xl overflow-hidden">
              {renderSearchResultsPanel()}
            </div>
          )}
        </div>
      )}

      {/* Greek Key Meander Border Strip */}
      <div className="relative z-10">
        <MeanderDivider opacity={0.65} />
      </div>

      {/* Main Production Floor SCADA Command Deck */}
      <main id="live-deck" className="relative z-10 w-full flex flex-col flex-1">
        {/* Diagnostic Fault Harness (Clean Drawer) */}
        <AnimatePresence>
          {showHarness && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: dur.fast, ease }}
              className="bg-g-surfaceElevated border-b border-g-border px-5 sm:px-7 py-3 flex flex-wrap items-center justify-between gap-3 text-[13px] animate-fadeIn"
            >
            <div className="flex items-center gap-2.5 text-g-textSecondary">
              <span className="font-semibold text-g-text">Fault injection:</span>
              <span className="hidden md:inline">Trigger standard failure drills to verify real-time alarms:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => handleChaosInject('spindle_overheat')}
                className="px-3 py-1.5 rounded-md bg-g-surface hover:bg-g-surfaceSubtle border border-g-border text-g-text text-[13px] font-medium transition-colors cursor-pointer"
              >
                Spindle thermal (CNC-101)
              </button>
              <button
                onClick={() => handleChaosInject('vibration_anomaly')}
                className="px-3 py-1.5 rounded-md bg-g-surface hover:bg-g-surfaceSubtle border border-g-border text-g-text text-[13px] font-medium transition-colors cursor-pointer"
              >
                Bearing drift (CNC-101)
              </button>
              <button
                onClick={() => handleChaosInject('hydraulic_loss')}
                className="px-3 py-1.5 rounded-md bg-g-surface hover:bg-g-surfaceSubtle border border-g-border text-g-text text-[13px] font-medium transition-colors cursor-pointer"
              >
                Hydraulic drop (INJ-202)
              </button>
              <button
                onClick={() => handleChaosInject('wire_feed_jam')}
                className="px-3 py-1.5 rounded-md bg-g-surface hover:bg-g-surfaceSubtle border border-g-border text-g-text text-[13px] font-medium transition-colors cursor-pointer"
              >
                Wire feed jam (WLD-303)
              </button>
              <button
                onClick={() => handleChaosInject('restore_all')}
                className="px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-medium text-[13px] transition-colors cursor-pointer"
              >
                Restore nominal
              </button>
            </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real Data Ingest Feedback Banner */}
        <MotionToast
          visible={Boolean(csvFeedback)}
          toastKey={csvFeedback?.text || 'csv-feedback'}
          durationMs={8000}
          progressColorVar={csvFeedback?.type === 'error' ? 'var(--g-red)' : 'var(--g-green)'}
          className={`px-6 py-2 text-xs flex items-center justify-between border-b animate-fadeIn ${
            csvFeedback?.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300'
          }`}
        >
          {csvFeedback && (
            <>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {csvFeedback.type === 'success' ? 'Ingestion success:' : 'Ingestion error:'}
                </span>
                <span>{csvFeedback.text}</span>
              </div>
              <button
                onClick={() => setCsvFeedback(null)}
                className="text-g-textSecondary hover:text-g-text ml-4 cursor-pointer"
              >
                ✕
              </button>
            </>
          )}
        </MotionToast>

        {/* Primary Operational Section Tabs */}
        <Reveal as="div" immediate delay={0.04}>
          <SlidingTabGroup id="main-nav-tabs">
            <nav className="bg-g-surface border-b border-g-border px-5 sm:px-7 lg:px-8 flex items-center gap-5 sm:gap-8 text-sm overflow-x-auto no-scrollbar whitespace-nowrap">
              {[
                { id: 'overview', numeral: '01', label: 'Fleet Overview', subtitle: 'Live Monitoring' },
                { id: 'connectors', numeral: '02', label: 'Field Connectors', subtitle: 'Edge & Ingestion' },
                { id: 'twin', numeral: '03', label: 'Digital Twin', subtitle: 'Floor Layout' },
                { id: 'losses', numeral: '04', label: 'Loss Analysis', subtitle: 'Six Big Losses' },
                { id: 'workorders', numeral: '05', label: 'Work Orders', subtitle: 'Batch Tracking' },
                {
                  id: 'alarms',
                  numeral: '06',
                  label: 'Alarms & Incidents',
                  subtitle: 'ISA-18.2 Triage',
                  badge: data.active_alarms.filter((a) => !a.acknowledged).length > 0
                    ? data.active_alarms.filter((a) => !a.acknowledged).length
                    : null,
                },
                {
                  id: 'inventory',
                  numeral: '07',
                  label: 'Inventory & MRO',
                  subtitle: 'Tooling & Procurement',
                },
                {
                  id: 'acoustic_ai',
                  numeral: '08',
                  label: 'Acoustic AI Twin',
                  subtitle: 'Ultrasonic Stethoscope',
                  badge: 'NEW',
                },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`relative py-4 text-sm transition-all flex items-center gap-3 border-b-2 -mb-[1px] cursor-pointer group ${
                      isActive
                        ? 'border-transparent text-marble font-semibold'
                        : 'border-transparent text-silver hover:text-marble font-normal'
                    }`}
                  >
                    <RomanMedallion numeral={tab.numeral} active={isActive} size="md" />
                    <div className="flex flex-col text-left">
                      <span className="font-cinzel text-[13px] tracking-[0.06em] leading-none">{tab.label}</span>
                      <span className="text-[12px] text-pewter font-sans leading-tight mt-1">{tab.subtitle}</span>
                    </div>
                    <AnimatePresence mode="popLayout">
                      {tab.badge != null && (
                        <motion.span
                          key="alarm-badge"
                          initial={shouldReduce ? false : { opacity: 0, scale: 0.7 }}
                          animate={
                            !shouldReduce && isDocVisible
                              ? { opacity: 1, scale: [1, 1.07] }
                              : { opacity: 1, scale: 1 }
                          }
                          exit={{ opacity: 0, scale: 0.7 }}
                          transition={
                            !shouldReduce && isDocVisible
                              ? {
                                  scale: { duration: 1.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
                                  opacity: { duration: dur.fast },
                                }
                              : { duration: dur.fast }
                          }
                          className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                        >
                          {tab.badge}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {isActive && <SlidingTabIndicator layoutId="main-nav-underline" variant="underline" />}
                  </button>
                );
              })}
            </nav>
          </SlidingTabGroup>
        </Reveal>

        {/* Main Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 sm:pb-10 flex flex-col gap-6 sm:gap-8 max-w-[1720px] w-full mx-auto relative z-10">
          {/* Executive KPI Strip with Midnight Marble Spotlight Cards */}
          <RevealGroup
            as="section"
            immediate
            delayChildren={0.08}
            staggerDelay={0.06}
            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 sm:gap-6"
          >
            {/* Card 1: Overall Plant OEE */}
            <RevealItem variant="grid" className="flex">
              <SpotlightCard
                onClick={() => setSelectedKpiModal('oee')}
                className="w-full p-6 sm:p-7 flex flex-col justify-between cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[13px] text-silver gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <RomanMedallion numeral="01" size="md" active />
                    <span className="font-cinzel tracking-wider font-semibold truncate">OVERALL PLANT OEE</span>
                  </div>
                  <span className="text-xs font-mono text-pewter px-2 py-0.5 rounded bg-g-surfaceElevated border border-g-border shrink-0">Target: 85.0%</span>
                </div>
                <div className="my-4 flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-2">
                    <AnimatedNumber
                      value={data.summary.overall_plant_oee}
                      decimals={1}
                      suffix="%"
                      className={`font-cinzel text-4xl xl:text-[42px] font-bold tracking-tight leading-none ${
                        data.summary.overall_plant_oee >= 85 ? 'text-laurel' : 'text-marble'
                      }`}
                    />
                    <span className={`inline-block w-fit text-xs font-medium px-2.5 py-0.5 rounded-md ${
                      data.summary.overall_plant_oee >= 85
                        ? 'bg-laurel/15 text-laurel border border-laurel/30'
                        : 'bg-coral/15 text-coral border border-coral/30'
                    }`}>
                      {data.summary.overall_plant_oee >= 85 ? 'World Class' : 'Acceptable'}
                    </span>
                  </div>
                  <RadialGauge
                    value={data.summary.overall_plant_oee}
                    size={62}
                    strokeWidth={5}
                    colorVar={data.summary.overall_plant_oee >= 85 ? 'var(--laurel)' : 'var(--coral)'}
                  />
                </div>
                <div className="text-[13px] text-silver pt-3.5 border-t border-line flex items-center justify-between font-mono">
                  <span>Avail <strong className="text-marble font-semibold"><AnimatedNumber value={data.summary.overall_availability} decimals={1} suffix="%" /></strong></span>
                  <span className="text-line">|</span>
                  <span>Perf <strong className="text-marble font-semibold"><AnimatedNumber value={data.summary.overall_performance} decimals={1} suffix="%" /></strong></span>
                  <span className="text-line">|</span>
                  <span>Qual <strong className="text-marble font-semibold"><AnimatedNumber value={data.summary.overall_quality} decimals={1} suffix="%" /></strong></span>
                </div>
              </SpotlightCard>
            </RevealItem>

            {/* Card 2: Production Output */}
            <RevealItem variant="grid" className="flex">
              <SpotlightCard
                onClick={() => setSelectedKpiModal('production')}
                className="w-full p-6 sm:p-7 flex flex-col justify-between cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[13px] text-silver gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <RomanMedallion numeral="02" size="md" active />
                    <span className="font-cinzel tracking-wider font-semibold truncate">PRODUCTION OUTPUT</span>
                  </div>
                  <span className="text-xs font-mono text-pewter px-2 py-0.5 rounded bg-g-surfaceElevated border border-g-border shrink-0">Target: <AnimatedNumber value={data.summary.total_target} decimals={0} /></span>
                </div>
                <div className="my-4 flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-2">
                      <AnimatedNumber
                        value={data.summary.total_output}
                        decimals={0}
                        className="font-cinzel text-4xl xl:text-[42px] font-bold text-marble tracking-tight leading-none"
                      />
                      <span className="text-sm text-silver font-sans">units</span>
                    </div>
                    <span className="text-xs font-mono text-silver">
                      <AnimatedNumber value={(data.summary.total_output / (data.summary.total_target || 1)) * 100} decimals={0} suffix="%" /> Shift Cadence
                    </span>
                  </div>
                  <RadialGauge
                    value={(data.summary.total_output / (data.summary.total_target || 1)) * 100}
                    size={62}
                    strokeWidth={5}
                    colorVar="var(--g-blue)"
                    showLabel
                  />
                </div>
                <div className="text-[13px] text-silver pt-3.5 border-t border-line flex items-center justify-between font-mono">
                  <span className="text-laurel">Conforming: <strong className="font-semibold"><AnimatedNumber value={data.summary.total_good} decimals={0} /></strong></span>
                  <span className="text-line">|</span>
                  <span className="text-crimson">Rejects: <strong className="font-semibold"><AnimatedNumber value={data.summary.total_scrap} decimals={0} /></strong></span>
                </div>
              </SpotlightCard>
            </RevealItem>

            {/* Card 3: Shift Economic Yield */}
            <RevealItem variant="grid" className="flex">
              <SpotlightCard
                onClick={() => setSelectedKpiModal('financial')}
                className="w-full p-6 sm:p-7 flex flex-col justify-between cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[13px] text-silver gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <RomanMedallion numeral="03" size="md" active />
                    <span className="font-cinzel tracking-wider font-semibold truncate">SHIFT ECONOMIC YIELD</span>
                  </div>
                  <span className="text-xs font-mono text-laurel px-2 py-0.5 rounded bg-laurel/10 border border-laurel/25 shrink-0">+{siteCurrency.symbol}{siteCurrency.unitBaseline.toLocaleString()}/unit</span>
                </div>
                <div className="my-4 flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <AnimatedNumber
                      value={data.summary.financial_roi?.net_shift_value_usd || 14970}
                      decimals={2}
                      prefix={siteCurrency.symbol}
                      className="font-cinzel text-3xl sm:text-4xl xl:text-[40px] font-bold text-marble tracking-tight leading-none"
                    />
                    <span className="text-xs text-silver font-sans">Realized Net Shift Value</span>
                  </div>
                  {/* Rising Shift Yield Mini Bars */}
                  <div className="hidden sm:flex items-end gap-1.5 h-10 shrink-0" aria-hidden="true">
                    {[0.38, 0.52, 0.48, 0.68, 0.84, 1].map((hRatio, i) => (
                      <motion.span
                        key={i}
                        initial={shouldReduce ? { scaleY: hRatio } : { scaleY: 0 }}
                        animate={{ scaleY: hRatio }}
                        transition={{ duration: 0.55, delay: 0.08 + i * 0.05, ease }}
                        style={{ transformOrigin: 'bottom' }}
                        className="w-1.5 h-full rounded-t bg-g-blue/75"
                      />
                    ))}
                  </div>
                </div>
                <div className="text-[13px] text-silver pt-3.5 border-t border-line flex items-center justify-between font-mono">
                  <span className="text-crimson">Downtime: -<AnimatedNumber value={data.summary.financial_roi?.downtime_cost_usd || 0} decimals={0} prefix={siteCurrency.symbol} /></span>
                  <span className="text-line">|</span>
                  <span>Gross: <strong className="text-marble font-semibold"><AnimatedNumber value={data.summary.financial_roi?.revenue_generated_usd || 0} decimals={0} prefix={siteCurrency.symbol} /></strong></span>
                </div>
              </SpotlightCard>
            </RevealItem>

            {/* Card 4: Fleet Power & Load */}
            <RevealItem variant="grid" className="flex">
              <SpotlightCard
                onClick={() => setSelectedKpiModal('energy')}
                className="w-full p-6 sm:p-7 flex flex-col justify-between cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[13px] text-silver gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <RomanMedallion numeral="04" size="md" active />
                    <span className="font-cinzel tracking-wider font-semibold truncate">FLEET POWER &amp; LOAD</span>
                  </div>
                  <span className="text-xs font-mono text-laurel px-2 py-0.5 rounded bg-laurel/10 border border-laurel/25 shrink-0"><AnimatedNumber value={data.summary.energy?.green_energy_pct || 44.5} decimals={1} suffix="%" /> Clean</span>
                </div>
                <div className="my-4 space-y-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <AnimatedNumber
                      value={data.summary.energy?.total_power_kw || 79.3}
                      decimals={1}
                      suffix=" kW"
                      className="font-cinzel text-4xl xl:text-[42px] font-bold text-marble tracking-tight leading-none"
                    />
                    <span className="text-xs text-silver font-sans">Active Load</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-g-surfaceElevated overflow-hidden border border-g-border/50">
                    <GrowBar value={data.summary.energy?.green_energy_pct || 44.5} className="h-full rounded-full bg-laurel" />
                  </div>
                </div>
                <div className="text-[13px] text-silver pt-3.5 border-t border-line flex items-center justify-between font-mono">
                  <span className="text-laurel"><strong className="font-semibold"><AnimatedNumber value={data.summary.running_machines} decimals={0} /></strong> Active Assets</span>
                  <span className="text-line">|</span>
                  <span><strong className="text-marble font-semibold"><AnimatedNumber value={data.summary.energy?.specific_energy_kwh_per_unit || 0.43} decimals={2} /></strong> kWh/unit</span>
                </div>
              </SpotlightCard>
            </RevealItem>
          </RevealGroup>

          <SlidingTabContent activeKey={activeTab} minHeightClass="min-h-[420px]">

          {/* TAB 1: Fleet Overview */}
          {activeTab === 'overview' && (
            <motion.div
              key="tab-overview"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-6 font-sans"
            >
              {/* Quiet Shift Toolbar Line with Organization Branding */}
              <Reveal immediate>
                <div className="relative bg-g-surface border border-g-border rounded-xl px-4 sm:px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-[13px] text-g-textSecondary grid-container-surface">
                  <div className="flex flex-wrap items-center gap-3">
                    {currentUser?.company_name && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-g-blueLight border border-g-blue/30 text-g-blue font-cinzel text-xs font-semibold mr-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-g-blue"></span>
                        <span>{currentUser.company_name}</span>
                      </div>
                    )}
                    <SlidingTabGroup id="shift-tabs">
                      <div className="inline-flex rounded-lg bg-g-surfaceElevated p-1 border border-g-border text-[13px]">
                        {(['shift1', 'shift2', 'shift3'] as const).map((sKey) => {
                          const isShiftActive = activeShift === sKey;
                          return (
                            <button
                              key={sKey}
                              onClick={() => {
                                setActiveShift(sKey);
                                pushEvent(
                                  `Shift window changed to ${SHIFT_CONFIGS[sKey].name} (${SHIFT_CONFIGS[sKey].supervisor})`,
                                  'Shift',
                                  'blue'
                                );
                              }}
                              className={`relative px-3 py-1 rounded-md text-[13px] transition-colors cursor-pointer ${
                                isShiftActive ? 'text-g-text font-semibold' : 'text-g-textSecondary hover:text-g-text'
                              }`}
                            >
                              {isShiftActive && <SlidingTabIndicator layoutId="shift-pill" variant="pill" />}
                              <span className="relative z-10">{SHIFT_CONFIGS[sKey].name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </SlidingTabGroup>
                    <span className="hidden sm:inline text-g-textMuted">·</span>
                    <span>Supervisor: <span className="text-g-text font-semibold">{SHIFT_CONFIGS[activeShift].supervisor}</span></span>
                    <span className="hidden sm:inline text-g-textMuted">·</span>
                    <span>{SHIFT_CONFIGS[activeShift].hours} UTC ({SHIFT_CONFIGS[activeShift].elapsedPct}% elapsed)</span>
                    <div className="hidden lg:block w-20 h-1.5 rounded-full bg-g-surfaceElevated overflow-hidden border border-g-border/50" title={`${SHIFT_CONFIGS[activeShift].elapsedPct}% shift elapsed`}>
                      <GrowBar value={SHIFT_CONFIGS[activeShift].elapsedPct} className="h-full rounded-full bg-g-blue" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[13px] font-mono">
                    <span>Cadence: <strong className="text-g-text font-semibold">{SHIFT_CONFIGS[activeShift].taktSec}s</strong></span>
                    <span className="text-g-textMuted">·</span>
                    <span>Target: <strong className="text-g-text font-semibold">{SHIFT_CONFIGS[activeShift].target} units</strong></span>
                    <span className="text-g-textMuted">·</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{data.summary.running_machines} of {data.machines.length} running</span>

                    {/* Live Event Stream Ticker & Expandable Feed */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowEventPopover((v) => !v)}
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-xs font-mono text-g-text cursor-pointer max-w-[240px]"
                        title="Toggle live shift event feed"
                      >
                        <StatusDot
                          status={eventLog[0]?.tone === 'rose' ? 'down' : 'live'}
                          size="sm"
                        />
                        <motion.span
                          key={eventLog[0]?.id || 'evt'}
                          initial={shouldReduce ? false : { opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, ease }}
                          className="truncate text-[11px] text-g-textSecondary"
                        >
                          {eventLog[0]?.label || 'Telemetry online'}
                        </motion.span>
                        <span className="text-[10px] text-g-blue font-semibold shrink-0">
                          {eventLog.length}
                        </span>
                      </button>

                      <MotionPopover
                        isOpen={showEventPopover}
                        className="absolute right-0 mt-2 w-80 sm:w-96 bg-g-surface border border-g-border rounded-xl shadow-2xl p-3.5 z-50 text-xs font-sans"
                      >
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-g-border">
                          <span className="font-cinzel font-semibold text-sm text-g-text">
                            Live Event Stream
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowEventPopover(false)}
                            className="text-g-textMuted hover:text-g-text px-1 cursor-pointer font-mono"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {eventLog.map((ev) => (
                            <div
                              key={ev.id}
                              className="p-2 rounded-lg bg-g-surfaceElevated border border-g-borderSubtle flex items-start justify-between gap-2"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      ev.tone === 'rose'
                                        ? 'bg-rose-500'
                                        : ev.tone === 'emerald'
                                        ? 'bg-emerald-500'
                                        : ev.tone === 'amber'
                                        ? 'bg-amber-500'
                                        : 'bg-g-blue'
                                    }`}
                                  />
                                  <span className="text-[10px] font-mono uppercase text-g-textMuted">
                                    {ev.category}
                                  </span>
                                </div>
                                <p className="text-g-text text-xs leading-snug">{ev.label}</p>
                              </div>
                              <span className="text-[10px] font-mono text-g-textMuted shrink-0">
                                {ev.time}
                              </span>
                            </div>
                          ))}
                        </div>
                      </MotionPopover>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Filter, Sorter, View Mode & Action Bar */}
              <Reveal immediate delay={0.04}>
                <div className="flex flex-wrap items-center justify-between gap-3.5 text-[13px]">
                  {/* Left: Status Filter Segmented Control & View Mode Switcher */}
                  <div className="flex flex-wrap items-center gap-3">
                    <SlidingTabGroup id="status-filter-tabs">
                      <div className="inline-flex rounded-lg bg-g-surfaceElevated p-1 border border-g-border">
                        {(['all', 'running', 'idle', 'down'] as const).map((s) => {
                          const count = s === 'all' ? data.machines.length : data.machines.filter((m) => m.status.toLowerCase() === (s === 'idle' ? 'idle' : s)).length;
                          const label = s === 'all' ? 'All' : s === 'running' ? 'Running' : s === 'idle' ? 'Standby' : 'Down';
                          const active = statusFilter === s;
                          return (
                            <button
                              key={s}
                              onClick={() => setStatusFilter(s)}
                              className={`relative px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
                                active
                                  ? 'text-g-text'
                                  : 'text-g-textSecondary hover:text-g-text'
                              }`}
                            >
                              {active && <SlidingTabIndicator layoutId="status-filter-pill" variant="pill" />}
                              <span className="relative z-10">{label} ({count})</span>
                            </button>
                          );
                        })}
                      </div>
                    </SlidingTabGroup>

                    {/* View Mode Switcher */}
                    <SlidingTabGroup id="view-mode-tabs">
                      <div className="inline-flex rounded-lg bg-g-surfaceElevated p-1 border border-g-border">
                        {(['cards', 'dense', 'health', 'scope'] as const).map((vm) => {
                          const vmLabel =
                            vm === 'cards'
                              ? 'Cards'
                              : vm === 'dense'
                              ? 'Table'
                              : vm === 'health'
                              ? 'Health'
                              : 'Scope';
                          const vmActive = viewMode === vm;
                          return (
                            <button
                              key={vm}
                              onClick={() => {
                                setViewMode(vm);
                                pushEvent(`Overview layout switched to ${vmLabel} mode`, 'View', 'blue');
                              }}
                              className={`relative px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-colors cursor-pointer ${
                                vmActive
                                  ? 'text-g-text'
                                  : 'text-g-textSecondary hover:text-g-text'
                              }`}
                            >
                              {vmActive && <SlidingTabIndicator layoutId="view-mode-pill" variant="pill" />}
                              <span className="relative z-10">{vmLabel}</span>
                            </button>
                          );
                        })}
                      </div>
                    </SlidingTabGroup>
                  </div>

                  {/* Right: Sorter, Export & Add Asset */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2 bg-g-surface h-10 px-3.5 rounded-lg border border-g-border text-[13px]">
                      <span className="text-g-textSecondary font-medium">Sort:</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-transparent text-g-text font-medium focus:outline-none cursor-pointer"
                      >
                        <option value="default" className="bg-g-surface text-g-text">Default</option>
                        <option value="oee_asc" className="bg-g-surface text-g-text">OEE (Lowest first)</option>
                        <option value="scrap_desc" className="bg-g-surface text-g-text">Highest scrap</option>
                        <option value="power_desc" className="bg-g-surface text-g-text">Highest power</option>
                      </select>
                    </div>

                    <MotionButton
                      onClick={handleExportTelemetryCsv}
                      className="h-10 px-4 rounded-lg bg-g-surface hover:bg-g-surfaceElevated border border-g-border text-g-text font-medium text-[13px] flex items-center gap-2 transition-colors cursor-pointer"
                      title="Download telemetry CSV"
                    >
                      <span>Export CSV</span>
                    </MotionButton>

                    <MotionButton
                      onClick={() => setShowShiftReportModal(true)}
                      className="h-10 px-4 rounded-lg bg-g-surface hover:bg-g-surfaceElevated border border-g-border text-g-text font-medium text-[13px] flex items-center gap-2 transition-colors cursor-pointer"
                      title="Generate shift report"
                    >
                      <span>Shift report</span>
                    </MotionButton>

                    <MotionButton
                      primary
                      onClick={() => setShowAddMachineModal(true)}
                      className="h-10 px-4 rounded-lg bg-g-blue hover:bg-g-blueHover text-white font-medium text-[13px] flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>Add asset</span>
                    </MotionButton>
                  </div>
                </div>
              </Reveal>

              {(searchQuery.trim() !== '' || statusFilter !== 'all') && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-g-surfaceElevated border border-g-border text-xs">
                  <div className="flex items-center gap-2 text-g-textSecondary">
                    <span>
                      Showing <strong className="text-g-text">{filteredMachines.length}</strong> of <strong className="text-g-text">{data.machines.length}</strong> assets
                    </span>
                    {searchQuery.trim() !== '' && (
                      <span className="px-2 py-0.5 rounded bg-g-blueLight text-g-blue font-mono border border-g-blue/30">
                        query: "{searchQuery.trim()}"
                      </span>
                    )}
                    {statusFilter !== 'all' && (
                      <span className="px-2 py-0.5 rounded bg-g-surface border border-g-border text-g-text font-mono uppercase">
                        {statusFilter}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="text-g-blue hover:underline font-medium cursor-pointer"
                  >
                    Clear filters
                  </button>
                </div>
              )}

              {filteredMachines.length === 0 ? (
                <div className="bg-g-surface border border-g-border rounded-xl p-10 text-center flex flex-col items-center gap-3">
                  <p className="font-cinzel text-base font-semibold text-g-text">No matching shop-floor equipment</p>
                  <p className="text-sm text-g-textSecondary max-w-md">
                    {searchQuery.trim()
                      ? `No assets matched "${searchQuery.trim()}" under the current status filter.`
                      : `No equipment currently has "${statusFilter}" status.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                    }}
                    className="px-4 py-2 rounded-lg bg-g-blue hover:bg-g-blueHover text-white text-[13px] font-medium cursor-pointer transition-colors"
                  >
                    Reset search & status filters
                  </button>
                </div>
              ) : (
              <SlidingTabContent activeKey={viewMode}>
              {/* VIEW MODE 1: Standard Rich Machine Cards Grid */}
              {viewMode === 'cards' && (
                <RevealGroup immediate staggerDelay={0.05} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredMachines.map((machine) => {
                    const isRunning = machine.status === 'Running';
                    const isDown = machine.status === 'Down';
                    const matchingAlarm = data.active_alarms.find((a) => a.machine_id === machine.machine_id);
                    const needsAttention = isDown || machine.oee_metrics.oee_percentage < 65;
                    const goodPct = Math.min(100, (machine.good_count / (machine.target_output || 1)) * 100);
                    const totalPct = Math.min(100, ((machine.good_count + machine.scrap_count) / (machine.target_output || 1)) * 100);

                    return (
                      <RevealItem key={machine.machine_id} variant="grid" className="flex">
                        <SpotlightCard
                          surface={false}
                          className={`w-full bg-g-surface border border-g-border rounded-xl p-6 flex flex-col justify-between gap-5 transition-colors ${
                            needsAttention ? 'border-l-2 border-l-coral' : ''
                          }`}
                        >
                        <div className="space-y-4">
                          {/* Row 1: Name + status dot + ID */}
                          <div className="flex items-start justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <StatusDot
                                size="md"
                                status={
                                  machine.active_alarm
                                    ? 'alarm'
                                    : isRunning
                                    ? 'running'
                                    : isDown
                                    ? 'down'
                                    : 'standby'
                                }
                              />
                              <h3
                                onClick={() => setSelectedMachine(machine)}
                                className="font-cinzel text-base sm:text-[17px] font-semibold text-g-text truncate hover:text-g-blue cursor-pointer"
                              >
                                {machine.machine_name}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-xs font-medium px-2 py-0.5 rounded bg-g-surfaceElevated border border-g-border text-g-textSecondary">
                                {machine.machine_id}
                              </span>
                              {needsAttention && (
                                <span className="text-xs font-medium text-coral bg-coral/10 border border-coral/30 px-2 py-0.5 rounded">
                                  Attention
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Location & Operator */}
                          <div className="text-[13px] text-g-textSecondary">
                            {machine.location} · {machine.operator}
                          </div>

                          {/* OEE Radial Ring + Big Metric + 3 sub-metrics */}
                          <div className="flex items-center justify-between gap-4 pt-1">
                            <div className="flex items-center gap-3.5">
                              <RadialGauge
                                value={machine.oee_metrics.oee_percentage}
                                size={52}
                                strokeWidth={4.5}
                                colorVar={isRunning ? 'var(--laurel)' : isDown ? 'var(--crimson)' : 'var(--coral)'}
                              />
                              <div>
                                <span className="text-xs uppercase tracking-wider text-g-textMuted font-medium block mb-0.5">OEE</span>
                                <AnimatedNumber
                                  value={machine.oee_metrics.oee_percentage}
                                  decimals={1}
                                  suffix="%"
                                  className={`font-cinzel text-3xl sm:text-[34px] font-bold tabular-nums leading-none ${
                                    isRunning ? 'text-g-text' : isDown ? 'text-crimson' : 'text-coral'
                                  }`}
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-right font-mono">
                              <div>
                                <span className="text-xs text-g-textMuted block">Avail</span>
                                <strong className="text-sm text-g-text font-semibold"><AnimatedNumber value={machine.oee_metrics.availability * 100} decimals={0} suffix="%" /></strong>
                              </div>
                              <div>
                                <span className="text-xs text-g-textMuted block">Perf</span>
                                <strong className="text-sm text-g-text font-semibold"><AnimatedNumber value={machine.oee_metrics.performance * 100} decimals={0} suffix="%" /></strong>
                              </div>
                              <div>
                                <span className="text-xs text-g-textMuted block">Qual</span>
                                <strong className="text-sm text-g-text font-semibold"><AnimatedNumber value={machine.oee_metrics.quality * 100} decimals={0} suffix="%" /></strong>
                              </div>
                            </div>
                          </div>

                          {/* Batch Progress Bar (8px track) */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-g-textSecondary">
                              <span>Shift Progress</span>
                              <span className="font-mono text-[13px] text-g-text font-medium tabular-nums">
                                <AnimatedNumber value={machine.output_count} decimals={0} /> / {machine.target_output} units
                              </span>
                            </div>
                            <div className="relative w-full bg-g-surfaceElevated h-2 rounded-full overflow-hidden">
                              <GrowBar value={totalPct} className="bg-rose-500 h-full absolute inset-0" />
                              <GrowBar value={goodPct} className="bg-emerald-500 h-full absolute inset-0" />
                            </div>
                          </div>

                          {/* Structured Sensors Strip */}
                          {machine.sensors && (
                            <div className="grid grid-cols-3 gap-2 bg-g-surfaceElevated/75 border border-g-borderSubtle rounded-lg p-3 text-center font-mono">
                              <div>
                                <span className="text-xs text-g-textMuted block font-sans">Temp</span>
                                <span className="text-[13px] sm:text-sm font-semibold text-g-text tabular-nums"><AnimatedNumber value={machine.sensors.temperature_c} decimals={1} suffix="°C" /></span>
                              </div>
                              <div>
                                <span className="text-xs text-g-textMuted block font-sans">Power</span>
                                <span className="text-[13px] sm:text-sm font-semibold text-g-text tabular-nums"><AnimatedNumber value={machine.sensors.power_kw} decimals={1} suffix=" kW" /></span>
                              </div>
                              <div>
                                <span className="text-xs text-g-textMuted block font-sans">Cycle</span>
                                <span className="text-[13px] sm:text-sm font-semibold text-g-text tabular-nums"><AnimatedNumber value={machine.cycle_time_sec} decimals={1} suffix="s" /></span>
                              </div>
                            </div>
                          )}

                          {/* Sparkline */}
                          <div className="pt-1">
                            <Sparkline points={machine.recent_cycle_times} ideal={machine.ideal_cycle_time_sec} />
                          </div>

                          {/* Active Alarm */}
                          <AnimatePresence initial={false}>
                            {machine.active_alarm && (
                              <motion.div
                                key={machine.active_alarm}
                                initial={shouldReduce ? false : { opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: dur.fast, ease }}
                                className="bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 px-3.5 py-2.5 rounded-lg text-[13px] flex items-center justify-between gap-2"
                              >
                                <span className="truncate">{machine.active_alarm}</span>
                                <button
                                  onClick={() => handleAcknowledge(matchingAlarm ? matchingAlarm.machine_id : machine.machine_id)}
                                  className="text-xs font-semibold text-rose-900 dark:text-rose-200 hover:text-white px-2.5 py-1 rounded bg-rose-500/20 dark:bg-rose-500/35 hover:bg-rose-600 dark:hover:bg-rose-500 shrink-0 cursor-pointer"
                                >
                                  Acknowledge
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Work-order link & Inspect */}
                        <div className="pt-3.5 border-t border-g-border flex items-center justify-between gap-2 text-[13px]">
                          {machine.work_order ? (
                            <button
                              onClick={() => handleOpenWorkOrder(machine.work_order!.order_id, machine.machine_id)}
                              className="text-g-blue hover:underline flex items-center gap-1.5 font-mono truncate cursor-pointer text-left"
                            >
                              <span>{machine.work_order.order_id}</span>
                              <span className="text-g-textSecondary font-sans truncate">· {machine.work_order.part_name}</span>
                            </button>
                          ) : (
                            <span className="text-g-textSecondary">Standby · No work order</span>
                          )}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setScopeFocusMachineId(machine.machine_id);
                                setViewMode('scope');
                              }}
                              title="Open multi-channel oscilloscope waveform"
                              className="px-2.5 py-1.5 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border hover:border-g-blue/50 text-g-blue text-xs font-mono font-medium cursor-pointer transition-colors"
                            >
                              Scope ↗
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedMachine(machine)}
                              className="px-3 py-1.5 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border hover:border-g-blue/50 text-g-text text-xs font-medium cursor-pointer transition-colors"
                            >
                              Inspect →
                            </button>
                          </div>
                        </div>
                        </SpotlightCard>
                      </RevealItem>
                    );
                  })}
                </RevealGroup>
              )}

              {/* VIEW MODE 2: Predictive Maintenance & RUL Health Matrix View */}
              {viewMode === 'health' && (
                <RevealGroup immediate staggerDelay={0.05} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredMachines.map((machine) => {
                    const pred = machine.predictive || {
                      anomaly_score: 12.0,
                      health_status: 'Optimal' as const,
                      remaining_useful_life_hrs: 420,
                      component_at_risk: 'Spindle Bearing Assembly',
                      root_cause_analysis: 'Vibration and thermal signatures within nominal ISO-10816 limits.',
                    };
                    const isCritical = pred.health_status === 'Critical Risk' || pred.anomaly_score > 60;
                    const isDegraded = pred.health_status === 'Degraded' || pred.anomaly_score > 30;

                    return (
                      <RevealItem key={machine.machine_id} variant="grid" className="flex">
                        <SpotlightCard
                          surface={false}
                          className="w-full g-card p-6 flex flex-col justify-between gap-5 hover:border-g-blue transition-all"
                        >
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-g-borderSubtle">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2.5">
                                <span className="font-mono text-xs font-bold text-g-blue bg-g-blueLight px-2.5 py-0.5 rounded border border-g-blue/30 shrink-0">
                                  {machine.machine_id}
                                </span>
                                <h3 className="font-cinzel font-semibold text-g-text text-base sm:text-[17px] tracking-tight truncate">
                                  {machine.machine_name}
                                </h3>
                              </div>
                              <p className="text-[13px] text-g-textSecondary mt-1.5">
                                {machine.location} • Component Reliability
                              </p>
                            </div>

                            <span className={`px-3 py-1 rounded-full text-xs font-semibold font-mono border shrink-0 ${isCritical
                                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30'
                                : isDegraded
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                              }`}>
                              {pred.health_status}
                            </span>
                          </div>

                          {/* RUL Hours Gauge */}
                          <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-borderSubtle space-y-2.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-g-textSecondary font-mono uppercase text-xs font-semibold">
                                Remaining Useful Life (RUL)
                              </span>
                              <span className={`font-mono font-bold text-base ${isCritical ? 'text-rose-700 dark:text-rose-400' : isDegraded ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'
                                }`}>
                                <AnimatedNumber value={pred.remaining_useful_life_hrs} decimals={0} suffix=" hrs" />
                              </span>
                            </div>
                            <div className="w-full bg-g-surface h-2.5 rounded-full overflow-hidden border border-g-border">
                              <GrowBar
                                value={Math.min(100, (pred.remaining_useful_life_hrs / 500) * 100)}
                                className={`h-full rounded-full ${isCritical ? 'bg-rose-500' : isDegraded ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              />
                            </div>
                            <div className="flex justify-between text-xs font-mono text-g-textMuted">
                              <span>0h (Failure)</span>
                              <span>Nominal: 500h</span>
                            </div>
                          </div>

                          {/* Anomaly & Risk Factor */}
                          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                            <div className="bg-g-surfaceElevated p-3 rounded-lg border border-g-borderSubtle">
                              <span className="block text-xs text-g-textMuted uppercase font-sans">Anomaly Score</span>
                              <span className={`text-lg font-bold ${pred.anomaly_score > 50 ? 'text-rose-700 dark:text-rose-400' : 'text-g-text'
                                }`}>
                                <AnimatedNumber value={pred.anomaly_score} decimals={1} suffix="%" />
                              </span>
                            </div>
                            <div className="bg-g-surfaceElevated p-3 rounded-lg border border-g-borderSubtle">
                              <span className="block text-xs text-g-textMuted uppercase font-sans">Wear Risk Area</span>
                              <span className="text-[13px] font-semibold text-g-text truncate block mt-1 font-sans">
                                {pred.component_at_risk}
                              </span>
                            </div>
                          </div>

                          {/* Diagnostic Root Cause */}
                          <div className="bg-g-surfaceElevated p-3.5 rounded-lg border border-g-borderSubtle text-[13px]">
                            <span className="text-xs font-semibold text-g-blue font-mono uppercase tracking-wider block mb-1">
                              Predictive Diagnostics:
                            </span>
                            <p className="text-g-textSecondary leading-relaxed font-sans text-[13px]">
                              {pred.root_cause_analysis}
                            </p>
                          </div>

                          {/* Physical Safety Margins */}
                          <div className="grid grid-cols-3 gap-2.5 text-center font-mono text-xs pt-1">
                            <div className="bg-g-surfaceElevated p-2.5 rounded-lg border border-g-borderSubtle">
                              <span className="text-xs text-g-textMuted block font-sans">Temp</span>
                              <span className="text-sm font-bold text-g-text"><AnimatedNumber value={machine.sensors?.temperature_c ?? 0} decimals={1} suffix="°C" /></span>
                            </div>
                            <div className="bg-g-surfaceElevated p-2.5 rounded-lg border border-g-borderSubtle">
                              <span className="text-xs text-g-textMuted block font-sans">Vibration</span>
                              <span className="text-sm font-bold text-g-text"><AnimatedNumber value={machine.sensors?.vibration_mm_s ?? 0} decimals={2} suffix=" mm/s" /></span>
                            </div>
                            <div className="bg-g-surfaceElevated p-2.5 rounded-lg border border-g-borderSubtle">
                              <span className="text-xs text-g-textMuted block font-sans">Load</span>
                              <span className="text-sm font-bold text-g-text"><AnimatedNumber value={machine.sensors?.power_kw ?? 0} decimals={1} suffix=" kW" /></span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-3.5 border-t border-g-borderSubtle flex items-center justify-between gap-2.5">
                          <MotionButton
                            primary
                            onClick={() => handleDispatchPreventiveOrder(machine)}
                            className="px-3.5 py-2 rounded-lg bg-g-blue hover:bg-g-blueHover text-white text-[13px] font-medium font-mono flex items-center gap-1.5 transition-colors shadow-xs"
                            title="Generate a Preventive Maintenance work order for this asset"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            <span>Dispatch PM Order</span>
                          </MotionButton>

                          <MotionButton
                            onClick={() => setSelectedMachine(machine)}
                            className="px-3.5 py-2 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-text text-[13px] font-mono font-medium transition-colors"
                          >
                            Diagnostics ↗
                          </MotionButton>
                        </div>
                        </SpotlightCard>
                      </RevealItem>
                    );
                  })}
                </RevealGroup>
              )}

              {/* VIEW MODE 3: High-Density SCADA Table View */}
              {viewMode === 'dense' && (
                <div className="bg-g-surface border border-g-border rounded-xl shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px] font-mono">
                      <thead className="bg-g-surfaceElevated border-b border-g-border text-g-textSecondary uppercase text-xs font-sans">
                        <tr>
                          <th className="p-3.5">Asset ID</th>
                          <th className="p-3.5">Work Center Name</th>
                          <th className="p-3.5">Location</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">OEE %</th>
                          <th className="p-3.5">Avail / Perf / Qual</th>
                          <th className="p-3.5">Batch Output</th>
                          <th className="p-3.5">Temp (°C)</th>
                          <th className="p-3.5">Vib (mm/s)</th>
                          <th className="p-3.5">Power (kW)</th>
                          <th className="p-3.5">Cycle Time</th>
                          <th className="p-3.5 text-right">Supervisory</th>
                        </tr>
                      </thead>
                      <MotionTableBody className="divide-y divide-g-borderSubtle text-g-text">
                        {filteredMachines.map((m, idx) => {
                          const isRunning = m.status === 'Running';
                          const isDown = m.status === 'Down';
                          return (
                            <MotionTableRow
                              key={m.machine_id}
                              index={idx}
                              className="hover:bg-g-surfaceElevated/60 cursor-pointer"
                              onClick={() => setSelectedMachine(m)}
                            >
                              <td className="p-3.5 font-bold text-g-blue font-mono">{m.machine_id}</td>
                              <td className="p-3.5 font-semibold font-sans text-sm">{m.machine_name}</td>
                              <td className="p-3.5 text-g-textSecondary text-[13px] font-sans">{m.location}</td>
                              <td className="p-3.5">
                                <span className={`px-2.5 py-1 rounded text-xs font-semibold font-sans ${isRunning
                                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                    : isDown
                                      ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                                  }`}>
                                  {m.status}
                                </span>
                              </td>
                              <td className="p-3.5 font-bold tabular-nums text-sm">
                                <span className={m.oee_metrics?.oee_percentage >= 85 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}>
                                  {m.oee_metrics?.oee_percentage?.toFixed(1) || '0.0'}%
                                </span>
                              </td>
                              <td className="p-3.5 text-g-textSecondary tabular-nums text-[13px]">
                                {((m.oee_metrics?.availability || 0) * 100).toFixed(0)}% / {((m.oee_metrics?.performance || 0) * 100).toFixed(0)}% / {((m.oee_metrics?.quality || 0) * 100).toFixed(0)}%
                              </td>
                              <td className="p-3.5 tabular-nums">
                                {m.good_count} <span className="text-g-textMuted">/ {m.target_output}</span>
                                {m.scrap_count > 0 && <span className="text-rose-700 dark:text-rose-400 ml-1">({m.scrap_count} sc)</span>}
                              </td>
                              <td className="p-3.5 tabular-nums">
                                {m.sensors?.temperature_c?.toFixed(1) || '0'}°C
                              </td>
                              <td className="p-3.5 tabular-nums">
                                {m.sensors?.vibration_mm_s?.toFixed(2) || '0'}
                              </td>
                              <td className="p-3.5 tabular-nums">
                                {m.sensors?.power_kw?.toFixed(1) || '0'} kW
                              </td>
                              <td className="p-3.5 tabular-nums">
                                {m.cycle_time_sec.toFixed(1)}s <span className="text-g-textMuted">({m.ideal_cycle_time_sec.toFixed(1)}s)</span>
                              </td>
                              <td className="p-3.5 text-right">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedMachine(m);
                                  }}
                                  className="px-3 py-1.5 rounded-md bg-g-surfaceElevated hover:bg-g-blue hover:text-white border border-g-border text-g-blue text-xs font-medium font-sans transition-colors cursor-pointer"
                                >
                                  Inspect ↗
                                </button>
                              </td>
                            </MotionTableRow>
                          );
                        })}
                      </MotionTableBody>
                    </table>
                  </div>

                </div>
              )}

              {/* VIEW MODE 4: Live Multi-Channel Oscilloscope & Correlation Deck */}
              {viewMode === 'scope' && (
                <Suspense fallback={<ChunkPanelFallback label="Loading multi-channel oscilloscope chunk..." minHeight={420} />}>
                  <LazyFleetScopeDeck
                    machines={filteredMachines}
                    focusMachineId={scopeFocusMachineId}
                    onInspectMachine={setSelectedMachine}
                    onTriggerDrill={handleChaosInject}
                    onClearAlarms={() => handleChaosInject('restore_all')}
                  />
                </Suspense>
              )}
              </SlidingTabContent>
              )}
            </motion.div>
          )}

          {/* TAB: Field Connectors & Real Industrial Data Ingestion */}
          {activeTab === 'connectors' && (
            <motion.div
              key="tab-connectors"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-7"
            >
              {/* Top Operational Status & Mode Bar */}
              <Reveal immediate>
                <div className="bg-g-surface border border-g-border rounded-xl p-6 shadow-sm flex flex-col xl:flex-row items-start xl:items-center justify-between gap-5 grid-container-surface">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusDot status="running" size="md" />
                      <RevealWords
                        immediate
                        as="h3"
                        text="Industrial OT Field Connectors & Ingestion Gateway"
                        staggerDelay={0.035}
                        className="font-cinzel text-lg sm:text-xl font-semibold text-g-text tracking-tight"
                      />
                      <span className="text-xs px-2.5 py-0.5 rounded-md bg-blue-500/10 text-g-blue border border-g-blue/20 font-mono">
                        IEC 62541 / Sparkplug B
                      </span>
                    </div>
                    <RevealText immediate delay={0.08} className="text-sm text-g-textSecondary mt-1.5 max-w-2xl leading-relaxed">
                      Physical plant connectivity engine streaming live telemetry from Fanuc/Siemens PLCs, robot cells, Modbus sensors, and historical CSV production shift logs into the ISO-22400 OEE engine.
                    </RevealText>
                  </div>

                  {/* Data Ingestion Mode Switcher & Add Connector Action */}
                  <div className="flex flex-wrap items-center gap-2.5 text-[13px] font-mono">
                    <MotionButton
                      primary
                      onClick={() => setShowAddConnectorModal(true)}
                      className="px-3.5 py-2 rounded-lg bg-g-blue hover:bg-g-blueHover text-white font-semibold text-[13px] font-sans flex items-center gap-1.5 shadow-sm transition-all mr-1"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                      <span>Add Connector</span>
                    </MotionButton>
                    <span className="text-g-textMuted text-xs uppercase tracking-wider mr-1">Active Pipeline:</span>
                    {[
                      { id: 'hybrid', label: 'Hybrid (OPC-UA + Edge REST)' },
                      { id: 'live_plc', label: 'Direct PLC Fieldbus' },
                      { id: 'dataset_replay', label: 'Shift CSV Replay' },
                      { id: 'simulation', label: 'Edge Simulator' },
                    ].map((m) => (
                      <MotionButton
                        key={m.id}
                        primary={(data.summary.data_source_mode || 'hybrid') === m.id}
                        onClick={() => handleChangeDataSourceMode(m.id)}
                        className={`px-3 py-1.5 rounded-lg text-[13px] transition-all border ${(data.summary.data_source_mode || 'hybrid') === m.id
                            ? 'bg-g-blue text-white border-g-blue font-semibold shadow-sm'
                            : 'bg-g-surfaceElevated text-g-textSecondary border-g-border hover:text-g-text'
                          }`}
                      >
                        {m.label}
                      </MotionButton>
                    ))}
                  </div>
                </div>
              </Reveal>

              {/* Real-time Fieldbus Stream Pipeline Visualizer */}
              <Reveal immediate delay={0.05}>
                <div className="bg-g-surface border border-g-border rounded-xl p-5 sm:p-6 text-[13px] grid-container-surface">
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-semibold text-[14px] text-g-text flex items-center gap-2.5">
                      <StatusDot status={(data.connectors || []).some((c) => c.status === 'Connected') ? 'running' : 'standby'} />
                      <span>Real-time edge data pipeline (500k pts/sec stream)</span>
                    </div>
                    <span className="text-xs text-g-textSecondary font-mono">IEC 62541 fieldbus stream</span>
                  </div>
                  <div className="relative py-2 overflow-hidden">
                    {(() => {
                      const conns = data.connectors || [];
                      const plcUp = conns.some((c, i) => (i === 0 || c.protocol === 'OPC-UA' || c.protocol === 'Modbus-TCP') && c.status === 'Connected') || conns.some((c) => c.status === 'Connected');
                      const brokerUp = conns.some((c, i) => (i === 1 || c.protocol === 'MQTT-SparkplugB') && c.status === 'Connected') || conns.filter((c) => c.status === 'Connected').length >= 2;
                      const engineUp = conns.some((c) => c.status === 'Connected');
                      return (
                        <PipelineFlow
                          nodes={[
                            { id: 'plcs', label: 'Field PLCs & cells', color: plcUp ? 'var(--g-green)' : 'var(--g-text-muted)', active: plcUp },
                            { id: 'bridge', label: 'OPC UA edge bridge', color: plcUp ? 'var(--g-blue)' : 'var(--g-text-muted)', active: plcUp },
                            { id: 'broker', label: 'Sparkplug B broker', color: brokerUp ? 'var(--g-yellow)' : 'var(--g-text-muted)', active: brokerUp },
                            { id: 'engine', label: 'Ingestion engine', color: engineUp ? 'var(--g-green)' : 'var(--g-text-muted)', active: engineUp, labelClassName: engineUp ? 'text-emerald-700 dark:text-emerald-400 font-medium' : '' },
                          ]}
                          links={[
                            { id: 'l1', connected: plcUp },
                            { id: 'l2', connected: brokerUp },
                            { id: 'l3', connected: engineUp },
                          ]}
                          durationSec={2.5}
                        />
                      );
                    })()}
                  </div>
                </div>
              </Reveal>

              {/* Firebase Cloud Firestore Sync & Multi-Tenant Bridge */}
              <Suspense fallback={<ChunkPanelFallback label="Loading Firebase Cloud Firestore connector chunk..." minHeight={260} />}>
                <LazyFirebaseCloudPanel
                  status={firebaseStatus}
                  onStatusChange={setFirebaseStatus}
                  onEvent={pushEvent}
                />
              </Suspense>

              {/* Protocol Edge Connectors Grid */}
              <RevealGroup immediate staggerDelay={0.055} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {(data.connectors || []).map((conn) => {
                  const isConn = conn.status === 'Connected';
                  const isPending = Boolean(pendingConnectors[conn.id]);
                  return (
                    <RevealItem key={conn.id} variant="grid" className="flex">
                      <SpotlightCard
                        surface={false}
                        className="w-full bg-g-surface border border-g-border rounded-xl p-5 flex flex-col justify-between gap-4 hover:border-g-blue/40 transition-colors"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-g-surfaceElevated text-g-blue border border-g-border font-medium">
                              {conn.protocol}
                            </span>
                            <motion.span
                              key={conn.status}
                              initial={shouldReduce ? false : { opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: dur.fast, ease }}
                              className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-medium flex items-center gap-1.5 ${
                                isConn
                                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              <StatusDot status={isConn ? 'running' : 'standby'} />
                              <span>{conn.status}</span>
                            </motion.span>
                          </div>

                          <h4 className="font-semibold text-base text-g-text">{conn.name}</h4>
                          <p className="text-xs font-mono text-g-textSecondary truncate mt-1.5 bg-g-surfaceElevated px-2.5 py-1.5 rounded-md border border-g-border" title={conn.endpoint}>
                            {conn.endpoint}
                          </p>

                          <div className="mt-4 space-y-2 text-[13px] font-mono text-g-textSecondary">
                            <div className="flex justify-between gap-2">
                              <span className="text-g-textMuted">Security:</span>
                              <span className="text-g-text truncate max-w-[160px]" title={conn.security_policy}>{conn.security_policy}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-g-textMuted">Throughput:</span>
                              <span className="text-g-text">{conn.packet_rate_hz} Hz ({isConn ? 'Streaming' : 'Paused'})</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-g-textMuted">Node Tags:</span>
                              <span className="text-g-text">{conn.nodes_mapped} mapped</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-g-textMuted">Link State:</span>
                              <span className="text-emerald-700 dark:text-emerald-400">{conn.last_heartbeat}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 mt-2">
                          <MotionButton
                            primary={!isConn}
                            loading={isPending}
                            onClick={() => handleToggleConnector(conn.id)}
                            className={`flex-1 py-2 rounded-lg text-[13px] font-sans font-semibold transition-all border flex items-center justify-center ${isConn
                                ? 'bg-g-surfaceElevated hover:bg-rose-500/10 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-g-border hover:border-rose-500/40 dark:hover:border-rose-800'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                              }`}
                          >
                            <span>{isConn ? 'Disconnect Link' : 'Establish Link'}</span>
                          </MotionButton>
                          <MotionButton
                            onClick={() => handleDeleteConnector(conn.id)}
                            title="Remove connector"
                            className="px-3 py-2 rounded-lg bg-g-surfaceElevated hover:bg-rose-500/10 dark:hover:bg-rose-950/60 text-g-textMuted hover:text-rose-700 dark:hover:text-rose-400 border border-g-border transition-colors text-[13px]"
                          >
                            ✕
                          </MotionButton>
                        </div>
                      </SpotlightCard>
                    </RevealItem>
                  );
                })}
              </RevealGroup>

              {/* Real Factory Shift CSV Ingestion Studio */}
              <Reveal immediate delay={0.08}>
              <div className="bg-g-surface border border-g-border rounded-xl p-6 shadow-sm flex flex-col gap-6 grid-container-surface">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-g-border pb-4">
                  <div>
                    <h3 className="font-cinzel text-lg font-semibold text-g-text flex flex-wrap items-center gap-2.5">
                      <span>Industrial Shift Telemetry Ingestion Studio (CSV / SCADA Logs)</span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono font-normal">
                        Real-World Data Ingest
                      </span>
                    </h3>
                    <RevealText immediate delay={0.1} className="text-sm text-g-textSecondary mt-1.5 leading-relaxed">
                      Feed genuine field production logs recorded from Fanuc CNCs, Engel Injection Presses, or robotic weld stations into SynapSYS to analyze actual shift performance.
                    </RevealText>
                  </div>

                  <div className="flex items-center gap-2">
                    <MotionButton
                      onClick={() => setShowCsvModal(true)}
                      className="px-3.5 py-2 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-text text-[13px] font-sans font-medium transition-colors"
                    >
                      Custom CSV Console
                    </MotionButton>
                  </div>

                </div>

                {/* Two Ingestion Actions Side-by-Side */}
                <RevealGroup immediate staggerDelay={0.07} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* 1-Click Load Shift Dataset */}
                  <RevealItem variant="grid" className="flex">
                  <SpotlightCard surface={false} notch={false} className="w-full bg-g-surfaceElevated border border-g-border rounded-xl p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-g-text text-[13px] uppercase font-mono tracking-wider">
                          Production Shift 1 Dataset Replay
                        </span>
                        <span className="text-xs font-mono text-g-textMuted">11 Frames • 3 Assets</span>
                      </div>
                      <p className="text-[13px] text-g-textSecondary mt-2.5 leading-relaxed">
                        Instant 1-click replay of real machining shift logs containing spindle thermal drift (ALM-E204 on CNC-101), torch nozzle reaming cycle (ALM-W512 on WLD-303), and authentic cycle variance distributions.
                      </p>
                    </div>
                    <MotionButton
                      primary
                      onClick={handleLoadSampleCsv}
                      disabled={csvIsLoading}
                      className="w-full py-2.5 rounded-lg bg-g-blue hover:bg-g-blueHover text-white font-semibold text-[13px] font-sans flex items-center justify-center gap-2 transition-all shadow-sm"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <span>{csvIsLoading ? 'Ingesting Real Shift Dataset...' : 'Replay Machining Shift Dataset (Shift 1 Log)'}</span>
                    </MotionButton>
                  </SpotlightCard>
                  </RevealItem>

                  {/* Upload Custom CSV File */}
                  <RevealItem variant="grid" className="flex">
                  <SpotlightCard surface={false} notch={false} className="w-full bg-g-surfaceElevated border border-g-border rounded-xl p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-g-text text-[13px] uppercase font-mono tracking-wider">
                          Upload Factory Telemetry (.csv)
                        </span>
                        <span className="text-xs font-mono text-g-textMuted">RFC 4180 Compatible</span>
                      </div>
                      <p className="text-[13px] text-g-textSecondary mt-2.5 leading-relaxed">
                        Export telemetry logs from your factory's SCADA, historian, or PLCs and drag-and-drop here. The engine automatically recalculates ISO-22400 Availability, Performance, and Quality in real time.
                      </p>
                    </div>

                    <label className="w-full py-2.5 rounded-lg bg-g-surface hover:bg-g-surfaceSubtle border border-dashed border-g-blue/40 text-g-blue font-semibold text-[13px] font-sans flex items-center justify-center gap-2 cursor-pointer transition-all">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                      </svg>
                      <span>Select or Drop .CSV Telemetry File</span>
                      <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </SpotlightCard>
                  </RevealItem>

                </RevealGroup>

                {/* Sample Telemetry Schema Reference */}
                <div className="bg-g-surfaceElevated rounded-xl p-5 border border-g-border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[13px] font-mono font-semibold text-g-text uppercase">Expected Telemetry Fields (Standard Industrial Schema):</span>
                    <span className="text-xs font-mono text-g-textMuted">JSON & CSV Interchangeable</span>
                  </div>
                  <div className="flex flex-wrap gap-2 font-mono text-xs">
                    {[
                      'timestamp',
                      'machine_id',
                      'machine_name',
                      'status',
                      'output_count',
                      'target_output',
                      'good_count',
                      'scrap_count',
                      'cycle_time_sec',
                      'ideal_cycle_time_sec',
                      'temp_c',
                      'vibration_rms',
                      'power_kw',
                      'pressure_bar',
                      'active_alarm',
                      'alarm_code',
                    ].map((field) => (
                      <span key={field} className="px-2.5 py-1 rounded-md bg-g-surface text-g-text border border-g-border">
                        {field}
                      </span>
                    ))}
                  </div>

                </div>

                {/* Field Engineer cURL Command Snippet */}
                <div className="bg-g-surfaceElevated rounded-xl p-5 border border-g-border font-mono text-[13px]">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-semibold text-g-blue uppercase text-xs">Edge Ingestion Webhook cURL Snippet:</span>
                    <span className="text-g-textMuted text-xs">Push direct from Raspberry Pi / Siemens IOT2050 / Python</span>
                  </div>
                  <pre className="text-g-text bg-g-bg p-4 rounded-lg border border-g-border overflow-x-auto text-xs leading-relaxed">
                    {`curl -X POST http://localhost:8000/api/telemetry \\
  -H "Content-Type: application/json" \\
  -d '{
    "timestamp": "${new Date().toISOString()}",
    "machine_id": "CNC-101",
    "status": "Running",
    "output_count": 86,
    "target_output": 250,
    "good_count": 85,
    "scrap_count": 1,
    "cycle_time_sec": 12.1,
    "ideal_cycle_time_sec": 12.0,
    "sensors": {
      "temperature_c": 52.8,
      "vibration_mm_s": 1.51,
      "power_kw": 22.9,
      "pressure_bar": 6.3
    }
  }'`}
                  </pre>
                </div>
              </div>
              </Reveal>
            </motion.div>
          )}

          {/* TAB 2: INNOVATION - Interactive 2D Digital Twin Shop Floor Layout */}
          {activeTab === 'twin' && (
            <motion.div
              key="tab-twin"
              initial={{ opacity: 0, scale: 0.99, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <Suspense fallback={<ChunkPanelFallback label="Loading 2D spatial digital twin chunk..." minHeight={440} />}>
                <LazyDigitalTwinFloor
                  machines={data.machines}
                  siteName={activeSite?.name || 'Active Facility'}
                  siteLocation={activeSite?.location}
                  lastSync={lastSync}
                  onAddAsset={() => setShowAddMachineModal(true)}
                  onInspectSupervisory={(machine) => setSelectedMachine(machine)}
                  onOpenWorkOrder={handleOpenWorkOrder}
                />
              </Suspense>
            </motion.div>
          )}

          {/* TAB 3: Six Big Losses Analysis */}
          {activeTab === 'losses' && (
            <motion.div
              key="tab-losses"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="bg-g-surface border border-g-border rounded-xl p-6 sm:p-7 shadow-sm flex flex-col gap-6 grid-container-surface"
            >
              <Reveal immediate>
                <RevealWords
                  immediate
                  as="h3"
                  text="Six big losses analysis"
                  staggerDelay={0.04}
                  className="font-cinzel text-lg sm:text-xl font-semibold text-g-text"
                />
                <RevealText immediate delay={0.07} className="text-sm text-g-textSecondary mt-1.5 leading-relaxed">
                  Decomposition of theoretical production availability into real manufacturing losses.
                </RevealText>
              </Reveal>

              {/* OEE Loss Pillars Summary Grid */}
              <RevealGroup immediate staggerDelay={0.06} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    label: 'Availability Loss',
                    pct: 6.2,
                    detail: `Downtime: ${formatSec(data.machines.reduce((a, b) => a + (b.losses?.equipment_failure_sec || 0) + (b.losses?.setup_adjustment_sec || 0), 0))}`,
                    tone: 'text-amber-700 dark:text-amber-400',
                    bar: 'bg-rose-500',
                  },
                  {
                    label: 'Performance Loss',
                    pct: 2.5,
                    detail: `Cycle / Idling: ${formatSec(data.machines.reduce((a, b) => a + (b.losses?.idling_minor_stops_sec || 0) + (b.losses?.reduced_speed_sec || 0), 0))}`,
                    tone: 'text-g-blue',
                    bar: 'bg-g-blue',
                  },
                  {
                    label: 'Quality Loss',
                    pct: 1.9,
                    detail: `${data.summary.total_scrap} rejected units`,
                    tone: 'text-emerald-700 dark:text-emerald-400',
                    bar: 'bg-rose-400',
                  },
                ].map((pillar) => (
                  <RevealItem key={pillar.label} variant="grid" className="flex">
                    <SpotlightCard
                      surface={false}
                      notch={false}
                      className="w-full bg-g-surfaceElevated border border-g-border rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-3 grid-container-surface"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-mono font-semibold uppercase tracking-wider ${pillar.tone}`}>
                          {pillar.label}
                        </span>
                        <AnimatedNumber value={pillar.pct} decimals={1} prefix="-" suffix="%" className="font-cinzel text-lg font-bold text-g-text" />
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-g-surface overflow-hidden">
                        <GrowBar value={Math.min(100, pillar.pct * 12)} className={`h-full rounded-full ${pillar.bar}`} />
                      </div>
                      <span className="text-xs font-mono text-g-textSecondary">{pillar.detail}</span>
                    </SpotlightCard>
                  </RevealItem>
                ))}
              </RevealGroup>

              {/* Interactive ISO-22400 OEE Waterfall & Financial Yield Attribution */}
              <Suspense fallback={<ChunkPanelFallback label="Loading OEE waterfall chunk..." minHeight={220} />}>
                <LazyOeeWaterfallCard
                  machines={data.machines}
                  overallOeePct={data.summary.overall_plant_oee}
                  netShiftValueUsd={data.summary.financial_roi?.net_shift_value_usd || 27309}
                  currencySymbol={siteCurrency.symbol}
                />
              </Suspense>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] sm:text-sm font-mono">
                  <thead className="bg-g-surfaceElevated border-b border-g-border text-g-textSecondary uppercase text-xs">
                    <tr>
                      <th className="p-4">OEE Category</th>
                      <th className="p-4">Loss Classification</th>
                      <th className="p-4">Impact Metric</th>
                      <th className="p-4">Floor Mitigation Strategy</th>
                      <th className="p-4 text-right">Yield Impact</th>
                    </tr>
                  </thead>
                  <MotionTableBody className="divide-y divide-g-borderSubtle text-g-text">
                    <MotionTableRow index={0} className="hover:bg-g-surfaceSubtle/40 h-14">
                      <td className="p-4 font-semibold text-amber-700 dark:text-amber-400">Availability</td>
                      <td className="p-4">1. Equipment failure (unplanned stops)</td>
                      <td className="p-4">Downtime: {formatSec(data.machines.reduce((a, b) => a + (b.losses?.equipment_failure_sec || 0), 0))}</td>
                      <td className="p-4 text-g-textSecondary font-sans">Predictive vibration monitoring & thermal interlocks</td>
                      <td className="p-4 text-right text-rose-700 dark:text-rose-400 font-semibold">
                        <div className="inline-flex flex-col items-end gap-1.5">
                          <span>-3.8% Availability</span>
                          <div className="w-24 h-1.5 rounded-full bg-g-surfaceElevated overflow-hidden">
                            <GrowBar value={95} className="h-full rounded-full bg-rose-500" />
                          </div>
                        </div>
                      </td>
                    </MotionTableRow>
                    <MotionTableRow index={1} className="hover:bg-g-surfaceSubtle/40 h-14">
                      <td className="p-4 font-semibold text-amber-700 dark:text-amber-400">Availability</td>
                      <td className="p-4">2. Setup & adjustments (tooling changes)</td>
                      <td className="p-4">Downtime: {formatSec(data.machines.reduce((a, b) => a + (b.losses?.setup_adjustment_sec || 0), 0))}</td>
                      <td className="p-4 text-g-textSecondary font-sans">SMED standardization & pre-staged tooling</td>
                      <td className="p-4 text-right text-rose-700 dark:text-rose-400 font-semibold">
                        <div className="inline-flex flex-col items-end gap-1.5">
                          <span>-2.4% Availability</span>
                          <div className="w-24 h-1.5 rounded-full bg-g-surfaceElevated overflow-hidden">
                            <GrowBar value={62} delay={0.05} className="h-full rounded-full bg-rose-500/85" />
                          </div>
                        </div>
                      </td>
                    </MotionTableRow>
                    <MotionTableRow index={2} className="hover:bg-g-surfaceSubtle/40 h-14">
                      <td className="p-4 font-semibold text-g-blue">Performance</td>
                      <td className="p-4">3. Idling & minor stoppages (&lt;5 min)</td>
                      <td className="p-4">Loss time: {formatSec(data.machines.reduce((a, b) => a + (b.losses?.idling_minor_stops_sec || 0), 0))}</td>
                      <td className="p-4 text-g-textSecondary font-sans">Automated hopper starvation sensors</td>
                      <td className="p-4 text-right text-rose-700 dark:text-rose-400 font-semibold">
                        <div className="inline-flex flex-col items-end gap-1.5">
                          <span>-1.5% Performance</span>
                          <div className="w-24 h-1.5 rounded-full bg-g-surfaceElevated overflow-hidden">
                            <GrowBar value={40} delay={0.1} className="h-full rounded-full bg-g-blue" />
                          </div>
                        </div>
                      </td>
                    </MotionTableRow>
                    <MotionTableRow index={3} className="hover:bg-g-surfaceSubtle/40 h-14">
                      <td className="p-4 font-semibold text-g-blue">Performance</td>
                      <td className="p-4">4. Reduced speed (cycle elongation)</td>
                      <td className="p-4">Speed delta: {formatSec(data.machines.reduce((a, b) => a + (b.losses?.reduced_speed_sec || 0), 0))}</td>
                      <td className="p-4 text-g-textSecondary font-sans">Spindle feed rate optimization & servo tuning</td>
                      <td className="p-4 text-right text-rose-700 dark:text-rose-400 font-semibold">
                        <div className="inline-flex flex-col items-end gap-1.5">
                          <span>-1.0% Performance</span>
                          <div className="w-24 h-1.5 rounded-full bg-g-surfaceElevated overflow-hidden">
                            <GrowBar value={28} delay={0.15} className="h-full rounded-full bg-g-blue/80" />
                          </div>
                        </div>
                      </td>
                    </MotionTableRow>
                    <MotionTableRow index={4} className="hover:bg-g-surfaceSubtle/40 h-14">
                      <td className="p-4 font-semibold text-emerald-700 dark:text-emerald-400">Quality</td>
                      <td className="p-4">5. Process defects (scrap parts)</td>
                      <td className="p-4"><AnimatedNumber value={data.summary.total_scrap} decimals={0} /> rejected units</td>
                      <td className="p-4 text-g-textSecondary font-sans">In-line optical measurement & tool wear offset</td>
                      <td className="p-4 text-right text-rose-700 dark:text-rose-400 font-semibold">
                        <div className="inline-flex flex-col items-end gap-1.5">
                          <span>-1.6% Quality</span>
                          <div className="w-24 h-1.5 rounded-full bg-g-surfaceElevated overflow-hidden">
                            <GrowBar value={42} delay={0.2} className="h-full rounded-full bg-rose-400" />
                          </div>
                        </div>
                      </td>
                    </MotionTableRow>
                    <MotionTableRow index={5} className="hover:bg-g-surfaceSubtle/40 h-14">
                      <td className="p-4 font-semibold text-emerald-700 dark:text-emerald-400">Quality</td>
                      <td className="p-4">6. Startup / ramp-up rejects</td>
                      <td className="p-4">1 conformance unit</td>
                      <td className="p-4 text-g-textSecondary font-sans">Pre-warmed tooling & closed-loop thermal control</td>
                      <td className="p-4 text-right text-rose-700 dark:text-rose-400 font-semibold">
                        <div className="inline-flex flex-col items-end gap-1.5">
                          <span>-0.3% Quality</span>
                          <div className="w-24 h-1.5 rounded-full bg-g-surfaceElevated overflow-hidden">
                            <GrowBar value={10} delay={0.25} className="h-full rounded-full bg-rose-400/70" />
                          </div>
                        </div>
                      </td>
                    </MotionTableRow>
                  </MotionTableBody>
                </table>
              </div>

              <Reveal immediate delay={0.12}>
                <div className="bg-g-surfaceElevated p-5 rounded-xl border border-g-border flex items-center justify-between text-[13px] sm:text-sm font-mono grid-container-surface">
                  <span className="text-g-textSecondary">Total recoverable variance:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold text-base">
                    <AnimatedNumber value={100 - data.summary.overall_plant_oee} decimals={1} suffix="%" /> (<AnimatedNumber value={data.summary.financial_roi?.net_shift_value_usd || 14970} decimals={0} prefix={siteCurrency.symbol} /> net yield)
                  </span>
                </div>
              </Reveal>
            </motion.div>
          )}

          {/* TAB 4: Active Work Orders */}
          {activeTab === 'workorders' && (
            <motion.div
              key="tab-workorders"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="bg-g-surface border border-g-border rounded-xl p-6 sm:p-7 shadow-sm flex flex-col gap-5 grid-container-surface"
            >
              <Reveal immediate className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-g-border pb-4">
                <div>
                  <RevealWords
                    immediate
                    as="h3"
                    text="Active work orders"
                    staggerDelay={0.04}
                    className="font-cinzel text-lg sm:text-xl font-semibold text-g-text"
                  />
                  <RevealText immediate delay={0.07} className="text-sm text-g-textSecondary mt-1.5 leading-relaxed">
                    Real-time batch progress, customer commitments, and machine allocation.
                  </RevealText>
                </div>
                <MotionButton
                  primary
                  onClick={() => setShowAddWorkOrderModal(true)}
                  className="h-10 px-4 rounded-lg bg-g-blue hover:bg-g-blueHover text-white font-semibold text-[13px] flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>Dispatch work order</span>
                </MotionButton>
              </Reveal>

              {/* Batch Execution Summary Grid */}
              <RevealGroup immediate staggerDelay={0.05} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <RevealItem variant="grid" className="flex">
                  <SpotlightCard surface={false} notch={false} className="w-full bg-g-surfaceElevated border border-g-border rounded-xl p-4 flex flex-col justify-between gap-1.5 grid-container-surface">
                    <span className="text-xs font-mono uppercase tracking-wider text-g-textMuted">Active Orders</span>
                    <AnimatedNumber value={data.machines.length} decimals={0} className="font-cinzel text-2xl font-bold text-g-text" />
                  </SpotlightCard>
                </RevealItem>
                <RevealItem variant="grid" className="flex">
                  <SpotlightCard surface={false} notch={false} className="w-full bg-g-surfaceElevated border border-g-border rounded-xl p-4 flex flex-col justify-between gap-1.5 grid-container-surface">
                    <span className="text-xs font-mono uppercase tracking-wider text-g-textMuted">Units Produced</span>
                    <AnimatedNumber value={data.summary.total_output} decimals={0} className="font-cinzel text-2xl font-bold text-g-blue" />
                  </SpotlightCard>
                </RevealItem>
                <RevealItem variant="grid" className="flex">
                  <SpotlightCard surface={false} notch={false} className="w-full bg-g-surfaceElevated border border-g-border rounded-xl p-4 flex flex-col justify-between gap-1.5 grid-container-surface">
                    <span className="text-xs font-mono uppercase tracking-wider text-g-textMuted">Batch Target</span>
                    <AnimatedNumber value={data.summary.total_target} decimals={0} className="font-cinzel text-2xl font-bold text-g-text" />
                  </SpotlightCard>
                </RevealItem>
                <RevealItem variant="grid" className="flex">
                  <SpotlightCard surface={false} notch={false} className="w-full bg-g-surfaceElevated border border-g-border rounded-xl p-4 flex flex-col justify-between gap-2 grid-container-surface">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-g-textMuted">Fulfillment</span>
                      <AnimatedNumber value={(data.summary.total_output / (data.summary.total_target || 1)) * 100} decimals={1} suffix="%" className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400" />
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-g-surface overflow-hidden">
                      <GrowBar value={(data.summary.total_output / (data.summary.total_target || 1)) * 100} className="h-full rounded-full bg-g-blue" />
                    </div>
                  </SpotlightCard>
                </RevealItem>
              </RevealGroup>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] sm:text-sm font-mono">
                  <thead className="bg-g-surfaceElevated border-b border-g-border text-g-textSecondary uppercase text-xs">
                    <tr>
                      <th className="p-4">Order ID</th>
                      <th className="p-4">Part & description</th>
                      <th className="p-4">Asset</th>
                      <th className="p-4">Customer</th>
                      <th className="p-4">Progress</th>
                      <th className="p-4">Est. completion</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <MotionTableBody className="divide-y divide-g-borderSubtle text-g-text">
                    {data.machines.map((m, idx) => {
                      const orderId = m.work_order?.order_id || 'WO-84900';
                      const batchPct = Math.min(100, (m.output_count / (m.target_output || 1)) * 100);
                      return (
                        <MotionTableRow key={m.machine_id} index={idx} className="hover:bg-g-surfaceSubtle/40 h-14">
                          <td className="p-4">
                            <button
                              onClick={() => handleOpenWorkOrder(orderId, m.machine_id)}
                              className="font-semibold text-g-blue hover:underline flex items-center gap-1.5 font-mono text-[13px] cursor-pointer"
                              title="View order details"
                            >
                              <span>{orderId}</span>
                            </button>
                          </td>
                          <td className="p-4">
                            <span className="font-semibold text-g-text block font-sans text-sm">{m.work_order?.part_name}</span>
                            <span className="text-g-textSecondary text-xs font-mono">{m.work_order?.part_number}</span>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => setSelectedMachine(m)}
                              className="font-medium text-g-text hover:text-g-blue font-mono hover:underline cursor-pointer"
                              title="Inspect asset"
                            >
                              {m.machine_id}
                            </button>
                          </td>
                          <td className="p-4 text-g-textSecondary font-sans">{m.work_order?.customer}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-24 bg-g-surfaceElevated h-2 rounded-full overflow-hidden">
                                <GrowBar
                                  value={batchPct}
                                  className="bg-g-blue h-full rounded-full"
                                />
                              </div>
                              <span className="font-mono tabular-nums text-[13px]">{m.output_count}/{m.target_output}</span>
                            </div>
                          </td>
                          <td className="p-4 font-sans">{m.work_order?.estimated_completion}</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium font-sans ${
                              m.status === 'Running' ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10' : 'text-amber-700 dark:text-amber-400 bg-amber-500/10'
                            }`}>
                              {m.status === 'Running' ? 'In progress' : 'Standby'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleOpenWorkOrder(orderId, m.machine_id)}
                              className="text-g-blue hover:underline text-[13px] font-semibold font-sans cursor-pointer"
                            >
                              Details →
                            </button>
                          </td>
                        </MotionTableRow>
                      );
                    })}
                  </MotionTableBody>
                </table>
              </div>
            </motion.div>
          )}

          {/* TAB 5: Alarms & Incidents */}
          {activeTab === 'alarms' && (() => {
            const activeUnresolvedAlarms = (data.active_alarms || []).filter((a) => !a.acknowledged);
            const acknowledgedHistory = (data.active_alarms || []).filter((a) => a.acknowledged);

            return (
              <motion.div
                key="tab-alarms"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="bg-g-surface border border-g-border rounded-xl p-6 sm:p-7 shadow-sm flex flex-col gap-6 grid-container-surface"
              >
                <Reveal immediate className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-g-border pb-4">
                  <div>
                    <RevealWords
                      immediate
                      as="h3"
                      text="Plant alarms and incidents"
                      staggerDelay={0.04}
                      className="font-cinzel text-lg sm:text-xl font-semibold text-g-text"
                    />
                    <RevealText immediate delay={0.07} className="text-sm text-g-textSecondary mt-1.5 leading-relaxed">
                      Active alarm sequence recording, operator acknowledgement tracking, and safety interlocks.
                    </RevealText>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <span className="text-[13px] text-g-textSecondary">
                      Unresolved: <strong className={activeUnresolvedAlarms.length > 0 ? 'text-rose-700 dark:text-rose-400 font-semibold' : 'text-emerald-700 dark:text-emerald-400'}>{activeUnresolvedAlarms.length}</strong>
                    </span>
                    {activeUnresolvedAlarms.length > 0 && (
                      <MotionButton
                        onClick={handleAcknowledgeAll}
                        className="h-10 px-4 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-text text-[13px] font-semibold cursor-pointer transition-colors"
                      >
                        Acknowledge all
                      </MotionButton>
                    )}
                  </div>
                </Reveal>

                {/* Alarm Triage Summary Grid */}
                <RevealGroup immediate staggerDelay={0.055} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <RevealItem variant="grid" className="flex">
                    <SpotlightCard surface={false} notch={false} className="w-full bg-g-surfaceElevated border border-g-border rounded-xl p-4 flex items-center justify-between grid-container-surface">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-mono uppercase tracking-wider text-g-textMuted">Unresolved Alarms</span>
                        <AnimatedNumber value={activeUnresolvedAlarms.length} decimals={0} className={`font-cinzel text-2xl font-bold ${activeUnresolvedAlarms.length > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'}`} />
                      </div>
                      <StatusDot status={activeUnresolvedAlarms.length > 0 ? 'alarm' : 'running'} size="md" />
                    </SpotlightCard>
                  </RevealItem>
                  <RevealItem variant="grid" className="flex">
                    <SpotlightCard surface={false} notch={false} className="w-full bg-g-surfaceElevated border border-g-border rounded-xl p-4 flex items-center justify-between grid-container-surface">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-mono uppercase tracking-wider text-g-textMuted">P1 Critical Priority</span>
                        <AnimatedNumber value={activeUnresolvedAlarms.filter((a) => a.severity === 'Critical').length} decimals={0} className="font-cinzel text-2xl font-bold text-g-text" />
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-g-surface border border-g-border text-g-textSecondary">ISA-18.2</span>
                    </SpotlightCard>
                  </RevealItem>
                  <RevealItem variant="grid" className="flex">
                    <SpotlightCard surface={false} notch={false} className="w-full bg-g-surfaceElevated border border-g-border rounded-xl p-4 flex items-center justify-between grid-container-surface">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-mono uppercase tracking-wider text-g-textMuted">Acknowledged Shift History</span>
                        <AnimatedNumber value={acknowledgedHistory.length} decimals={0} className="font-cinzel text-2xl font-bold text-g-blue" />
                      </div>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-g-surface border border-g-border text-g-textSecondary">Logged</span>
                    </SpotlightCard>
                  </RevealItem>
                </RevealGroup>

                {/* Clean Fault Simulation Panel */}
                <Reveal immediate delay={0.08}>
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-g-surfaceElevated border border-g-border text-[13px] grid-container-surface">
                  <div className="flex items-center gap-2.5 text-g-textSecondary">
                    <span className="font-semibold text-g-text">Fault injection:</span>
                    <span className="text-xs hidden sm:inline">Trigger standard failure drills to test alarms:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <MotionButton
                      onClick={() => handleChaosInject('spindle_overheat')}
                      className="px-3 py-1.5 rounded-md bg-g-surface hover:bg-g-surfaceSubtle border border-g-border text-g-text text-[13px] font-medium transition-colors cursor-pointer"
                    >
                      Spindle thermal (CNC-101)
                    </MotionButton>
                    <MotionButton
                      onClick={() => handleChaosInject('vibration_anomaly')}
                      className="px-3 py-1.5 rounded-md bg-g-surface hover:bg-g-surfaceSubtle border border-g-border text-g-text text-[13px] font-medium transition-colors cursor-pointer"
                    >
                      Bearing drift (CNC-101)
                    </MotionButton>
                    <MotionButton
                      onClick={() => handleChaosInject('hydraulic_loss')}
                      className="px-3 py-1.5 rounded-md bg-g-surface hover:bg-g-surfaceSubtle border border-g-border text-g-text text-[13px] font-medium transition-colors cursor-pointer"
                    >
                      Hydraulic drop (INJ-202)
                    </MotionButton>
                    <MotionButton
                      onClick={() => handleChaosInject('wire_feed_jam')}
                      className="px-3 py-1.5 rounded-md bg-g-surface hover:bg-g-surfaceSubtle border border-g-border text-g-text text-[13px] font-medium transition-colors cursor-pointer"
                    >
                      Wire feed jam (WLD-303)
                    </MotionButton>
                    <MotionButton
                      onClick={() => handleChaosInject('restore_all')}
                      className="px-3 py-1.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-medium text-[13px] transition-colors cursor-pointer"
                    >
                      Restore nominal
                    </MotionButton>
                  </div>
                </div>
                </Reveal>

                {activeUnresolvedAlarms.length === 0 ? (
                  <motion.div
                    key="alarms-nominal"
                    initial={shouldReduce ? false : { opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: dur.base, ease }}
                    className="py-14 flex flex-col items-center justify-center text-center text-g-textSecondary"
                  >
                    <motion.div
                      initial={shouldReduce ? false : { scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: dur.base, ease }}
                      className="w-11 h-11 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 flex items-center justify-center mb-3 font-bold text-base"
                    >
                      ✓
                    </motion.div>
                    <p className="text-base font-semibold text-g-text">All plant systems nominal</p>
                    <p className="text-[13px] text-g-textMuted mt-1">Zero unacknowledged alarms on active manufacturing lines.</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="alarms-active"
                    initial={shouldReduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: dur.fast, ease }}
                    className="overflow-x-auto"
                  >
                    <table className="w-full text-left text-[13px] sm:text-sm font-mono">
                      <thead className="bg-g-surfaceElevated border-b border-g-border text-g-textSecondary uppercase text-xs">
                        <tr>
                          <th className="p-4">Severity</th>
                          <th className="p-4">Asset</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Fault condition</th>
                          <th className="p-4">Code</th>
                          <th className="p-4">Duration</th>
                          <th className="p-4">State</th>
                          <th className="p-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <MotionTableBody className="divide-y divide-g-borderSubtle text-g-text">
                        {activeUnresolvedAlarms.map((a: AlarmEvent, idx: number) => (
                          <MotionTableRow key={a.machine_id} index={idx} className="hover:bg-g-surfaceSubtle/40 h-14">
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-md text-xs font-medium font-sans ${
                                  a.severity === 'Critical'
                                    ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400'
                                    : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                                }`}
                              >
                                {a.severity === 'Critical' ? 'P1 Critical' : 'P2 Advisory'}
                              </span>
                            </td>
                            <td className="p-4 font-semibold text-g-blue">{a.machine_id}</td>
                            <td className="p-4 text-g-textSecondary font-sans">{a.category || 'Mechanical'}</td>
                            <td className="p-4 text-g-text font-medium font-sans">{a.alarm}</td>
                            <td className="p-4 text-g-textSecondary">{a.code || 'ALM-E204'}</td>
                            <td className="p-4 tabular-nums">{a.duration_sec ? formatSec(a.duration_sec) : '< 30s'}</td>
                            <td className="p-4">
                              <span className="inline-flex items-center gap-2 text-[13px] text-rose-700 dark:text-rose-400 font-sans">
                                <StatusDot status="alarm" />
                                <span>Unresolved</span>
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <MotionButton
                                onClick={() => handleAcknowledge(a.machine_id)}
                                className="px-3.5 py-1.5 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-text text-[13px] font-medium font-sans cursor-pointer transition-colors"
                              >
                                Acknowledge
                              </MotionButton>
                            </td>
                          </MotionTableRow>
                        ))}
                      </MotionTableBody>
                    </table>
                  </motion.div>
                )}

                {/* Acknowledged History */}
                {acknowledgedHistory.length > 0 && (
                  <div className="pt-4 border-t border-g-border text-[13px] text-g-textMuted flex items-center justify-between">
                    <span>Acknowledged history: {acknowledgedHistory.length} cleared during shift</span>
                    <span>Logged to ISO-22400</span>
                  </div>
                )}
              </motion.div>
            );
          })()}

          {/* TAB 7: Inventory & Procurement MRO Deck */}
          {activeTab === 'inventory' && (
            <motion.div
              key="tab-inventory"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <Suspense fallback={<ChunkPanelFallback label="Loading Inventory & Procurement Deck..." />}>
                <LazyInventoryManagementDeck
                  currency={siteCurrency}
                  siteName={activeSite?.name}
                  siteLocation={activeSite?.location}
                />
              </Suspense>
            </motion.div>
          )}

          {/* TAB 8: Acoustic AI Harmonic Resonance Twin & Ultrasonic Stethoscope */}
          {activeTab === 'acoustic_ai' && (
            <motion.div
              key="tab-acoustic_ai"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            >
              <Suspense fallback={<ChunkPanelFallback label="Initializing Acoustic AI Harmonic Twin & Heterodyne Synthesizer..." />}>
                <LazyAcousticResonanceLab
                  machines={data.machines}
                  isDarkMode={isDarkMode}
                />
              </Suspense>
            </motion.div>
          )}
          </SlidingTabContent>

          {/* INNOVATION 3: SynapSYS Copilot AI Slide-Over Drawer */}
          <MotionDrawer
            isOpen={showCopilot}
            side="right"
            onClose={() => setShowCopilot(false)}
            backdropClassName="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            panelClassName="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-g-surface border-l border-g-border shadow-2xl z-50 flex flex-col justify-between"
          >
                {/* Drawer Header */}
                <div className="p-5 border-b border-g-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-g-blue flex items-center justify-center text-white text-sm">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-cinzel font-semibold text-base text-g-text">SynapSYS Copilot AI</h3>
                      <p className="text-xs text-g-textSecondary font-mono">Grounded on Live ISO-22400 Telemetry</p>
                    </div>

                  </div>
                  <button
                    onClick={() => setShowCopilot(false)}
                    className="text-g-textSecondary hover:text-g-text p-1.5 text-base font-mono cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Quick Prompts Chips */}
                <div className="px-5 py-3 bg-g-surfaceElevated border-b border-g-border flex flex-wrap gap-2 text-xs font-mono">
                  <button
                    onClick={() => handleCopilotSend('Analyze our OEE bottlenecks')}
                    className="px-2.5 py-1 rounded-md bg-g-surface hover:bg-g-surfaceSubtle text-g-text border border-g-border transition-colors cursor-pointer"
                  >
                    Bottleneck Analysis
                  </button>
                  <button
                    onClick={() => handleCopilotSend('Predict component failures & RUL')}
                    className="px-2.5 py-1 rounded-md bg-g-surface hover:bg-g-surfaceSubtle text-g-text border border-g-border transition-colors cursor-pointer"
                  >
                    Predictive RUL
                  </button>
                  <button
                    onClick={() => handleCopilotSend('Calculate shift financial ROI and scrap loss')}
                    className="px-2.5 py-1 rounded-md bg-g-surface hover:bg-g-surfaceSubtle text-g-text border border-g-border transition-colors cursor-pointer"
                  >
                    Financial Yield
                  </button>
                </div>

                {/* Messages Chat Flow */}
                <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-3.5 font-sans text-sm">
                  {copilotMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={shouldReduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: dur.fast, ease }}
                      className={`p-3.5 rounded-xl leading-relaxed ${msg.sender === 'user'
                          ? 'bg-g-blue text-white ml-8 self-end'
                          : 'bg-g-surfaceElevated text-g-text border border-g-border mr-4 self-start'
                        }`}
                    >
                      <p>{msg.text}</p>
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2.5 pt-2.5 border-t border-g-border font-mono text-xs text-g-textSecondary space-y-1">
                          <span className="font-semibold text-g-blue block uppercase">Telemetry Citations:</span>
                          {msg.citations.map((c, idx) => (
                            <div key={idx}>• {c}</div>
                          ))}
                        </div>
                      )}
                      <span className="text-xs text-g-textMuted font-mono block mt-1.5 text-right">{msg.timestamp}</span>
                    </motion.div>
                  ))}
                  {copilotLoading && (
                    <div className="bg-g-surfaceElevated text-g-textSecondary border border-g-border p-3.5 rounded-xl mr-8 self-start font-mono text-[13px] flex items-center gap-2.5">
                      <span>Reasoning over live plant telemetry</span>
                      <span className="inline-flex items-center gap-1" aria-hidden="true">
                        {[0, 0.18, 0.36].map((d, idx) => (
                          <motion.span
                            key={idx}
                            animate={shouldReduce || !isDocVisible ? undefined : { opacity: [0.3, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse', delay: d }}
                            className="w-1.5 h-1.5 rounded-full bg-g-blue"
                          />
                        ))}
                      </span>
                    </div>
                  )}
                </div>

                {/* Input Bar */}
                <div className="p-4 border-t border-g-border bg-g-surfaceElevated flex items-center gap-2.5">
                  <input
                    type="text"
                    placeholder="Ask Copilot about assets, alarms, or OEE..."
                    value={copilotInput}
                    onChange={(e) => setCopilotInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCopilotSend();
                    }}
                    className="flex-1 bg-g-surface border border-g-border rounded-lg text-sm text-g-text px-3.5 py-2.5 focus:outline-none focus:border-g-blue font-sans"
                  />
                  <MotionButton
                    primary
                    onClick={() => handleCopilotSend()}
                    disabled={copilotLoading}
                    className="px-4 py-2.5 rounded-lg bg-g-blue hover:bg-g-blueHover text-white font-semibold text-sm transition-colors"
                  >
                    Send
                  </MotionButton>
                </div>
          </MotionDrawer>
        </main>

        {/* Custom CSV Telemetry Ingestion Studio Modal */}
        <MotionModal
          isOpen={showCsvModal}
          backdropClassName="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          panelClassName="bg-g-surface border border-g-border rounded-xl max-w-2xl w-full p-6 flex flex-col gap-4 shadow-2xl font-mono text-xs"
        >
              <div className="flex items-start justify-between border-b border-g-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      CSV INGESTION CONSOLE
                    </span>
                    <h3 className="font-semibold text-g-text text-base font-sans">Raw Shift Telemetry Ingest</h3>
                  </div>
                  <p className="text-g-textSecondary mt-1">Paste RFC-4180 CSV logs directly from your PLC or historian export.</p>
                </div>
                <button onClick={() => setShowCsvModal(false)} className="text-g-textSecondary hover:text-g-text text-lg p-1">
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-g-textSecondary text-xs">
                  CSV Payload Content (Headers: timestamp, machine_id, status, output_count, target_output, good_count, scrap_count, cycle_time_sec, temp_c, vibration_rms, power_kw, active_alarm):
                </label>
                <textarea
                  rows={10}
                  value={customCsvInput}
                  onChange={(e) => setCustomCsvInput(e.target.value)}
                  placeholder="2026-11-05T08:00:00Z,CNC-101,5-Axis CNC Milling Center,Running,85,250,84,1,12.1,12.0,1020.0,20.0,52.4,1.48,22.8,6.3,,&#10;2026-11-05T08:00:00Z,INJ-202,Hydraulic Injection Press,Running,280,500,278,2,6.5,6.5,1820.0,15.0,68.2,1.38,36.2,142.0,,&#10;2026-11-05T08:00:00Z,WLD-303,Robotic Arc Welding Cell,Running,110,160,108,2,18.2,18.0,1980.0,85.0,42.1,0.45,14.6,6.0,,"
                  className="w-full bg-g-surfaceElevated border border-g-border rounded p-3 text-g-text font-mono text-xs focus:outline-none focus:border-g-blue placeholder-zinc-600 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-g-border">
                <button
                  onClick={async () => {
                    try {
                      let res = await fetch('/api/data-source/sample-csv');
                      if (!res.ok) res = await fetch('http://localhost:8000/api/data-source/sample-csv');
                      const json = await res.json();
                      if (json.csv_data) setCustomCsvInput(json.csv_data);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="text-g-blue hover:text-g-blueHover text-xs font-mono cursor-pointer"
                >
                  Pre-fill with Shift 1 Sample
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCsvModal(false)}
                    className="px-3 py-1.5 rounded bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-text font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleImportCustomCsv(customCsvInput)}
                    disabled={csvIsLoading || !customCsvInput.trim()}
                    className="px-4 py-1.5 rounded bg-g-blue hover:bg-g-blueHover disabled:opacity-50 text-white font-medium cursor-pointer"
                  >
                    {csvIsLoading ? 'Parsing...' : 'Ingest & Recalculate OEE'}
                  </button>
                </div>
              </div>
        </MotionModal>

        {/* Commission New Asset Modal */}
        <MotionModal
          isOpen={showAddMachineModal}
          backdropClassName="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          panelClassName="bg-g-surface border border-g-border rounded-xl max-w-3xl w-full p-6 flex flex-col gap-4 shadow-2xl font-mono text-xs max-h-[90vh] overflow-y-auto"
        >
              <div className="flex items-start justify-between border-b border-g-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-g-blue bg-blue-500/10 px-2 py-0.5 rounded border border-g-blue/20 uppercase">
                      Asset Commissioning
                    </span>
                    <h3 className="font-semibold text-g-text text-base font-sans">Commission Physical Asset to Shop Floor</h3>
                  </div>
                  <p className="text-g-textSecondary mt-1">
                    Registers new machine into <strong className="text-g-blue">{activeSite?.name || 'active facility'}</strong> ({activeSite?.region || 'edge'}), connects OT fieldbus controller, and assigns initial MES job.
                  </p>
                </div>
                <button onClick={() => setShowAddMachineModal(false)} className="text-g-textSecondary hover:text-g-text text-lg p-1">
                  ✕
                </button>
              </div>

              {/* Industrial Quick Presets */}
              <div className="bg-g-surfaceElevated p-3 rounded-lg border border-g-border flex flex-col gap-2">
                <span className="text-[10px] uppercase font-bold text-g-textSecondary tracking-wider">
                  Industrial Equipment Presets (Click to autofill):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MACHINE_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setNewMachineForm({
                          machine_id: p.id,
                          machine_name: p.name,
                          location: p.location,
                          operator: p.operator,
                          ideal_cycle_time_sec: p.cycle,
                          target_output: p.target,
                          component: p.comp,
                          plc_controller: p.plc,
                          ip_address: p.ip,
                          opc_node_id: p.node,
                          order_id: p.wo,
                          part_number: p.pn,
                          part_name: p.pname,
                          customer: p.cust,
                        });
                      }}
                      className={`p-2 rounded text-left border transition-all ${newMachineForm.machine_id === p.id
                          ? 'bg-g-blue/15 border-g-blue text-g-blue'
                          : 'bg-g-surface border-g-border text-g-text hover:border-g-textMuted'
                        }`}
                    >
                      <span className="block font-bold text-[11px] text-g-text truncate">{p.id}</span>
                      <span className="block text-[10px] text-g-textSecondary truncate">{p.name.split(' ')[0]} Cell</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateMachine} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Column 1: Machine Core Spec */}
                  <div className="space-y-3">
                    <span className="font-bold text-g-blue text-[11px] uppercase block border-b border-g-border pb-1">
                      1. Machine Identity & Floor Bay
                    </span>

                    <div>
                      <label className="text-g-textSecondary text-[11px] block mb-1">Machine Tag ID (e.g. LSR-404)</label>
                      <input
                        type="text"
                        required
                        value={newMachineForm.machine_id}
                        onChange={(e) => setNewMachineForm({ ...newMachineForm, machine_id: e.target.value.toUpperCase() })}
                        className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-text font-mono focus:outline-none focus:border-g-blue"
                      />
                    </div>

                    <div>
                      <label className="text-g-textSecondary text-[11px] block mb-1">Machine Name / Type</label>
                      <input
                        type="text"
                        required
                        value={newMachineForm.machine_name}
                        onChange={(e) => setNewMachineForm({ ...newMachineForm, machine_name: e.target.value })}
                        className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-sans"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-g-textSecondary text-[11px] block mb-1">Bay Location</label>
                        <input
                          type="text"
                          required
                          value={newMachineForm.location}
                          onChange={(e) => setNewMachineForm({ ...newMachineForm, location: e.target.value })}
                          className="w-full bg-g-surfaceElevated border border-g-border rounded px-2.5 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-sans text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-g-textSecondary text-[11px] block mb-1">Shift Operator</label>
                        <input
                          type="text"
                          required
                          value={newMachineForm.operator}
                          onChange={(e) => setNewMachineForm({ ...newMachineForm, operator: e.target.value })}
                          className="w-full bg-g-surfaceElevated border border-g-border rounded px-2.5 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-sans text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-g-textSecondary text-[11px] block mb-1">Ideal Cycle Time (s)</label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={newMachineForm.ideal_cycle_time_sec}
                          onChange={(e) => setNewMachineForm({ ...newMachineForm, ideal_cycle_time_sec: parseFloat(e.target.value) || 12.0 })}
                          className="w-full bg-g-surfaceElevated border border-g-border rounded px-2.5 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-g-textSecondary text-[11px] block mb-1">Shift Target Units</label>
                        <input
                          type="number"
                          required
                          value={newMachineForm.target_output}
                          onChange={(e) => setNewMachineForm({ ...newMachineForm, target_output: parseInt(e.target.value) || 250 })}
                          className="w-full bg-g-surfaceElevated border border-g-border rounded px-2.5 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-g-textSecondary text-[11px] block mb-1">Critical Monitored Component (PdM)</label>
                      <input
                        type="text"
                        required
                        value={newMachineForm.component}
                        onChange={(e) => setNewMachineForm({ ...newMachineForm, component: e.target.value })}
                        className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-sans text-xs"
                      />
                    </div>
                  </div>

                  {/* Column 2: Physical PLC & Work Order */}
                  <div className="space-y-3">
                    <span className="font-bold text-g-blue text-[11px] uppercase block border-b border-g-border pb-1">
                      2. Physical PLC & Initial MES Job
                    </span>

                    <div>
                      <label className="text-g-textSecondary text-[11px] block mb-1">PLC Hardware Controller Model</label>
                      <input
                        type="text"
                        required
                        value={newMachineForm.plc_controller}
                        onChange={(e) => setNewMachineForm({ ...newMachineForm, plc_controller: e.target.value })}
                        className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-sans text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-g-textSecondary text-[11px] block mb-1">OT Subnet IP</label>
                        <input
                          type="text"
                          required
                          value={newMachineForm.ip_address}
                          onChange={(e) => setNewMachineForm({ ...newMachineForm, ip_address: e.target.value })}
                          className="w-full bg-g-surfaceElevated border border-g-border rounded px-2.5 py-1.5 text-g-blue focus:outline-none focus:border-g-blue font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-g-textSecondary text-[11px] block mb-1">OPC-UA NodeID</label>
                        <input
                          type="text"
                          required
                          value={newMachineForm.opc_node_id}
                          onChange={(e) => setNewMachineForm({ ...newMachineForm, opc_node_id: e.target.value })}
                          className="w-full bg-g-surfaceElevated border border-g-border rounded px-2.5 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-g-textSecondary text-[11px] block mb-1">Initial MES Work Order ID</label>
                      <input
                        type="text"
                        required
                        value={newMachineForm.order_id}
                        onChange={(e) => setNewMachineForm({ ...newMachineForm, order_id: e.target.value })}
                        className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-mono text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-g-textSecondary text-[11px] block mb-1">Part Number</label>
                        <input
                          type="text"
                          required
                          value={newMachineForm.part_number}
                          onChange={(e) => setNewMachineForm({ ...newMachineForm, part_number: e.target.value })}
                          className="w-full bg-g-surfaceElevated border border-g-border rounded px-2.5 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-g-textSecondary text-[11px] block mb-1">Customer Client</label>
                        <input
                          type="text"
                          required
                          value={newMachineForm.customer}
                          onChange={(e) => setNewMachineForm({ ...newMachineForm, customer: e.target.value })}
                          className="w-full bg-g-surfaceElevated border border-g-border rounded px-2.5 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-sans text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-g-textSecondary text-[11px] block mb-1">Part Description</label>
                      <input
                        type="text"
                        required
                        value={newMachineForm.part_name}
                        onChange={(e) => setNewMachineForm({ ...newMachineForm, part_name: e.target.value })}
                        className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-sans text-xs"
                      />
                    </div>
                  </div>

                </div>

                {/* Submit / Cancel Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-g-border">
                  <button
                    type="button"
                    onClick={() => setShowAddMachineModal(false)}
                    className="px-4 py-2 rounded bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-text font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded bg-g-blue hover:bg-g-blueHover text-white font-medium shadow-md transition-colors"
                  >
                    Provision Asset to Fleet
                  </button>
                </div>
              </form>
        </MotionModal>

        {/* Add Field Connector Modal */}
        <MotionModal
          isOpen={showAddConnectorModal}
          backdropClassName="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          panelClassName="bg-g-surface border border-g-border rounded-xl max-w-lg w-full p-6 flex flex-col gap-4 shadow-2xl font-mono text-xs"
        >
              <div className="flex items-start justify-between border-b border-g-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 uppercase">
                      Field Connector Setup
                    </span>
                    <h3 className="font-semibold text-g-text text-base font-sans">Deploy Industrial Field Connector</h3>
                  </div>
                  <p className="text-g-textSecondary mt-1">
                    Establish a real-time protocol link to factory PLCs, edge gateways, or SCADA brokers.
                  </p>
                </div>
                <button onClick={() => setShowAddConnectorModal(false)} className="text-g-textSecondary hover:text-g-text text-lg p-1">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateConnector} className="flex flex-col gap-3">
                <div>
                  <label className="text-g-textSecondary text-[11px] block mb-1">Connector Name</label>
                  <input
                    type="text"
                    required
                    value={newConnectorForm.name}
                    onChange={(e) => setNewConnectorForm({ ...newConnectorForm, name: e.target.value })}
                    placeholder="e.g. Allen-Bradley EtherNet/IP CIP Driver"
                    className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-g-textSecondary text-[11px] block mb-1">Protocol Standard</label>
                    <select
                      value={newConnectorForm.protocol}
                      onChange={(e) => setNewConnectorForm({ ...newConnectorForm, protocol: e.target.value as any })}
                      className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-blue focus:outline-none focus:border-g-blue font-mono"
                    >
                      <option value="OPC-UA">OPC-UA (IEC 62541)</option>
                      <option value="MQTT-SparkplugB">MQTT Sparkplug B</option>
                      <option value="REST-Webhook">REST Ingestion Webhook</option>
                      <option value="Modbus-TCP">Modbus TCP Fieldbus</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-g-textSecondary text-[11px] block mb-1">Scan Rate (Hz)</label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={newConnectorForm.packet_rate_hz}
                      onChange={(e) => setNewConnectorForm({ ...newConnectorForm, packet_rate_hz: parseFloat(e.target.value) || 1.0 })}
                      className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-mono"
                    />
                  </div>

                </div>

                <div>
                  <label className="text-g-textSecondary text-[11px] block mb-1">Server / Broker Endpoint URL</label>
                  <input
                    type="text"
                    required
                    value={newConnectorForm.endpoint}
                    onChange={(e) => setNewConnectorForm({ ...newConnectorForm, endpoint: e.target.value })}
                    placeholder="opc.tcp://192.168.1.140:4840 or mqtt://..."
                    className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-blue focus:outline-none focus:border-g-blue font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-g-textSecondary text-[11px] block mb-1">Security Policy</label>
                    <input
                      type="text"
                      required
                      value={newConnectorForm.security_policy}
                      onChange={(e) => setNewConnectorForm({ ...newConnectorForm, security_policy: e.target.value })}
                      className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-g-textSecondary text-[11px] block mb-1">Tags / NodeIDs Mapped</label>
                    <input
                      type="number"
                      required
                      value={newConnectorForm.nodes_mapped}
                      onChange={(e) => setNewConnectorForm({ ...newConnectorForm, nodes_mapped: parseInt(e.target.value) || 16 })}
                      className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-mono"
                    />
                  </div>

                </div>

                <div className="flex items-center justify-between pt-3 border-t border-g-border mt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddConnectorModal(false)}
                    className="px-4 py-2 rounded bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-text font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded bg-g-blue hover:bg-g-blueHover text-white font-medium shadow-md transition-colors"
                  >
                    Deploy Connector Link
                  </button>
                </div>
              </form>
        </MotionModal>

        {/* Dispatch MES Work Order Modal */}
        <MotionModal
          isOpen={showAddWorkOrderModal}
          backdropClassName="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          panelClassName="bg-g-surface border border-g-border rounded-xl max-w-lg w-full p-6 flex flex-col gap-4 shadow-2xl font-mono text-xs"
        >
              <div className="flex items-start justify-between border-b border-g-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-g-blue bg-blue-500/10 px-2 py-0.5 rounded border border-g-blue/20 uppercase">
                      MES Job Dispatch
                    </span>
                    <h3 className="font-semibold text-g-text text-base font-sans">Dispatch Production Work Order Batch</h3>
                  </div>
                  <p className="text-g-textSecondary mt-1">
                    Assign a manufacturing batch to an active asset and configure target quantities.
                  </p>
                </div>
                <button onClick={() => setShowAddWorkOrderModal(false)} className="text-g-textSecondary hover:text-g-text text-lg p-1">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateWorkOrder} className="flex flex-col gap-3">
                <div>
                  <label className="text-g-textSecondary text-[11px] block mb-1">Target Production Machine</label>
                  <select
                    value={newWorkOrderForm.machine_id}
                    onChange={(e) => setNewWorkOrderForm({ ...newWorkOrderForm, machine_id: e.target.value })}
                    className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-blue focus:outline-none focus:border-g-blue font-mono"
                  >
                    {data.machines.map((m) => (
                      <option key={m.machine_id} value={m.machine_id}>
                        {m.machine_id} — {m.machine_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-g-textSecondary text-[11px] block mb-1">Work Order ID</label>
                    <input
                      type="text"
                      required
                      value={newWorkOrderForm.order_id}
                      onChange={(e) => setNewWorkOrderForm({ ...newWorkOrderForm, order_id: e.target.value })}
                      className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-g-textSecondary text-[11px] block mb-1">Part Number</label>
                    <input
                      type="text"
                      required
                      value={newWorkOrderForm.part_number}
                      onChange={(e) => setNewWorkOrderForm({ ...newWorkOrderForm, part_number: e.target.value })}
                      className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-mono"
                    />
                  </div>

                </div>

                <div>
                  <label className="text-g-textSecondary text-[11px] block mb-1">Part Name & Component Description</label>
                  <input
                    type="text"
                    required
                    value={newWorkOrderForm.part_name}
                    onChange={(e) => setNewWorkOrderForm({ ...newWorkOrderForm, part_name: e.target.value })}
                    className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-g-textSecondary text-[11px] block mb-1">Client / Customer</label>
                    <input
                      type="text"
                      required
                      value={newWorkOrderForm.customer}
                      onChange={(e) => setNewWorkOrderForm({ ...newWorkOrderForm, customer: e.target.value })}
                      className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-sans"
                    />
                  </div>
                  <div>
                    <label className="text-g-textSecondary text-[11px] block mb-1">Batch Target Units</label>
                    <input
                      type="number"
                      required
                      value={newWorkOrderForm.batch_target}
                      onChange={(e) => setNewWorkOrderForm({ ...newWorkOrderForm, batch_target: parseInt(e.target.value) || 250 })}
                      className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-mono"
                    />
                  </div>

                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-g-textSecondary text-[11px] block mb-1">Start Time</label>
                    <input
                      type="text"
                      value={newWorkOrderForm.start_time}
                      onChange={(e) => setNewWorkOrderForm({ ...newWorkOrderForm, start_time: e.target.value })}
                      className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-g-textSecondary text-[11px] block mb-1">Estimated Completion</label>
                    <input
                      type="text"
                      value={newWorkOrderForm.estimated_completion}
                      onChange={(e) => setNewWorkOrderForm({ ...newWorkOrderForm, estimated_completion: e.target.value })}
                      className="w-full bg-g-surfaceElevated border border-g-border rounded px-3 py-1.5 text-g-text focus:outline-none focus:border-g-blue font-mono"
                    />
                  </div>

                </div>

                <div className="flex items-center justify-between pt-3 border-t border-g-border mt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddWorkOrderModal(false)}
                    className="px-4 py-2 rounded bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-text font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded bg-g-blue hover:bg-g-blueHover text-white font-medium shadow-md transition-colors"
                  >
                    Dispatch Batch to Floor
                  </button>
                </div>
              </form>
        </MotionModal>

        {/* 1. ISO-22400 Overall Plant OEE Deep-Dive Modal */}
        <MotionModal
          isOpen={selectedKpiModal === 'oee'}
          backdropClassName="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          panelClassName="bg-g-surface border border-g-border rounded-xl max-w-4xl w-full p-6 sm:p-7 flex flex-col gap-5 shadow-2xl font-sans max-h-[92vh] overflow-y-auto"
        >
              <div className="flex items-start justify-between border-b border-g-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-g-blueLight text-g-blue border border-g-blue/30">
                      ISO-22400 Enterprise Analytics
                    </span>
                    <span className="text-xs text-g-textSecondary font-mono uppercase">
                      {activeSite?.name.replace(/\s*\(Production Live\)/i, '') || 'Detroit Site 04'} • {activeSite?.location || 'High-Bay Cell Area'}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-g-text tracking-tight mt-1.5">
                    Overall Equipment Effectiveness (OEE) Deep-Dive
                  </h3>
                  <p className="text-xs text-g-textSecondary font-mono mt-0.5">
                    Mathematical Model: OEE = Availability ({data.summary.overall_availability.toFixed(1)}%) × Performance ({data.summary.overall_performance.toFixed(1)}%) × Quality ({data.summary.overall_quality.toFixed(1)}%) = <strong className="text-emerald-700 dark:text-emerald-400">{data.summary.overall_plant_oee.toFixed(1)}%</strong>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedKpiModal(null)}
                  className="p-1 rounded-md text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 3 Pillars Decomposition Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pillar 1: Availability */}
                <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-g-textSecondary font-mono mb-2">
                      <span className="font-semibold uppercase text-g-text">Availability (A)</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">{data.summary.overall_availability.toFixed(1)}%</span>
                    </div>
                    <div className="text-xs text-g-textSecondary leading-relaxed">
                      Measures operational uptime versus planned production schedule. Captures machine failures, setup tooling delays, and emergency stops.
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-g-borderSubtle text-[11px] font-mono text-g-textSecondary flex justify-between">
                    <span>Target: 95.0%</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">+2.1% above benchmark</span>
                  </div>

                </div>

                {/* Pillar 2: Performance */}
                <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-g-textSecondary font-mono mb-2">
                      <span className="font-semibold uppercase text-g-text">Performance (P)</span>
                      <span className="text-g-blue font-bold">{data.summary.overall_performance.toFixed(1)}%</span>
                    </div>
                    <div className="text-xs text-g-textSecondary leading-relaxed">
                      Evaluates actual machine cycle speed against ideal engineering cycle time. Quantifies speed losses, minor micro-stops (&lt;5 min), and material feeding latency.
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-g-borderSubtle text-[11px] font-mono text-g-textSecondary flex justify-between">
                    <span>Target: 90.0%</span>
                    <span className="text-g-blue font-semibold">Mean Cadence 12.4s</span>
                  </div>

                </div>

                {/* Pillar 3: Quality */}
                <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-g-textSecondary font-mono mb-2">
                      <span className="font-semibold uppercase text-g-text">Quality (Q)</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">{data.summary.overall_quality.toFixed(1)}%</span>
                    </div>
                    <div className="text-xs text-g-textSecondary leading-relaxed">
                      First-pass conforming parts ratio. Tracks machining process defects, dimensional tolerance rejects, and initial startup scrap parts.
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-g-borderSubtle text-[11px] font-mono text-g-textSecondary flex justify-between">
                    <span>Target: 98.0%</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{data.summary.total_good} Good / {data.summary.total_scrap} Scrap</span>
                  </div>

                </div>
              </div>

              {/* Asset-by-Asset OEE Ranking Table */}
              <div className="bg-g-surfaceElevated p-5 rounded-xl border border-g-border flex flex-col gap-3">
                <span className="text-xs font-bold text-g-text uppercase tracking-wider font-mono border-b border-g-border pb-2">
                  Monitored Asset OEE Contribution Matrix
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-g-textSecondary uppercase text-[10px] border-b border-g-border">
                      <tr>
                        <th className="pb-2">Asset Tag</th>
                        <th className="pb-2">Equipment Type</th>
                        <th className="pb-2">Availability</th>
                        <th className="pb-2">Performance</th>
                        <th className="pb-2">Quality</th>
                        <th className="pb-2">Overall OEE</th>
                        <th className="pb-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <MotionTableBody className="divide-y divide-g-borderSubtle text-g-text">
                      {data.machines.map((m, idx) => (
                        <MotionTableRow key={m.machine_id} index={idx} className="hover:bg-g-surfaceSubtle/50 transition-colors">
                          <td className="py-2.5 font-bold text-g-blue">{m.machine_id}</td>
                          <td className="py-2.5">{m.machine_name}</td>
                          <td className="py-2.5">{(m.oee_metrics.availability * 100).toFixed(1)}%</td>
                          <td className="py-2.5">{(m.oee_metrics.performance * 100).toFixed(1)}%</td>
                          <td className="py-2.5">{(m.oee_metrics.quality * 100).toFixed(1)}%</td>
                          <td className="py-2.5 font-bold text-emerald-700 dark:text-emerald-400">{m.oee_metrics.oee_percentage.toFixed(1)}%</td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => {
                                setSelectedKpiModal(null);
                                setSelectedMachine(m);
                              }}
                              className="px-2.5 py-1 rounded bg-g-surface hover:bg-g-blue hover:text-white border border-g-border text-xs transition-colors font-sans"
                            >
                              Inspect Machine →
                            </button>
                          </td>
                        </MotionTableRow>
                      ))}
                    </MotionTableBody>
                  </table>
                </div>
              </div>

              <div className="pt-3 border-t border-g-border flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    setSelectedKpiModal(null);
                    setActiveTab('losses');
                  }}
                  className="px-4 py-2 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-text font-medium font-mono flex items-center gap-1.5 transition-colors"
                >
                  <span>View Six Big Losses Waterfall →</span>
                </button>
                <button
                  onClick={() => setSelectedKpiModal(null)}
                  className="px-4 py-2 rounded-lg bg-g-blue hover:bg-g-blueHover text-white font-medium transition-colors"
                >
                  Dismiss
                </button>
              </div>
        </MotionModal>

        {/* 2. Production Output & Cadence Analytics Modal */}
        <MotionModal
          isOpen={selectedKpiModal === 'production'}
          backdropClassName="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          panelClassName="bg-g-surface border border-g-border rounded-xl max-w-4xl w-full p-6 sm:p-7 flex flex-col gap-5 shadow-2xl font-sans max-h-[92vh] overflow-y-auto"
        >
              <div className="flex items-start justify-between border-b border-g-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-g-blueLight text-g-blue border border-g-blue/30">
                      Production Takt & Line Cadence
                    </span>
                    <span className="text-xs text-g-textSecondary font-mono uppercase">
                      Detroit Plant Shift 1
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-g-text tracking-tight mt-1.5">
                    Shift Production Output & Cadence Breakdown
                  </h3>
                  <p className="text-xs text-g-textSecondary font-mono mt-0.5">
                    Target: {data.summary.total_target} units • Current Total Output: <strong className="text-g-text">{data.summary.total_output} units</strong> ({((data.summary.total_output / data.summary.total_target) * 100).toFixed(0)}% Cadence)
                  </p>
                </div>
                <button
                  onClick={() => setSelectedKpiModal(null)}
                  className="p-1 rounded-md text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Top 3 Progress & Quality Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border">
                  <span className="text-[11px] font-semibold text-g-textSecondary uppercase tracking-wider font-mono">Total Conforming</span>
                  <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 font-mono mt-2">{data.summary.total_good} units</div>
                  <p className="text-xs text-g-textSecondary mt-1 font-mono">First-pass quality yield: {((data.summary.total_good / data.summary.total_output) * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border">
                  <span className="text-[11px] font-semibold text-g-textSecondary uppercase tracking-wider font-mono">Process Scrap</span>
                  <div className="text-3xl font-bold text-rose-700 dark:text-rose-400 font-mono mt-2">{data.summary.total_scrap} units</div>
                  <p className="text-xs text-g-textSecondary mt-1 font-mono">Scrap rate: {((data.summary.total_scrap / data.summary.total_output) * 100).toFixed(1)}%</p>
                </div>
                <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border">
                  <span className="text-[11px] font-semibold text-g-textSecondary uppercase tracking-wider font-mono">Line Takt Pace</span>
                  <div className="text-3xl font-bold text-g-blue font-mono mt-2">{data.summary.takt_time_sec.toFixed(1)}s</div>
                  <p className="text-xs text-g-textSecondary mt-1 font-mono">Mean Cycle: {data.summary.mean_line_speed_sec.toFixed(1)}s</p>
                </div>
              </div>

              {/* Asset Production Breakdown Table */}
              <div className="bg-g-surfaceElevated p-5 rounded-xl border border-g-border flex flex-col gap-3">
                <span className="text-xs font-bold text-g-text uppercase tracking-wider font-mono border-b border-g-border pb-2">
                  Machine Production Contribution & Active Work Orders
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-g-textSecondary uppercase text-[10px] border-b border-g-border">
                      <tr>
                        <th className="pb-2">Machine Tag</th>
                        <th className="pb-2">Assigned Work Order</th>
                        <th className="pb-2">Batch Progress</th>
                        <th className="pb-2">Conforming</th>
                        <th className="pb-2">Scrap</th>
                        <th className="pb-2 text-right">Cycle Cadence</th>
                      </tr>
                    </thead>
                    <MotionTableBody className="divide-y divide-g-borderSubtle text-g-text">
                      {data.machines.map((m, idx) => (
                        <MotionTableRow key={m.machine_id} index={idx} className="hover:bg-g-surfaceSubtle/50 transition-colors">
                          <td className="py-2.5 font-bold text-g-blue">{m.machine_id}</td>
                          <td className="py-2.5">{m.work_order?.order_id || 'WO-84900'} ({m.work_order?.part_name})</td>
                          <td className="py-2.5">{m.output_count} / {m.target_output} ({((m.output_count / m.target_output) * 100).toFixed(0)}%)</td>
                          <td className="py-2.5 text-emerald-700 dark:text-emerald-400 font-semibold">{m.good_count}</td>
                          <td className="py-2.5 text-rose-700 dark:text-rose-400 font-semibold">{m.scrap_count}</td>
                          <td className="py-2.5 text-right">{m.cycle_time_sec.toFixed(1)}s (Ideal: {m.ideal_cycle_time_sec.toFixed(1)}s)</td>
                        </MotionTableRow>
                      ))}
                    </MotionTableBody>
                  </table>
                </div>
              </div>

              <div className="pt-3 border-t border-g-border flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    setSelectedKpiModal(null);
                    setShowAddWorkOrderModal(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-text font-medium font-mono flex items-center gap-1.5 transition-colors"
                >
                  <span>+ Dispatch New MES Work Order</span>
                </button>
                <button
                  onClick={() => setSelectedKpiModal(null)}
                  className="px-4 py-2 rounded-lg bg-g-blue hover:bg-g-blueHover text-white font-medium transition-colors"
                >
                  Close
                </button>
              </div>
        </MotionModal>

        {/* 3. Shift Economic Value & Financial ROI Modal */}
        <MotionModal
          isOpen={selectedKpiModal === 'financial'}
          backdropClassName="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          panelClassName="bg-g-surface border border-g-border rounded-xl max-w-4xl w-full p-6 sm:p-7 flex flex-col gap-5 shadow-2xl font-sans max-h-[92vh] overflow-y-auto"
        >
              <div className="flex items-start justify-between border-b border-g-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Industrial Monetary Accounting
                    </span>
                    <span className="text-xs text-g-textSecondary font-mono uppercase">
                      ISO-22400 Financial Ledger
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-g-text tracking-tight mt-1.5">
                    Shift Economic Yield & Operational ROI Breakdown
                  </h3>
                  <p className="text-xs text-g-textSecondary font-mono mt-0.5">
                    Unit Contract Baseline: +{siteCurrency.symbol}{siteCurrency.unitBaseline.toLocaleString()} / finished part • Downtime Cost Penalty: {siteCurrency.symbol}{siteCurrency.downtimeHourlyRate.toLocaleString()} / hr per asset
                  </p>
                </div>
                <button
                  onClick={() => setSelectedKpiModal(null)}
                  className="p-1 rounded-md text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Financial Ledger Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
                <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border">
                  <span className="text-[10px] text-g-textSecondary uppercase block">Net Shift Yield</span>
                  <div className="text-2xl font-bold text-g-text mt-1">{siteCurrency.symbol}{data.summary.financial_roi?.net_shift_value_usd.toLocaleString()}</div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 block">Net Realized Value</span>
                </div>
                <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border">
                  <span className="text-[10px] text-g-textSecondary uppercase block">Gross Contract Output</span>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{siteCurrency.symbol}{data.summary.financial_roi?.revenue_generated_usd.toLocaleString()}</div>
                  <span className="text-[10px] text-g-textSecondary mt-1 block">Total Delivered Output</span>
                </div>
                <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border">
                  <span className="text-[10px] text-g-textSecondary uppercase block">Downtime Cost Penalty</span>
                  <div className="text-2xl font-bold text-rose-600 dark:text-rose-500 mt-1">-{siteCurrency.symbol}{data.summary.financial_roi?.downtime_cost_usd}</div>
                  <span className="text-[10px] text-rose-700 dark:text-rose-400 mt-1 block">Unplanned Stoppages</span>
                </div>
                <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border">
                  <span className="text-[10px] text-g-textSecondary uppercase block">AI Recoverable Savings</span>
                  <div className="text-2xl font-bold text-g-blue mt-1">+{siteCurrency.symbol}{data.summary.financial_roi?.potential_savings_usd}</div>
                  <span className="text-[10px] text-g-blue mt-1 block">Via Gemini Diagnostics</span>
                </div>
              </div>

              {/* Economic Accounting Ledger */}
              <div className="bg-g-surfaceElevated p-5 rounded-xl border border-g-border space-y-3">
                <span className="text-xs font-bold text-g-text uppercase tracking-wider font-mono border-b border-g-border pb-2 block">
                  Shift Financial Variance Ledger
                </span>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1 border-b border-g-borderSubtle/50">
                    <span className="text-g-textSecondary">Gross Value from Conforming Output ({data.summary.total_good} units × {siteCurrency.symbol}{siteCurrency.unitBaseline.toLocaleString()}):</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">+{siteCurrency.symbol}{(data.summary.total_good * siteCurrency.unitBaseline).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-g-borderSubtle/50">
                    <span className="text-g-textSecondary">Unplanned Machine Downtime Labor & Capital Penalty:</span>
                    <span className="font-bold text-rose-700 dark:text-rose-400">-{siteCurrency.symbol}{data.summary.financial_roi?.downtime_cost_usd}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-g-borderSubtle/50">
                    <span className="text-g-textSecondary">Scrap Rejection Material Loss ({data.summary.total_scrap} units × {siteCurrency.symbol}{siteCurrency.scrapUnitCost.toLocaleString()} scrap cost):</span>
                    <span className="font-bold text-rose-700 dark:text-rose-400">-{siteCurrency.symbol}{(data.summary.total_scrap * siteCurrency.scrapUnitCost).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1.5 font-bold text-sm bg-g-surface p-2.5 rounded border border-g-border">
                    <span className="text-g-text">Net Realized Economic Value for {activeSite?.name.replace(/\s*\(Production Live\)/i, '') || 'Active Facility'}:</span>
                    <span className="text-emerald-700 dark:text-emerald-400">{siteCurrency.symbol}{data.summary.financial_roi?.net_shift_value_usd.toLocaleString()}</span>
                  </div>

                </div>
              </div>

              <div className="pt-3 border-t border-g-border flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    setSelectedKpiModal(null);
                    setShowCopilot(true);
                    handleCopilotSend('Calculate shift financial ROI, downtime costs, and scrap reduction recommendations');
                  }}
                  className="px-4 py-2 rounded-lg bg-g-blue hover:bg-g-blueHover text-white font-medium font-mono flex items-center gap-1.5 transition-colors"
                >
                  <span>Ask Copilot for Cost Optimization Strategy →</span>
                </button>
                <button
                  onClick={() => setSelectedKpiModal(null)}
                  className="px-4 py-2 rounded-lg border border-g-border hover:bg-g-surfaceElevated text-g-text font-medium transition-colors"
                >
                  Close
                </button>
              </div>
        </MotionModal>

        {/* 4. Fleet Power & Energy Sustainability Modal */}
        <MotionModal
          isOpen={selectedKpiModal === 'energy'}
          backdropClassName="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          panelClassName="bg-g-surface border border-g-border rounded-xl max-w-4xl w-full p-6 sm:p-7 flex flex-col gap-5 shadow-2xl font-sans max-h-[92vh] overflow-y-auto"
        >
              <div className="flex items-start justify-between border-b border-g-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-g-blueLight text-g-blue border border-g-blue/30">
                      Industrial Power & Sustainability
                    </span>
                    <span className="text-xs text-g-textSecondary font-mono uppercase">
                      Active Factory Micro-Grid
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-g-text tracking-tight mt-1.5">
                    Fleet Electrical Load & Carbon Footprint Telemetry
                  </h3>
                  <p className="text-xs text-g-textSecondary font-mono mt-0.5">
                    Active Bus Load: {data.summary.energy?.total_power_kw || 87.1} kW • Carbon Intensity: {data.summary.energy?.carbon_intensity_gco2_per_unit || 165.5} g CO2/pt
                  </p>
                </div>
                <button
                  onClick={() => setSelectedKpiModal(null)}
                  className="p-1 rounded-md text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 4 Energy KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
                <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border">
                  <span className="text-[10px] text-g-textSecondary uppercase block">Total Power Draw</span>
                  <div className="text-2xl font-bold text-g-text mt-1">{data.summary.energy?.total_power_kw || 87.1} kW</div>
                  <span className="text-[10px] text-g-blue mt-1 block">Live 3-Phase Bus Load</span>
                </div>
                <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border">
                  <span className="text-[10px] text-g-textSecondary uppercase block">Specific Energy</span>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{data.summary.energy?.specific_energy_kwh_per_unit || 0.43} kWh/pt</div>
                  <span className="text-[10px] text-g-textSecondary mt-1 block">Energy per Conforming Part</span>
                </div>
                <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border">
                  <span className="text-[10px] text-g-textSecondary uppercase block">Green Grid Ratio</span>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-500 mt-1">{data.summary.energy?.green_energy_pct || 44.5}%</div>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 block">On-site Solar & Wind</span>
                </div>
                <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border">
                  <span className="text-[10px] text-g-textSecondary uppercase block">Shift Energy Cost</span>
                  <div className="text-2xl font-bold text-g-text mt-1">{siteCurrency.symbol}{Math.round((data.summary.energy?.energy_cost_usd || 69.78) * siteCurrency.fxRate).toLocaleString()}</div>
                  <span className="text-[10px] text-g-textSecondary mt-1 block">@ {siteCurrency.powerTariffLabel}</span>
                </div>
              </div>

              {/* Machine Sub-System Power Distribution */}
              <div className="bg-g-surfaceElevated p-5 rounded-xl border border-g-border flex flex-col gap-3">
                <span className="text-xs font-bold text-g-text uppercase tracking-wider font-mono border-b border-g-border pb-2">
                  Machine Sub-System Electrical Power Allocation
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-g-textSecondary uppercase text-[10px] border-b border-g-border">
                      <tr>
                        <th className="pb-2">Equipment Tag</th>
                        <th className="pb-2">Sub-System Load Type</th>
                        <th className="pb-2">Active Power (kW)</th>
                        <th className="pb-2">Thermal Temperature</th>
                        <th className="pb-2">Vibration RMS</th>
                        <th className="pb-2 text-right">Energy State</th>
                      </tr>
                    </thead>
                    <MotionTableBody className="divide-y divide-g-borderSubtle text-g-text">
                      {data.machines.map((m, idx) => (
                        <MotionTableRow key={m.machine_id} index={idx} className="hover:bg-g-surfaceSubtle/50 transition-colors">
                          <td className="py-2.5 font-bold text-g-blue">{m.machine_id}</td>
                          <td className="py-2.5">{m.machine_id === 'CNC-101' ? 'High-Speed Spindle Ceramic Drive' : m.machine_id === 'INJ-202' ? 'Proportional Hydraulic Pump & Heater Bands' : 'GMAW Inverter Arc Source'}</td>
                          <td className="py-2.5 font-bold text-g-text">{m.sensors?.power_kw || 24.1} kW</td>
                          <td className="py-2.5">{m.sensors?.temperature_c || 55.4}°C</td>
                          <td className="py-2.5">{m.sensors?.vibration_mm_s.toFixed(2) || '1.55'} mm/s</td>
                          <td className="py-2.5 text-right">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                              NOMINAL LOAD
                            </span>
                          </td>
                        </MotionTableRow>
                      ))}
                    </MotionTableBody>
                  </table>
                </div>
              </div>

              <div className="pt-3 border-t border-g-border flex items-center justify-between text-xs">
                <button
                  onClick={() => {
                    setSelectedKpiModal(null);
                    setShowHarness(true);
                  }}
                  className="px-4 py-2 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-text font-medium font-mono flex items-center gap-1.5 transition-colors"
                >
                  <span>Open Diagnostic Fault Simulator →</span>
                </button>
                <button
                  onClick={() => setSelectedKpiModal(null)}
                  className="px-4 py-2 rounded-lg bg-g-blue hover:bg-g-blueHover text-white font-medium transition-colors"
                >
                  Close
                </button>
              </div>
        </MotionModal>

        {/* Certified Shift Handover Production Report Modal (ISO-22400 / ISA-95) */}
        <MotionModal
          isOpen={showShiftReportModal}
          backdropClassName="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 font-sans"
          panelClassName="bg-g-surface border border-g-border rounded-xl max-w-4xl w-full p-4 sm:p-7 flex flex-col gap-4 sm:gap-5 shadow-2xl max-h-[88vh] sm:max-h-[92vh] overflow-y-auto"
        >
              {/* Report Header */}
              <div className="flex items-start justify-between border-b border-g-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      Certified Production Handover Report
                    </span>
                    <span className="text-xs text-g-textSecondary font-mono uppercase">
                      ISO-22400 • ISA-95 Standard
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-g-text tracking-tight mt-1.5">
                    {activeSite?.name.replace(/\s*\(Production Live\)/i, '') || 'Detroit Site 04'} — Shift 1 Operational Handover Summary
                  </h3>
                  <p className="text-xs text-g-textSecondary font-mono mt-0.5">
                    Generated at {new Date().toUTCString()} • Host: synapsys-mfg-engine-01 • Supervisor: Operations Lead
                  </p>
                </div>

                <button
                  onClick={() => setShowShiftReportModal(false)}
                  className="p-1 rounded-md text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Key Executive Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
                <div className="bg-g-surfaceElevated p-3.5 rounded-xl border border-g-border">
                  <span className="text-[10px] text-g-textSecondary uppercase block font-sans">Plant OEE</span>
                  <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 block">{data.summary.overall_plant_oee.toFixed(1)}%</span>
                  <span className="text-[10px] text-g-textMuted mt-0.5 block">Target: 85.0%</span>
                </div>
                <div className="bg-g-surfaceElevated p-3.5 rounded-xl border border-g-border">
                  <span className="text-[10px] text-g-textSecondary uppercase block font-sans">Total Output</span>
                  <span className="text-2xl font-bold text-g-text mt-1 block">{data.summary.total_output} units</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 block">{data.summary.total_good} Conforming</span>
                </div>
                <div className="bg-g-surfaceElevated p-3.5 rounded-xl border border-g-border">
                  <span className="text-[10px] text-g-textSecondary uppercase block font-sans">Net Economic Yield</span>
                  <span className="text-2xl font-bold text-g-text mt-1 block">{siteCurrency.symbol}{data.summary.financial_roi?.net_shift_value_usd.toLocaleString()}</span>
                  <span className="text-[10px] text-rose-700 dark:text-rose-400 mt-0.5 block">Downtime: -{siteCurrency.symbol}{data.summary.financial_roi?.downtime_cost_usd}</span>
                </div>
                <div className="bg-g-surfaceElevated p-3.5 rounded-xl border border-g-border">
                  <span className="text-[10px] text-g-textSecondary uppercase block font-sans">Fleet Energy</span>
                  <span className="text-2xl font-bold text-g-blue mt-1 block">{data.summary.energy?.total_power_kw || 87.1} kW</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 block">{data.summary.energy?.green_energy_pct || 44.5}% Green Grid</span>
                </div>
              </div>

              {/* Machine Handover Audit Table */}
              <div className="bg-g-surfaceElevated p-5 rounded-xl border border-g-border flex flex-col gap-3">
                <span className="text-xs font-bold text-g-text uppercase tracking-wider font-mono border-b border-g-border pb-2">
                  Shift Equipment State & Variance Audit
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-g-textSecondary uppercase text-[10px] border-b border-g-border">
                      <tr>
                        <th className="pb-2">Machine Tag</th>
                        <th className="pb-2">Equipment Type</th>
                        <th className="pb-2">State</th>
                        <th className="pb-2">OEE</th>
                        <th className="pb-2">Conforming</th>
                        <th className="pb-2">Scrap</th>
                        <th className="pb-2">Active Work Order</th>
                        <th className="pb-2 text-right">RUL Health</th>
                      </tr>
                    </thead>
                    <MotionTableBody className="divide-y divide-g-borderSubtle text-g-text">
                      {data.machines.map((m, idx) => (
                        <MotionTableRow key={m.machine_id} index={idx} className="hover:bg-g-surfaceSubtle/50 transition-colors">
                          <td className="py-2.5 font-bold text-g-blue">{m.machine_id}</td>
                          <td className="py-2.5 font-sans">{m.machine_name}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${m.status === 'Running' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                              }`}>
                              {m.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 font-bold text-emerald-700 dark:text-emerald-400">{m.oee_metrics.oee_percentage.toFixed(1)}%</td>
                          <td className="py-2.5 text-emerald-700 dark:text-emerald-400">{m.good_count}</td>
                          <td className="py-2.5 text-rose-700 dark:text-rose-400">{m.scrap_count}</td>
                          <td className="py-2.5 font-sans">{m.work_order?.order_id || 'N/A'}: {m.work_order?.part_name}</td>
                          <td className="py-2.5 text-right font-bold text-g-text">{m.predictive?.remaining_useful_life_hrs || 280} hrs</td>
                        </MotionTableRow>
                      ))}
                    </MotionTableBody>
                  </table>
                </div>
              </div>

              {/* Operator Handover Signoff Checklist */}
              <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border space-y-2 text-xs">
                <span className="font-bold text-g-text uppercase tracking-wider font-mono block text-[11px]">
                  Shift Handover Safety & Quality Signoff:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-g-textSecondary font-mono text-[11px]">
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    <span>All emergency stop circuits verified nominal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    <span>PLC fieldbus packet loss &lt; 0.01%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    <span>First-article metrology inspections archived</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    <span>Coolant & thermal loop pressure within range</span>
                  </div>

                </div>
              </div>

              {/* Actions Bar */}
              <div className="pt-3 border-t border-g-border flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportShiftReportCsv}
                    className="px-4 py-2 rounded-lg bg-g-blue hover:bg-g-blueHover text-white font-medium flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    <span>Download Shift CSV Report</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-text font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <svg className="w-4 h-4 text-g-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24-1.076-.672-2.03-1.272-2.829m14.28 0c-.6 0-1.032.953-1.272 2.829m-11.736 0A12.015 12.015 0 0012 15a12.015 12.015 0 005.28-1.171m-10.56 0c.24-1.076.672-2.03 1.272-2.829m0 0A11.96 11.96 0 0112 9c1.94 0 3.738.46 5.28 1.171m0 0c.6 0 1.032.953 1.272 2.829M12 15v6m-6-6v6m12-6v6" />
                    </svg>
                    <span>Print Shift Summary</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowShiftReportModal(false)}
                  className="px-4 py-2 rounded-lg border border-g-border hover:bg-g-surfaceElevated text-g-text font-medium transition-colors"
                >
                  Close
                </button>
              </div>
        </MotionModal>

        {/* Detailed Work Order Inspection & Telemetry Modal */}
        <MotionModal
          isOpen={Boolean(selectedWorkOrder)}
          backdropClassName="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
          panelClassName="bg-g-surface border border-g-border rounded-xl max-w-4xl w-full p-4 sm:p-7 flex flex-col gap-4 sm:gap-5 shadow-2xl font-sans max-h-[88vh] sm:max-h-[92vh] overflow-y-auto"
        >
          {() => selectedWorkOrder && (
            <>
              {/* Header */}
              <div className="flex items-start justify-between border-b border-g-border pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-g-blueLight text-g-blue border border-g-blue/30">
                      {selectedWorkOrder.order_id}
                    </span>
                    <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      {selectedWorkOrder.priority}
                    </span>
                    <span className="text-xs text-g-textSecondary font-mono">
                      Customer: <strong className="text-g-text">{selectedWorkOrder.customer}</strong>
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-g-text tracking-tight mt-1.5">
                    {selectedWorkOrder.part_name}
                  </h3>
                  <p className="text-xs text-g-textSecondary font-mono mt-0.5">
                    Engineering Part Number: <span className="text-g-blue font-semibold">{selectedWorkOrder.part_number}</span> • CAD Spec: <span className="text-g-text">{selectedWorkOrder.cad_revision}</span>
                  </p>
                </div>

                <button
                  onClick={() => setSelectedWorkOrder(null)}
                  className="p-1 rounded-md text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated transition-colors"
                  title="Close Work Order Inspection"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Top 4 KPI Metrics Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Batch Output Progress */}
                <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-g-textSecondary uppercase tracking-wider font-mono">
                    Batch Completion
                  </span>
                  <div className="my-2">
                    <div className="text-2xl font-bold text-g-text font-mono">
                      {selectedWorkOrder.batch_completed} <span className="text-xs text-g-textSecondary font-normal">/ {selectedWorkOrder.batch_target}</span>
                    </div>
                    <div className="w-full bg-g-surface h-2 rounded-full overflow-hidden mt-1.5 border border-g-border">
                      <div
                        className="bg-g-blue h-full rounded-full"
                        style={{ width: `${Math.min(100, (selectedWorkOrder.batch_completed / selectedWorkOrder.batch_target) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-g-textSecondary flex justify-between">
                    <span>{((selectedWorkOrder.batch_completed / selectedWorkOrder.batch_target) * 100).toFixed(0)}% Complete</span>
                    <span className="text-g-blue">{selectedWorkOrder.batch_target - selectedWorkOrder.batch_completed} left</span>
                  </div>

                </div>

                {/* Metric 2: Quality & Yield */}
                <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-g-textSecondary uppercase tracking-wider font-mono">
                    First-Pass Yield
                  </span>
                  <div className="my-2">
                    <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                      {selectedWorkOrder.first_pass_yield_pct}%
                    </div>
                    <span className="text-xs text-g-text font-mono mt-1 block">
                      Conforming: {selectedWorkOrder.good_count} • Scrap: {selectedWorkOrder.scrap_count}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    {selectedWorkOrder.fai_status}
                  </span>
                </div>

                {/* Metric 3: Machine & Operator Allocation */}
                <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-g-textSecondary uppercase tracking-wider font-mono">
                    Allocated Asset
                  </span>
                  <div className="my-2">
                    <div className="text-lg font-bold text-g-text font-mono">
                      {selectedWorkOrder.machine_id}
                    </div>
                    <div className="text-xs text-g-textSecondary truncate">
                      {selectedWorkOrder.machine_name}
                    </div>
                  </div>
                  <div className="text-[11px] font-mono text-g-textSecondary">
                    {selectedWorkOrder.location} • {selectedWorkOrder.operator}
                  </div>

                </div>

                {/* Metric 4: Financial Economic Value */}
                <div className="bg-g-surfaceElevated p-4 rounded-xl border border-g-border flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-g-textSecondary uppercase tracking-wider font-mono">
                    Contract Batch Value
                  </span>
                  <div className="my-2">
                    <div className="text-2xl font-bold text-g-text font-mono">
                      ${selectedWorkOrder.current_value_delivered_usd.toLocaleString()}
                    </div>
                    <span className="text-xs text-g-textSecondary font-mono mt-1 block">
                      Order Total: ${selectedWorkOrder.total_order_value_usd.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-g-textSecondary flex justify-between">
                    <span>${selectedWorkOrder.unit_price_usd.toFixed(2)}/pt</span>
                    <span className="text-rose-700 dark:text-rose-400">Scrap: -${selectedWorkOrder.scrap_cost_usd.toFixed(0)}</span>
                  </div>

                </div>
              </div>

              {/* Two-Column Specification and Routing Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left Column: Material & Metrology Specifications */}
                <div className="bg-g-surfaceElevated p-5 rounded-xl border border-g-border flex flex-col gap-3">
                  <span className="text-xs font-bold text-g-text uppercase tracking-wider font-mono border-b border-g-border pb-2">
                    Technical Material & Metrology Specifications
                  </span>
                  <div className="space-y-2.5 text-xs font-mono">
                    <div className="flex justify-between items-center py-1 border-b border-g-borderSubtle/50">
                      <span className="text-g-textSecondary">Material Spec:</span>
                      <span className="font-semibold text-g-text text-right max-w-[240px] truncate">{selectedWorkOrder.material_spec}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-g-borderSubtle/50">
                      <span className="text-g-textSecondary">Engineering Revision:</span>
                      <span className="font-semibold text-g-text">{selectedWorkOrder.cad_revision}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-g-borderSubtle/50">
                      <span className="text-g-textSecondary">Tolerance Class:</span>
                      <span className="font-semibold text-g-blue">{selectedWorkOrder.tolerance_class}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-g-borderSubtle/50">
                      <span className="text-g-textSecondary">Quality Metrology Lead:</span>
                      <span className="font-semibold text-g-text">{selectedWorkOrder.qa_inspector}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-g-borderSubtle/50">
                      <span className="text-g-textSecondary">First-Article Inspection (FAI):</span>
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">{selectedWorkOrder.fai_status}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-g-textSecondary">Shift Execution Schedule:</span>
                      <span className="font-semibold text-g-text">{selectedWorkOrder.start_time} → {selectedWorkOrder.estimated_completion}</span>
                    </div>
                  </div>

                </div>

                {/* Right Column: Manufacturing Routing Workflow */}
                <div className="bg-g-surfaceElevated p-5 rounded-xl border border-g-border flex flex-col gap-3">
                  <span className="text-xs font-bold text-g-text uppercase tracking-wider font-mono border-b border-g-border pb-2">
                    Manufacturing Routing & Operations
                  </span>
                  <div className="space-y-2 text-xs">
                    {selectedWorkOrder.routing_steps.map((step) => {
                      const isDone = step.status === 'Completed';
                      const isInProgress = step.status === 'In Progress';

                      return (
                        <div
                          key={step.step}
                          className={`p-2.5 rounded-lg border transition-all flex items-center justify-between ${isInProgress
                              ? 'bg-g-blueLight border-g-blue/40 text-g-blue'
                              : isDone
                                ? 'bg-g-surface border-g-border text-g-text'
                                : 'bg-g-surface border-g-border/60 text-g-textSecondary opacity-75'
                            }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold ${isDone
                                  ? 'bg-emerald-500 text-white'
                                  : isInProgress
                                    ? 'bg-cyan-500 text-white animate-pulse'
                                    : 'bg-g-surfaceElevated text-g-textMuted border border-g-border'
                                }`}
                            >
                              {isDone ? (
                                <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              ) : (
                                step.step
                              )}
                            </span>
                            <div>
                              <span className="font-semibold font-sans block text-xs">
                                {step.operation}
                              </span>
                              {step.details && (
                                <span className="text-[10px] font-mono text-g-textSecondary">
                                  {step.details}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-g-surfaceElevated border border-g-border block">
                              {step.station}
                            </span>
                            <span className="text-[10px] font-mono text-g-textSecondary mt-0.5 block">
                              {step.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

              {/* Bottom Modal Actions */}
              <div className="pt-3 border-t border-g-border flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(selectedWorkOrder, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedWorkOrder.order_id}_traveler_spec.json`;
                      a.click();
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-text font-medium font-mono flex items-center gap-1.5 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 text-g-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                    <span>Export Traveler JSON</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const matchingM = data.machines.find((m) => m.machine_id === selectedWorkOrder.machine_id);
                      if (matchingM) {
                        setSelectedWorkOrder(null);
                        setSelectedMachine(matchingM);
                      }
                    }}
                    className="px-4 py-1.5 rounded-lg bg-g-blue hover:bg-g-blueHover text-white font-medium shadow-sm transition-colors flex items-center gap-1.5 font-mono"
                  >
                    <span>Inspect Asset ({selectedWorkOrder.machine_id}) →</span>
                  </button>
                  <button
                    onClick={() => setSelectedWorkOrder(null)}
                    className="px-4 py-1.5 rounded-lg border border-g-border hover:bg-g-surfaceElevated text-g-text font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </>
          )}
        </MotionModal>

        {/* Asset Inspection Drawer Modal */}
        <MotionModal
          isOpen={Boolean(selectedMachine)}
          backdropClassName="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
          panelClassName="bg-g-surface border border-g-border rounded-xl max-w-2xl w-full p-4 sm:p-6 flex flex-col gap-4 shadow-2xl font-mono text-xs max-h-[88vh] overflow-y-auto"
        >
          {() => selectedMachine && (
            <>
              <div className="flex items-start justify-between border-b border-g-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-g-blue bg-blue-500/10 px-2 py-0.5 rounded border border-g-blue/20">
                      {selectedMachine.machine_id}
                    </span>
                    <h3 className="font-semibold text-g-text text-base font-sans">{selectedMachine.machine_name}</h3>
                  </div>
                  <p className="text-g-textSecondary mt-1">{selectedMachine.location} • Operator: {selectedMachine.operator}</p>
                </div>
                <button onClick={() => setSelectedMachine(null)} className="text-g-textSecondary hover:text-g-text text-lg p-1">
                  ✕
                </button>
              </div>

              {/* OEE Pillars Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-g-surfaceElevated p-2.5 rounded border border-g-border">
                  <span className="text-g-textMuted block uppercase text-[10px]">OEE Score</span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{selectedMachine.oee_metrics.oee_percentage.toFixed(1)}%</span>
                </div>
                <div className="bg-g-surfaceElevated p-2.5 rounded border border-g-border">
                  <span className="text-g-textMuted block uppercase text-[10px]">Availability</span>
                  <span className="text-lg font-bold text-g-text">{(selectedMachine.oee_metrics.availability * 100).toFixed(1)}%</span>
                </div>
                <div className="bg-g-surfaceElevated p-2.5 rounded border border-g-border">
                  <span className="text-g-textMuted block uppercase text-[10px]">Performance</span>
                  <span className="text-lg font-bold text-g-text">{(selectedMachine.oee_metrics.performance * 100).toFixed(1)}%</span>
                </div>
                <div className="bg-g-surfaceElevated p-2.5 rounded border border-g-border">
                  <span className="text-g-textMuted block uppercase text-[10px]">Quality</span>
                  <span className="text-lg font-bold text-g-text">{(selectedMachine.oee_metrics.quality * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Active MES Work Order */}
              {selectedMachine.work_order && (
                <div className="bg-g-surfaceElevated p-3 rounded-lg border border-g-border flex items-center justify-between">
                  <div>
                    <span className="text-g-textMuted block uppercase text-[10px] font-mono">Active Production Work Order</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-g-blue font-mono text-xs">{selectedMachine.work_order.order_id}</span>
                      <span className="text-g-text font-sans font-medium text-xs truncate max-w-[240px]">{selectedMachine.work_order.part_name}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const woId = selectedMachine.work_order!.order_id;
                      const mId = selectedMachine.machine_id;
                      setSelectedMachine(null);
                      handleOpenWorkOrder(woId, mId);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-g-blue hover:bg-g-blueHover text-white font-medium text-xs font-mono transition-colors shadow-xs flex items-center gap-1"
                  >
                    <span>View Order Details</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                  </button>
                </div>
              )}

              {/* OT Field Device Controller & Protocol Architecture */}
              <div className="bg-g-surfaceElevated p-3 rounded border border-g-border flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-g-blue uppercase text-[11px]">Physical OT Field Controller & Protocol Architecture</span>
                  <span className="text-[10px] text-g-textMuted font-mono">IEC 62541 / Fieldbus IO</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-g-text">
                  <div className="bg-g-surface p-2 rounded border border-g-border">
                    <span className="text-g-textMuted block text-[10px] uppercase">Hardware Controller</span>
                    <span className="font-semibold text-g-text">{selectedMachine.plc_controller || 'Fanuc / Siemens Field PLC'}</span>
                  </div>
                  <div className="bg-g-surface p-2 rounded border border-g-border">
                    <span className="text-g-textMuted block text-[10px] uppercase">OT Network IP</span>
                    <span className="font-semibold font-mono text-g-blue">{selectedMachine.ip_address || '192.168.1.120'}</span>
                  </div>
                  <div className="bg-g-surface p-2 rounded border border-g-border">
                    <span className="text-g-textMuted block text-[10px] uppercase">OPC-UA Tag NodeID</span>
                    <span className="font-semibold font-mono text-g-text truncate" title={selectedMachine.opc_node_id}>
                      {selectedMachine.opc_node_id || `ns=2;s=${selectedMachine.machine_id}`}
                    </span>
                  </div>

                </div>
              </div>

              {/* Predictive Maintenance & Root Cause Analysis */}
              {selectedMachine.predictive && (
                <div className="bg-g-surfaceElevated p-3 rounded border border-g-border space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-g-blue uppercase text-[11px]">Predictive Diagnostics & Anomaly Health</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">RUL: {selectedMachine.predictive.remaining_useful_life_hrs} hrs</span>
                  </div>
                  <p className="text-g-text text-xs leading-relaxed font-sans">{selectedMachine.predictive.root_cause_analysis}</p>
                  <div className="text-g-textMuted text-[10px] pt-1 border-t border-g-border">
                    Critical Monitored Component: {selectedMachine.predictive.component_at_risk}
                  </div>

                </div>
              )}

              {/* Live Sensors */}
              {selectedMachine.sensors && (
                <div className="bg-g-surfaceElevated p-3 rounded border border-g-border grid grid-cols-2 sm:grid-cols-4 gap-2 text-g-text">
                  <div>Temp: <span className="font-bold text-g-text">{selectedMachine.sensors.temperature_c}°C</span></div>
                  <div>Power: <span className="font-bold text-g-text">{selectedMachine.sensors.power_kw} kW</span></div>
                  <div>Vibration: <span className="font-bold text-g-text">{selectedMachine.sensors.vibration_mm_s} mm/s</span></div>
                  <div>Pressure: <span className="font-bold text-g-text">{selectedMachine.sensors.pressure_bar || 6.2} bar</span></div>
                </div>
              )}

              {/* Supervisory Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-g-border">
                <span className="text-g-textSecondary text-xs">Field Supervisory Actions:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      handleDeleteMachine(selectedMachine.machine_id);
                      setSelectedMachine(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-g-surfaceElevated hover:bg-rose-500/10 dark:hover:bg-rose-900/40 border border-g-border hover:border-rose-500 text-g-textSecondary hover:text-rose-700 dark:hover:text-rose-400 font-medium text-xs transition-colors"
                  >
                    Decommission Asset
                  </button>
                  <button
                    onClick={() => {
                      handleMachineCommand(selectedMachine.machine_id, 'reset_fault');
                      setSelectedMachine(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors shadow-sm"
                  >
                    Clear Fault & Resume
                  </button>
                  <button
                    onClick={() => {
                      handleMachineCommand(selectedMachine.machine_id, 'e_stop');
                      setSelectedMachine(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors shadow-sm"
                  >
                    Emergency Halt (E-Stop)
                  </button>
                </div>
              </div>
            </>
          )}
        </MotionModal>

        {/* Collapsible Left Side Navigation Drawer (Side Toggle Bar) */}
        <MotionDrawer
          isOpen={sidebarOpen}
          side="left"
          asAside={true}
          onClose={() => setSidebarOpen(false)}
          backdropClassName="fixed inset-0 bg-black/60 backdrop-blur-xs z-50"
          panelClassName="fixed inset-y-0 left-0 w-[85vw] max-w-xs sm:w-80 bg-g-surface border-r border-g-border shadow-2xl z-50 flex flex-col justify-between"
        >
              <div>
                {/* Sidebar Header with New SynapSYS Architectural Brand */}
                <div className="p-5 border-b border-g-border flex items-center justify-between">
                  <SynapsysLogo variant="horizontal" size="md" isDarkMode={isDarkMode} />
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-lg text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated transition-colors cursor-pointer"
                    aria-label="Close side navigation"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Active User Card */}
                <div className="p-4 bg-g-surface border-b border-g-border flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-g-surfaceElevated border border-g-border text-g-text font-semibold text-sm flex items-center justify-center shrink-0">
                        {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'D'}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[13px] text-g-text truncate">{currentUser?.full_name || 'Demo Explorer'}</span>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-g-surfaceElevated border border-g-border text-g-textSecondary uppercase">
                            {currentUser?.role || 'demo'}
                          </span>
                        </div>
                        <span className="text-xs text-g-textSecondary font-mono truncate">{currentUser?.email || 'demo@synapsys.com'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-g-textSecondary px-3 py-1.5 rounded-md bg-g-surfaceSubtle border border-g-border/60">
                    <span className="uppercase tracking-wider">Tenant Org:</span>
                    <span className="text-g-blue font-semibold truncate max-w-[150px]">{currentUser?.company_name || 'SynapSYS Enterprise'}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                    <button
                      onClick={() => { setShowProfileModal(true); setSidebarOpen(false); }}
                      className="px-2.5 py-2 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border hover:border-g-blue/50 text-g-text text-[13px] font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      title="View Full Profile & Session Info"
                    >
                      <svg className="w-4 h-4 text-g-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => { setSidebarOpen(false); onLogout(); }}
                      className="px-2.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 hover:border-rose-500/50 text-[13px] font-medium font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      title="Log Out & End Session"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>

                </div>

                {/* Site Status Pill */}
                <div
                  onClick={() => { setShowProjectModal(true); setSidebarOpen(false); }}
                  className="px-4 py-3 bg-g-surfaceElevated border-b border-g-border flex items-center justify-between text-[13px] cursor-pointer hover:bg-g-surfaceSubtle transition-colors"
                  title="Click to Switch or Provision Production Sites"
                >
                  <span className="text-g-textSecondary font-medium">Facility Context:</span>
                  <span className="font-semibold text-g-blue font-mono flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    {activeSite?.name.replace(/\s*\(Production Live\)/i, '') || 'Detroit Site 04'}
                  </span>
                </div>

                {/* Navigation Links */}
                <div className="p-3.5 space-y-5 overflow-y-auto max-h-[calc(100vh-290px)] text-[13px]">
                  <div>
                    <span className="px-3 text-xs font-semibold uppercase tracking-wider text-g-textMuted block mb-1.5">
                      Plant Operations
                    </span>
                    <div className="space-y-1">
                      <button
                        onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }}
                        className={`w-full px-3 py-2.5 rounded-lg text-left font-medium flex items-center justify-between transition-colors ${activeTab === 'overview' ? 'bg-g-blue text-white shadow-sm' : 'text-g-text hover:bg-g-surfaceElevated'
                          }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
                          <span>Fleet Overview</span>
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/20 text-white">{data.machines.length}</span>
                      </button>

                      <button
                        onClick={() => { setActiveTab('twin'); setSidebarOpen(false); }}
                        className={`w-full px-3 py-2.5 rounded-lg text-left font-medium flex items-center justify-between transition-colors ${activeTab === 'twin' ? 'bg-g-blue text-white shadow-sm' : 'text-g-text hover:bg-g-surfaceElevated'
                          }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" /></svg>
                          <span>Digital Twin Shop Floor</span>
                        </span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-g-blue">2D</span>
                      </button>

                      <button
                        onClick={() => { setActiveTab('losses'); setSidebarOpen(false); }}
                        className={`w-full px-3 py-2.5 rounded-lg text-left font-medium flex items-center justify-between transition-colors ${activeTab === 'losses' ? 'bg-g-blue text-white shadow-sm' : 'text-g-text hover:bg-g-surfaceElevated'
                          }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></svg>
                          <span>Six Big Losses (ISO-22400)</span>
                        </span>
                        <span className="text-xs font-mono text-g-textMuted">OEE</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="px-3 text-xs font-semibold uppercase tracking-wider text-g-textMuted block mb-1.5">
                      Connectivity & MES
                    </span>
                    <div className="space-y-1">
                      <button
                        onClick={() => { setActiveTab('connectors'); setSidebarOpen(false); }}
                        className={`w-full px-3 py-2.5 rounded-lg text-left font-medium flex items-center justify-between transition-colors ${activeTab === 'connectors' ? 'bg-g-blue text-white shadow-sm' : 'text-g-text hover:bg-g-surfaceElevated'
                          }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                          <span>Field Connectors</span>
                        </span>
                        <span className="text-xs font-mono text-emerald-500 font-semibold">Active</span>
                      </button>

                      <button
                        onClick={() => { setActiveTab('workorders'); setSidebarOpen(false); }}
                        className={`w-full px-3 py-2.5 rounded-lg text-left font-medium flex items-center justify-between transition-colors ${activeTab === 'workorders' ? 'bg-g-blue text-white shadow-sm' : 'text-g-text hover:bg-g-surfaceElevated'
                          }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>
                          <span>Active Work Orders (MES)</span>
                        </span>
                        <span className="text-xs font-mono text-g-textSecondary">Batch</span>
                      </button>

                      <button
                        onClick={() => { setActiveTab('alarms'); setSidebarOpen(false); }}
                        className={`w-full px-3 py-2.5 rounded-lg text-left font-medium flex items-center justify-between transition-colors ${activeTab === 'alarms' ? 'bg-g-blue text-white shadow-sm' : 'text-g-text hover:bg-g-surfaceElevated'
                          }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <svg className="w-4 h-4 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                          <span>ISA-18.2 Alarms</span>
                        </span>
                        {data.active_alarms.length > 0 ? (
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold">{data.active_alarms.length}</span>
                        ) : (
                          <span className="text-xs font-mono text-emerald-500">Nominal</span>
                        )}
                      </button>

                      <button
                        onClick={() => { setActiveTab('inventory'); setSidebarOpen(false); }}
                        className={`w-full px-3 py-2.5 rounded-lg text-left font-medium flex items-center justify-between transition-colors ${activeTab === 'inventory' ? 'bg-g-blue text-white shadow-sm' : 'text-g-text hover:bg-g-surfaceElevated'
                          }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                          </svg>
                          <span>Inventory & MRO</span>
                        </span>
                        <span className="text-xs font-mono text-emerald-500 font-bold">MRO</span>
                      </button>

                      <button
                        onClick={() => { setActiveTab('acoustic_ai'); setSidebarOpen(false); }}
                        className={`w-full px-3 py-2.5 rounded-lg text-left font-medium flex items-center justify-between transition-colors ${activeTab === 'acoustic_ai' ? 'bg-g-blue text-white shadow-sm' : 'text-g-text hover:bg-g-surfaceElevated'
                          }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
                          </svg>
                          <span>Acoustic AI Twin</span>
                        </span>
                        <span className="text-xs font-mono text-purple-400 font-bold">NEW</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="px-3 text-xs font-semibold uppercase tracking-wider text-g-textMuted block mb-1.5">
                      Quick Operational Actions
                    </span>
                    <div className="space-y-1.5 pt-1">
                      <button
                        onClick={() => { setShowAddMachineModal(true); setSidebarOpen(false); }}
                        className="w-full py-2.5 px-3 rounded-lg bg-g-surfaceElevated hover:bg-g-blue hover:text-white border border-g-border text-g-text text-left font-medium flex items-center gap-2 transition-colors"
                      >
                        <span className="text-g-blue font-bold text-base">+</span>
                        <span>Provision Machine Asset</span>
                      </button>
                      <button
                        onClick={() => { setShowAddConnectorModal(true); setSidebarOpen(false); }}
                        className="w-full py-2 px-3 rounded-lg bg-g-surfaceElevated hover:bg-g-blue hover:text-white border border-g-border text-g-text text-left font-medium flex items-center gap-2 transition-colors"
                      >
                        <span className="text-g-blue font-bold text-sm">+</span>
                        <span>Add Field Connector</span>
                      </button>
                      <button
                        onClick={() => { setShowAddWorkOrderModal(true); setSidebarOpen(false); }}
                        className="w-full py-2 px-3 rounded-lg bg-g-surfaceElevated hover:bg-g-blue hover:text-white border border-g-border text-g-text text-left font-medium flex items-center gap-2 transition-colors"
                      >
                        <span className="text-g-blue font-bold text-sm">+</span>
                        <span>Dispatch MES Work Order</span>
                      </button>
                      <button
                        onClick={() => { handleLoadSampleCsv(); setSidebarOpen(false); }}
                        className="w-full py-2 px-3 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-blue text-left font-medium flex items-center gap-2 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                        <span>Replay Shift CSV Dataset</span>
                      </button>
                      <button
                        onClick={() => { setTutorialStep(0); setShowTutorial(true); setSidebarOpen(false); }}
                        className="w-full py-2 px-3 rounded-lg bg-g-blueLight hover:bg-g-blue hover:text-white border border-g-blue/30 text-g-blue text-left font-medium flex items-center gap-2 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                        <span>System Operations Guide</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="p-4 border-t border-g-border bg-g-surfaceElevated flex flex-col gap-2.5">
                <button
                  onClick={() => onToggleTheme()}
                  className="w-full py-2 px-3 rounded-lg bg-g-surface border border-g-border flex items-center justify-between text-xs text-g-text hover:border-g-blue transition-colors shadow-xs"
                >
                  <span className="font-medium">Active Theme:</span>
                  <span className="font-semibold text-g-blue flex items-center gap-1.5">
                    {isDarkMode ? 'Dark Slate' : 'Light Neutral'}
                  </span>
                </button>
                <div className="flex items-center justify-between text-[11px] text-g-textSecondary font-mono pt-1 border-t border-g-border/50">
                  <div className="flex flex-col truncate max-w-[180px]">
                    <span className="font-semibold text-g-text truncate">{currentUser?.full_name || 'Operator'}</span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono truncate">{currentUser?.company_name || 'SynapSYS Enterprise'}</span>
                  </div>
                  <button
                    onClick={() => { setSidebarOpen(false); onLogout(); }}
                    className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 text-[11px] font-mono font-semibold transition-all flex items-center gap-1 cursor-pointer"
                    title="Logout"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
        </MotionDrawer>

        {/* SynapSYS Multi-Plant Facility Manager Modal */}
        <MotionModal
          isOpen={showProjectModal}
          backdropClassName="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
          panelClassName="bg-g-surface border border-g-border rounded-2xl max-w-2xl w-full p-4 sm:p-7 flex flex-col gap-4 sm:gap-5 shadow-2xl max-h-[88vh] overflow-hidden"
        >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-g-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-g-blueLight border border-g-blue/30 text-g-blue flex items-center justify-center flex-shrink-0 shadow-xs">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-g-text text-base sm:text-lg">Production Sites & Deployments</h3>
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-g-blueLight text-g-blue border border-g-blue/20">
                        {productionSites.length} Facilities
                      </span>
                    </div>
                    <p className="text-xs text-g-textSecondary mt-0.5">
                      Provision new manufacturing facilities and switch active supervisory telemetry context.
                    </p>
                  </div>

                </div>
                <div className="flex items-center gap-2">
                  {(currentUser?.role === 'owner' || currentUser?.role === 'manager' || currentUser?.role === 'admin') ? (
                    <button
                      type="button"
                      onClick={() => setShowAddSiteForm(!showAddSiteForm)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${showAddSiteForm
                          ? 'bg-g-surfaceElevated border-g-border text-g-text hover:bg-g-surfaceSubtle'
                          : 'bg-g-blue text-white border-g-blue hover:bg-blue-600 shadow-xs'
                        }`}
                    >
                      {showAddSiteForm ? (
                        <>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          <span>Close Form</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                          <span>Provision Site</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-g-textMuted px-2 py-1 rounded bg-g-surfaceElevated border border-g-border">
                      Owner/Manager Provisioning Only
                    </span>
                  )}
                  <button
                    onClick={() => { setShowProjectModal(false); setShowAddSiteForm(false); }}
                    className="p-1.5 rounded-lg text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated transition-colors cursor-pointer"
                    aria-label="Close modal"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* Scrollable Container */}
              <div className="overflow-y-auto space-y-4 pr-1 max-h-[calc(80vh-140px)]">
                {/* Provisioning Form Accordion/Block */}
                {showAddSiteForm && (
                  <form onSubmit={handleCreateSite} className="p-4 sm:p-5 rounded-xl border border-g-blue/40 bg-g-surfaceElevated/70 space-y-4 animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-g-border pb-3">
                      <div>
                        <h4 className="text-xs font-bold text-g-text uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-g-blue"></span>
                          Provision New Production Facility
                        </h4>
                        <p className="text-[11px] text-g-textSecondary mt-0.5">Define facility parameters, regional edge gateway, and production capacity.</p>
                      </div>

                      {/* Presets Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="text-g-textMuted font-mono">Presets:</span>
                        <button
                          type="button"
                          onClick={() => handleApplyPresetSite({
                            name: 'Austin Gigafactory 05',
                            id: 'synapsys-mfg-us-austin',
                            region: 'us-south1',
                            location: 'Austin, TX, USA',
                            facility_type: 'EV Powertrain & Battery Cell',
                            active_lines: 14,
                            target_capacity: 5200,
                            nominal_oee: 89.2,
                            status: 'active',
                          })}
                          className="px-2 py-0.5 rounded bg-g-surface border border-g-border hover:border-g-blue text-g-text font-medium text-[10px] cursor-pointer"
                        >
                          Austin Gigafactory
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPresetSite({
                            name: 'Munich Press Shop 03',
                            id: 'synapsys-mfg-eu-munich',
                            region: 'europe-west3',
                            location: 'Munich, Germany',
                            facility_type: 'Precision Stamping & BiW Assembly',
                            active_lines: 8,
                            target_capacity: 3800,
                            nominal_oee: 87.5,
                            status: 'active',
                          })}
                          className="px-2 py-0.5 rounded bg-g-surface border border-g-border hover:border-g-blue text-g-text font-medium text-[10px] cursor-pointer"
                        >
                          Munich Stamping
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPresetSite({
                            name: 'Singapore Semi Fab 01',
                            id: 'synapsys-mfg-apac-singapore',
                            region: 'asia-southeast1',
                            location: 'Jurong, Singapore',
                            latitude: 1.3521,
                            longitude: 103.8198,
                            facility_type: 'Semiconductor Fab & Cleanroom',
                            active_lines: 16,
                            target_capacity: 7500,
                            nominal_oee: 92.4,
                            status: 'active',
                          })}
                          className="px-2 py-0.5 rounded bg-g-surface border border-g-border hover:border-g-blue text-g-text font-medium text-[10px] cursor-pointer"
                        >
                          Singapore Fab
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyPresetSite({
                            name: 'Coimbatore Precision Tooling 07',
                            id: 'synapsys-mfg-in-coimbatore',
                            region: 'asia-south1',
                            location: 'Coimbatore, Tamil Nadu, India',
                            latitude: 11.0168,
                            longitude: 76.9558,
                            facility_type: 'Precision Tooling & Pump Machining',
                            active_lines: 12,
                            target_capacity: 4800,
                            nominal_oee: 89.2,
                            status: 'active',
                          })}
                          className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 hover:border-amber-500 text-amber-800 dark:text-amber-300 font-semibold text-[10px] cursor-pointer transition-colors"
                        >
                          Coimbatore Precision
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-g-textSecondary font-medium mb-1">Facility Name *</label>
                        <input
                          type="text"
                          required
                          value={newSiteForm.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewSiteForm((prev) => ({
                              ...prev,
                              name: val,
                              id: `synapsys-mfg-${val.toLowerCase().replace(/[^a-z0-9]/g, '-')}`.replace(/-+/g, '-'),
                            }));
                          }}
                          placeholder="e.g. Austin Gigafactory 05"
                          className="w-full px-3 py-1.5 rounded-lg bg-g-surface border border-g-border text-g-text focus:outline-none focus:border-g-blue text-xs font-sans"
                        />
                      </div>

                      <div>
                        <label className="block text-g-textSecondary font-medium mb-1">Deployment ID / Slug *</label>
                        <input
                          type="text"
                          required
                          value={newSiteForm.id}
                          onChange={(e) => setNewSiteForm({ ...newSiteForm, id: e.target.value })}
                          placeholder="synapsys-mfg-..."
                          className="w-full px-3 py-1.5 rounded-lg bg-g-surface border border-g-border text-g-text focus:outline-none focus:border-g-blue text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-g-textSecondary font-medium mb-1">Regional Edge Gateway *</label>
                        <select
                          value={newSiteForm.region}
                          onChange={(e) => {
                            const reg = e.target.value;
                            const primaryHub = MANUFACTURING_HUBS.find((h) => h.gateway_region === reg);
                            if (primaryHub) {
                              setNewSiteForm((prev) => ({
                                ...prev,
                                region: reg,
                                location: primaryHub.full_location,
                                latitude: primaryHub.lat,
                                longitude: primaryHub.lon,
                                facility_type: primaryHub.facility_type,
                                name: prev.name.endsWith('Facility') || !prev.name ? `${primaryHub.city} Facility` : prev.name,
                                id: prev.id.startsWith('synapsys-mfg-') || !prev.id ? `synapsys-mfg-${primaryHub.city.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : prev.id,
                              }));
                            } else {
                              setNewSiteForm((prev) => ({ ...prev, region: reg }));
                            }
                          }}
                          className="w-full px-3 py-1.5 rounded-lg bg-g-surface border border-g-border text-g-text focus:outline-none focus:border-g-blue text-xs cursor-pointer"
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

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-g-textSecondary font-medium">Geographic Location</label>
                          <button
                            type="button"
                            onClick={() => setShowMapAssist(!showMapAssist)}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold transition-all border ${showMapAssist
                                ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40 shadow-xs'
                                : 'bg-g-surface border-g-border hover:border-amber-500/50 text-g-textSecondary hover:text-amber-700 dark:hover:text-amber-400'
                              }`}
                          >
                            <svg className="w-3 h-3 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="9" />
                              <circle cx="12" cy="12" r="3" />
                              <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
                            </svg>
                            <span>{showMapAssist ? 'Close Map Assist ✕' : 'Map Assist ⌖'}</span>
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            value={newSiteForm.location}
                            onChange={(e) => setNewSiteForm({ ...newSiteForm, location: e.target.value })}
                            placeholder="e.g. Coimbatore, TN or Austin, TX, USA"
                            className="w-full px-3 py-1.5 rounded-lg bg-g-surface border border-g-border text-g-text focus:outline-none focus:border-g-blue text-xs pr-20"
                          />
                          {newSiteForm.latitude !== undefined && newSiteForm.longitude !== undefined && (
                            <div className="absolute right-2 top-1.5 text-[9px] font-mono text-amber-700 dark:text-amber-400 bg-g-surfaceElevated px-1 py-0.5 rounded border border-amber-500/25 pointer-events-none">
                              {newSiteForm.latitude.toFixed(2)}°, {newSiteForm.longitude.toFixed(2)}°
                            </div>
                          )}
                        </div>
                      </div>

                      {showMapAssist && (
                        <div className="sm:col-span-2 my-1">
                          <Suspense fallback={<ChunkPanelFallback label="Loading GeoMap coordinate picker chunk..." minHeight={260} />}>
                            <LazyGeoMapAssist
                              currentLocation={newSiteForm.location}
                              currentLatitude={newSiteForm.latitude}
                              currentLongitude={newSiteForm.longitude}
                              selectedRegion={newSiteForm.region}
                              onSelectLocation={(geo: GeoLocationData) => {
                                handleGeoLocationSelect(geo);
                              }}
                              deployedSites={productionSites}
                              mode="picker"
                              onClose={() => setShowMapAssist(false)}
                            />
                          </Suspense>
                        </div>
                      )}

                      <div className="sm:col-span-2">
                        <label className="block text-g-textSecondary font-medium mb-1">Facility Domain / Industry Type</label>
                        <select
                          value={newSiteForm.facility_type}
                          onChange={(e) => setNewSiteForm({ ...newSiteForm, facility_type: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-g-surface border border-g-border text-g-text focus:outline-none focus:border-g-blue text-xs cursor-pointer"
                        >
                          <option value="EV Powertrain & Battery Cell">EV Powertrain & Battery Cell</option>
                          <option value="Automotive Powertrain & Battery Cell">Automotive Powertrain & Battery Cell</option>
                          <option value="Precision Stamping & BiW Assembly">Precision Stamping & BiW Assembly</option>
                          <option value="Aerospace Machining & Turbine Impeller">Aerospace Machining & Turbine Impeller</option>
                          <option value="Semiconductor Fab & Cleanroom">Semiconductor Fab & Cleanroom</option>
                          <option value="Semiconductor & Precision Optics">Semiconductor & Precision Optics</option>
                          <option value="Robotics Assembly & Testing Cell">Robotics Assembly & Testing Cell</option>
                          <option value="Medical Device Cleanroom Fabrication">Medical Device Cleanroom Fabrication</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-g-textSecondary font-medium mb-1">Active Lines Count</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={newSiteForm.active_lines}
                          onChange={(e) => setNewSiteForm({ ...newSiteForm, active_lines: parseInt(e.target.value) || 1 })}
                          className="w-full px-3 py-1.5 rounded-lg bg-g-surface border border-g-border text-g-text focus:outline-none focus:border-g-blue text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-g-textSecondary font-medium mb-1">Shift Target Capacity (Units)</label>
                        <input
                          type="number"
                          min="50"
                          step="50"
                          value={newSiteForm.target_capacity}
                          onChange={(e) => setNewSiteForm({ ...newSiteForm, target_capacity: parseInt(e.target.value) || 1000 })}
                          className="w-full px-3 py-1.5 rounded-lg bg-g-surface border border-g-border text-g-text focus:outline-none focus:border-g-blue text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-g-textSecondary font-medium mb-1">Nominal Target OEE (%)</label>
                        <input
                          type="number"
                          min="30"
                          max="100"
                          step="0.1"
                          value={newSiteForm.nominal_oee}
                          onChange={(e) => setNewSiteForm({ ...newSiteForm, nominal_oee: parseFloat(e.target.value) || 85.0 })}
                          className="w-full px-3 py-1.5 rounded-lg bg-g-surface border border-g-border text-g-text focus:outline-none focus:border-g-blue text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-g-textSecondary font-medium mb-1">Commissioning State</label>
                        <select
                          value={newSiteForm.status}
                          onChange={(e) => setNewSiteForm({ ...newSiteForm, status: e.target.value as any })}
                          className="w-full px-3 py-1.5 rounded-lg bg-g-surface border border-g-border text-g-text focus:outline-none focus:border-g-blue text-xs cursor-pointer"
                        >
                          <option value="active">Active Live Production</option>
                          <option value="commissioning">In Commissioning</option>
                          <option value="standby">Cold Standby</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-g-border">
                      <button
                        type="button"
                        onClick={() => setShowAddSiteForm(false)}
                        className="px-3 py-1.5 rounded-lg border border-g-border text-g-textSecondary hover:text-g-text text-xs font-medium cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingSite}
                        className="px-4 py-1.5 rounded-lg bg-g-blue text-white hover:bg-blue-600 font-semibold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingSite ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span>Provisioning...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                            <span>Provision Facility & Connect</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Facilities List Header with View Mode Toggle */}
                <div className="flex items-center justify-between text-xs text-g-textSecondary px-1 pt-2 border-t border-g-borderSubtle">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold uppercase tracking-wider text-[11px] text-g-textMuted">
                      Available Global Facilities ({productionSites.length})
                    </span>
                    <span className="font-mono text-[10px] text-g-textMuted hidden sm:inline">Click a site to switch telemetry stream</span>
                  </div>
                  <div className="flex items-center gap-1 bg-g-surface border border-g-border rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setFacilityViewMode('list')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${facilityViewMode === 'list'
                          ? 'bg-g-surfaceElevated text-g-text shadow-xs font-semibold'
                          : 'text-g-textMuted hover:text-g-text'
                        }`}
                    >
                      List
                    </button>
                    <button
                      type="button"
                      onClick={() => setFacilityViewMode('radar_map')}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${facilityViewMode === 'radar_map'
                          ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 font-semibold'
                          : 'text-g-textMuted hover:text-g-text'
                        }`}
                    >
                      <svg className="w-3 h-3 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M3.6 9h16.8M3.6 15h16.8" />
                        <path d="M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18" />
                      </svg>
                      Global Map
                    </button>
                  </div>

                </div>

                {/* View: Radar Map vs List */}
                {facilityViewMode === 'radar_map' ? (
                  <div className="p-2 rounded-xl border border-g-border bg-g-surfaceElevated">
                    <Suspense fallback={<ChunkPanelFallback label="Loading global radar map chunk..." minHeight={300} />}>
                      <LazyGeoMapAssist
                        currentLocation=""
                        onSelectLocation={() => { }}
                        deployedSites={productionSites}
                        activeSiteId={currentProject}
                        onSelectSite={(siteId: string) => {
                          setCurrentProject(siteId);
                          setShowProjectModal(false);
                          const matched = productionSites.find((s) => s.id === siteId);
                          setCsvFeedback({
                            type: 'success',
                            text: `Switched manufacturing context to "${matched?.name || siteId}". Edge telemetry synchronized from ${matched?.region || 'global'}.`,
                          });
                        }}
                        mode="radar_view"
                      />
                    </Suspense>
                  </div>
                ) : (
                  /* Site Cards */
                  <div className="space-y-2.5">
                    {productionSites.map((site) => {
                      const isActive = currentProject === site.id;
                      return (
                        <div
                          key={site.id}
                          onClick={() => {
                            if (!isActive) {
                              setCurrentProject(site.id);
                              setShowProjectModal(false);
                              setCsvFeedback({
                                type: 'success',
                                text: `Switched manufacturing context to "${site.name}". Edge telemetry synchronized from ${site.region}.`,
                              });
                            }
                          }}
                          className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group ${isActive
                              ? 'bg-g-blueLight/60 border-g-blue shadow-xs'
                              : 'bg-g-surfaceElevated border-g-border hover:border-g-blue/60 hover:bg-g-surfaceSubtle'
                            }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              {isActive && (
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" title="Active Live Telemetry Context"></span>
                              )}
                              <h4 className="font-bold text-sm text-g-text tracking-tight group-hover:text-g-blue transition-colors">
                                {site.name}
                              </h4>
                              {isActive && (
                                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-g-blue text-white font-semibold">
                                  ACTIVE CONTEXT
                                </span>
                              )}
                              {site.status === 'commissioning' && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                  Commissioning
                                </span>
                              )}
                              {site.status === 'standby' && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">
                                  Standby
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-g-textSecondary font-mono">
                              <span className="text-g-blue font-semibold">{site.id}</span>
                              <span>•</span>
                              <span>{site.region}</span>
                              <span>•</span>
                              <span className="font-sans text-g-text">{site.location}</span>
                              {site.latitude !== undefined && site.longitude !== undefined && (
                                <>
                                  <span>•</span>
                                  <span className="text-amber-700 dark:text-amber-400 text-[10px]">
                                    [{site.latitude.toFixed(2)}°, {site.longitude.toFixed(2)}°]
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                              <span className="px-2 py-0.5 rounded-md bg-g-surface border border-g-border font-medium text-g-textSecondary">
                                {site.facility_type}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-g-surface border border-g-border font-mono text-g-textSecondary">
                                {site.active_lines} Lines
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-g-surface border border-g-border font-mono text-g-textSecondary">
                                Target: {site.target_capacity.toLocaleString()} u/shift
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-g-surface border border-g-border font-mono text-emerald-500 font-semibold">
                                {site.nominal_oee}% OEE
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-g-surface border border-cyan-500/30 font-mono text-cyan-400 font-semibold">
                                {(() => {
                                  const c = getCurrencyForSite(site);
                                  return `${c.country}: ${c.symbol} ${c.code}`;
                                })()}
                              </span>
                            </div>
                          </div>

                          {/* Card Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {!isActive ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentProject(site.id);
                                  setShowProjectModal(false);
                                  setCsvFeedback({
                                    type: 'success',
                                    text: `Switched manufacturing context to "${site.name}". Edge telemetry synchronized from ${site.region}.`,
                                  });
                                }}
                                className="px-3 py-1.5 rounded-lg bg-g-surface border border-g-border hover:border-g-blue hover:text-g-blue text-xs font-semibold text-g-text transition-colors cursor-pointer"
                              >
                                Switch Context
                              </button>
                            ) : (
                              <span className="text-xs font-semibold text-g-blue flex items-center gap-1 font-mono">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                                Connected
                              </span>
                            )}

                            {productionSites.length > 1 && (
                              <button
                                type="button"
                                title={`Decommission ${site.name}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Are you sure you want to decommission production site "${site.name}"?`)) {
                                    handleDeleteSite(site.id, site.name);
                                  }
                                }}
                                className="p-1.5 rounded-lg text-g-textSecondary hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                aria-label={`Decommission ${site.name}`}
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Bottom Status Bar */}
              <div className="pt-3 border-t border-g-border flex flex-wrap items-center justify-between gap-2 text-xs text-g-textSecondary">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Active Telemetry Site:</span>
                  <span className="font-semibold text-g-text font-sans">{activeSite?.name}</span>
                  <span className="font-mono text-[11px] text-g-blue">({activeSite?.id})</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowProjectModal(false); setShowAddSiteForm(false); }}
                  className="px-4 py-1.5 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-text font-medium cursor-pointer"
                >
                  Close
                </button>
              </div>
        </MotionModal>

        {/* Keyboard Shortcuts Cheat Sheet Modal */}
        <MotionModal
          isOpen={showHotkeysModal}
          backdropClassName="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
          panelClassName="bg-g-surface border border-g-border rounded-xl max-w-lg w-full p-5 sm:p-6 flex flex-col gap-4 shadow-2xl relative max-h-[88vh] overflow-y-auto font-mono text-xs"
        >
              <div className="flex items-start justify-between border-b border-g-border pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-g-blueLight text-g-blue border border-g-blue/30 font-bold uppercase text-[10px]">
                      Hotkeys
                    </span>
                    <h3 className="text-base font-bold text-g-text font-sans">Keyboard Shortcuts</h3>
                  </div>
                  <p className="text-g-textSecondary text-xs font-sans mt-0.5">
                    Fast supervisory navigation and platform interlock controls
                  </p>
                </div>
                <button
                  onClick={() => setShowHotkeysModal(false)}
                  className="p-1 rounded text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated transition-colors"
                  title="Close Shortcuts"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-semibold text-g-textSecondary uppercase tracking-wider block">
                  Primary Navigation
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-2 rounded bg-g-surfaceElevated border border-g-borderSubtle">
                    <span className="text-g-text">Fleet Overview</span>
                    <kbd className="px-2 py-0.5 rounded bg-g-surface border border-g-border text-g-blue font-bold">1</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-g-surfaceElevated border border-g-borderSubtle">
                    <span className="text-g-text">Field Connectors</span>
                    <kbd className="px-2 py-0.5 rounded bg-g-surface border border-g-border text-g-blue font-bold">2</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-g-surfaceElevated border border-g-borderSubtle">
                    <span className="text-g-text">Digital Twin Floor</span>
                    <kbd className="px-2 py-0.5 rounded bg-g-surface border border-g-border text-g-blue font-bold">3</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-g-surfaceElevated border border-g-borderSubtle">
                    <span className="text-g-text">Six Big Losses</span>
                    <kbd className="px-2 py-0.5 rounded bg-g-surface border border-g-border text-g-blue font-bold">4</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-g-surfaceElevated border border-g-borderSubtle">
                    <span className="text-g-text">Work Orders</span>
                    <kbd className="px-2 py-0.5 rounded bg-g-surface border border-g-border text-g-blue font-bold">5</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-g-surfaceElevated border border-g-borderSubtle">
                    <span className="text-g-text">Alarms & Incidents</span>
                    <kbd className="px-2 py-0.5 rounded bg-g-surface border border-g-border text-g-blue font-bold">6</kbd>
                  </div>

                </div>

                <span className="text-[10px] font-semibold text-g-textSecondary uppercase tracking-wider block pt-2">
                  Telemetry & System Actions
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2 rounded bg-g-surfaceElevated border border-g-borderSubtle">
                    <span className="text-g-text">Focus Global Search Omnibox</span>
                    <kbd className="px-2.5 py-0.5 rounded bg-g-surface border border-g-border text-g-blue font-bold">/ or Ctrl+K</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-g-surfaceElevated border border-g-borderSubtle">
                    <span className="text-g-text">Pause / Resume Telemetry Stream</span>
                    <kbd className="px-2.5 py-0.5 rounded bg-g-surface border border-g-border text-g-text font-bold">Space</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-g-surfaceElevated border border-g-borderSubtle">
                    <span className="text-g-text">Toggle Keyboard Hotkeys Guide</span>
                    <kbd className="px-2.5 py-0.5 rounded bg-g-surface border border-g-border text-g-text font-bold">?</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-g-surfaceElevated border border-g-borderSubtle">
                    <span className="text-g-text">Close Any Active Modal / Drawer</span>
                    <kbd className="px-2.5 py-0.5 rounded bg-g-surface border border-g-border text-g-text font-bold">Esc</kbd>
                  </div>

                </div>
              </div>

              <div className="pt-3 border-t border-g-border flex justify-end">
                <button
                  onClick={() => setShowHotkeysModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-g-blue text-white font-medium font-sans"
                >
                  Got It
                </button>
              </div>
        </MotionModal>

        {/* Enterprise Platform Onboarding Guide Modal */}
        <MotionModal
          isOpen={showTutorial}
          backdropClassName="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4"
          panelClassName="bg-g-surface border border-g-border rounded-xl max-w-2xl sm:max-w-3xl w-full p-4 sm:p-7 flex flex-col gap-4 sm:gap-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
        >
          {() => {
            const safeIdx = Math.max(0, Math.min(TUTORIAL_STEPS.length - 1, tutorialStep));
            const currentStep = TUTORIAL_STEPS[safeIdx] || TUTORIAL_STEPS[0];

            return (
              <>
                {/* Modal Header */}
                <div className="flex items-start justify-between border-b border-g-border pb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-g-surfaceElevated text-g-blue border border-g-border font-mono">
                        {currentStep.badge}
                      </span>
                      <span className="text-xs text-g-textSecondary uppercase tracking-wider">
                        Operations guide
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-g-text tracking-tight mt-1.5">
                      {currentStep.title}
                    </h3>
                    <p className="text-xs font-normal text-g-textSecondary mt-0.5">
                      {currentStep.subtitle}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTutorial(false)}
                    className="p-1 rounded-md text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated transition-colors"
                    title="Close Guide"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Stepper Navigation Tabs (6 Steps) */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-xs font-mono">
                  {TUTORIAL_STEPS.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setTutorialStep(idx);
                        setActiveTab(s.actionTab as any);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-center transition-all border cursor-pointer ${safeIdx === idx
                          ? 'bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-500 font-semibold shadow-xs ring-1 ring-amber-500/50'
                          : 'bg-g-surfaceElevated border-g-border text-g-textSecondary hover:text-g-text'
                        }`}
                    >
                      <span className="block text-[10px] opacity-80">Step {idx + 1}</span>
                      <span className="truncate block font-sans text-[11px] font-medium">
                        {s.shortTitle}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Body Explanation */}
                <div className="text-xs sm:text-sm text-g-text leading-relaxed bg-g-surfaceElevated p-3.5 sm:p-4 rounded-lg border border-g-borderSubtle">
                  {currentStep.content}
                </div>

                {/* Interactive Action Guide */}
                {currentStep.howToUse && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 sm:p-3.5 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-400 font-semibold font-mono uppercase tracking-wider mb-1">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
                      </svg>
                      Interactive Action Guide (How to Operate)
                    </div>
                    <p className="text-g-text leading-relaxed font-sans">
                      {currentStep.howToUse}
                    </p>
                  </div>
                )}

                {/* Key Capabilities Bullet Points */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-g-text uppercase tracking-wider block font-mono">
                    Key Architectural Capabilities:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {currentStep.keyPoints?.map((point, pIdx) => {
                      const colonIdx = point.indexOf(':');
                      const title = colonIdx !== -1 ? point.slice(0, colonIdx) : '';
                      const body = colonIdx !== -1 ? point.slice(colonIdx + 1) : point;
                      return (
                        <div key={pIdx} className="flex items-start gap-2.5 text-xs text-g-text bg-g-surfaceElevated p-2.5 rounded-lg border border-g-borderSubtle">
                          <span className="w-5 h-5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/30">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          </span>
                          <div className="leading-relaxed">
                            {title && <strong className="font-semibold text-g-text mr-1">{title}:</strong>}
                            <span className="text-g-textSecondary">{body}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Pro-Tip Callout Box */}
                {currentStep.proTip && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-xs flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-amber-500/30">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                    </span>
                    <div className="text-g-text leading-relaxed">
                      <strong className="font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider font-mono text-[11px] block mb-0.5">
                        Plant Operator Pro-Tip
                      </strong>
                      <span className="text-g-textSecondary">{currentStep.proTip}</span>
                    </div>

                  </div>
                )}

                {/* Stepper Footer Controls */}
                <div className="pt-3 border-t border-g-border flex items-center justify-between gap-2 flex-wrap">
                  <button
                    onClick={() => setShowTutorial(false)}
                    className="text-xs text-g-textSecondary hover:text-g-text font-medium underline-offset-4 hover:underline"
                  >
                    Skip Guide
                  </button>

                  <div className="flex items-center gap-2">
                    {tutorialStep > 0 && (
                      <button
                        onClick={() => {
                          const prev = Math.max(0, safeIdx - 1);
                          setTutorialStep(prev);
                          setActiveTab(TUTORIAL_STEPS[prev].actionTab as any);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-g-border text-g-text text-xs font-medium hover:bg-g-surfaceElevated transition-colors cursor-pointer"
                      >
                        Previous
                      </button>
                    )}
                    {safeIdx < TUTORIAL_STEPS.length - 1 ? (
                      <button
                        onClick={() => {
                          const next = Math.min(TUTORIAL_STEPS.length - 1, safeIdx + 1);
                          setTutorialStep(next);
                          setActiveTab(TUTORIAL_STEPS[next].actionTab as any);
                        }}
                        className="px-4 py-1.5 rounded-lg bg-g-blue hover:bg-g-blueHover text-white text-xs font-medium shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Next section</span>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowTutorial(false)}
                        className="px-4 py-1.5 rounded-lg bg-g-blue hover:bg-g-blueHover text-white text-xs font-medium shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Enter platform</span>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </>
            );
          }}
        </MotionModal>

        {/* Corporate User Profile Modal */}
        <MotionModal
          isOpen={showProfileModal}
          backdropClassName="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4"
          panelClassName="bg-g-surface border border-g-border rounded-xl max-w-md w-full p-5 sm:p-6 flex flex-col gap-4 shadow-2xl max-h-[88vh] overflow-y-auto"
        >
              <div className="flex items-center justify-between border-b border-g-border pb-3.5">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-g-surfaceElevated border border-g-border text-g-text font-semibold text-base flex items-center justify-center">
                    {currentUser?.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'D'}
                  </div>
                  <div>
                    <h3 className="font-cinzel font-semibold text-g-text text-lg">
                      {currentUser?.full_name || 'Demo Explorer'}
                    </h3>
                    <p className="text-[13px] text-g-textSecondary font-mono">
                      {currentUser?.company_name || 'SynapSYS Demo Workspace'}
                    </p>
                  </div>

                </div>
                <button onClick={() => setShowProfileModal(false)} className="text-g-textSecondary hover:text-g-text text-lg p-1 cursor-pointer">✕</button>
              </div>
              <div className="space-y-2.5 text-[13px] font-mono bg-g-surfaceElevated p-4 rounded-xl border border-g-border">
                <div className="flex justify-between gap-2">
                  <span className="text-g-textMuted">Corporate Email:</span>
                  <span className="text-g-text font-semibold truncate max-w-[200px]">{currentUser?.email || 'demo@synapsys.com'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-g-textMuted">Enterprise Domain:</span>
                  <span className="text-g-blue font-semibold">{currentUser?.company_domain || 'synapsys.com'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-g-textMuted">Session Role:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold uppercase">{currentUser?.role || 'demo'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-g-textMuted">Current Plant:</span>
                  <span className="text-g-text font-semibold">{activeSite?.name.replace(/\s*\(Production Live\)/i, '') || 'Detroit Site 04'}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-g-textMuted">Persistence Engine:</span>
                  <span className="text-cyan-700 dark:text-cyan-400 font-semibold">
                    {firebaseStatus.connected ? 'Firebase Firestore Synced' : 'SQLite + Firebase Ready'}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-g-textMuted">Compliance:</span>
                  <span className="text-emerald-500 font-semibold">ISO-22400 / ISA-95</span>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="flex gap-2.5">
                  <button
                    onClick={() => {
                      onToggleTheme();
                    }}
                    className="flex-1 py-2.5 rounded-lg bg-g-surfaceElevated border border-g-border text-g-text text-[13px] font-medium hover:border-g-blue transition-colors cursor-pointer"
                  >
                    Toggle Theme
                  </button>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="px-4 py-2.5 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-text text-[13px] font-medium transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>

                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    onLogout();
                  }}
                  className="w-full py-2.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-[13px] font-semibold font-mono flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  <span>Log Out of Enterprise Session</span>
                </button>
              </div>
        </MotionModal>


        {/* SynapSYS Platform Footer */}
        <footer className="border-t border-g-border bg-g-surface px-6 py-4 text-[13px] text-g-textMuted flex items-center justify-between mb-16 sm:mb-0">
          <span>SynapSYS · {activeSite?.name.replace(/\s*\(Production Live\)/i, '') || currentProject} · OPC UA live · Latency {latencyMs}ms · Sync {lastSync}</span>
          <span className="hidden sm:inline">ISO-22400 · ISA-95</span>
        </footer>
      </main>

      {/* Mobile Sticky Bottom Navigation Bar (Thumb-Friendly for Plant Floor Operators) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-g-surface/95 backdrop-blur-md border-t border-g-border shadow-lg safe-bottom flex items-center justify-around px-2 py-1.5"
      >
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'overview' ? 'text-g-blue font-semibold' : 'text-g-textSecondary hover:text-g-text'
            }`}
        >
          <div className="relative">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            <span className="absolute -top-1 -right-2 text-[9px] font-mono font-bold bg-g-blue text-white rounded-full px-1">
              {data.machines.length}
            </span>
          </div>
          <span className="text-[10px] mt-0.5 font-medium">Fleet</span>
        </button>

        <button
          onClick={() => setActiveTab('twin')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'twin' ? 'text-g-blue font-semibold' : 'text-g-textSecondary hover:text-g-text'
            }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
          </svg>
          <span className="text-[10px] mt-0.5 font-medium">Floor Twin</span>
        </button>

        <button
          onClick={() => setActiveTab('workorders')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'workorders' ? 'text-g-blue font-semibold' : 'text-g-textSecondary hover:text-g-text'
            }`}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          <span className="text-[10px] mt-0.5 font-medium">Orders</span>
        </button>

        <button
          onClick={() => setActiveTab('alarms')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'alarms' ? 'text-g-blue font-semibold' : 'text-g-textSecondary hover:text-g-text'
            }`}
        >
          <div className="relative">
            <svg className={`w-5 h-5 ${data.active_alarms.filter((a) => !a.acknowledged).length > 0 ? 'text-rose-500' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {data.active_alarms.filter((a) => !a.acknowledged).length > 0 && (
              <span className="absolute -top-1 -right-2 text-[9px] font-mono font-bold bg-rose-500 text-white rounded-full px-1 animate-pulse">
                {data.active_alarms.filter((a) => !a.acknowledged).length}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-medium">Alarms</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'inventory' ? 'text-g-blue font-semibold' : 'text-g-textSecondary hover:text-g-text'
            }`}
        >
          <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
          </svg>
          <span className="text-[10px] mt-0.5 font-medium">Inventory</span>
        </button>

        <button
          onClick={() => setActiveTab('acoustic_ai')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors cursor-pointer ${activeTab === 'acoustic_ai' ? 'text-purple-400 font-semibold' : 'text-g-textSecondary hover:text-g-text'
            }`}
        >
          <div className="relative">
            <svg className="w-5 h-5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.757 3.63 8.25 4.51 8.25H6.75z" />
            </svg>
            <span className="absolute -top-1 -right-2 text-[8px] font-mono font-bold bg-purple-500 text-white rounded px-0.5">
              AI
            </span>
          </div>
          <span className="text-[10px] mt-0.5 font-medium">Acoustic</span>
        </button>

        <button
          onClick={() => setShowCopilot(true)}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-lg text-cyan-700 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <div className="w-5 h-5 rounded bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-[10px] shadow-xs border border-cyan-400/30">
            <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          </div>
          <span className="text-[10px] mt-0.5 font-semibold font-tactical tracking-wide uppercase">Copilot</span>
        </button>
      </nav>
    </motion.div>
  );
}
