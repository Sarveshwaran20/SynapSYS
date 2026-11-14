"""
SynapSYS Enterprise IIoT Platform - Manufacturing Data Engine & Industrial Field Ingestion
SynapSYS Enterprise Architecture for PS-002: Real-World Industrial Telemetry & OEE Analytics.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from collections import deque
import sqlite3
import os
import random
import csv
import io
import hashlib

from fastapi import FastAPI, HTTPException, Body, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from .firebase_store import firebase_store
except ImportError:
    from firebase_store import firebase_store

try:
    from .two_factor import (
        initiate_2fa_signup,
        verify_2fa_code,
        initiate_po_authorization_2fa,
        verify_po_authorization_2fa,
        DESIGNATED_SECURITY_EMAIL,
    )
except ImportError:
    from two_factor import (
        initiate_2fa_signup,
        verify_2fa_code,
        initiate_po_authorization_2fa,
        verify_po_authorization_2fa,
        DESIGNATED_SECURITY_EMAIL,
    )

try:
    from .procurement import (
        DEFAULT_INVENTORY,
        DEFAULT_SUPPLIERS,
        _PURCHASE_ORDERS,
        dispatch_supplier_po_email,
    )
except ImportError:
    from procurement import (
        DEFAULT_INVENTORY,
        DEFAULT_SUPPLIERS,
        _PURCHASE_ORDERS,
        dispatch_supplier_po_email,
    )


# ---------------------------------------------------------------------------
# Data Models (SynapSYS Enterprise IIoT Schema)
# ---------------------------------------------------------------------------

class MachineSensors(BaseModel):
    temperature_c: float = Field(..., description="Operating temperature in Celsius")
    vibration_mm_s: float = Field(..., description="Vibration velocity RMS in mm/s")
    power_kw: float = Field(..., description="Active power consumption in kW")
    pressure_bar: Optional[float] = Field(None, description="System hydraulic/pneumatic pressure")


class PredictiveMaintenance(BaseModel):
    anomaly_score: float = Field(..., description="Vibration & Thermal Anomaly Score (0-100%)")
    health_status: str = Field(..., description="'Optimal', 'Degraded', 'Critical Risk'")
    remaining_useful_life_hrs: int = Field(..., description="Estimated hours before recommended maintenance")
    component_at_risk: str = Field(..., description="Component exhibiting highest wear")
    root_cause_analysis: str = Field(..., description="Root cause diagnostic analysis")


class WorkOrder(BaseModel):
    order_id: str
    part_number: str
    part_name: str
    customer: str
    batch_target: int = 250
    batch_completed: int = 0
    start_time: str
    estimated_completion: str


class SixBigLosses(BaseModel):
    equipment_failure_sec: float
    setup_adjustment_sec: float
    idling_minor_stops_sec: float
    reduced_speed_sec: float
    process_defects_units: int
    startup_rejects_units: int


class PlantEnergyMetrics(BaseModel):
    total_power_kw: float
    specific_energy_kwh_per_unit: float
    carbon_intensity_gco2_per_unit: float
    energy_cost_usd: float
    green_energy_pct: float


class IndustrialConnector(BaseModel):
    id: str
    name: str
    protocol: str # 'OPC-UA', 'MQTT-SparkplugB', 'REST-Webhook', 'Modbus-TCP'
    endpoint: str
    status: str # 'Connected', 'Standby', 'Error'
    packet_rate_hz: float
    last_heartbeat: str
    nodes_mapped: int
    security_policy: str


class ProductionSite(BaseModel):
    id: str = Field(..., description="Unique slug or identifier, e.g. synapsys-mfg-prod-us")
    name: str = Field(..., description="Human-readable facility name, e.g. Detroit Site 04")
    region: str = Field(..., description="Cloud or edge region e.g. us-east4, europe-west3")
    location: str = Field(..., description="Physical geography, e.g. Detroit, MI, USA")
    facility_type: str = Field(..., description="Industry domain e.g. Automotive Powertrain & Battery Cell")
    active_lines: int = Field(1, description="Number of active production lines")
    target_capacity: int = Field(1000, description="Nominal units produced per shift")
    nominal_oee: float = Field(85.0, description="Target nominal OEE percentage")
    status: str = Field("active", description="'active', 'commissioning', or 'standby'")
    created_at: Optional[str] = Field(None, description="ISO timestamp")
    latitude: Optional[float] = Field(None, description="Latitude coordinate")
    longitude: Optional[float] = Field(None, description="Longitude coordinate")
    company_domain: Optional[str] = Field(None, description="Domain of owning company")
    company_name: Optional[str] = Field(None, description="Name of owning enterprise company")


def get_currency_for_site(site: Optional[ProductionSite] = None) -> dict:
    if not site:
        return {
            "symbol": "$",
            "code": "USD",
            "name": "US Dollar",
            "country": "United States",
            "unit_base": 85.0,
            "dt_rate": 1200.0,
            "scrap_rate": 45.0,
            "power_rate": 0.14,
        }

    loc = (site.location or "").lower()
    name = (site.name or "").lower()
    site_id = (site.id or "").lower()
    reg = (site.region or "").lower()
    lat = site.latitude
    lon = site.longitude

    # 1. India (INR ₹)
    if (
        "india" in loc or "tamil nadu" in loc or "karnataka" in loc or "maharashtra" in loc
        or "gujarat" in loc or "haryana" in loc or "coimbatore" in loc or "chennai" in loc
        or "bengaluru" in loc or "bangalore" in loc or "pune" in loc or "sanand" in loc
        or "ahmedabad" in loc or "gurugram" in loc or "manesar" in loc or "mumbai" in loc or "delhi" in loc
        or "coimbatore" in name or "chennai" in name or "in-" in site_id or "coimbatore" in site_id
        or reg == "asia-south1"
        or (lat is not None and lon is not None and 6 <= lat <= 38 and 68 <= lon <= 97)
    ):
        return {
            "symbol": "₹",
            "code": "INR",
            "name": "Indian Rupee",
            "country": "India",
            "unit_base": 7200.0,
            "dt_rate": 95000.0,
            "scrap_rate": 3800.0,
            "power_rate": 11.50,
        }

    # 2. Japan (JPY ¥)
    if (
        "japan" in loc or "tokyo" in loc or "yokohama" in loc or "osaka" in loc or "nagoya" in loc
        or "kanagawa" in loc or "yokohama" in name or "tokyo" in name or "jp-" in site_id
        or (reg == "asia-northeast1" and "korea" not in loc and "ulsan" not in loc and "korea" not in name)
        or (lat is not None and lon is not None and 30 <= lat <= 46 and 129 <= lon <= 146)
    ):
        return {
            "symbol": "¥",
            "code": "JPY",
            "name": "Japanese Yen",
            "country": "Japan",
            "unit_base": 13000.0,
            "dt_rate": 180000.0,
            "scrap_rate": 7000.0,
            "power_rate": 28.00,
        }

    # 3. South Korea (KRW ₩)
    if (
        "korea" in loc or "ulsan" in loc or "seoul" in loc or "incheon" in loc or "busan" in loc
        or "ulsan" in name or "korea" in name or "kr-" in site_id
        or (lat is not None and lon is not None and 34 <= lat <= 39 and 125 <= lon <= 130)
    ):
        return {
            "symbol": "₩",
            "code": "KRW",
            "name": "South Korean Won",
            "country": "South Korea",
            "unit_base": 115000.0,
            "dt_rate": 1600000.0,
            "scrap_rate": 60000.0,
            "power_rate": 180.00,
        }

    # 4. Taiwan (TWD NT$)
    if (
        "taiwan" in loc or "hsinchu" in loc or "taipei" in loc or "taichung" in loc
        or "hsinchu" in name or "taiwan" in name or "tw-" in site_id or reg == "asia-east1"
        or (lat is not None and lon is not None and 21 <= lat <= 26 and 119 <= lon <= 123)
    ):
        return {
            "symbol": "NT$",
            "code": "TWD",
            "name": "New Taiwan Dollar",
            "country": "Taiwan",
            "unit_base": 2750.0,
            "dt_rate": 38000.0,
            "scrap_rate": 1450.0,
            "power_rate": 4.20,
        }

    # 5. Singapore (SGD S$)
    if (
        "singapore" in loc or "jurong" in loc or "tuas" in loc or "singapore" in name
        or "sg-" in site_id or reg == "asia-southeast1"
        or (lat is not None and lon is not None and 1.1 <= lat <= 1.5 and 103.5 <= lon <= 104.1)
    ):
        return {
            "symbol": "S$",
            "code": "SGD",
            "name": "Singapore Dollar",
            "country": "Singapore",
            "unit_base": 115.0,
            "dt_rate": 1600.0,
            "scrap_rate": 60.0,
            "power_rate": 0.32,
        }

    # 6. United Kingdom (GBP £)
    if (
        "united kingdom" in loc or "uk" in loc or "england" in loc or "scotland" in loc or "wales" in loc
        or "london" in loc or "birmingham" in loc or "coventry" in loc or "manchester" in loc
        or "birmingham" in name or "coventry" in name or "uk-" in site_id or reg == "europe-west2"
        or (lat is not None and lon is not None and 49.5 <= lat <= 59.5 and -8.5 <= lon <= 2.0)
    ):
        return {
            "symbol": "£",
            "code": "GBP",
            "name": "British Pound",
            "country": "United Kingdom",
            "unit_base": 68.0,
            "dt_rate": 960.0,
            "scrap_rate": 36.0,
            "power_rate": 0.24,
        }

    # 7. Switzerland (CHF CHF)
    if "switzerland" in loc or "zurich" in loc or "geneva" in loc or "basel" in loc or "ch-" in site_id:
        return {
            "symbol": "CHF",
            "code": "CHF",
            "name": "Swiss Franc",
            "country": "Switzerland",
            "unit_base": 76.0,
            "dt_rate": 1050.0,
            "scrap_rate": 40.0,
            "power_rate": 0.26,
        }

    # 8. Eurozone (Germany, France, Austria, Italy, Spain, etc. - EUR €)
    if (
        "germany" in loc or "deutschland" in loc or "stuttgart" in loc or "munich" in loc or "frankfurt" in loc
        or "france" in loc or "toulouse" in loc or "paris" in loc or "austria" in loc or "graz" in loc or "vienna" in loc
        or "italy" in loc or "milan" in loc or "spain" in loc or "madrid" in loc or "netherlands" in loc
        or "amsterdam" in loc or "belgium" in loc or "brussels" in loc or "ireland" in loc or "portugal" in loc
        or "stuttgart" in name or "munich" in name or "toulouse" in name or "de-" in site_id or "fr-" in site_id or "eu-" in site_id
        or reg.startswith("europe")
        or (lat is not None and lon is not None and 36 <= lat <= 60 and -10 <= lon <= 25)
    ):
        euro_country = "France" if ("france" in loc or "toulouse" in loc) else ("Austria" if ("austria" in loc or "graz" in loc) else ("Italy" if "italy" in loc else ("Spain" if "spain" in loc else "Germany")))
        return {
            "symbol": "€",
            "code": "EUR",
            "name": "Euro",
            "country": euro_country,
            "unit_base": 78.0,
            "dt_rate": 1100.0,
            "scrap_rate": 42.0,
            "power_rate": 0.28,
        }

    # 9. Mexico (MXN Mex$)
    if (
        "mexico" in loc or "monterrey" in loc or "guadalajara" in loc or "nuevo león" in loc
        or "monterrey" in name or "mx-" in site_id
        or (lat is not None and lon is not None and 14 <= lat <= 33 and -118 <= lon <= -86)
    ):
        return {
            "symbol": "Mex$",
            "code": "MXN",
            "name": "Mexican Peso",
            "country": "Mexico",
            "unit_base": 1700.0,
            "dt_rate": 24000.0,
            "scrap_rate": 900.0,
            "power_rate": 2.80,
        }

    # 10. Canada (CAD CA$)
    if "canada" in loc or "toronto" in loc or "montreal" in loc or "vancouver" in loc or "ontario" in loc or "ca-" in site_id:
        return {
            "symbol": "CA$",
            "code": "CAD",
            "name": "Canadian Dollar",
            "country": "Canada",
            "unit_base": 118.0,
            "dt_rate": 1650.0,
            "scrap_rate": 62.0,
            "power_rate": 0.19,
        }

    # 11. Australia (AUD A$)
    if "australia" in loc or "sydney" in loc or "melbourne" in loc or "brisbane" in loc or "au-" in site_id:
        return {
            "symbol": "A$",
            "code": "AUD",
            "name": "Australian Dollar",
            "country": "Australia",
            "unit_base": 130.0,
            "dt_rate": 1850.0,
            "scrap_rate": 70.0,
            "power_rate": 0.29,
        }

    # 12. China (CNY ¥)
    if "china" in loc or "shanghai" in loc or "shenzhen" in loc or "beijing" in loc or "cn-" in site_id:
        return {
            "symbol": "¥",
            "code": "CNY",
            "name": "Chinese Yuan",
            "country": "China",
            "unit_base": 620.0,
            "dt_rate": 8800.0,
            "scrap_rate": 330.0,
            "power_rate": 0.85,
        }

    # 13. Brazil (BRL R$)
    if "brazil" in loc or "brasil" in loc or "são paulo" in loc or "sao paulo" in loc or "br-" in site_id:
        return {
            "symbol": "R$",
            "code": "BRL",
            "name": "Brazilian Real",
            "country": "Brazil",
            "unit_base": 480.0,
            "dt_rate": 6800.0,
            "scrap_rate": 250.0,
            "power_rate": 0.80,
        }

    # Default / Americas: United States (USD $)
    return {
        "symbol": "$",
        "code": "USD",
        "name": "US Dollar",
        "country": "United States",
        "unit_base": 85.0,
        "dt_rate": 1200.0,
        "scrap_rate": 45.0,
        "power_rate": 0.14,
    }


class TelemetryPayload(BaseModel):
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp")
    machine_id: str = Field(..., description="Unique machine identifier (e.g., CNC-101)")
    machine_name: Optional[str] = Field(None, description="Human readable machine name")
    location: Optional[str] = Field(None, description="Plant floor location")
    operator: Optional[str] = Field(None, description="Assigned operator")
    status: str = Field(..., description="Machine operational status: 'Running', 'Idle', or 'Down'")
    output_count: int = Field(..., ge=0, description="Cumulative units produced")
    target_output: int = Field(..., ge=1, description="Production target count")
    good_count: Optional[int] = Field(None, ge=0, description="Conforming units produced")
    scrap_count: Optional[int] = Field(None, ge=0, description="Defective units rejected")
    cycle_time_sec: float = Field(..., ge=0.0, description="Latest unit cycle time in seconds")
    ideal_cycle_time_sec: float = Field(..., ge=0.1, description="Standard engineered ideal cycle time")
    uptime_seconds: float = Field(..., ge=0.0, description="Cumulative active run time in seconds")
    downtime_seconds: float = Field(..., ge=0.0, description="Cumulative unplanned stoppage time in seconds")
    active_alarm: Optional[str] = Field(None, description="Current alarm description or null")
    alarm_severity: Optional[str] = Field("None", description="Severity: 'Critical', 'Warning', or 'None'")
    alarm_code: Optional[str] = Field(None, description="ISA/IEC fault code e.g. ALM-E204")
    sensors: Optional[MachineSensors] = None


class OEEMetrics(BaseModel):
    availability: float = Field(..., description="Availability ratio (0.0 to 1.0)")
    performance: float = Field(..., description="Performance ratio (0.0 to 1.0)")
    quality: float = Field(..., description="Quality ratio (0.0 to 1.0)")
    oee: float = Field(..., description="Overall Equipment Effectiveness (0.0 to 1.0)")
    oee_percentage: float = Field(..., description="OEE expressed as percentage (0% to 100%)")
    benchmark_status: str = Field(..., description="'World-Class', 'Acceptable', or 'Needs Attention'")


class MachineDashboardState(BaseModel):
    machine_id: str
    machine_name: str
    status: str
    timestamp: str
    location: str
    operator: str
    output_count: int
    target_output: int
    good_count: int
    scrap_count: int
    cycle_time_sec: float
    ideal_cycle_time_sec: float
    uptime_seconds: float
    downtime_seconds: float
    oee_metrics: OEEMetrics
    active_alarm: Optional[str]
    alarm_severity: str
    alarm_acknowledged: bool
    alarm_duration_sec: int
    recent_cycle_times: List[float]
    sensors: MachineSensors
    predictive: PredictiveMaintenance
    work_order: WorkOrder
    losses: SixBigLosses
    plc_controller: Optional[str] = None
    ip_address: Optional[str] = None
    opc_node_id: Optional[str] = None


class AlarmEvent(BaseModel):
    machine_id: str
    machine_name: str
    alarm: str
    severity: str
    timestamp: str
    acknowledged: bool = False
    duration_sec: int = 0
    code: str = "ALM-GEN"
    category: str = "Mechanical"


class FinancialROI(BaseModel):
    revenue_generated_usd: float
    downtime_cost_usd: float
    scrap_waste_cost_usd: float
    net_shift_value_usd: float
    potential_savings_usd: float
    currency_symbol: str = "$"
    currency_code: str = "USD"
    unit_baseline: float = 85.0
    downtime_hourly_rate: float = 1200.0
    scrap_unit_cost: float = 45.0


class DashboardSummary(BaseModel):
    overall_plant_oee: float
    overall_availability: float
    overall_performance: float
    overall_quality: float
    total_output: int
    total_target: int
    total_good: int
    total_scrap: int
    total_machines: int
    running_machines: int
    idle_machines: int
    down_machines: int
    active_alarms_count: int
    last_updated: str
    financial_roi: FinancialROI
    takt_time_sec: float
    mean_line_speed_sec: float
    shift_name: str
    shift_elapsed_pct: float = 68.0
    energy: Optional[PlantEnergyMetrics] = None
    data_source_mode: str = "hybrid"
    active_connectors_count: int = 3


class CopilotQuery(BaseModel):
    prompt: str
    site_id: Optional[str] = None
    company_domain: Optional[str] = None


class CopilotResponse(BaseModel):
    answer: str
    citations: List[str]
    suggested_actions: List[str]


# ---------------------------------------------------------------------------
# Enterprise Authentication & User Models (SQL Multi-Tenant)
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: str = Field(..., description="Corporate email address")
    password: str = Field(..., description="Corporate account password")


class UserProfile(BaseModel):
    id: int
    email: str
    full_name: str
    company_name: str
    company_domain: str
    role: str # "admin", "operator", or "demo"
    assigned_facility: Optional[str] = None
    created_at: str


class AuthResponse(BaseModel):
    success: bool
    token: str
    user: UserProfile
    message: str


# ---------------------------------------------------------------------------
# Storage, Connectors & State Management
# ---------------------------------------------------------------------------

DB_FILE = os.path.join(os.path.dirname(__file__), "telemetry.db")
SAMPLE_CSV_PATH = os.path.join(os.path.dirname(__file__), "data", "real_machining_shift_sample.csv")

def hash_password(password: str) -> str:
    """Standard secure SHA-256 password hash for internal SQLite user directory."""
    return hashlib.sha256((password + "_synapsys_salt_2026").encode()).hexdigest()

def seed_default_users():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
    count = cursor.fetchone()[0]
    if count == 0:
        default_users = [
            (
                "admin@synapsys.com",
                hash_password("admin123"),
                "System Administrator",
                "SynapSYS Global Intelligence",
                "synapsys.com",
                "admin",
                "synapsys-mfg-prod-us",
                datetime.now(timezone.utc).isoformat(),
            ),
            (
                "sarvesh@synapsys.com",
                hash_password("admin123"),
                "Sarvesh (Principal Administrator)",
                "SynapSYS Global Intelligence",
                "synapsys.com",
                "admin",
                "synapsys-mfg-prod-us",
                datetime.now(timezone.utc).isoformat(),
            ),
            (
                "admin@coimbatoretooling.in",
                hash_password("admin123"),
                "Coimbatore Plant Director",
                "Coimbatore Precision Tooling Ltd",
                "coimbatoretooling.in",
                "admin",
                "coimbatore-precision-01",
                datetime.now(timezone.utc).isoformat(),
            ),
            (
                "operator@coimbatoretooling.in",
                hash_password("operator123"),
                "K. Miller (Cell Lead)",
                "Coimbatore Precision Tooling Ltd",
                "coimbatoretooling.in",
                "operator",
                "coimbatore-precision-01",
                datetime.now(timezone.utc).isoformat(),
            ),
            (
                "admin@apexindustrial.com",
                hash_password("admin123"),
                "Apex Operations Director",
                "Apex Advanced Manufacturing",
                "apexindustrial.com",
                "admin",
                "apex-mfg-advanced-01",
                datetime.now(timezone.utc).isoformat(),
            ),
            (
                "operator@synapsys.com",
                hash_password("operator123"),
                "Floor Shift Operator",
                "SynapSYS Global Intelligence",
                "synapsys.com",
                "operator",
                "synapsys-mfg-prod-us",
                datetime.now(timezone.utc).isoformat(),
            ),
            (
                "demo@synapsys.com",
                hash_password("demo123"),
                "Demo Explorer",
                "SynapSYS Demo Workspace",
                "synapsys.com",
                "demo",
                "synapsys-mfg-prod-us",
                datetime.now(timezone.utc).isoformat(),
            ),
        ]
        cursor.executemany("""
            INSERT INTO users (email, password_hash, full_name, company_name, company_domain, role, assigned_facility, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, default_users)
        conn.commit()
    # Ensure standard non-admin Demo & Operator accounts exist even on pre-populated databases
    cursor.execute("""
        INSERT OR IGNORE INTO users (email, password_hash, full_name, company_name, company_domain, role, assigned_facility, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        "demo@synapsys.com",
        hash_password("demo123"),
        "Demo Explorer",
        "SynapSYS Demo Workspace",
        "synapsys.com",
        "demo",
        "synapsys-mfg-prod-us",
        datetime.now(timezone.utc).isoformat(),
    ))
    conn.commit()
    conn.close()

def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS telemetry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            machine_id TEXT NOT NULL,
            status TEXT NOT NULL,
            output_count INTEGER NOT NULL,
            cycle_time_sec REAL NOT NULL,
            active_alarm TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            company_name TEXT NOT NULL,
            company_domain TEXT NOT NULL,
            role TEXT NOT NULL,
            assigned_facility TEXT,
            created_at TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS production_sites (
            id TEXT PRIMARY KEY,
            company_domain TEXT NOT NULL,
            company_name TEXT NOT NULL,
            name TEXT NOT NULL,
            region TEXT NOT NULL,
            location TEXT NOT NULL,
            facility_type TEXT NOT NULL,
            active_lines INTEGER NOT NULL,
            target_capacity INTEGER NOT NULL,
            nominal_oee REAL NOT NULL,
            status TEXT NOT NULL,
            latitude REAL,
            longitude REAL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()
    seed_default_users()
    seed_default_production_sites()

def seed_default_production_sites():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM production_sites")
    count = cursor.fetchone()[0]
    if count == 0:
        default_sites = [
            (
                "synapsys-mfg-prod-us",
                "synapsys.com",
                "SynapSYS Global Intelligence",
                "Detroit Site 04 (Production Live)",
                "us-east4",
                "Detroit, MI, USA",
                "Automotive Powertrain & Battery Cell",
                12,
                5000,
                86.5,
                "active",
                42.3314,
                -83.0458,
                datetime.now(timezone.utc).isoformat(),
            ),
            (
                "apex-mfg-advanced-01",
                "apexindustrial.com",
                "Apex Advanced Manufacturing",
                "Apex Precision Stamping & Assembly",
                "us-midwest",
                "Grand Rapids, MI, USA",
                "Precision Stamping & Robotic Welding",
                10,
                4200,
                88.5,
                "active",
                42.9634,
                -85.6681,
                datetime.now(timezone.utc).isoformat(),
            ),
            (
                "coimbatore-precision-01",
                "coimbatoretooling.in",
                "Coimbatore Precision Tooling Ltd",
                "Coimbatore Precision Plant 01",
                "asia-south1",
                "Coimbatore, Tamil Nadu, India",
                "Precision Tooling & Pump Machining",
                12,
                4800,
                89.2,
                "active",
                11.0168,
                76.9558,
                datetime.now(timezone.utc).isoformat(),
            ),
        ]
        cursor.executemany("""
            INSERT INTO production_sites (id, company_domain, company_name, name, region, location, facility_type, active_lines, target_capacity, nominal_oee, status, latitude, longitude, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, default_sites)
        conn.commit()
    conn.close()

def ensure_company_site(company_domain: str, company_name: str = "") -> ProductionSite:
    domain = company_domain.strip().lower()
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, company_domain, company_name, name, region, location, facility_type, active_lines, target_capacity, nominal_oee, status, latitude, longitude, created_at
        FROM production_sites WHERE company_domain = ?
    """, (domain,))
    row = cursor.fetchone()
    if row:
        site = ProductionSite(
            id=row[0],
            company_domain=row[1],
            company_name=row[2],
            name=row[3],
            region=row[4],
            location=row[5],
            facility_type=row[6],
            active_lines=row[7],
            target_capacity=row[8],
            nominal_oee=row[9],
            status=row[10],
            latitude=row[11],
            longitude=row[12],
            created_at=row[13],
        )
        conn.close()
        production_sites[site.id] = site
        if not [m for m, meta in MACHINE_METADATA.items() if meta.get("site_id") == site.id]:
            seed_machines_for_site(site.id, site.name, site.facility_type)
        return site

    prefix = domain.split(".")[0].lower().replace("-", "")
    site_id = f"{prefix}-mfg-plant-01"
    clean_company = company_name or (domain.split(".")[0].replace("-", " ").title() + " Industrial")
    facility_name = f"{clean_company} Plant 01"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    is_india = domain.endswith(".in") or "india" in domain
    site = ProductionSite(
        id=site_id,
        company_domain=domain,
        company_name=clean_company,
        name=facility_name,
        region="asia-south1" if is_india else "us-central1",
        location=f"{clean_company} Manufacturing Headquarters",
        facility_type="Advanced Precision Manufacturing & Assembly",
        active_lines=8,
        target_capacity=4200,
        nominal_oee=87.5,
        status="active",
        latitude=11.0168 if is_india else 37.7749,
        longitude=76.9558 if is_india else -122.4194,
        created_at=now_iso,
    )
    cursor.execute("""
        INSERT INTO production_sites (id, company_domain, company_name, name, region, location, facility_type, active_lines, target_capacity, nominal_oee, status, latitude, longitude, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (site.id, site.company_domain, site.company_name, site.name, site.region, site.location, site.facility_type, site.active_lines, site.target_capacity, site.nominal_oee, site.status, site.latitude, site.longitude, site.created_at))
    conn.commit()
    conn.close()

    production_sites[site.id] = site
    seed_machines_for_site(site.id, site.name, site.facility_type)
    return site

def get_sites_for_company(company_domain: str) -> List[ProductionSite]:
    domain = (company_domain or "synapsys.com").strip().lower()
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, company_domain, company_name, name, region, location, facility_type, active_lines, target_capacity, nominal_oee, status, latitude, longitude, created_at
        FROM production_sites WHERE company_domain = ?
    """, (domain,))
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        site = ensure_company_site(domain)
        return [site]

    results = []
    for r in rows:
        site = ProductionSite(
            id=r[0],
            company_domain=r[1],
            company_name=r[2],
            name=r[3],
            region=r[4],
            location=r[5],
            facility_type=r[6],
            active_lines=r[7],
            target_capacity=r[8],
            nominal_oee=r[9],
            status=r[10],
            latitude=r[11],
            longitude=r[12],
            created_at=r[13],
        )
        production_sites[site.id] = site
        if not [m for m, meta in MACHINE_METADATA.items() if meta.get("site_id") == site.id]:
            seed_machines_for_site(site.id, site.name, site.facility_type)
        results.append(site)
    return results

init_db()

latest_telemetry: Dict[str, TelemetryPayload] = {}
recent_cycle_history: Dict[str, deque] = {}
active_alarms_map: Dict[str, AlarmEvent] = {}
alarm_start_times: Dict[str, float] = {}
alarm_ack_state: Dict[str, bool] = {}
current_data_source_mode = "hybrid" # "hybrid", "live_plc", "simulation", "dataset_replay"

# Real-World Industrial Connectors Registry
industrial_connectors: Dict[str, IndustrialConnector] = {
    "opc_ua_client": IndustrialConnector(
        id="opc_ua_client",
        name="OPC-UA Client Driver (IEC 62541)",
        protocol="OPC-UA",
        endpoint="opc.tcp://192.168.1.120:4840",
        status="Connected",
        packet_rate_hz=2.0,
        last_heartbeat="Live (Subscribed)",
        nodes_mapped=48,
        security_policy="Basic256Sha256 / SignAndEncrypt",
    ),
    "mqtt_sparkplug": IndustrialConnector(
        id="mqtt_sparkplug",
        name="MQTT Sparkplug B Edge Broker",
        protocol="MQTT-SparkplugB",
        endpoint="mqtt://edge-gateway.local:1883/spBv1.0/DetroitSite04",
        status="Connected",
        packet_rate_hz=1.0,
        last_heartbeat="Live (Subscribed)",
        nodes_mapped=32,
        security_policy="TLS 1.3 / Certificate M-TLS",
    ),
    "rest_webhook": IndustrialConnector(
        id="rest_webhook",
        name="REST Ingestion Webhook Gateway",
        protocol="REST-Webhook",
        endpoint="http://0.0.0.0:8000/api/telemetry",
        status="Connected",
        packet_rate_hz=0.5,
        last_heartbeat="Active (201 OK)",
        nodes_mapped=18,
        security_policy="Bearer Token / X-API-Key Auth",
    ),
    "modbus_tcp": IndustrialConnector(
        id="modbus_tcp",
        name="Modbus TCP Remote IO Gateway",
        protocol="Modbus-TCP",
        endpoint="tcp://192.168.1.150:502",
        status="Standby",
        packet_rate_hz=0.0,
        last_heartbeat="Standby",
        nodes_mapped=12,
        security_policy="Standard Industrial Ethernet",
    ),
}

# Real-World Multi-Plant Production Sites Registry
production_sites: Dict[str, ProductionSite] = {
    "synapsys-mfg-prod-us": ProductionSite(
        id="synapsys-mfg-prod-us",
        name="Detroit Site 04 (Production Live)",
        region="us-east4",
        location="Detroit, MI, USA",
        facility_type="Automotive Powertrain & Battery Cell",
        active_lines=12,
        target_capacity=5000,
        nominal_oee=86.5,
        status="active",
        created_at=datetime.now(timezone.utc).isoformat(),
        latitude=42.3314,
        longitude=-83.0458,
    ),
    "synapsys-mfg-eu-frankfurt": ProductionSite(
        id="synapsys-mfg-eu-frankfurt",
        name="Stuttgart Plant 02 (Automotive Body)",
        region="europe-west3",
        location="Stuttgart, Germany",
        facility_type="Precision Stamping & BiW Assembly",
        active_lines=8,
        target_capacity=3500,
        nominal_oee=81.2,
        status="active",
        created_at=datetime.now(timezone.utc).isoformat(),
        latitude=48.7758,
        longitude=9.1829,
    ),
    "synapsys-mfg-apac-tokyo": ProductionSite(
        id="synapsys-mfg-apac-tokyo",
        name="Yokohama Cell 01 (Precision Optics)",
        region="asia-northeast1",
        location="Yokohama, Japan",
        facility_type="Semiconductor & Optical Inspection",
        active_lines=6,
        target_capacity=2800,
        nominal_oee=89.4,
        status="active",
        created_at=datetime.now(timezone.utc).isoformat(),
        latitude=35.4437,
        longitude=139.6380,
    ),
    "synapsys-mfg-in-coimbatore": ProductionSite(
        id="synapsys-mfg-in-coimbatore",
        name="Coimbatore Precision 01 (Precision Tooling & Motors)",
        region="asia-south1",
        location="Coimbatore, Tamil Nadu, India",
        facility_type="Automotive Components, Precision Motors & Textile Machinery",
        active_lines=10,
        target_capacity=4500,
        nominal_oee=88.2,
        status="active",
        created_at=datetime.now(timezone.utc).isoformat(),
        latitude=11.0168,
        longitude=76.9558,
    ),
    "synapsys-mfg-uk-midlands": ProductionSite(
        id="synapsys-mfg-uk-midlands",
        name="UK Midlands Plant 03 (Propulsion Systems)",
        region="europe-west2",
        location="Birmingham, West Midlands, UK",
        facility_type="Automotive Powertrain & Clean Propulsion",
        active_lines=7,
        target_capacity=3200,
        nominal_oee=84.6,
        status="active",
        created_at=datetime.now(timezone.utc).isoformat(),
        latitude=52.4862,
        longitude=-1.8904,
    ),
    "synapsys-mfg-sg-jurong": ProductionSite(
        id="synapsys-mfg-sg-jurong",
        name="Jurong Cleanroom Fab 05 (Advanced Packaging)",
        region="asia-southeast1",
        location="Jurong, Singapore",
        facility_type="Semiconductor Fab & Cleanroom",
        active_lines=5,
        target_capacity=2200,
        nominal_oee=91.5,
        status="active",
        created_at=datetime.now(timezone.utc).isoformat(),
        latitude=1.3329,
        longitude=103.7436,
    ),
    "synapsys-mfg-mx-monterrey": ProductionSite(
        id="synapsys-mfg-mx-monterrey",
        name="Monterrey Advanced Stamping 06 (Tier-1 Castings)",
        region="us-south1",
        location="Monterrey, Nuevo León, Mexico",
        facility_type="Precision Stamping & Tier-1 Heavy Castings",
        active_lines=9,
        target_capacity=4100,
        nominal_oee=83.8,
        status="active",
        created_at=datetime.now(timezone.utc).isoformat(),
        latitude=25.6866,
        longitude=-100.3161,
    ),
}

MACHINE_METADATA: Dict[str, Dict[str, Any]] = {
    # -----------------------------------------------------------------------
    # Coimbatore Precision 01 (synapsys-mfg-in-coimbatore) - Tamil Nadu, India
    # -----------------------------------------------------------------------
    "CBE-101": {
        "site_id": "synapsys-mfg-in-coimbatore",
        "name": "5-Axis Precision Vertical Machining Center",
        "location": "Bay 01 - High-Precision Milling Line",
        "operator": "S. Ramanathan [Shift 1]",
        "ideal_cycle": 11.5,
        "default_target": 150,
        "component": "Spindle Roller Thrust Bearings",
        "plc_controller": "Siemens S7-1500 / Fanuc 31i-B5",
        "ip_address": "10.24.10.11",
        "opc_node_id": "ns=2;s=CBE101.SpindleLoad",
        "work_order": {
            "order_id": "WO-CBE-701",
            "part_number": "PN-EV-ROTOR-55",
            "part_name": "Traction Motor High-Torque Rotor Shaft",
            "customer": "Ather Energy & Tata EV Powertrain",
            "start_time": "06:00 IST",
            "estimated_completion": "14:00 IST",
        },
    },
    "CBE-202": {
        "site_id": "synapsys-mfg-in-coimbatore",
        "name": "Automated Sub-Micron Cylindrical Grinder",
        "location": "Bay 02 - Micro-Finishing Cell",
        "operator": "M. Anand [Shift 1]",
        "ideal_cycle": 12.0,
        "default_target": 150,
        "component": "Diamond Dressing Roll",
        "plc_controller": "Beckhoff TwinCAT 3 PLC",
        "ip_address": "10.24.10.12",
        "opc_node_id": "ns=2;s=CBE202.GrindWheel",
        "work_order": {
            "order_id": "WO-CBE-702",
            "part_number": "PN-HYD-SPOOL-12",
            "part_name": "Servo Proportional Valve Spool",
            "customer": "L&T Heavy Engineering",
            "start_time": "06:00 IST",
            "estimated_completion": "14:30 IST",
        },
    },
    "CBE-303": {
        "site_id": "synapsys-mfg-in-coimbatore",
        "name": "Laser Precision Welder & Inspection Cell",
        "location": "Bay 03 - Laser Cell",
        "operator": "V. Sundaram [Shift 1]",
        "ideal_cycle": 11.0,
        "default_target": 150,
        "component": "Beam Collimating Optics",
        "plc_controller": "Mitsubishi Electric iQ-R Series PLC",
        "ip_address": "10.24.10.13",
        "opc_node_id": "ns=2;s=CBE303.LaserCavity",
        "work_order": {
            "order_id": "WO-CBE-703",
            "part_number": "PN-BATT-BUSBAR-04",
            "part_name": "High-Current EV Battery Busbar Link",
            "customer": "Ola Electric Megaplant",
            "start_time": "06:00 IST",
            "estimated_completion": "14:15 IST",
        },
    },
    # -----------------------------------------------------------------------
    # Detroit Site 04 (synapsys-mfg-prod-us) - Automotive Powertrain & Battery Cell
    # -----------------------------------------------------------------------
    "CNC-101": {
        "site_id": "synapsys-mfg-prod-us",
        "name": "5-Axis CNC Milling Center",
        "location": "Bay 02 - Machining Cell A",
        "operator": "K. Miller [Shift 1]",
        "ideal_cycle": 12.0,
        "default_target": 250,
        "component": "High-Speed Spindle Ceramic Bearings",
        "plc_controller": "Fanuc Series 31i-MODEL B5",
        "ip_address": "192.168.1.120",
        "opc_node_id": "ns=2;s=CNC101.Drive.Spindle",
        "work_order": {
            "order_id": "WO-84920",
            "part_number": "PN-4820-T6",
            "part_name": "Aerospace Turbine Impeller",
            "customer": "Pratt & Whitney Aerostructures",
            "start_time": "06:00 UTC",
            "estimated_completion": "13:30 UTC",
        },
    },
    "INJ-202": {
        "site_id": "synapsys-mfg-prod-us",
        "name": "Hydraulic Injection Press",
        "location": "Bay 04 - Polymers Line",
        "operator": "T. Vance [Shift 1]",
        "ideal_cycle": 6.5,
        "default_target": 500,
        "component": "Hydraulic Platen Proportional Valve",
        "plc_controller": "Siemens S7-1500F Fail-Safe PLC (Euromap 77)",
        "ip_address": "192.168.1.121",
        "opc_node_id": "ns=3;s=IMM202.ClampingUnit",
        "work_order": {
            "order_id": "WO-84921",
            "part_number": "PN-9104-ABS",
            "part_name": "Automotive Sensor Housing",
            "customer": "Apex Precision Assembly",
            "start_time": "06:00 UTC",
            "estimated_completion": "12:45 UTC",
        },
    },
    "WLD-303": {
        "site_id": "synapsys-mfg-prod-us",
        "name": "Robotic Arc Welding Cell",
        "location": "Bay 01 - Fabrication Cell C",
        "operator": "A. Chen [Shift 1]",
        "ideal_cycle": 18.0,
        "default_target": 160,
        "component": "Wire Feeder Drive Rollers & Torch Liner",
        "plc_controller": "Beckhoff TwinCAT 3 CX5140 (EtherCAT / KUKA)",
        "ip_address": "192.168.1.122",
        "opc_node_id": "ns=4;s=RobotWeld303.TorchAssembly",
        "work_order": {
            "order_id": "WO-84922",
            "part_number": "PN-3108-CH",
            "part_name": "Structural Chassis Subframe",
            "customer": "Ford EV Platform Group",
            "start_time": "06:00 UTC",
            "estimated_completion": "14:15 UTC",
        },
    },
    "BAT-404": {
        "site_id": "synapsys-mfg-prod-us",
        "name": "Ultrasonic Battery Tab Welder",
        "location": "Bay 03 - Pack Assembly Cell D",
        "operator": "D. Kowalski [Shift 1]",
        "ideal_cycle": 8.5,
        "default_target": 400,
        "component": "Sonotrode Horn & Transducer Acoustic Stack",
        "plc_controller": "Rockwell ControlLogix 5580 (EtherNet/IP)",
        "ip_address": "192.168.1.123",
        "opc_node_id": "ns=5;s=PackCell404.UltrasonicStack",
        "work_order": {
            "order_id": "WO-84923",
            "part_number": "PN-4680-MOD",
            "part_name": "4680 Cylindrical Battery Cell Module",
            "customer": "Rivian Fleet Systems",
            "start_time": "06:00 UTC",
            "estimated_completion": "14:00 UTC",
        },
    },

    # -----------------------------------------------------------------------
    # Stuttgart Plant 02 (synapsys-mfg-eu-frankfurt) - Precision Stamping & BiW Assembly
    # -----------------------------------------------------------------------
    "PRS-101": {
        "site_id": "synapsys-mfg-eu-frankfurt",
        "name": "2500T Servo Stamping Press",
        "location": "Bay A1 - Primary Body Line",
        "operator": "H. Weber [Shift 1]",
        "ideal_cycle": 5.2,
        "default_target": 800,
        "component": "Main Hydraulic Eccentric Drive Bushing",
        "plc_controller": "Schuler ServoDirect Technology PLC",
        "ip_address": "10.20.4.110",
        "opc_node_id": "ns=2;s=Press101.RamCushion",
        "work_order": {
            "order_id": "WO-92101",
            "part_number": "PN-ST-882",
            "part_name": "High-Strength Steel Roof Outer Panel",
            "customer": "Mercedes-Benz Group",
            "start_time": "06:00 UTC",
            "estimated_completion": "13:45 UTC",
        },
    },
    "ROB-204": {
        "site_id": "synapsys-mfg-eu-frankfurt",
        "name": "Dual-Arm Spot Welding Station",
        "location": "Bay A2 - Body-in-White Cell",
        "operator": "M. Schmidt [Shift 1]",
        "ideal_cycle": 14.5,
        "default_target": 220,
        "component": "Medium-Frequency Inverter Transformer (MFDC)",
        "plc_controller": "KUKA KRC4 Industrial Controller (Profinet IRT)",
        "ip_address": "10.20.4.111",
        "opc_node_id": "ns=2;s=RoboWeld204.ServoGun",
        "work_order": {
            "order_id": "WO-92102",
            "part_number": "PN-ST-904",
            "part_name": "Structural Side Aperture Assembly",
            "customer": "Porsche Motorsport",
            "start_time": "06:00 UTC",
            "estimated_completion": "14:30 UTC",
        },
    },
    "LAS-305": {
        "site_id": "synapsys-mfg-eu-frankfurt",
        "name": "3D 5-Axis Fiber Laser Trimming Cell",
        "location": "Bay B1 - Finishing Line",
        "operator": "L. Fischer [Shift 1]",
        "ideal_cycle": 9.0,
        "default_target": 350,
        "component": "Trumpf TruDisk 6001 Optical Collimator",
        "plc_controller": "Siemens Sinumerik 840D sl",
        "ip_address": "10.20.4.112",
        "opc_node_id": "ns=3;s=Laser305.BeamDelivery",
        "work_order": {
            "order_id": "WO-92103",
            "part_number": "PN-ST-412",
            "part_name": "Hot-Stamped Boron Steel B-Pillars",
            "customer": "Audi AG",
            "start_time": "06:00 UTC",
            "estimated_completion": "12:15 UTC",
        },
    },
    "EDC-402": {
        "site_id": "synapsys-mfg-eu-frankfurt",
        "name": "Cathodic Electro-Dip Coating Tank",
        "location": "Bay C2 - Surface Coating Line",
        "operator": "K. Braun [Shift 1]",
        "ideal_cycle": 22.0,
        "default_target": 120,
        "component": "Ultrafiltration Recirculation Pump Impeller",
        "plc_controller": "Phoenix Contact RFC 470 PN 3TX",
        "ip_address": "10.20.4.113",
        "opc_node_id": "ns=4;s=EDC402.AnolyteCirculation",
        "work_order": {
            "order_id": "WO-92104",
            "part_number": "PN-ST-110",
            "part_name": "Anti-Corrosion E-Coat Primer Bath",
            "customer": "BMW Manufacturing",
            "start_time": "06:00 UTC",
            "estimated_completion": "15:00 UTC",
        },
    },

    # -----------------------------------------------------------------------
    # Yokohama Cell 01 (synapsys-mfg-apac-tokyo) - Semiconductor & Precision Optics
    # -----------------------------------------------------------------------
    "OPT-101": {
        "site_id": "synapsys-mfg-apac-tokyo",
        "name": "Ultra-Precision Diamond Turning Lathe",
        "location": "Bay Alpha - Cleanroom ISO 5",
        "operator": "R. Takahashi [Shift 1]",
        "ideal_cycle": 35.0,
        "default_target": 90,
        "component": "Hydrostatic Aerostatic Air-Bearing Spindle",
        "plc_controller": "Fanuc Series 30i-B Ultra-Precision CNC",
        "ip_address": "172.16.8.101",
        "opc_node_id": "ns=2;s=DiamondTurn101.SpindleRunout",
        "work_order": {
            "order_id": "WO-77301",
            "part_number": "PN-OPT-08",
            "part_name": "LiDAR Aspherical Fused Silica Lens",
            "customer": "Sony Imaging Systems",
            "start_time": "06:00 UTC",
            "estimated_completion": "14:45 UTC",
        },
    },
    "SMT-202": {
        "site_id": "synapsys-mfg-apac-tokyo",
        "name": "High-Speed SMT Pick & Place System",
        "location": "Bay Beta - Electronics Line 1",
        "operator": "Y. Tanaka [Shift 1]",
        "ideal_cycle": 4.2,
        "default_target": 1200,
        "component": "High-Speed Rotary Vacuum Placement Nozzle",
        "plc_controller": "Panasonic NPM-D3 Production Controller",
        "ip_address": "172.16.8.102",
        "opc_node_id": "ns=2;s=SMT202.VacuumHeadArray",
        "work_order": {
            "order_id": "WO-77302",
            "part_number": "PN-ECU-77",
            "part_name": "Automotive Radar 77GHz Transceiver Board",
            "customer": "Denso Corporation",
            "start_time": "06:00 UTC",
            "estimated_completion": "12:30 UTC",
        },
    },
    "AOI-303": {
        "site_id": "synapsys-mfg-apac-tokyo",
        "name": "3D Automated Optical Inspector",
        "location": "Bay Beta - QA Inspection Cell",
        "operator": "K. Sato [Shift 1]",
        "ideal_cycle": 6.0,
        "default_target": 850,
        "component": "Coaxial DLP Telecentric Projection Lens",
        "plc_controller": "Omron NJ501-1400 Automation Controller",
        "ip_address": "172.16.8.103",
        "opc_node_id": "ns=3;s=AOI303.MoiréProjector",
        "work_order": {
            "order_id": "WO-77303",
            "part_number": "PN-QA-44",
            "part_name": "Sub-Micron BGA Solder Joint Metrology",
            "customer": "Renesas Electronics",
            "start_time": "06:00 UTC",
            "estimated_completion": "13:00 UTC",
        },
    },
    "ENC-401": {
        "site_id": "synapsys-mfg-apac-tokyo",
        "name": "Hermetic Ultrasonic Wire Bonder",
        "location": "Bay Gamma - Micro-Packaging Cell",
        "operator": "H. Nakamura [Shift 1]",
        "ideal_cycle": 11.0,
        "default_target": 420,
        "component": "High-Frequency 138kHz Piezo Transducer",
        "plc_controller": "Kulicke & Soffa Asterion Hybrid Controller",
        "ip_address": "172.16.8.104",
        "opc_node_id": "ns=4;s=WireBond401.UltrasonicGenerator",
        "work_order": {
            "order_id": "WO-77304",
            "part_number": "PN-MEMS-02",
            "part_name": "MEMS Inertial Measurement Unit Wire Loops",
            "customer": "Panasonic Avionics",
            "start_time": "06:00 UTC",
            "estimated_completion": "14:15 UTC",
        },
    },
}


def seed_machines_for_site(site_id: str, site_name: str = "", facility_type: str = "") -> List[str]:
    """Generates unique, realistic industrial machinery for any custom or newly provisioned production site."""
    slug = site_id.replace("synapsys-mfg-", "").replace("site-", "").replace("-", " ").strip().title()
    prefix = site_id.split("-")[-1][:3].upper() if site_id else "AST"
    
    seeds = [
        {
            "id": f"{prefix}-101",
            "name": f"High-Precision CNC Multi-Spindle Cell",
            "location": "Bay 01 - Primary Machining Area",
            "operator": "J. Reynolds [Shift 1]",
            "ideal_cycle": 13.5,
            "target": 300,
            "component": "Drive Spindle Roller Bearing Stack",
            "plc": "Siemens S7-1500 Advanced",
            "wo": f"WO-{random.randint(50000, 99900)}",
            "part": f"Precision Component Subassembly ({slug})",
        },
        {
            "id": f"{prefix}-202",
            "name": f"Automated Robotic Fabrication Cell",
            "location": "Bay 02 - Assembly & Joining",
            "operator": "C. Morgan [Shift 1]",
            "ideal_cycle": 9.2,
            "target": 450,
            "component": "Servo Harmonic Drive Reducer",
            "plc": "KUKA KRC4 / Beckhoff EtherCAT",
            "wo": f"WO-{random.randint(50000, 99900)}",
            "part": f"Structural Frame Bracket ({slug})",
        },
        {
            "id": f"{prefix}-303",
            "name": f"Inline Automated Quality & Laser Metrology",
            "location": "Bay 03 - End-of-Line QA",
            "operator": "E. Davis [Shift 1]",
            "ideal_cycle": 7.0,
            "target": 600,
            "component": "High-Resolution Laser Interferometer",
            "plc": "Keyence XG-X Vision System",
            "wo": f"WO-{random.randint(50000, 99900)}",
            "part": f"Certified QC Inspection Lot ({slug})",
        },
    ]
    
    created_ids = []
    for s in seeds:
        m_id = s["id"]
        MACHINE_METADATA[m_id] = {
            "site_id": site_id,
            "name": s["name"],
            "location": s["location"],
            "operator": s["operator"],
            "ideal_cycle": s["ideal_cycle"],
            "default_target": s["target"],
            "component": s["component"],
            "plc_controller": s["plc"],
            "ip_address": f"192.168.10.{random.randint(20, 200)}",
            "opc_node_id": f"ns=2;s={m_id}.Telemetry",
            "work_order": {
                "order_id": s["wo"],
                "part_number": f"PN-{m_id}",
                "part_name": s["part"],
                "customer": f"{slug} Enterprise Fleet Partner",
                "start_time": "06:00 UTC",
                "estimated_completion": "14:00 UTC",
            },
        }
        created_ids.append(m_id)
    return created_ids


# ---------------------------------------------------------------------------
# OEE & Predictive Diagnostics Calculation
# ---------------------------------------------------------------------------

def calculate_oee(payload: TelemetryPayload) -> OEEMetrics:
    planned_production_time = payload.uptime_seconds + payload.downtime_seconds
    if planned_production_time > 0:
        availability = payload.uptime_seconds / planned_production_time
    else:
        availability = 1.0 if payload.status == "Running" else 0.0
    availability = max(0.0, min(1.0, availability))

    total_output = payload.output_count
    if payload.uptime_seconds > 0 and total_output > 0:
        theoretical_time = total_output * payload.ideal_cycle_time_sec
        performance = theoretical_time / payload.uptime_seconds
    elif payload.cycle_time_sec > 0:
        performance = payload.ideal_cycle_time_sec / payload.cycle_time_sec
    else:
        performance = 0.85
    performance = max(0.0, min(1.0, performance))

    good_count = payload.good_count if payload.good_count is not None else max(0, total_output - (payload.scrap_count or 0))
    if total_output > 0:
        quality = good_count / total_output
    else:
        quality = 1.0
    quality = max(0.0, min(1.0, quality))

    oee = availability * performance * quality
    oee_pct = round(oee * 100, 2)

    if oee_pct >= 85.0:
        benchmark = "World-Class"
    elif oee_pct >= 65.0:
        benchmark = "Acceptable"
    else:
        benchmark = "Needs Attention"

    return OEEMetrics(
        availability=round(availability, 4),
        performance=round(performance, 4),
        quality=round(quality, 4),
        oee=round(oee, 4),
        oee_percentage=oee_pct,
        benchmark_status=benchmark,
    )


def compute_six_big_losses(payload: TelemetryPayload) -> SixBigLosses:
    eq_failure = payload.downtime_seconds if payload.status == "Down" else min(payload.downtime_seconds, 45.0)
    setup_adj = max(0.0, payload.downtime_seconds - eq_failure) * 0.4
    idling = max(0.0, payload.downtime_seconds - eq_failure) * 0.6
    
    actual_cycle = payload.cycle_time_sec or payload.ideal_cycle_time_sec
    cycle_delta = max(0.0, actual_cycle - payload.ideal_cycle_time_sec)
    speed_loss = round(cycle_delta * payload.output_count, 1)

    scrap = payload.scrap_count or 0
    startup_rejects = 1 if scrap > 0 else 0
    process_defects = max(0, scrap - startup_rejects)

    return SixBigLosses(
        equipment_failure_sec=round(eq_failure, 1),
        setup_adjustment_sec=round(setup_adj, 1),
        idling_minor_stops_sec=round(idling, 1),
        reduced_speed_sec=speed_loss,
        process_defects_units=process_defects,
        startup_rejects_units=startup_rejects,
    )


def compute_predictive_diagnostics(payload: TelemetryPayload, sensors: MachineSensors) -> PredictiveMaintenance:
    meta = MACHINE_METADATA.get(payload.machine_id, {})
    comp = meta.get("component", "Drive Mechanism")

    if payload.status == "Down":
        anomaly_score = 94.0
        health_status = "Critical Risk"
        rul_hrs = 4
        rca = f"Unscheduled stoppage. Operating sensors detect thermal trip ({sensors.temperature_c}°C) or mechanical jam on {comp}."
    elif payload.status == "Idle":
        anomaly_score = 24.0
        health_status = "Degraded"
        rul_hrs = 140
        rca = f"Machine on operational standby. Minor harmonic attenuation observed during operator changeover on {comp}."
    else:
        vib_excess = max(0.0, sensors.vibration_mm_s - 1.5) * 18.0
        temp_excess = max(0.0, sensors.temperature_c - 55.0) * 0.7
        score = min(85.0, round(12.0 + vib_excess + temp_excess, 1))

        if score > 45.0:
            health_status = "Degraded"
            rul_hrs = 64
            rca = f"Micro-vibration harmonics detected (+{round(sensors.vibration_mm_s, 2)} mm/s). Scheduled lubrication or tool re-seating recommended within 64h."
        else:
            health_status = "Optimal"
            rul_hrs = 320
            rca = f"Harmonic profile nominal. {comp} operating within 99.4% confidence interval."
        anomaly_score = score

    return PredictiveMaintenance(
        anomaly_score=anomaly_score,
        health_status=health_status,
        remaining_useful_life_hrs=rul_hrs,
        component_at_risk=comp,
        root_cause_analysis=rca,
    )


# ---------------------------------------------------------------------------
# FastAPI Application & Endpoints
# ---------------------------------------------------------------------------

app = FastAPI(
    title="SynapSYS Enterprise Manufacturing Data Engine",
    description="Clean, real-time industrial telemetry, OEE loss decomposition & ISA-18.2 engine",
    version="4.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": "SynapSYS Enterprise Manufacturing Data Engine",
        "spec": "ISO-22400 / ISA-95 / ISA-18.2 / ISO-50001 / IEC-62541 (OPC-UA)",
        "status": "Operational",
        "data_source_mode": current_data_source_mode,
        "firebase": firebase_store.get_status(),
        "endpoints": {
            "dashboard": "/api/dashboard",
            "telemetry_stream": "/api/telemetry",
            "connectors": "/api/connectors",
            "import_csv": "/api/telemetry/import-csv",
            "copilot": "/api/copilot/query",
            "firebase_status": "/api/cloud/firebase/status",
            "documentation": "/docs",
        },
    }


# ---------------------------------------------------------------------------
# Enterprise Authentication & SQL User Management
# ---------------------------------------------------------------------------

class SignUpRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    role: Optional[str] = "admin"
    assigned_facility: Optional[str] = None


class Initiate2FARequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    role: Optional[str] = "admin"


class Verify2FARequest(BaseModel):
    email: str
    otp_code: str


@app.post("/api/auth/register/initiate-2fa")
def initiate_2fa(req: Initiate2FARequest):
    """
    Step 1 of 2FA: Validates candidate details and immediately dispatches a security
    alert email with a 6-digit OTP to the designated supervisor email (sarveshwaran.k2008@gmail.com).
    """
    email = req.email.strip().lower()
    password = req.password.strip()
    if not email or not password:
        raise HTTPException(status_code=400, detail="Valid email address and password are required")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"User with email '{email}' already registered. Please sign in.")
    conn.close()

    domain = email.split("@")[-1] if "@" in email else "enterprise.local"
    prefix = email.split("@")[0].lower()
    full_name = (req.full_name or "").strip() or prefix.replace(".", " ").replace("_", " ").title()
    company_name = (req.company_name or "").strip() or (domain.split(".")[0].replace("-", " ").title() + " Industrial")

    candidate_data = {
        "email": email,
        "password": password,
        "full_name": full_name,
        "company_name": company_name,
        "domain": domain,
        "role": req.role if req.role in ("admin", "operator", "demo") else "admin",
    }

    _, otp_code, delivery_info = initiate_2fa_signup(candidate_data)
    return {
        "success": True,
        "delivered": delivery_info.get("delivered", False),
        "delivery_status": "SMTP_DELIVERED" if delivery_info.get("delivered") else "SMTP_UNCONFIGURED",
        "delivery_message": delivery_info.get("status_message") or f"Security alert & 2FA OTP code dispatched to {DESIGNATED_SECURITY_EMAIL}",
        "message": delivery_info.get("status_message") or f"Security alert & 2FA OTP code dispatched to {DESIGNATED_SECURITY_EMAIL}",
        "recipient": DESIGNATED_SECURITY_EMAIL,
        "email": email,
        # Only provide sandbox fallback hint if SMTP delivery is unconfigured or failed
        "debug_otp_hint": None if delivery_info.get("delivered") else otp_code,
    }


@app.post("/api/auth/register/verify-2fa", response_model=AuthResponse, status_code=201)
def verify_2fa_and_register(req: Verify2FARequest):
    """
    Step 2 of 2FA: Validates the 6-digit OTP code, creates the user in SQLite,
    provisions their dedicated company manufacturing site, and syncs immediately to Cloud Firestore.
    """
    candidate_data = verify_2fa_code(req.email, req.otp_code)
    if not candidate_data:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired 2FA verification code. Please check your email or request a new code.",
        )

    email = candidate_data["email"]
    password = candidate_data["password"]
    full_name = candidate_data["full_name"]
    company_name = candidate_data["company_name"]
    domain = candidate_data["domain"]
    role = candidate_data["role"]

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Account already registered.")

    pwd_hash = hash_password(password)
    created_at = datetime.now(timezone.utc).isoformat()

    comp_site = ensure_company_site(domain, company_name)
    assigned_facility = comp_site.id

    cursor.execute("""
        INSERT INTO users (email, password_hash, full_name, company_name, company_domain, role, assigned_facility, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (email, pwd_hash, full_name, company_name, domain, role, assigned_facility, created_at))
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    user_dict = {
        "email": email,
        "password_hash": pwd_hash,
        "full_name": full_name,
        "company_name": company_name,
        "company_domain": domain,
        "role": role,
        "assigned_facility": assigned_facility,
        "created_at": created_at,
    }
    firebase_store.set_document("users", email, user_dict)

    token = f"synapsys_session_{user_id}_{hashlib.sha256((email + created_at).encode()).hexdigest()[:16]}"
    return AuthResponse(
        success=True,
        token=token,
        user=UserProfile(
            id=user_id,
            email=email,
            full_name=full_name,
            company_name=company_name,
            company_domain=domain,
            role=role,
            assigned_facility=assigned_facility,
            created_at=created_at,
        ),
        message=f"2FA verified! Account created successfully for {full_name} ({company_name})",
    )


@app.post("/api/auth/register", response_model=AuthResponse, status_code=201)
def register(req: SignUpRequest):
    """
    Explicit enterprise sign up endpoint for new users and facility administrators.
    Provisions credentials into SQLite and syncs instantly to Cloud Firestore.
    """
    email = req.email.strip().lower()
    password = req.password.strip()
    if not email or not password:
        raise HTTPException(status_code=400, detail="Valid email address and password are required")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE email = ?", (email,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"User with email '{email}' already registered. Please sign in.")

    domain = email.split("@")[-1] if "@" in email else "enterprise.local"
    prefix = email.split("@")[0].lower()

    full_name = (req.full_name or "").strip() or prefix.replace(".", " ").replace("_", " ").title()
    company_name = (req.company_name or "").strip() or (domain.split(".")[0].replace("-", " ").title() + " Industrial")
    role = req.role if req.role in ("admin", "operator", "demo") else "admin"

    pwd_hash = hash_password(password)
    created_at = datetime.now(timezone.utc).isoformat()

    comp_site = ensure_company_site(domain, company_name)
    assigned_facility = req.assigned_facility or comp_site.id

    cursor.execute("""
        INSERT INTO users (email, password_hash, full_name, company_name, company_domain, role, assigned_facility, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (email, pwd_hash, full_name, company_name, domain, role, assigned_facility, created_at))
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()

    user_dict = {
        "email": email,
        "password_hash": pwd_hash,
        "full_name": full_name,
        "company_name": company_name,
        "company_domain": domain,
        "role": role,
        "assigned_facility": assigned_facility,
        "created_at": created_at,
    }
    firebase_store.set_document("users", email, user_dict)

    token = f"synapsys_session_{user_id}_{hashlib.sha256((email + created_at).encode()).hexdigest()[:16]}"
    return AuthResponse(
        success=True,
        token=token,
        user=UserProfile(
            id=user_id,
            email=email,
            full_name=full_name,
            company_name=company_name,
            company_domain=domain,
            role=role,
            assigned_facility=assigned_facility,
            created_at=created_at,
        ),
        message=f"Account created successfully for {full_name} ({company_name})",
    )


@app.post("/api/auth/login", response_model=AuthResponse)
def login(req: LoginRequest):
    """
    Enterprise login endpoint backed by persistent SQLite database.
    - If user exists in SQL database, verifies credentials.
    - If user enters a new corporate email (e.g. employee@company.com),
      automatically provisions them as Company Administrator with full supervisory privileges.
    """
    email = req.email.strip().lower()
    password = req.password.strip()
    if not email or not password:
        raise HTTPException(status_code=400, detail="Corporate email and password are required")
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, email, password_hash, full_name, company_name, company_domain, role, assigned_facility, created_at
        FROM users WHERE email = ?
    """, (email,))
    row = cursor.fetchone()
    
    if row:
        user_id, u_email, pwd_hash, full_name, company_name, company_domain, role, assigned_facility, created_at = row
        if pwd_hash != hash_password(password):
            conn.close()
            raise HTTPException(status_code=401, detail="Invalid corporate password")
        # Ensure company primary site exists
        comp_site = ensure_company_site(company_domain, company_name)
        if not assigned_facility or assigned_facility == "synapsys-mfg-prod-us" and company_domain != "synapsys.com":
            assigned_facility = comp_site.id
    else:
        # Dynamic Enterprise Auto-Provisioning:
        # Derive role cleanly from corporate identity prefix without granting admin to demo/operator addresses
        domain = email.split("@")[-1] if "@" in email else "enterprise.local"
        prefix = email.split("@")[0].lower()

        is_demo = prefix == "demo" or prefix.startswith("demo.") or prefix.startswith("demo+")
        is_operator = "operator" in prefix or "shift" in prefix

        clean_company = (
            "SynapSYS Demo Workspace"
            if is_demo and domain == "synapsys.com"
            else domain.split(".")[0].replace("-", " ").title() + " Industrial"
        )
        user_name = (
            "Demo Explorer"
            if is_demo
            else prefix.replace(".", " ").replace("_", " ").title()
        )

        role = "demo" if is_demo else ("operator" if is_operator else "admin")
        pwd_hash = hash_password(password)
        created_at = datetime.now(timezone.utc).isoformat()
        
        comp_site = ensure_company_site(domain, clean_company)
        assigned_facility = comp_site.id
        
        cursor.execute("""
            INSERT INTO users (email, password_hash, full_name, company_name, company_domain, role, assigned_facility, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (email, pwd_hash, user_name, clean_company, domain, role, assigned_facility, created_at))
        conn.commit()
        user_id = cursor.lastrowid
        full_name = user_name
        company_name = clean_company
        company_domain = domain
        firebase_store.set_document(
            "users",
            email,
            {
                "email": email,
                "password_hash": pwd_hash,
                "full_name": full_name,
                "company_name": company_name,
                "company_domain": company_domain,
                "role": role,
                "assigned_facility": assigned_facility,
                "created_at": created_at,
            },
        )
    
    conn.close()
    
    token = f"synapsys_session_{user_id}_{hashlib.sha256((email + created_at).encode()).hexdigest()[:16]}"
    
    return AuthResponse(
        success=True,
        token=token,
        user=UserProfile(
            id=user_id,
            email=email,
            full_name=full_name,
            company_name=company_name,
            company_domain=company_domain,
            role=role,
            assigned_facility=assigned_facility,
            created_at=created_at,
        ),
        message=f"Authenticated successfully as {role.upper()} for {company_name}",
    )


@app.get("/api/auth/me", response_model=UserProfile)
def get_current_user(token: Optional[str] = None):
    """Returns active session user from SQLite database."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, email, full_name, company_name, company_domain, role, assigned_facility, created_at
        FROM users ORDER BY id ASC LIMIT 1
    """)
    row = cursor.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="No users registered in system")
    user_id, email, full_name, company_name, company_domain, role, assigned_facility, created_at = row
    return UserProfile(
        id=user_id,
        email=email,
        full_name=full_name,
        company_name=company_name,
        company_domain=company_domain,
        role=role,
        assigned_facility=assigned_facility,
        created_at=created_at,
    )


@app.get("/api/auth/users", response_model=List[UserProfile])
def get_all_users():
    """Lists all registered corporate enterprise users stored in SQLite."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, email, full_name, company_name, company_domain, role, assigned_facility, created_at
        FROM users ORDER BY id ASC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [
        UserProfile(
            id=r[0],
            email=r[1],
            full_name=r[2],
            company_name=r[3],
            company_domain=r[4],
            role=r[5],
            assigned_facility=r[6],
            created_at=r[7],
        )
        for r in rows
    ]


@app.post("/api/auth/logout")
def logout():
    """Logs out current session."""
    return {"success": True, "message": "Enterprise session terminated"}


@app.get("/api/connectors", response_model=List[IndustrialConnector])
def get_connectors():
    """
    Returns list of industrial edge connectors (OPC-UA, MQTT Sparkplug B, REST Webhook, Modbus).
    """
    return list(industrial_connectors.values())


@app.post("/api/connectors/{connector_id}/toggle")
def toggle_connector(connector_id: str):
    if connector_id not in industrial_connectors:
        raise HTTPException(status_code=404, detail="Connector not found")
    conn = industrial_connectors[connector_id]
    conn.status = "Standby" if conn.status == "Connected" else "Connected"
    return {"id": conn.id, "name": conn.name, "status": conn.status}


# ---------------------------------------------------------------------------
# Multi-Plant Production Sites Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/sites", response_model=List[ProductionSite])
def get_production_sites(company_domain: Optional[str] = Query(None)):
    """Returns list of configured manufacturing facilities strictly for the requesting company."""
    if not company_domain:
        company_domain = "synapsys.com"
    return get_sites_for_company(company_domain)


@app.post("/api/sites", response_model=ProductionSite, status_code=201)
def create_production_site(site: ProductionSite):
    """Provisions a new production site / manufacturing plant with automatic distinct machine seeding for that company."""
    site_id = site.id.strip().lower().replace(" ", "-")
    domain = (site.company_domain or "synapsys.com").strip().lower()
    clean_company = site.company_name or (domain.split(".")[0].replace("-", " ").title() + " Industrial")
    if not site_id:
        site_id = f"{domain.split('.')[0]}-mfg-{len(production_sites)+1:02d}"
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM production_sites WHERE id = ?", (site_id,))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail=f"Production site with ID '{site_id}' already exists")
    
    now_iso = site.created_at or datetime.now(timezone.utc).isoformat()
    new_site = site.model_copy(update={
        "id": site_id,
        "company_domain": domain,
        "company_name": clean_company,
        "created_at": now_iso,
    })

    cursor.execute("""
        INSERT INTO production_sites (id, company_domain, company_name, name, region, location, facility_type, active_lines, target_capacity, nominal_oee, status, latitude, longitude, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (new_site.id, new_site.company_domain, new_site.company_name, new_site.name, new_site.region, new_site.location, new_site.facility_type, new_site.active_lines, new_site.target_capacity, new_site.nominal_oee, new_site.status, new_site.latitude, new_site.longitude, new_site.created_at))
    conn.commit()
    conn.close()

    production_sites[site_id] = new_site
    seed_machines_for_site(site_id, new_site.name, new_site.facility_type)
    firebase_store.set_document("production_sites", site_id, new_site.model_dump())
    return new_site


@app.delete("/api/sites/{site_id}")
def delete_production_site(site_id: str):
    """Decommissions/removes a production site and purges its attached machinery."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM production_sites WHERE id = ?", (site_id,))
    conn.commit()
    conn.close()
    firebase_store.delete_document("production_sites", site_id)

    # Remove associated machines
    machines_to_purge = [m for m, meta in MACHINE_METADATA.items() if meta.get("site_id") == site_id]
    for m in machines_to_purge:
        MACHINE_METADATA.pop(m, None)
        latest_telemetry.pop(m, None)
        recent_cycle_history.pop(m, None)
        active_alarms_map.pop(m, None)
        alarm_start_times.pop(m, None)
        alarm_ack_state.pop(m, None)

    deleted = production_sites.pop(site_id, None)
    return {"status": "deleted", "id": site_id, "name": deleted.name if deleted else site_id}


class CreateMachineRequest(BaseModel):
    machine_id: str
    machine_name: str
    site_id: Optional[str] = None
    location: str = "Bay 03 - Machining Cell B"
    operator: str = "Shift Operator"
    ideal_cycle_time_sec: float = 14.0
    target_output: int = 250
    component: str = "High-Speed Spindle / Drive Train"
    plc_controller: str = "Siemens S7-1500F"
    ip_address: str = "192.168.1.135"
    opc_node_id: str = "ns=2;s=Machine.MainDrive"
    order_id: Optional[str] = "WO-84930"
    part_number: Optional[str] = "PN-5520-AL"
    part_name: Optional[str] = "Structural Sub-Assembly Bracket"
    customer: Optional[str] = "Apex Precision Assembly"


class CreateConnectorRequest(BaseModel):
    id: Optional[str] = None
    name: str
    protocol: str = "OPC-UA"
    endpoint: str
    security_policy: str = "TLS 1.3 / Certificate M-TLS"
    nodes_mapped: int = 24
    packet_rate_hz: float = 1.0


class CreateWorkOrderRequest(BaseModel):
    machine_id: str
    order_id: str
    part_number: str
    part_name: str
    customer: str
    batch_target: int
    start_time: str = "08:00 UTC"
    estimated_completion: str = "16:00 UTC"


@app.post("/api/machines", status_code=201)
def create_machine(req: CreateMachineRequest):
    m_id = req.machine_id.strip().upper()
    if not m_id:
        raise HTTPException(status_code=400, detail="Machine ID cannot be empty")
    if m_id in MACHINE_METADATA:
        raise HTTPException(status_code=409, detail=f"Machine {m_id} already provisioned")

    target_site = req.site_id.strip() if req.site_id else (list(production_sites.keys())[0] if production_sites else "synapsys-mfg-prod-us")

    now_iso = datetime.now(timezone.utc).isoformat()
    MACHINE_METADATA[m_id] = {
        "site_id": target_site,
        "name": req.machine_name.strip(),
        "location": req.location.strip(),
        "operator": req.operator.strip(),
        "ideal_cycle": req.ideal_cycle_time_sec,
        "default_target": req.target_output,
        "component": req.component.strip(),
        "plc_controller": req.plc_controller.strip(),
        "ip_address": req.ip_address.strip(),
        "opc_node_id": req.opc_node_id.strip(),
        "work_order": {
            "order_id": req.order_id or "WO-84930",
            "part_number": req.part_number or "PN-0000",
            "part_name": req.part_name or "Component Batch",
            "customer": req.customer or "OEM Client",
            "start_time": "08:00 UTC",
            "estimated_completion": "16:00 UTC",
        },
    }

    latest_telemetry[m_id] = TelemetryPayload(
        timestamp=now_iso,
        machine_id=m_id,
        machine_name=req.machine_name.strip(),
        location=req.location.strip(),
        operator=req.operator.strip(),
        status="Running",
        output_count=18,
        target_output=req.target_output,
        good_count=18,
        scrap_count=0,
        cycle_time_sec=req.ideal_cycle_time_sec,
        ideal_cycle_time_sec=req.ideal_cycle_time_sec,
        uptime_seconds=216.0,
        downtime_seconds=0.0,
        active_alarm=None,
        alarm_severity="None",
        sensors=MachineSensors(
            temperature_c=48.5,
            vibration_mm_s=1.28,
            power_kw=19.5,
            pressure_bar=6.2,
        ),
    )
    recent_cycle_history[m_id] = deque([req.ideal_cycle_time_sec] * 8, maxlen=25)

    return {
        "status": "provisioned",
        "machine_id": m_id,
        "machine_name": req.machine_name,
        "message": f"Asset {m_id} successfully provisioned to shop floor and registered in ISO-22400 bus."
    }


@app.delete("/api/machines/{machine_id}")
def delete_machine(machine_id: str):
    m_id = machine_id.strip().upper()
    if m_id not in MACHINE_METADATA:
        raise HTTPException(status_code=404, detail="Machine not found")

    MACHINE_METADATA.pop(m_id, None)
    latest_telemetry.pop(m_id, None)
    recent_cycle_history.pop(m_id, None)
    active_alarms_map.pop(m_id, None)
    alarm_start_times.pop(m_id, None)
    alarm_ack_state.pop(m_id, None)

    return {"status": "decommissioned", "machine_id": m_id, "message": f"Asset {m_id} decommissioned."}


@app.post("/api/connectors", status_code=201)
def create_connector(req: CreateConnectorRequest):
    c_id = req.id or f"conn_{len(industrial_connectors) + 1}_{req.protocol.lower().replace('-', '_')}"
    new_conn = IndustrialConnector(
        id=c_id,
        name=req.name,
        protocol=req.protocol,
        endpoint=req.endpoint,
        status="Connected",
        packet_rate_hz=req.packet_rate_hz,
        last_heartbeat="Live (Subscribed)",
        nodes_mapped=req.nodes_mapped,
        security_policy=req.security_policy,
    )
    industrial_connectors[c_id] = new_conn
    return new_conn


@app.delete("/api/connectors/{connector_id}")
def delete_connector(connector_id: str):
    if connector_id not in industrial_connectors:
        raise HTTPException(status_code=404, detail="Connector not found")
    del industrial_connectors[connector_id]
    return {"status": "removed", "connector_id": connector_id}


@app.post("/api/workorders", status_code=201)
def create_work_order(req: CreateWorkOrderRequest):
    m_id = req.machine_id.strip().upper()
    if m_id not in MACHINE_METADATA:
        raise HTTPException(status_code=404, detail="Machine not found")

    wo = {
        "order_id": req.order_id,
        "part_number": req.part_number,
        "part_name": req.part_name,
        "customer": req.customer,
        "start_time": req.start_time,
        "estimated_completion": req.estimated_completion,
    }
    MACHINE_METADATA[m_id]["work_order"] = wo
    if m_id in latest_telemetry:
        latest_telemetry[m_id].target_output = req.batch_target
        latest_telemetry[m_id].output_count = 0
        latest_telemetry[m_id].good_count = 0
        latest_telemetry[m_id].scrap_count = 0

    return {"status": "dispatched", "work_order": wo, "machine_id": m_id}


@app.get("/api/workorders/{order_id}")
def get_work_order_details(order_id: str):
    """
    Retrieves full manufacturing execution details, routing workflow,
    material specifications, and commercial metrics for an active work order.
    """
    clean_id = order_id.strip().upper()
    found_machine_id = None
    found_wo = None

    # Search in MACHINE_METADATA
    for m_id, meta in MACHINE_METADATA.items():
        wo = meta.get("work_order", {})
        if wo.get("order_id", "").upper() == clean_id:
            found_machine_id = m_id
            found_wo = wo
            break

    # If not found by exact ID, fallback to check if order_id is actually machine_id or matches first machine
    if not found_wo and clean_id in MACHINE_METADATA:
        found_machine_id = clean_id
        found_wo = MACHINE_METADATA[clean_id].get("work_order", {})

    if not found_wo:
        # Default to first machine if not found
        found_machine_id = list(MACHINE_METADATA.keys())[0]
        found_wo = MACHINE_METADATA[found_machine_id].get("work_order", {})

    meta = MACHINE_METADATA.get(found_machine_id, {})
    telem = latest_telemetry.get(found_machine_id)
    
    target = telem.target_output if telem else found_wo.get("batch_target", 250)
    completed = telem.output_count if telem else 214
    good = telem.good_count if telem else 208
    scrap = telem.scrap_count if telem else 6
    yield_pct = round((good / completed * 100), 1) if completed > 0 else 100.0

    # Rich metadata dictionary tailored per order/asset
    specs_catalog = {
        "WO-84920": {
            "material_spec": "Ti-6Al-4V Grade 5 Aerospace Titanium",
            "cad_revision": "DWG-84920-A (Rev D.4)",
            "tolerance_class": "ISO 2768-m (±0.012 mm)",
            "unit_price_usd": 385.00,
            "priority": "High / Tier 1 Aerospace",
            "fai_status": "AS9102 Rev C Approved",
            "qa_inspector": "E. Hoffman (QA Lead Metrology)",
            "routing_steps": [
                {"step": 10, "operation": "Billet Sawing & Surface De-scale", "status": "Completed", "station": "SAW-01", "details": "Ultrasonic test passed"},
                {"step": 20, "operation": "5-Axis High-Speed Roughing", "status": "Completed", "station": "CNC-101", "details": "4 Flute Endmill nominal"},
                {"step": 30, "operation": "Blade Blisk Finish Contouring", "status": "In Progress", "station": "CNC-101", "details": "Active cycle 12.2s"},
                {"step": 40, "operation": "Deburr & Ultrasonic Wash", "status": "Queued", "station": "WASH-02", "details": "40kHz immersion tank"},
                {"step": 50, "operation": "Zeiss CMM 3D Coordinate Inspection", "status": "Queued", "station": "CMM-01", "details": "AS9102 inspection report"},
            ]
        },
        "WO-84921": {
            "material_spec": "PA66-GF30 Heat Stabilized Polymer (30% Glass)",
            "cad_revision": "DWG-9104-B (Rev B.1)",
            "tolerance_class": "DIN 16901-130 (±0.05 mm)",
            "unit_price_usd": 42.50,
            "priority": "Standard Automotive OEM",
            "fai_status": "PPAP Level 3 Validated",
            "qa_inspector": "R. Patel (Polymer Quality Tech)",
            "routing_steps": [
                {"step": 10, "operation": "Resin Desiccant Drying (-40°C Dew Point)", "status": "Completed", "station": "DRY-04", "details": "Moisture < 0.08%"},
                {"step": 20, "operation": "Injection Mold Cycle & Clamping", "status": "In Progress", "station": "INJ-202", "details": "142 bar pack pressure"},
                {"step": 30, "operation": "Robotic Sprue & Gate Trimming", "status": "In Progress", "station": "INJ-202", "details": "6-axis servo degater"},
                {"step": 40, "operation": "Dielectric Insulation Breakdown Test", "status": "Queued", "station": "TEST-03", "details": "1.5kV AC dielectric"},
                {"step": 50, "operation": "ESD Packaging & Barcode Serialization", "status": "Queued", "station": "PKG-01", "details": "ISO 14644 cleanroom"},
            ]
        },
        "WO-84922": {
            "material_spec": "AISI 304L Structural Stainless Steel Tubing",
            "cad_revision": "DWG-3031-C (Rev E.2)",
            "tolerance_class": "AWS D1.1 Structural (±0.25 mm)",
            "unit_price_usd": 165.00,
            "priority": "Critical Structural Tier 1",
            "fai_status": "AWS CWI Certified (#8942)",
            "qa_inspector": "D. Zhang (Certified Welding Inspector)",
            "routing_steps": [
                {"step": 10, "operation": "CNC Laser Tube Profiling & Chamfering", "status": "Completed", "station": "LSR-02", "details": "Bevel angle 37.5°"},
                {"step": 20, "operation": "Precision Jig & Fixture Hydraulic Clamp", "status": "Completed", "station": "WLD-303", "details": "Repeatability ±0.05mm"},
                {"step": 30, "operation": "Robotic GMAW Pulsed Arc Welding", "status": "In Progress", "station": "WLD-303", "details": "Shield gas Ar/CO2 82/18"},
                {"step": 40, "operation": "Phased Array Ultrasonic NDT Inspection", "status": "Queued", "station": "NDT-01", "details": "Full seam weld scan"},
                {"step": 50, "operation": "E-Coat Dip & Thermal Curing", "status": "Queued", "station": "COAT-01", "details": "25 micron corrosion coat"},
            ]
        }
    }

    order_key = found_wo.get("order_id", "WO-84920")
    spec = specs_catalog.get(order_key, {
        "material_spec": "Aerospace / Industrial High-Strength Alloy",
        "cad_revision": "DWG-STANDARD (Rev A.1)",
        "tolerance_class": "ISO 2768-m Standard Precision",
        "unit_price_usd": 120.00,
        "priority": "Standard Production",
        "fai_status": "Conforming Quality Standard",
        "qa_inspector": "J. Doe (Plant Metrology)",
        "routing_steps": [
            {"step": 10, "operation": "Material Preparation & Setup", "status": "Completed", "station": found_machine_id},
            {"step": 20, "operation": "Primary Machining & Cycle Hold", "status": "In Progress", "station": found_machine_id},
            {"step": 30, "operation": "Secondary Finishing & Deburr", "status": "Queued", "station": "CELL-B"},
            {"step": 40, "operation": "Final Metrology & Packaging", "status": "Queued", "station": "QA-CELL"},
        ]
    })

    unit_price = spec["unit_price_usd"]
    total_val = target * unit_price
    delivered_val = good * unit_price
    scrap_loss = scrap * unit_price * 0.45  # Material scrap cost fraction

    return {
        "order_id": order_key,
        "machine_id": found_machine_id,
        "machine_name": meta.get("name", "Machining Center"),
        "location": meta.get("location", "Bay 01"),
        "operator": meta.get("operator", "Shift Operator"),
        "part_number": found_wo.get("part_number", "PN-0000"),
        "part_name": found_wo.get("part_name", "Component"),
        "customer": found_wo.get("customer", "OEM Client"),
        "batch_target": target,
        "batch_completed": completed,
        "good_count": good,
        "scrap_count": scrap,
        "first_pass_yield_pct": yield_pct,
        "start_time": found_wo.get("start_time", "06:00 UTC"),
        "estimated_completion": found_wo.get("estimated_completion", "14:00 UTC"),
        "material_spec": spec["material_spec"],
        "cad_revision": spec["cad_revision"],
        "tolerance_class": spec["tolerance_class"],
        "unit_price_usd": unit_price,
        "total_order_value_usd": total_val,
        "current_value_delivered_usd": delivered_val,
        "scrap_cost_usd": scrap_loss,
        "priority": spec["priority"],
        "fai_status": spec["fai_status"],
        "qa_inspector": spec["qa_inspector"],
        "routing_steps": spec["routing_steps"],
    }


@app.post("/api/data-source/mode")
def set_data_source_mode(mode: str = Body(..., embed=True)):
    """
    Switches active ingestion source between: 'hybrid', 'live_plc', 'simulation', 'dataset_replay'.
    """
    global current_data_source_mode
    if mode not in ["hybrid", "live_plc", "simulation", "dataset_replay"]:
        raise HTTPException(status_code=400, detail="Invalid data source mode")
    current_data_source_mode = mode
    return {"status": "updated", "current_data_source_mode": current_data_source_mode}


@app.get("/api/data-source/sample-csv")
def get_sample_csv():
    """
    Returns sample real-world machining telemetry CSV dataset for inspection or testing.
    """
    if os.path.exists(SAMPLE_CSV_PATH):
        with open(SAMPLE_CSV_PATH, "r", encoding="utf-8") as f:
            return {"csv_data": f.read(), "filename": "real_machining_shift_sample.csv"}
    return {"csv_data": "", "error": "Sample file not found"}


@app.post("/api/telemetry/import-csv")
def import_csv_telemetry(csv_content: str = Body(..., embed=True)):
    """
    Imports real-world telemetry CSV log files from industrial machines/PLCs.
    Parses timestamps, asset IDs, output, cycle times, sensor signals, and alarms.
    """
    reader = csv.DictReader(io.StringIO(csv_content))
    imported_count = 0
    now_epoch = datetime.now(timezone.utc).timestamp()

    for row in reader:
        try:
            m_id = row["machine_id"].strip()
            status = row.get("status", "Running").strip()
            output_c = int(row.get("output_count", 0))
            target_o = int(row.get("target_output", 250))
            good_c = int(row.get("good_count", output_c))
            scrap_c = int(row.get("scrap_count", 0))
            cycle_t = float(row.get("cycle_time_sec", 12.0))
            ideal_t = float(row.get("ideal_cycle_time_sec", 12.0))
            uptime_s = float(row.get("uptime_sec", output_c * ideal_t))
            downtime_s = float(row.get("downtime_sec", 0.0))
            active_alm = row.get("active_alarm") or None
            alm_code = row.get("alarm_code") or None

            sensors = MachineSensors(
                temperature_c=float(row.get("temp_c", 52.0)),
                vibration_mm_s=float(row.get("vibration_rms", 1.5)),
                power_kw=float(row.get("power_kw", 22.0)),
                pressure_bar=float(row.get("pressure_bar", 6.2)) if row.get("pressure_bar") else 6.2,
            )

            meta = MACHINE_METADATA.get(m_id, {})
            payload = TelemetryPayload(
                timestamp=row.get("timestamp") or datetime.now(timezone.utc).isoformat(),
                machine_id=m_id,
                machine_name=row.get("machine_name") or meta.get("name", m_id),
                location=meta.get("location", "Bay 01"),
                operator=meta.get("operator", "Shift Operator"),
                status=status,
                output_count=output_c,
                target_output=target_o,
                good_count=good_c,
                scrap_count=scrap_c,
                cycle_time_sec=cycle_t,
                ideal_cycle_time_sec=ideal_t,
                uptime_seconds=uptime_s,
                downtime_seconds=downtime_s,
                active_alarm=active_alm,
                alarm_severity="Critical" if status == "Down" else ("Warning" if active_alm else "None"),
                alarm_code=alm_code,
                sensors=sensors,
            )

            latest_telemetry[m_id] = payload
            if m_id not in recent_cycle_history:
                recent_cycle_history[m_id] = deque(maxlen=25)
            if cycle_t > 0:
                recent_cycle_history[m_id].append(cycle_t)

            if active_alm and active_alm.strip():
                active_alarms_map[m_id] = AlarmEvent(
                    machine_id=m_id,
                    machine_name=payload.machine_name or m_id,
                    alarm=active_alm,
                    severity=payload.alarm_severity,
                    timestamp=payload.timestamp,
                    acknowledged=False,
                    duration_sec=30,
                    code=alm_code or "ALM-E204",
                    category="Mechanical",
                )
            else:
                active_alarms_map.pop(m_id, None)

            imported_count += 1
        except Exception as e:
            print(f"[WARN] CSV parse line error: {e}")

    return {
        "status": "success",
        "imported_rows": imported_count,
        "active_machines": list(latest_telemetry.keys()),
    }


@app.post("/api/telemetry", status_code=201)
def ingest_telemetry(payload: TelemetryPayload):
    machine_id = payload.machine_id
    now_epoch = datetime.now(timezone.utc).timestamp()
    latest_telemetry[machine_id] = payload

    if machine_id not in recent_cycle_history:
        recent_cycle_history[machine_id] = deque(maxlen=25)
    if payload.cycle_time_sec > 0:
        recent_cycle_history[machine_id].append(payload.cycle_time_sec)

    meta = MACHINE_METADATA.get(machine_id, {})
    mach_name = payload.machine_name or meta.get("name", machine_id)

    if payload.active_alarm and payload.active_alarm.strip() and not alarm_ack_state.get(machine_id, False):
        if machine_id not in alarm_start_times:
            alarm_start_times[machine_id] = now_epoch
            alarm_ack_state[machine_id] = False

        duration = int(now_epoch - alarm_start_times[machine_id])
        severity = payload.alarm_severity or ("Critical" if payload.status == "Down" else "Warning")
        code = payload.alarm_code or ("ALM-E204" if severity == "Critical" else "ALM-W102")
        cat = "Electrical" if "Heater" in payload.active_alarm or "Trip" in payload.active_alarm else ("Safety" if "Curtain" in payload.active_alarm else "Mechanical")

        active_alarms_map[machine_id] = AlarmEvent(
            machine_id=machine_id,
            machine_name=mach_name,
            alarm=payload.active_alarm,
            severity=severity,
            timestamp=payload.timestamp,
            acknowledged=False,
            duration_sec=duration,
            code=code,
            category=cat,
        )
    else:
        active_alarms_map.pop(machine_id, None)
        alarm_start_times.pop(machine_id, None)
        # If payload itself has no active alarm, reset ack state
        if not payload.active_alarm or not payload.active_alarm.strip():
            alarm_ack_state.pop(machine_id, None)

    firebase_store.add_document(
        "telemetry",
        {
            "site_id": meta.get("site_id"),
            "machine_id": machine_id,
            "timestamp": payload.timestamp,
            "status": payload.status,
            "output_count": payload.output_count,
            "good_count": payload.good_count,
            "scrap_count": payload.scrap_count,
            "cycle_time_sec": payload.cycle_time_sec,
            "temperature_c": payload.temperature_c,
            "vibration_mm_s": payload.vibration_mm_s,
            "power_kw": payload.power_kw,
            "active_alarm": payload.active_alarm,
        },
    )

    return {"status": "ingested", "machine_id": machine_id, "timestamp": payload.timestamp}


class DashboardResponseModel(BaseModel):
    site_id: Optional[str] = None
    site_name: Optional[str] = None
    summary: DashboardSummary
    machines: List[MachineDashboardState]
    active_alarms: List[AlarmEvent]
    connectors: Optional[List[IndustrialConnector]] = None


@app.get("/api/dashboard", response_model=DashboardResponseModel)
def get_dashboard(site_id: Optional[str] = Query(default=None), company_domain: Optional[str] = Query(default=None)):
    # Safely handle non-string or Query default arguments when called programmatically
    if not isinstance(site_id, str):
        site_id = None
    if not isinstance(company_domain, str):
        company_domain = None

    if company_domain:
        comp_domain = company_domain.strip().lower()
        comp_sites = get_sites_for_company(comp_domain)
        comp_ids = [s.id for s in comp_sites]
        if not site_id or site_id not in comp_ids:
            site_id = comp_sites[0].id if comp_sites else "synapsys-mfg-prod-us"
    elif not site_id:
        site_id = list(production_sites.keys())[0] if production_sites else "synapsys-mfg-prod-us"
    elif site_id not in production_sites:
        clean_name = site_id.replace("synapsys-mfg-", "").replace("site-", "").replace("-", " ").strip().title()
        production_sites[site_id] = ProductionSite(
            id=site_id,
            name=f"{clean_name} Facility",
            region="edge-node",
            location=f"{clean_name} Manufacturing Plant",
            facility_type="Advanced Modular Production",
            active_lines=6,
            target_capacity=3000,
            nominal_oee=85.5,
            status="active",
        )

    current_site_info = production_sites.get(site_id)
    site_name = current_site_info.name if current_site_info else site_id

    # Filter machines strictly belonging to this specific production facility
    machine_ids = [m_id for m_id, meta in MACHINE_METADATA.items() if meta.get("site_id") == site_id]

    # Auto-seed if newly registered site has no machines yet
    if not machine_ids:
        machine_ids = seed_machines_for_site(site_id, site_name, current_site_info.facility_type if current_site_info else "")
    now_iso = datetime.now(timezone.utc).isoformat()
    now_epoch = datetime.now(timezone.utc).timestamp()

    machines_dashboard_list: List[MachineDashboardState] = []
    total_output = 0
    total_target = 0
    total_good = 0
    total_scrap = 0
    running_count = 0
    idle_count = 0
    down_count = 0
    total_downtime_sec = 0.0

    accumulated_oee = 0.0
    accumulated_a = 0.0
    accumulated_p = 0.0
    accumulated_q = 0.0
    accumulated_speed = 0.0
    accumulated_power_kw = 0.0

    for m_id in machine_ids:
        meta = MACHINE_METADATA.get(m_id, {})
        payload = latest_telemetry.get(m_id)

        if not payload:
            payload = TelemetryPayload(
                timestamp=now_iso,
                machine_id=m_id,
                machine_name=meta.get("name", m_id),
                location=meta.get("location", "Bay 01"),
                operator=meta.get("operator", "Shift Operator"),
                status="Running",
                output_count=82,
                target_output=meta.get("default_target", 250),
                good_count=81,
                scrap_count=1,
                cycle_time_sec=meta.get("ideal_cycle", 12.0),
                ideal_cycle_time_sec=meta.get("ideal_cycle", 12.0),
                uptime_seconds=984.0,
                downtime_seconds=38.0,
                active_alarm=None,
                alarm_severity="None",
                sensors=MachineSensors(
                    temperature_c=52.4,
                    vibration_mm_s=1.45,
                    power_kw=21.6,
                    pressure_bar=6.2,
                ),
            )

        oee_result = calculate_oee(payload)
        losses = compute_six_big_losses(payload)

        good_c = payload.good_count if payload.good_count is not None else max(0, payload.output_count - (payload.scrap_count or 0))
        scrap_c = payload.scrap_count if payload.scrap_count is not None else 0

        total_output += payload.output_count
        total_target += payload.target_output
        total_good += good_c
        total_scrap += scrap_c
        total_downtime_sec += payload.downtime_seconds
        accumulated_speed += (payload.cycle_time_sec or payload.ideal_cycle_time_sec)

        if payload.status == "Running":
            running_count += 1
        elif payload.status == "Down":
            down_count += 1
        else:
            idle_count += 1

        accumulated_oee += oee_result.oee
        accumulated_a += oee_result.availability
        accumulated_p += oee_result.performance
        accumulated_q += oee_result.quality

        cycle_history = list(recent_cycle_history.get(m_id, deque([payload.cycle_time_sec or payload.ideal_cycle_time_sec])))
        if len(cycle_history) < 6:
            seed = payload.ideal_cycle_time_sec
            cycle_history = [seed * random.uniform(0.97, 1.03) for _ in range(8)]

        if payload.sensors:
            sensors = payload.sensors
        else:
            base_temp = 54.0 if payload.status == "Running" else (81.0 if payload.status == "Down" else 35.0)
            base_vib = 1.6 if payload.status == "Running" else (4.8 if payload.status == "Down" else 0.4)
            base_power = 24.0 if payload.status == "Running" else (1.8 if payload.status == "Down" else 4.2)
            sensors = MachineSensors(
                temperature_c=round(base_temp + random.uniform(-1.0, 1.5), 1),
                vibration_mm_s=round(base_vib + random.uniform(-0.15, 0.2), 2),
                power_kw=round(base_power + random.uniform(-0.6, 0.8), 1),
                pressure_bar=round(6.2 + random.uniform(-0.1, 0.1), 1),
            )

        accumulated_power_kw += sensors.power_kw
        pdm = compute_predictive_diagnostics(payload, sensors)
        duration = int(now_epoch - alarm_start_times.get(m_id, now_epoch)) if m_id in alarm_start_times else 0
        is_ack = alarm_ack_state.get(m_id, False)

        wo_info = meta.get("work_order", {})
        work_order = WorkOrder(
            order_id=wo_info.get("order_id", "WO-84900"),
            part_number=wo_info.get("part_number", "PN-0000"),
            part_name=wo_info.get("part_name", "Component Batch"),
            customer=wo_info.get("customer", "OEM Client"),
            batch_target=payload.target_output,
            batch_completed=payload.output_count,
            start_time=wo_info.get("start_time", "06:00 UTC"),
            estimated_completion=wo_info.get("estimated_completion", "14:00 UTC"),
        )

        machines_dashboard_list.append(
            MachineDashboardState(
                machine_id=m_id,
                machine_name=payload.machine_name or meta.get("name", m_id),
                status="Running" if (is_ack and payload.status == "Down") else payload.status,
                timestamp=payload.timestamp,
                location=payload.location or meta.get("location", "Bay 01"),
                operator=payload.operator or meta.get("operator", "Shift Operator"),
                output_count=payload.output_count,
                target_output=payload.target_output,
                good_count=good_c,
                scrap_count=scrap_c,
                cycle_time_sec=payload.cycle_time_sec,
                ideal_cycle_time_sec=payload.ideal_cycle_time_sec,
                uptime_seconds=payload.uptime_seconds,
                downtime_seconds=payload.downtime_seconds,
                oee_metrics=oee_result,
                active_alarm=None if is_ack else payload.active_alarm,
                alarm_severity="None" if is_ack else (payload.alarm_severity or ("Critical" if payload.status == "Down" else "Warning")),
                alarm_acknowledged=is_ack,
                alarm_duration_sec=duration,
                recent_cycle_times=cycle_history,
                sensors=sensors,
                predictive=pdm,
                work_order=work_order,
                losses=losses,
                plc_controller=meta.get("plc_controller", "Standard Industrial PLC"),
                ip_address=meta.get("ip_address", "192.168.1.100"),
                opc_node_id=meta.get("opc_node_id", f"ns=2;s={m_id}"),
            )
        )

    num_machines = len(machine_ids)
    divisor = max(1, num_machines)
    overall_oee_pct = round((accumulated_oee / divisor) * 100, 2)

    curr_data = get_currency_for_site(current_site_info)
    curr_sym = curr_data["symbol"]
    curr_code = curr_data["code"]
    unit_base = curr_data["unit_base"]
    dt_rate = curr_data["dt_rate"]
    scrap_rate = curr_data["scrap_rate"]
    power_rate = curr_data["power_rate"]

    rev_gen = round(total_good * unit_base, 2)
    dt_cost = round((total_downtime_sec / 3600.0) * dt_rate, 2)
    scrap_cost = round(total_scrap * scrap_rate, 2)
    net_val = round(rev_gen - dt_cost - scrap_cost, 2)
    pot_savings = round(dt_cost * 0.65 + scrap_cost * 0.8, 2)

    financial_roi = FinancialROI(
        revenue_generated_usd=rev_gen,
        downtime_cost_usd=dt_cost,
        scrap_waste_cost_usd=scrap_cost,
        net_shift_value_usd=net_val,
        potential_savings_usd=pot_savings,
        currency_symbol=curr_sym,
        currency_code=curr_code,
        unit_baseline=unit_base,
        downtime_hourly_rate=dt_rate,
        scrap_unit_cost=scrap_rate,
    )

    total_kw = round(accumulated_power_kw + 14.5, 1)
    kwh_per_unit = round(total_kw / max(1, (total_output * 0.5)), 2)
    carbon_g = round(kwh_per_unit * 385.0, 1)

    energy_metrics = PlantEnergyMetrics(
        total_power_kw=total_kw,
        specific_energy_kwh_per_unit=kwh_per_unit,
        carbon_intensity_gco2_per_unit=carbon_g,
        energy_cost_usd=round(total_kw * 8.0 * 0.11, 2),
        green_energy_pct=44.5,
    )

    active_conn_count = sum(1 for c in industrial_connectors.values() if c.status == "Connected")

    # Ensure any active unacknowledged alarm on machine telemetry is in active_alarms_map
    for m in machines_dashboard_list:
        if m.active_alarm and not m.alarm_acknowledged and m.machine_id not in active_alarms_map:
            active_alarms_map[m.machine_id] = AlarmEvent(
                machine_id=m.machine_id,
                machine_name=m.machine_name,
                alarm=m.active_alarm,
                severity=m.alarm_severity or ("Critical" if m.status == "Down" else "Warning"),
                timestamp=m.timestamp,
                code=m.active_alarm.split("(")[-1].replace(")", "") if "(" in m.active_alarm else "ALM-E204",
                category="Mechanical",
                duration_sec=m.alarm_duration_sec or 30.0,
                acknowledged=False,
            )

    site_alarms = [a for a in active_alarms_map.values() if a.machine_id in machine_ids and not a.acknowledged]

    summary = DashboardSummary(
        overall_plant_oee=overall_oee_pct,
        overall_availability=round((accumulated_a / divisor) * 100, 2),
        overall_performance=round((accumulated_p / divisor) * 100, 2),
        overall_quality=round((accumulated_q / divisor) * 100, 2),
        total_output=total_output,
        total_target=total_target,
        total_good=total_good,
        total_scrap=total_scrap,
        total_machines=num_machines,
        running_machines=running_count,
        idle_machines=idle_count,
        down_machines=down_count,
        active_alarms_count=len(site_alarms),
        last_updated=now_iso,
        financial_roi=financial_roi,
        takt_time_sec=12.0,
        mean_line_speed_sec=round(accumulated_speed / divisor, 2),
        shift_name="Shift 1 (Day)",
        shift_elapsed_pct=68.0,
        energy=energy_metrics,
        data_source_mode=current_data_source_mode,
        active_connectors_count=active_conn_count,
    )

    return DashboardResponseModel(
        site_id=site_id,
        site_name=site_name,
        summary=summary,
        machines=machines_dashboard_list,
        active_alarms=site_alarms,
        connectors=list(industrial_connectors.values()),
    )


@app.get("/api/alarms")
def get_alarms():
    return list(active_alarms_map.values())


@app.post("/api/copilot/query", response_model=CopilotResponse)
def copilot_query(query: CopilotQuery):
    prompt = query.prompt.lower().strip()
    dash = get_dashboard(site_id=query.site_id, company_domain=query.company_domain)
    summary = dash.summary
    site_name = dash.site_name or (query.site_id or "Active Production Facility")
    machines = dash.machines or []

    if "asset" in prompt or "machine" in prompt or "line" in prompt or "equipment" in prompt:
        m_lines = []
        for m in machines[:5]:
            m_lines.append(
                f"{m.machine_name} ({m.machine_id}): Status {m.status}, OEE {m.oee_metrics.oee_percentage}%, "
                f"Temp {m.sensors.temperature_c}°C, Vibration {m.sensors.vibration_mm_s} mm/s"
            )
        asset_summary = "; ".join(m_lines) if m_lines else "No equipment currently registered."
        ans = (
            f"{site_name} floor monitoring: {len(machines)} production assets detected. "
            f"Asset breakdown: {asset_summary}. "
            f"Overall facility cadence is {summary.mean_line_speed_sec}s cycle time across {summary.running_machines} active units."
        )
        citations = [
            f"Total Monitored Assets: {len(machines)}",
            f"Running: {summary.running_machines} | Idle: {summary.idle_machines} | Down: {summary.down_machines}",
            f"Active Site: {site_name}",
        ]
        actions = [
            "Review real-time digital twin layout on Floor Twin view",
            "Check component lubrication for machines operating > 55°C",
            "Monitor live cycle delta on active work orders",
        ]

    elif "inventory" in prompt or "stock" in prompt or "spare" in prompt or "part" in prompt or "supplier" in prompt:
        low_items = [it for it in DEFAULT_INVENTORY if it["quantity"] <= it["min_safety_stock"]]
        total_val = sum(it["quantity"] * it["unit_cost_usd"] for it in DEFAULT_INVENTORY)
        if "supplier" in prompt or "vendor" in prompt or "seller" in prompt:
            sup_list = ", ".join([f"{s['name']} (Lead time: {s['lead_time_days']}d, {s['email']})" for s in DEFAULT_SUPPLIERS])
            ans = f"There are {len(DEFAULT_SUPPLIERS)} verified industrial vendors in your procurement network: {sup_list}. You can dispatch automated RFQ emails and POs directly from the Inventory tab."
            citations = [f"Registered Suppliers: {len(DEFAULT_SUPPLIERS)}", "Delivery Terms: Net 15-45 Days"]
            actions = ["Open Inventory -> Suppliers to draft a purchase order", "Verify supplier lead time SLAs"]
        elif low_items:
            low_str = "; ".join([f"{it['sku']} - {it['name']}: {it['quantity']}/{it['min_safety_stock']} {it['unit']} ({it['bin_location']})" for it in low_items[:3]])
            ans = f"Warning: {len(low_items)} inventory items have fallen below minimum safety stock buffers: {low_str}. Automated reorder requisitions can be emailed to suppliers."
            citations = [
                f"Low Stock Alerts: {len(low_items)} items",
                f"Warehouse Valuation: ${total_val:,.2f}",
                f"Tooling Cribs: Crib A, Crib B, Raw Yard",
            ]
            actions = [
                "Navigate to Inventory tab and click 'Dispatch Reorder'",
                "Email Coimbatore Precision Tooling for carbide endmills",
                "Review MRO replacement schedule for CNC-101 bearing kit",
            ]
        else:
            ans = f"Warehouse stock is fully balanced. All {len(DEFAULT_INVENTORY)} catalog items are above safety buffers with total crib valuation of ${total_val:,.2f}."
            citations = [
                f"Total SKUs: {len(DEFAULT_INVENTORY)}",
                f"Valuation: ${total_val:,.2f}",
                "Safety Buffer: 100% compliant",
            ]
            actions = ["Audit high-turnover tooling wear on CNC machines"]

    elif "alarm" in prompt or "incident" in prompt or "alert" in prompt:
        active_a = dash.active_alarms or []
        if active_a:
            alarm_details = ", ".join([f"{a.machine_id}: {a.message} ({a.severity})" for a in active_a[:3]])
            ans = f"There are {len(active_a)} active ISA-18.2 alarms logged for {site_name}: {alarm_details}. Operator acknowledgment and root cause diagnosis are recommended."
        else:
            ans = f"No critical alarms currently flagged for {site_name}. All equipment is running within nominal safety and vibration thresholds."
        citations = [
            f"Active Alarms: {len(active_a)}",
            f"Safety Status: {'Nominal' if not active_a else 'Incident Active'}",
            f"Facility: {site_name}",
        ]
        actions = [
            "Inspect Alarms view to acknowledge active incidents",
            "Run Fault Simulator to test operator drill preparedness",
        ]

    elif "bottleneck" in prompt or "loss" in prompt or "oee" in prompt:
        if machines:
            lowest_m = min(machines, key=lambda m: m.oee_metrics.oee)
            ans = (
                f"{site_name} OEE is currently operating at {summary.overall_plant_oee}%. "
                f"The primary line bottleneck is asset {lowest_m.machine_id} ({lowest_m.machine_name}) at {lowest_m.oee_metrics.oee_percentage}% OEE. "
                f"Analysis of Nakajima Six Losses identifies {format_time_sec(lowest_m.losses.setup_adjustment_sec + lowest_m.losses.idling_minor_stops_sec)} "
                f"lost to setup/idling and {lowest_m.losses.process_defects_units} scrap units on Work Order {lowest_m.work_order.order_id}."
            )
            citations = [
                f"{lowest_m.machine_id} OEE: {lowest_m.oee_metrics.oee_percentage}%",
                f"Target Takt: {summary.takt_time_sec}s vs Mean: {summary.mean_line_speed_sec}s",
                f"Active Work Order: {lowest_m.work_order.order_id}",
            ]
            actions = [
                f"Deploy tooling technician to {lowest_m.location} for die alignment",
                "Adjust feed rate override to align with customer Takt 12.0s",
                "Review optical calibration to reduce scrap count",
            ]
        else:
            ans = f"Plant OEE is operating at {summary.overall_plant_oee}%. Telemetry streaming normally."
            citations = [f"Plant OEE: {summary.overall_plant_oee}%"]
            actions = ["Calibrate machine telemetry baseline"]

    elif "predictive" in prompt or "failure" in prompt or "bearing" in prompt or "rul" in prompt:
        if machines:
            critical_m = max(machines, key=lambda m: m.predictive.anomaly_score)
            ans = (
                f"Predictive anomaly scan evaluated {len(machines)} assets at {site_name}. "
                f"Asset {critical_m.machine_id} presents the highest mechanical risk with an Anomaly Score of {critical_m.predictive.anomaly_score}% "
                f"({critical_m.predictive.health_status}). "
                f"Remaining Useful Life (RUL) for {critical_m.predictive.component_at_risk} is estimated at {critical_m.predictive.remaining_useful_life_hrs} operating hours. "
                f"Diagnostic finding: {critical_m.predictive.root_cause_analysis}"
            )
            citations = [
                f"Sensor Vibration: {critical_m.sensors.vibration_mm_s} mm/s RMS",
                f"Core Temp: {critical_m.sensors.temperature_c}°C",
                f"RUL Horizon: {critical_m.predictive.remaining_useful_life_hrs}h",
            ]
            actions = [
                f"Schedule bearing lube service for {critical_m.machine_id} during shift handover",
                "Engage acoustic vibration secondary probe to verify race wear",
                "Check spare parts inventory in Central Tooling Crib",
            ]
        else:
            ans = "Predictive anomaly scan evaluated all assets as nominal."
            citations = ["RUL: Nominal"]
            actions = ["Maintain standard PM inspection schedule"]

    elif "financial" in prompt or "cost" in prompt or "roi" in prompt or "revenue" in prompt:
        roi = summary.financial_roi
        sym = roi.currency_symbol or "$"
        ans = (
            f"Current shift at {site_name} has generated {sym}{roi.revenue_generated_usd:,.2f} in gross production value "
            f"across {summary.total_good} conforming parts. "
            f"Unplanned downtime losses total -{sym}{roi.downtime_cost_usd:,.2f} (rate: {sym}{roi.downtime_hourly_rate:,.0f}/hr) "
            f"and scrap defect waste is -{sym}{roi.scrap_waste_cost_usd:,.2f}. "
            f"Net shift economic yield stands at {sym}{roi.net_shift_value_usd:,.2f}. "
            f"Recoverable opportunity through process tuning is estimated at +{sym}{roi.potential_savings_usd:,.2f}."
        )
        citations = [
            f"Gross Value: {sym}{roi.revenue_generated_usd:,.2f}",
            f"Downtime Hours Cost: -{sym}{roi.downtime_cost_usd:,.2f}",
            f"Conforming Parts: {summary.total_good} / {summary.total_target}",
        ]
        actions = [
            "Execute What-If cycle delta simulation in financial drawer",
            "Prioritize bottleneck machine recovery to reclaim lost margin",
        ]

    else:
        ans = (
            f"{site_name} operating at {summary.overall_plant_oee}% OEE with {summary.running_machines} assets online. "
            f"Current production output is {summary.total_output} of {summary.total_target} scheduled units. "
            f"Total facility electrical demand is {summary.energy.total_power_kw} kW with specific intensity of {summary.energy.specific_energy_kwh_per_unit} kWh/part. "
            f"There are currently {summary.active_alarms_count} unresolved ISA-18.2 alarms requiring operator review."
        )
        citations = [
            f"Plant OEE: {summary.overall_plant_oee}%",
            f"Power Draw: {summary.energy.total_power_kw} kW",
            f"Active Alarms: {summary.active_alarms_count}",
        ]
        actions = [
            "Review ISA-18.2 alarm dispatch table for unacknowledged incidents",
            "Inspect live work orders for upcoming delivery milestones",
        ]

    return CopilotResponse(answer=ans, citations=citations, suggested_actions=actions)


class CreatePORequest(BaseModel):
    supplier_id: str
    items: List[Dict[str, Any]]
    notes: Optional[str] = None
    company_name: Optional[str] = "SynapSYS Industrial Operations"
    facility: Optional[str] = "Detroit Plant C4 / Coimbatore Tooling Unit"
    priority: Optional[str] = "Standard"
    operator_name: Optional[str] = "Plant Supervisor"


class InitiatePO2FARequest(BaseModel):
    supplier_id: str
    items: List[Dict[str, Any]]
    notes: Optional[str] = None
    company_name: Optional[str] = "SynapSYS Industrial Operations"
    facility: Optional[str] = "Detroit Plant C4 / Coimbatore Tooling Unit"
    priority: Optional[str] = "Standard"
    operator_name: Optional[str] = "Plant Supervisor"


class VerifyPO2FARequest(BaseModel):
    auth_token: str
    otp: str
    operator_name: Optional[str] = "Plant Supervisor"


class AdjustStockRequest(BaseModel):
    item_id: str
    delta: int
    reason: Optional[str] = "Floor maintenance checkout"


@app.get("/api/inventory")
def get_inventory():
    total_val_inr = sum(
        it["quantity"] * float(it.get("unit_cost_inr") or (it.get("unit_cost_usd", 0) * 86.0))
        for it in DEFAULT_INVENTORY
    )
    total_val_usd = sum(it["quantity"] * float(it.get("unit_cost_usd", 0)) for it in DEFAULT_INVENTORY)
    low_stock = [it for it in DEFAULT_INVENTORY if it["quantity"] <= it["min_safety_stock"]]
    return {
        "items": DEFAULT_INVENTORY,
        "total_items": len(DEFAULT_INVENTORY),
        "total_valuation_inr": round(total_val_inr, 2),
        "total_valuation_usd": round(total_val_usd, 2),
        "low_stock_count": len(low_stock),
        "low_stock_items": low_stock,
        "currency": "INR",
        "currency_symbol": "₹",
    }


@app.get("/api/inventory/suppliers")
def get_suppliers():
    return DEFAULT_SUPPLIERS


@app.get("/api/inventory/orders")
def get_purchase_orders():
    return _PURCHASE_ORDERS


@app.post("/api/inventory/orders/initiate-2fa")
def initiate_po_order_2fa(req: InitiatePO2FARequest):
    """
    Guards procurement by issuing an instant 6-digit 2FA challenge code
    dispatched to the supervisor email (sarveshwaran.k2008@gmail.com).
    """
    sup = next((s for s in DEFAULT_SUPPLIERS if s["id"] == req.supplier_id), None)
    if not sup:
        raise HTTPException(status_code=404, detail="Supplier not found")
    if not req.items:
        raise HTTPException(status_code=400, detail="Cannot create PO with empty line items")

    po_num = f"PO-2026-{1000 + len(_PURCHASE_ORDERS) + 1}"
    subtotal_inr = sum(
        it.get("quantity", 1) * float(it.get("unit_price_inr") or it.get("unit_price_usd") or it.get("unit_price") or 0.0)
        for it in req.items
    )
    # Standard Indian GST for industrial machine components & tooling is 18% (CGST 9% + SGST 9%)
    cgst_inr = round(subtotal_inr * 0.09, 2)
    sgst_inr = round(subtotal_inr * 0.09, 2)
    tax_inr = round(cgst_inr + sgst_inr, 2)
    total_inr = round(subtotal_inr + tax_inr, 2)
    now_iso = datetime.now(timezone.utc).isoformat()

    po_draft = {
        "po_id": po_num,
        "created_at": now_iso,
        "supplier_id": sup["id"],
        "supplier_name": sup["name"],
        "supplier_email": sup["email"],
        "status": "Pending 2FA",
        "items": req.items,
        "subtotal_inr": round(subtotal_inr, 2),
        "tax_inr": tax_inr,
        "cgst_inr": cgst_inr,
        "sgst_inr": sgst_inr,
        "total_inr": total_inr,
        "subtotal_usd": round(subtotal_inr / 86.0, 2),
        "total_usd": round(total_inr / 86.0, 2),
        "estimated_delivery": datetime.now(timezone.utc).date().isoformat(),
        "notes": req.notes or "Automated requisition dispatch",
        "priority": req.priority or "Standard",
        "facility": req.facility or "Detroit Plant C4 / Coimbatore Tooling Unit",
        "created_by": req.operator_name or "Plant Supervisor",
    }

    auth_token, otp, delivery_info = initiate_po_authorization_2fa(po_draft)
    return {
        "success": True,
        "auth_token": auth_token,
        "po_id": po_num,
        "total_inr": total_inr,
        "supervisor_email": DESIGNATED_SECURITY_EMAIL,
        "delivered": delivery_info.get("delivered", False),
        "delivery_status": "SMTP_DELIVERED" if delivery_info.get("delivered") else "SMTP_UNCONFIGURED",
        "delivery_message": delivery_info.get("status_message") or f"2FA code generated for supervisor {DESIGNATED_SECURITY_EMAIL}",
        "expires_in_sec": 600,
        "debug_otp_hint": None if delivery_info.get("delivered") else otp,
        "message": delivery_info.get("status_message") or f"2FA code dispatched to supervisor {DESIGNATED_SECURITY_EMAIL}",
    }


@app.post("/api/inventory/orders/verify-2fa")
def verify_po_order_2fa(req: VerifyPO2FARequest):
    """
    Validates the 6-digit OTP code against the pending procurement session.
    Upon verification, commits the PO, emails the vendor, and updates inventory records.
    """
    po_draft = verify_po_authorization_2fa(req.auth_token, req.otp)
    if not po_draft:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired 2FA authorization code. Re-check the code or request a new OTP."
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    po_draft["status"] = "Emailed"
    po_draft["authorized_at"] = now_iso
    po_draft["authorized_by"] = req.operator_name or po_draft.get("created_by") or "Authorized Supervisor"
    po_draft["security_2fa_verified"] = True
    po_draft["email_dispatched_at"] = now_iso
    po_draft["email_subject"] = f"Purchase Order {po_draft['po_id']} - {po_draft.get('supplier_name')}"

    # Generate authorization cryptographic signature
    sig_payload = f"{po_draft['po_id']}|{po_draft['total_inr']}|{now_iso}|{DESIGNATED_SECURITY_EMAIL}"
    po_draft["authorization_hash"] = hashlib.sha256(sig_payload.encode()).hexdigest()[:16].upper()

    _PURCHASE_ORDERS.insert(0, po_draft)
    dispatch_supplier_po_email(po_draft, company_name="SynapSYS Industrial Operations")
    return {
        "success": True,
        "po": po_draft,
        "message": f"Purchase order {po_draft['po_id']} authorized via 2FA and emailed to {po_draft['supplier_email']}"
    }


@app.post("/api/inventory/orders/create")
def create_purchase_order(req: CreatePORequest):
    sup = next((s for s in DEFAULT_SUPPLIERS if s["id"] == req.supplier_id), None)
    if not sup:
        raise HTTPException(status_code=404, detail="Supplier not found")

    po_num = f"PO-2026-{1000 + len(_PURCHASE_ORDERS) + 1}"
    subtotal_inr = sum(
        it.get("quantity", 1) * float(it.get("unit_price_inr") or it.get("unit_price_usd") or it.get("unit_price") or 0.0)
        for it in req.items
    )
    cgst_inr = round(subtotal_inr * 0.09, 2)
    sgst_inr = round(subtotal_inr * 0.09, 2)
    tax_inr = round(cgst_inr + sgst_inr, 2)
    total_inr = round(subtotal_inr + tax_inr, 2)
    now_iso = datetime.now(timezone.utc).isoformat()

    po_data = {
        "po_id": po_num,
        "created_at": now_iso,
        "supplier_id": sup["id"],
        "supplier_name": sup["name"],
        "supplier_email": sup["email"],
        "status": "Emailed",
        "items": req.items,
        "subtotal_inr": round(subtotal_inr, 2),
        "tax_inr": tax_inr,
        "cgst_inr": cgst_inr,
        "sgst_inr": sgst_inr,
        "total_inr": total_inr,
        "subtotal_usd": round(subtotal_inr / 86.0, 2),
        "total_usd": round(total_inr / 86.0, 2),
        "estimated_delivery": datetime.now(timezone.utc).date().isoformat(),
        "email_subject": f"Purchase Order {po_num} - {req.company_name}",
        "email_dispatched_at": now_iso,
        "notes": req.notes or "Automated requisition dispatch",
        "priority": req.priority or "Standard",
        "facility": req.facility or "Detroit Plant C4 / Coimbatore Tooling Unit",
        "security_2fa_verified": False,
        "created_by": req.operator_name or "Supervisor",
    }

    _PURCHASE_ORDERS.insert(0, po_data)
    dispatch_supplier_po_email(po_data, company_name=req.company_name or "SynapSYS Operations")
    return {"success": True, "po": po_data, "message": f"Purchase order {po_num} dispatched to {sup['email']}"}


@app.post("/api/inventory/orders/{po_id}/receive")
def receive_purchase_order(po_id: str):
    po = next((p for p in _PURCHASE_ORDERS if p["po_id"] == po_id), None)
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    if po["status"] == "Received":
        return {"success": True, "po": po, "message": "Order already received"}

    po["status"] = "Received"
    for it in po.get("items", []):
        match_item = next(
            (inv for inv in DEFAULT_INVENTORY if inv["id"] == it.get("item_id") or inv["sku"] == it.get("sku")),
            None,
        )
        if match_item:
            match_item["quantity"] += int(it.get("quantity", 0))
            match_item["last_restocked_at"] = datetime.now(timezone.utc).isoformat()
    return {"success": True, "po": po, "message": f"Received {po_id} and updated warehouse inventory"}


@app.post("/api/inventory/adjust")
def adjust_inventory_stock(req: AdjustStockRequest):
    item = next((it for it in DEFAULT_INVENTORY if it["id"] == req.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    new_qty = max(0, item["quantity"] + req.delta)
    item["quantity"] = new_qty
    if req.delta > 0:
        item["last_restocked_at"] = datetime.now(timezone.utc).isoformat()
    return {"success": True, "item": item, "message": f"Updated stock for {item['sku']} to {new_qty} {item['unit']}"}


def format_time_sec(sec: float) -> str:
    m = int(sec // 60)
    s = int(sec % 60)
    return f"{m}m {s}s"


@app.post("/api/demo/inject-incident")
def inject_incident(fault_type: str):
    now_iso = datetime.now(timezone.utc).isoformat()
    now_epoch = datetime.now(timezone.utc).timestamp()

    if fault_type == "spindle_overheat":
        m_id = "CNC-101"
        latest_telemetry[m_id] = TelemetryPayload(
            timestamp=now_iso,
            machine_id=m_id,
            machine_name="5-Axis CNC Milling Center",
            location="Bay 02 - Machining Cell A",
            operator="K. Miller [Shift 1]",
            status="Down",
            output_count=latest_telemetry.get(m_id, TelemetryPayload(timestamp=now_iso, machine_id=m_id, status="Down", output_count=70, target_output=250, cycle_time_sec=0.0, ideal_cycle_time_sec=12.0, uptime_seconds=720.0, downtime_seconds=45.0)).output_count,
            target_output=250,
            good_count=68,
            scrap_count=2,
            cycle_time_sec=0.0,
            ideal_cycle_time_sec=12.0,
            uptime_seconds=720.0,
            downtime_seconds=85.0,
            active_alarm="Spindle Bearings Thermal Trip (>94°C)",
            alarm_severity="Critical",
            alarm_code="ALM-E204",
            sensors=MachineSensors(temperature_c=94.5, vibration_mm_s=5.2, power_kw=1.8, pressure_bar=6.1),
        )
        active_alarms_map[m_id] = AlarmEvent(
            machine_id=m_id,
            machine_name="5-Axis CNC Milling Center",
            alarm="Spindle Bearings Thermal Trip (>94°C)",
            severity="Critical",
            timestamp=now_iso,
            code="ALM-E204",
            category="Thermal/Mechanical",
            duration_sec=1.0,
            acknowledged=False
        )
        alarm_start_times[m_id] = now_epoch
        alarm_ack_state[m_id] = False
        return {"status": "injected", "fault": "spindle_overheat", "target": m_id}

    elif fault_type == "vibration_anomaly":
        m_id = "CNC-101"
        if m_id in latest_telemetry:
            latest_telemetry[m_id].active_alarm = "High Vibration Harmonic Drift on Axis Y (4.6 mm/s)"
            latest_telemetry[m_id].alarm_severity = "Warning"
            latest_telemetry[m_id].alarm_code = "ALM-W108"
            if latest_telemetry[m_id].sensors:
                latest_telemetry[m_id].sensors.vibration_mm_s = 4.62
        active_alarms_map[m_id] = AlarmEvent(
            machine_id=m_id,
            machine_name="5-Axis CNC Milling Center",
            alarm="High Vibration Harmonic Drift on Axis Y (4.6 mm/s)",
            severity="Warning",
            timestamp=datetime.now(timezone.utc).isoformat(),
            code="ALM-W108",
            category="Mechanical",
            duration_sec=12.0,
            acknowledged=False
        )
        alarm_start_times[m_id] = now_epoch
        alarm_ack_state[m_id] = False
        return {"status": "injected", "fault": "vibration_anomaly", "target": m_id}

    elif fault_type == "hydraulic_loss":
        m_id = "INJ-202"
        if m_id in latest_telemetry:
            latest_telemetry[m_id].status = "Down"
            latest_telemetry[m_id].active_alarm = "Hydraulic Manifold Pressure Drop (<85 bar)"
            latest_telemetry[m_id].alarm_severity = "Critical"
            latest_telemetry[m_id].alarm_code = "ALM-P301"
            if latest_telemetry[m_id].sensors:
                latest_telemetry[m_id].sensors.pressure_bar = 74.2
                latest_telemetry[m_id].sensors.temperature_c = 72.8
        active_alarms_map[m_id] = AlarmEvent(
            machine_id=m_id,
            machine_name="Hydraulic Injection Press",
            alarm="Hydraulic Manifold Pressure Drop (<85 bar)",
            severity="Critical",
            timestamp=datetime.now(timezone.utc).isoformat(),
            code="ALM-P301",
            category="Mechanical",
            duration_sec=6.0,
            acknowledged=False
        )
        alarm_start_times[m_id] = now_epoch
        alarm_ack_state[m_id] = False
        return {"status": "injected", "fault": "hydraulic_loss", "target": m_id}

    elif fault_type == "wire_feed_jam":
        m_id = "WLD-303"
        if m_id in latest_telemetry:
            latest_telemetry[m_id].status = "Down"
            latest_telemetry[m_id].active_alarm = "Robotic Arc Wire Feed Drive Motor Stall"
            latest_telemetry[m_id].alarm_severity = "Critical"
            latest_telemetry[m_id].alarm_code = "ALM-W402"
            if latest_telemetry[m_id].sensors:
                latest_telemetry[m_id].sensors.power_kw = 38.6
                latest_telemetry[m_id].sensors.vibration_mm_s = 3.9
        active_alarms_map[m_id] = AlarmEvent(
            machine_id=m_id,
            machine_name="Robotic Arc Welding Cell",
            alarm="Robotic Arc Wire Feed Drive Motor Stall",
            severity="Critical",
            timestamp=datetime.now(timezone.utc).isoformat(),
            code="ALM-W402",
            category="Electrical",
            duration_sec=9.0,
            acknowledged=False
        )
        alarm_start_times[m_id] = now_epoch
        alarm_ack_state[m_id] = False
        return {"status": "injected", "fault": "wire_feed_jam", "target": m_id}

    elif fault_type == "restore_all":
        for m_id, meta in MACHINE_METADATA.items():
            if m_id in latest_telemetry:
                latest_telemetry[m_id].status = "Running"
                latest_telemetry[m_id].active_alarm = None
                latest_telemetry[m_id].alarm_severity = "None"
                latest_telemetry[m_id].cycle_time_sec = meta["ideal_cycle"]
                if latest_telemetry[m_id].sensors:
                    latest_telemetry[m_id].sensors.temperature_c = 52.0
                    latest_telemetry[m_id].sensors.vibration_mm_s = 1.4
                    latest_telemetry[m_id].sensors.power_kw = 22.0
                    if m_id == "INJ-202":
                        latest_telemetry[m_id].sensors.pressure_bar = 160.0
        active_alarms_map.clear()
        alarm_start_times.clear()
        alarm_ack_state.clear()
        return {"status": "restored", "message": "All assets restored to nominal operating parameters"}

    raise HTTPException(status_code=400, detail="Unknown fault type")


@app.post("/api/alarms/{machine_id}/acknowledge")
def acknowledge_alarm(machine_id: str):
    alarm_ack_state[machine_id] = True
    active_alarms_map.pop(machine_id, None)
    alarm_start_times.pop(machine_id, None)
    if machine_id in latest_telemetry:
        latest_telemetry[machine_id].alarm_acknowledged = True
        latest_telemetry[machine_id].active_alarm = None
        latest_telemetry[machine_id].alarm_severity = "None"
        if latest_telemetry[machine_id].status == "Down":
            latest_telemetry[machine_id].status = "Running"
    return {"status": "acknowledged", "machine_id": machine_id}


@app.post("/api/alarms/acknowledge-all")
def acknowledge_all_alarms():
    for m_id in list(MACHINE_METADATA.keys()) + list(latest_telemetry.keys()):
        alarm_ack_state[m_id] = True
        if m_id in latest_telemetry:
            latest_telemetry[m_id].alarm_acknowledged = True
            latest_telemetry[m_id].active_alarm = None
            latest_telemetry[m_id].alarm_severity = "None"
            if latest_telemetry[m_id].status == "Down":
                latest_telemetry[m_id].status = "Running"
    active_alarms_map.clear()
    alarm_start_times.clear()
    return {"status": "all_acknowledged"}


@app.post("/api/machines/{machine_id}/command")
def machine_command(machine_id: str, action: str):
    if machine_id not in latest_telemetry:
        raise HTTPException(status_code=404, detail="Machine not registered")
    payload = latest_telemetry[machine_id]
    if action == "reset_fault":
        payload.active_alarm = None
        payload.status = "Running"
        active_alarms_map.pop(machine_id, None)
    elif action == "e_stop":
        payload.status = "Down"
        payload.active_alarm = "Operator Emergency Stop Commanded"
        payload.alarm_severity = "Critical"
    return {"status": "command_executed", "machine_id": machine_id, "action": action}


# ---------------------------------------------------------------------------
# Supabase Cloud Persistence & Sync Endpoints
# ---------------------------------------------------------------------------

class FirebaseConfigRequest(BaseModel):
    project_id: str
    api_key: Optional[str] = ""
    auth_token: Optional[str] = ""


@app.get("/api/cloud/firebase/status")
def get_firebase_status(refresh: bool = Query(False)):
    """Returns Firebase Cloud Firestore connection health, latency, and SQLite fallback mode."""
    if refresh:
        return firebase_store.ping()
    return firebase_store.get_status()


@app.post("/api/cloud/firebase/configure")
def configure_firebase_connection(req: FirebaseConfigRequest):
    """Validates and tests live connectivity to a user's Firebase project via Cloud Firestore REST API."""
    try:
        return firebase_store.configure(req.project_id, req.api_key or "", req.auth_token or "")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/api/cloud/firebase/sync-baseline")
def sync_baseline_to_firebase():
    """Synchronizes users, multi-tenant sites, and live machine telemetry snapshot to Cloud Firestore."""
    status = firebase_store.ping()
    if not status.get("connected"):
        raise HTTPException(
            status_code=400,
            detail=status.get("last_error") or "Firebase Firestore is not reachable",
        )

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT email, password_hash, full_name, company_name, company_domain, role, assigned_facility, created_at FROM users"
    )
    user_rows = [
        {
            "email": r[0],
            "password_hash": r[1],
            "full_name": r[2],
            "company_name": r[3],
            "company_domain": r[4],
            "role": r[5],
            "assigned_facility": r[6],
            "created_at": r[7],
        }
        for r in cursor.fetchall()
    ]
    cursor.execute(
        "SELECT id, company_domain, company_name, name, region, location, facility_type, active_lines, target_capacity, nominal_oee, status, latitude, longitude, created_at FROM production_sites"
    )
    site_rows = [
        {
            "id": r[0],
            "company_domain": r[1],
            "company_name": r[2],
            "name": r[3],
            "region": r[4],
            "location": r[5],
            "facility_type": r[6],
            "active_lines": r[7],
            "target_capacity": r[8],
            "nominal_oee": r[9],
            "status": r[10],
            "latitude": r[11],
            "longitude": r[12],
            "created_at": r[13],
        }
        for r in cursor.fetchall()
    ]
    conn.close()

    synced_users = 0
    for u in user_rows:
        if firebase_store.set_document("users", u["email"], u):
            synced_users += 1

    synced_sites = 0
    for s in site_rows:
        if firebase_store.set_document("production_sites", s["id"], s):
            synced_sites += 1

    synced_tel = 0
    for m_id, p in latest_telemetry.items():
        doc = {
            "site_id": (MACHINE_METADATA.get(m_id) or {}).get("site_id"),
            "machine_id": m_id,
            "timestamp": p.timestamp,
            "status": p.status,
            "output_count": p.output_count,
            "good_count": p.good_count,
            "scrap_count": p.scrap_count,
            "cycle_time_sec": p.cycle_time_sec,
            "temperature_c": p.temperature_c,
            "vibration_mm_s": p.vibration_mm_s,
            "power_kw": p.power_kw,
            "active_alarm": p.active_alarm,
        }
        if firebase_store.add_document("telemetry", doc):
            synced_tel += 1

    return {
        "success": True,
        "synced_sites": synced_sites,
        "synced_users": synced_users,
        "synced_telemetry": synced_tel,
        "status": firebase_store.get_status(),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)