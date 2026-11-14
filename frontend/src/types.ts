export interface OEEMetrics {
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  oee_percentage: number;
  benchmark_status: 'World-Class' | 'Acceptable' | 'Needs Attention';
}

export interface MachineSensors {
  temperature_c: number;
  vibration_mm_s: number;
  power_kw: number;
  pressure_bar?: number;
}

export interface PredictiveMaintenance {
  anomaly_score: number;
  health_status: 'Optimal' | 'Degraded' | 'Critical Risk';
  remaining_useful_life_hrs: number;
  component_at_risk: string;
  root_cause_analysis: string;
}

export interface WorkOrder {
  order_id: string;
  part_number: string;
  part_name: string;
  customer: string;
  batch_target: number;
  batch_completed: number;
  start_time: string;
  estimated_completion: string;
}

export interface WorkOrderRoutingStep {
  step: number;
  operation: string;
  status: 'Completed' | 'In Progress' | 'Queued';
  station: string;
  details?: string;
}

export interface DetailedWorkOrder {
  order_id: string;
  machine_id: string;
  machine_name: string;
  location: string;
  operator: string;
  part_number: string;
  part_name: string;
  customer: string;
  batch_target: number;
  batch_completed: number;
  good_count: number;
  scrap_count: number;
  first_pass_yield_pct: number;
  start_time: string;
  estimated_completion: string;
  material_spec: string;
  cad_revision: string;
  tolerance_class: string;
  unit_price_usd: number;
  total_order_value_usd: number;
  current_value_delivered_usd: number;
  scrap_cost_usd: number;
  priority: string;
  fai_status: string;
  qa_inspector: string;
  routing_steps: WorkOrderRoutingStep[];
}

export interface SixBigLosses {
  equipment_failure_sec: number;
  setup_adjustment_sec: number;
  idling_minor_stops_sec: number;
  reduced_speed_sec: number;
  process_defects_units: number;
  startup_rejects_units: number;
}

export interface PlantEnergyMetrics {
  total_power_kw: number;
  specific_energy_kwh_per_unit: number;
  carbon_intensity_gco2_per_unit: number;
  energy_cost_usd: number;
  green_energy_pct: number;
}

export interface IndustrialConnector {
  id: string;
  name: string;
  protocol: 'OPC-UA' | 'MQTT-SparkplugB' | 'REST-Webhook' | 'Modbus-TCP';
  endpoint: string;
  status: 'Connected' | 'Standby' | 'Error';
  packet_rate_hz: number;
  last_heartbeat: string;
  nodes_mapped: number;
  security_policy: string;
}

export type DataSourceMode = 'simulation' | 'live_plc' | 'hybrid' | 'dataset_replay';

export interface MachineDashboardState {
  machine_id: string;
  machine_name: string;
  site_id?: string;
  status: 'Running' | 'Idle' | 'Down';
  timestamp: string;
  location?: string;
  operator?: string;
  output_count: number;
  target_output: number;
  good_count: number;
  scrap_count: number;
  cycle_time_sec: number;
  ideal_cycle_time_sec: number;
  uptime_seconds: number;
  downtime_seconds: number;
  oee_metrics: OEEMetrics;
  active_alarm: string | null;
  alarm_severity: 'Critical' | 'Warning' | 'None';
  alarm_acknowledged?: boolean;
  alarm_duration_sec?: number;
  recent_cycle_times: number[];
  sensors?: MachineSensors;
  predictive?: PredictiveMaintenance;
  work_order?: WorkOrder;
  losses?: SixBigLosses;
  plc_controller?: string;
  ip_address?: string;
  opc_node_id?: string;
}

export interface AlarmEvent {
  machine_id: string;
  machine_name: string;
  alarm: string;
  severity: 'Critical' | 'Warning';
  timestamp: string;
  acknowledged?: boolean;
  duration_sec?: number;
  code?: string;
  category?: 'Mechanical' | 'Electrical' | 'Safety' | 'Process';
}

export interface FinancialROI {
  revenue_generated_usd: number;
  downtime_cost_usd: number;
  scrap_waste_cost_usd: number;
  net_shift_value_usd: number;
  potential_savings_usd: number;
  currency_symbol?: string;
  currency_code?: string;
  unit_baseline?: number;
  downtime_hourly_rate?: number;
  scrap_unit_cost?: number;
}

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  citations?: string[];
}

export interface DashboardSummary {
  overall_plant_oee: number;
  overall_availability: number;
  overall_performance: number;
  overall_quality: number;
  total_output: number;
  total_target: number;
  total_good: number;
  total_scrap: number;
  total_machines: number;
  running_machines: number;
  idle_machines: number;
  down_machines: number;
  active_alarms_count: number;
  last_updated: string;
  financial_roi?: FinancialROI;
  takt_time_sec: number;
  mean_line_speed_sec: number;
  shift_name: string;
  shift_elapsed_pct: number;
  energy?: PlantEnergyMetrics;
  data_source_mode?: DataSourceMode;
  active_connectors_count?: number;
}

export interface DashboardResponse {
  site_id?: string;
  site_name?: string;
  summary: DashboardSummary;
  machines: MachineDashboardState[];
  active_alarms: AlarmEvent[];
  connectors?: IndustrialConnector[];
}

export interface ProductionSite {
  id: string;
  name: string;
  region: string;
  location: string;
  facility_type: string;
  active_lines: number;
  target_capacity: number;
  nominal_oee: number;
  status: 'active' | 'standby' | 'commissioning';
  created_at?: string;
  latitude?: number;
  longitude?: number;
  company_domain?: string;
  company_name?: string;
}

export type UserRole = 'admin' | 'operator' | 'demo';

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  company_name: string;
  company_domain: string;
  role: UserRole;
  assigned_facility?: string;
  created_at: string;
}

export interface AuthSession {
  token: string;
  user: UserProfile;
}

// ---------------------------------------------------------------------------
// Inventory & Procurement System Types
// ---------------------------------------------------------------------------

export type InventoryCategory =
  | 'Machine Spares'
  | 'Cutting Tools'
  | 'Raw Materials'
  | 'Fluids & Lubricants'
  | 'Safety & PPE';

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  min_safety_stock: number;
  reorder_quantity: number;
  unit: string;
  unit_cost_inr?: number;
  unit_cost_usd: number;
  bin_location: string;
  preferred_supplier_id: string;
  preferred_supplier_name: string;
  linked_machine_id?: string;
  last_restocked_at?: string;
}

export interface SupplierVendor {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  categories: InventoryCategory[];
  lead_time_days: number;
  rating: number;
  address: string;
  payment_terms: string;
}

export type PurchaseOrderStatus = 'Draft' | 'Pending 2FA' | 'Emailed' | 'Confirmed' | 'Received' | 'Cancelled';

export interface PurchaseOrderItem {
  item_id: string;
  sku: string;
  name: string;
  quantity: number;
  unit: string;
  unit_price_inr?: number;
  unit_price_usd: number;
  total_price_inr?: number;
  total_price_usd: number;
}

export interface PurchaseOrder {
  po_id: string;
  created_at: string;
  supplier_id: string;
  supplier_name: string;
  supplier_email: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  subtotal_inr?: number;
  subtotal_usd: number;
  tax_inr?: number;
  cgst_inr?: number;
  sgst_inr?: number;
  tax_usd: number;
  total_inr?: number;
  total_usd: number;
  estimated_delivery: string;
  email_subject?: string;
  email_dispatched_at?: string;
  notes?: string;
  priority?: string;
  facility?: string;
  security_2fa_verified?: boolean;
  authorized_by?: string;
  authorization_hash?: string;
}
