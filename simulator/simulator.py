"""
SynapSYS Enterprise IIoT Platform - Synthetic Telemetry Generator
Generates realistic multi-machine operational telemetry and streams it to FastAPI.
"""

import sys
import time
import random
import os
import json
from datetime import datetime, timezone

# Zero-dependency HTTP transport: prefer requests if available, fallback to standard library urllib
try:
    import requests

    def post_telemetry(url: str, payload: dict, timeout: float = 2.5) -> int:
        res = requests.post(url, json=payload, timeout=timeout)
        return res.status_code

    NetworkError = requests.exceptions.RequestException
except ImportError:
    import urllib.request
    import urllib.error

    def post_telemetry(url: str, payload: dict, timeout: float = 2.5) -> int:
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return resp.status
        except urllib.error.HTTPError as err:
            return err.code

    NetworkError = (urllib.error.URLError, TimeoutError, OSError)

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000/api/telemetry")
TICK_INTERVAL_SEC = 2.0

COLOR_RESET = "\033[0m"
COLOR_GREEN = "\033[92m"
COLOR_YELLOW = "\033[93m"
COLOR_RED = "\033[91m"
COLOR_CYAN = "\033[96m"
COLOR_BOLD = "\033[1m"
COLOR_GRAY = "\033[90m"


class SimulatedMachine:
    def __init__(
        self,
        machine_id: str,
        machine_name: str,
        location: str,
        operator: str,
        ideal_cycle_time: float,
        target_output: int,
        nominal_cycle_variation: float = 0.8,
        base_temp: float = 48.0,
        base_power: float = 18.0,
    ):
        self.machine_id = machine_id
        self.machine_name = machine_name
        self.location = location
        self.operator = operator
        self.ideal_cycle_time = ideal_cycle_time
        self.target_output = target_output
        self.nominal_cycle_variation = nominal_cycle_variation
        self.base_temp = base_temp
        self.base_power = base_power

        # Internal operational states
        self.status = "Running"
        self.state_countdown = random.randint(12, 24)
        self.output_count = random.randint(30, 65)
        self.good_count = int(self.output_count * 0.985)
        self.scrap_count = self.output_count - self.good_count
        self.uptime_seconds = self.output_count * self.ideal_cycle_time
        self.downtime_seconds = random.uniform(15.0, 45.0)
        self.cycle_time_sec = self.ideal_cycle_time
        self.active_alarm = None
        self.alarm_severity = "None"
        self.alarm_code = None
        self.alarm_duration_sec = 0.0
        self.alarm_max_duration_sec = 12.0
        self.seconds_since_last_part = 0.0

    def step(self, delta_time: float):
        # Auto-resolve transient warnings and alarms after duration expires
        if self.active_alarm:
            self.alarm_duration_sec += delta_time
            if self.alarm_duration_sec >= self.alarm_max_duration_sec:
                self.active_alarm = None
                self.alarm_severity = "None"
                self.alarm_code = None
                self.alarm_duration_sec = 0.0

        self.state_countdown -= 1

        if self.state_countdown <= 0:
            roll = random.random()
            if self.status == "Running":
                if roll < 0.04:
                    self.status = "Down"
                    self.state_countdown = random.randint(5, 9)
                    self._generate_fault()
                elif roll < 0.09:
                    self.status = "Idle"
                    self.state_countdown = random.randint(4, 7)
                    self._generate_idle_state()
                else:
                    self.state_countdown = random.randint(30, 60)
            elif self.status == "Down":
                self.status = "Running"
                self.active_alarm = None
                self.alarm_severity = "None"
                self.alarm_code = None
                self.alarm_duration_sec = 0.0
                self.state_countdown = random.randint(40, 70)
            elif self.status == "Idle":
                self.status = "Running"
                self.active_alarm = None
                self.alarm_severity = "None"
                self.alarm_code = None
                self.alarm_duration_sec = 0.0
                self.state_countdown = random.randint(35, 65)

        if self.status == "Running":
            self.uptime_seconds += delta_time
            jitter = random.gauss(0, self.nominal_cycle_variation)
            self.cycle_time_sec = max(
                self.ideal_cycle_time * 0.92,
                round(self.ideal_cycle_time + jitter, 2),
            )
            self.seconds_since_last_part += delta_time

            if self.seconds_since_last_part >= self.cycle_time_sec:
                self.output_count += 1
                self.seconds_since_last_part = 0.0

                if random.random() < 0.015:
                    self.scrap_count += 1
                else:
                    self.good_count += 1

                # Rare transient harmonic vibration drift, auto-resolving in 8-12s
                if random.random() < 0.01 and not self.active_alarm:
                    v_val = round(random.uniform(2.8, 3.4), 2)
                    self.active_alarm = f"Vibration drift (RMS: {v_val} mm/s)"
                    self.alarm_severity = "Warning"
                    self.alarm_code = "ALM-W108"
                    self.alarm_duration_sec = 0.0
                    self.alarm_max_duration_sec = random.uniform(8.0, 12.0)

        elif self.status == "Down":
            self.downtime_seconds += delta_time
            self.cycle_time_sec = 0.0

        elif self.status == "Idle":
            self.downtime_seconds += delta_time * 0.35
            self.cycle_time_sec = 0.0

    def _generate_fault(self):
        faults_map = {
            "CNC-101": [
                ("Spindle Bearings Thermal Trip (>89°C)", "Critical", "ALM-E204"),
                ("Coolant Delivery Line Depressurized (<1.1 bar)", "Critical", "ALM-E312"),
                ("Axis Y Servo Overcurrent Fault", "Critical", "ALM-E401"),
            ],
            "INJ-202": [
                ("Barrel Heater Zone 3 Thermocouple Open", "Critical", "ALM-E109"),
                ("Mold Clamp Proximity Interlock Fault", "Critical", "ALM-E550"),
                ("Plasticizer Melt Pressure Exceeded (185 bar)", "Critical", "ALM-E702"),
            ],
            "WLD-303": [
                ("Shielding Gas Flow Below 8 L/min", "Critical", "ALM-E881"),
                ("Wire Feed Spool Jammed / Burnback Detected", "Critical", "ALM-E890"),
                ("Safety Light Curtain Perimeter Violation", "Critical", "ALM-E999"),
            ],
        }
        alarms = faults_map.get(
            self.machine_id,
            [("Unscheduled Emergency E-Stop Actuated", "Critical", "ALM-E000")],
        )
        alarm_text, severity, code = random.choice(alarms)
        self.active_alarm = alarm_text
        self.alarm_severity = severity
        self.alarm_code = code
        self.alarm_duration_sec = 0.0
        self.alarm_max_duration_sec = 16.0

    def _generate_idle_state(self):
        idle_map = {
            "CNC-101": ("Tool Magazine Pocket #07 Inspection", "Warning", "ALM-W210"),
            "INJ-202": ("Raw Polymer Resin Hopper Replenishment", "Warning", "ALM-W340"),
            "WLD-303": ("Torch Nozzle Reaming & Anti-Spatter Clean", "Warning", "ALM-W512"),
        }
        alarm_text, severity, code = idle_map.get(
            self.machine_id,
            ("Operator Workpiece Alignment", "Warning", "ALM-W100"),
        )
        self.active_alarm = alarm_text
        self.alarm_severity = severity
        self.alarm_code = code
        self.alarm_duration_sec = 0.0
        self.alarm_max_duration_sec = 12.0

    def get_sensors(self) -> dict:
        if self.status == "Running":
            temp = self.base_temp + random.uniform(-1.2, 2.5)
            if self.alarm_code == "ALM-W108":
                vib = random.uniform(2.85, 3.35)
            else:
                vib = 1.6 + random.uniform(-0.15, 0.25)
            pwr = self.base_power + random.uniform(-1.0, 1.5)
            press = 6.4 + random.uniform(-0.1, 0.1)
        elif self.status == "Down":
            temp = self.base_temp + 28.5 + random.uniform(-0.5, 1.5)
            vib = 4.8 + random.uniform(-0.3, 0.5)
            pwr = 1.4 + random.uniform(-0.2, 0.2)
            press = 1.1 + random.uniform(-0.1, 0.2)
        else: # Idle
            temp = self.base_temp - 12.0 + random.uniform(-0.5, 0.5)
            vib = 0.3 + random.uniform(-0.05, 0.05)
            pwr = 3.8 + random.uniform(-0.2, 0.2)
            press = 6.0 + random.uniform(-0.1, 0.1)

        return {
            "temperature_c": round(temp, 1),
            "vibration_mm_s": round(vib, 2),
            "power_kw": round(pwr, 1),
            "pressure_bar": round(press, 1),
        }

    def to_payload(self) -> dict:
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "machine_id": self.machine_id,
            "machine_name": self.machine_name,
            "location": self.location,
            "operator": self.operator,
            "status": self.status,
            "output_count": self.output_count,
            "target_output": self.target_output,
            "good_count": self.good_count,
            "scrap_count": self.scrap_count,
            "cycle_time_sec": round(self.cycle_time_sec, 2),
            "ideal_cycle_time_sec": self.ideal_cycle_time,
            "uptime_seconds": round(self.uptime_seconds, 1),
            "downtime_seconds": round(self.downtime_seconds, 1),
            "active_alarm": self.active_alarm,
            "alarm_severity": self.alarm_severity,
            "alarm_code": self.alarm_code,
            "sensors": self.get_sensors(),
        }


def format_status(status: str) -> str:
    if status == "Running":
        return f"{COLOR_GREEN}{COLOR_BOLD}● RUNNING{COLOR_RESET}"
    elif status == "Down":
        return f"{COLOR_RED}{COLOR_BOLD}▲ DOWN   {COLOR_RESET}"
    else:
        return f"{COLOR_YELLOW}{COLOR_BOLD}■ IDLE   {COLOR_RESET}"


def replay_real_world_csv(csv_path: str, cadence_sec: float = 1.5):
    """
    Replays an authentic real-world manufacturing shift CSV file row-by-row into FastAPI.
    Dynamically maps timestamps to current time for live streaming.
    """
    import csv
    if not os.path.exists(csv_path):
        print(f"{COLOR_RED}Error: Dataset not found at {csv_path}{COLOR_RESET}")
        return

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = list(csv.DictReader(f))

    print(f"\n{COLOR_CYAN}{COLOR_BOLD}{'='*75}{COLOR_RESET}")
    print(f"{COLOR_CYAN}{COLOR_BOLD} SynapSYS Real-World Shift Telemetry Replay Engine{COLOR_RESET}")
    print(f" Source Dataset: {COLOR_BOLD}{os.path.basename(csv_path)}{COLOR_RESET} ({len(reader)} records)")
    print(f" Ingestion Target: {COLOR_BOLD}{BACKEND_URL}{COLOR_RESET}")
    print(f" Streaming Cadence: {cadence_sec}s per telemetry frame")
    print(f"{COLOR_CYAN}{COLOR_BOLD}{'='*75}{COLOR_RESET}\n")

    frame_idx = 0
    try:
        while True:
            for row in reader:
                frame_idx += 1
                now_str = datetime.now().strftime("%H:%M:%S")
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

                payload = {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "machine_id": m_id,
                    "machine_name": row.get("machine_name", m_id),
                    "location": "Bay 02 • Machining Cell A" if "CNC" in m_id else ("Bay 04 • Polymers Line" if "INJ" in m_id else "Bay 01 • Fabrication"),
                    "operator": "K. Miller [Shift 1]" if "CNC" in m_id else ("T. Vance [Shift 1]" if "INJ" in m_id else "A. Chen [Shift 1]"),
                    "status": status,
                    "output_count": output_c,
                    "target_output": target_o,
                    "good_count": good_c,
                    "scrap_count": scrap_c,
                    "cycle_time_sec": cycle_t,
                    "ideal_cycle_time_sec": ideal_t,
                    "uptime_seconds": uptime_s,
                    "downtime_seconds": downtime_s,
                    "active_alarm": active_alm,
                    "alarm_severity": "Critical" if status == "Down" else ("Warning" if active_alm else "None"),
                    "alarm_code": alm_code,
                    "sensors": {
                        "temperature_c": float(row.get("temp_c", 52.0)),
                        "vibration_mm_s": float(row.get("vibration_rms", 1.5)),
                        "power_kw": float(row.get("power_kw", 22.0)),
                        "pressure_bar": float(row.get("pressure_bar", 6.2)) if row.get("pressure_bar") else 6.2,
                    },
                }

                status_colored = format_status(status)
                sensors = payload["sensors"]
                sensor_str = f" | {sensors['temperature_c']}°C | {sensors['power_kw']}kW | {sensors['vibration_mm_s']}mm/s"
                alarm_str = f" | {COLOR_RED}FAULT: {active_alm} ({alm_code}){COLOR_RESET}" if active_alm else ""

                try:
                    http_code = post_telemetry(BACKEND_URL, payload, timeout=2.5)
                    code_color = COLOR_GREEN if http_code == 201 else COLOR_YELLOW
                    print(
                        f"[{now_str}] Frame #{frame_idx:>4} [{code_color}{http_code}{COLOR_RESET}] {COLOR_BOLD}{m_id:<8}{COLOR_RESET} "
                        f"{status_colored} | Output: {output_c:>3}/{target_o} "
                        f"| Cycle: {cycle_t:>4.1f}s{sensor_str}{alarm_str}"
                    )
                except NetworkError as exc:
                    print(
                        f"[{now_str}] Frame #{frame_idx:>4} [{COLOR_RED}FAIL{COLOR_RESET}] {COLOR_BOLD}{m_id:<8}{COLOR_RESET} "
                        f"Backend unreachable at {BACKEND_URL} ({type(exc).__name__})"
                    )

                time.sleep(cadence_sec)

    except KeyboardInterrupt:
        print(f"\n{COLOR_YELLOW}[!] Shift replay stopped gracefully.{COLOR_RESET}\n")
        sys.exit(0)


def main():
    # Check if replay mode requested via command line or env
    is_replay = "--replay" in sys.argv or os.environ.get("REPLAY_CSV", "").lower() in ("1", "true")
    csv_file = None
    if is_replay:
        for idx, arg in enumerate(sys.argv):
            if arg == "--replay" and idx + 1 < len(sys.argv) and not sys.argv[idx + 1].startswith("--"):
                csv_file = sys.argv[idx + 1]
                break
        if not csv_file:
            # Default to authentic shift sample
            cand_paths = [
                os.path.join(os.path.dirname(__file__), "..", "backend", "data", "real_machining_shift_sample.csv"),
                os.path.join(os.path.dirname(__file__), "data", "real_machining_shift_sample.csv"),
            ]
            for p in cand_paths:
                if os.path.exists(p):
                    csv_file = p
                    break

        if csv_file and os.path.exists(csv_file):
            replay_real_world_csv(csv_file)
            return
    print(f"\n{COLOR_CYAN}{COLOR_BOLD}{'='*75}{COLOR_RESET}")
    print(f"{COLOR_CYAN}{COLOR_BOLD} SynapSYS Enterprise IIoT Simulator (3 Discrete Production Assets){COLOR_RESET}")
    print(f" Ingestion Target: {COLOR_BOLD}{BACKEND_URL}{COLOR_RESET}")
    print(f" Telemetry Cadence: {TICK_INTERVAL_SEC}s streaming window")
    print(f"{COLOR_CYAN}{COLOR_BOLD}{'='*75}{COLOR_RESET}\n")

    machines = [
        SimulatedMachine(
            machine_id="CNC-101",
            machine_name="5-Axis CNC Milling Center",
            location="Bay 02 • Machining Cell A",
            operator="K. Miller [Shift 1]",
            ideal_cycle_time=12.0,
            target_output=250,
            nominal_cycle_variation=0.8,
            base_temp=52.0,
            base_power=24.0,
        ),
        SimulatedMachine(
            machine_id="INJ-202",
            machine_name="Hydraulic Injection Press",
            location="Bay 04 • Polymers Line",
            operator="T. Vance [Shift 1]",
            ideal_cycle_time=6.5,
            target_output=500,
            nominal_cycle_variation=0.4,
            base_temp=68.0,
            base_power=38.0,
        ),
        SimulatedMachine(
            machine_id="WLD-303",
            machine_name="Robotic Arc Welding Cell",
            location="Bay 01 • Fabrication Cell C",
            operator="A. Chen [Shift 1]",
            ideal_cycle_time=18.0,
            target_output=160,
            nominal_cycle_variation=1.1,
            base_temp=44.0,
            base_power=16.0,
        ),
    ]

    cycle_count = 0
    try:
        while True:
            cycle_count += 1
            now_str = datetime.now().strftime("%H:%M:%S")
            print(f"{COLOR_GRAY}[{now_str}] Telemetry Frame #{cycle_count}{COLOR_RESET}")

            for machine in machines:
                machine.step(TICK_INTERVAL_SEC)
                payload = machine.to_payload()
                status_colored = format_status(payload["status"])
                sensors = payload["sensors"]
                sensor_str = f" | {sensors['temperature_c']}°C | {sensors['power_kw']}kW | {sensors['vibration_mm_s']}mm/s"
                alarm_str = f" | {COLOR_RED}FAULT: {payload['active_alarm']} ({payload['alarm_code']}){COLOR_RESET}" if payload["active_alarm"] else ""

                try:
                    http_code = post_telemetry(BACKEND_URL, payload, timeout=2.5)
                    code_color = COLOR_GREEN if http_code == 201 else COLOR_YELLOW
                    print(
                        f"  [{code_color}{http_code}{COLOR_RESET}] {COLOR_BOLD}{machine.machine_id:<8}{COLOR_RESET} "
                        f"{status_colored} | Output: {payload['output_count']:>3}/{payload['target_output']} "
                        f"| Cycle: {payload['cycle_time_sec']:>4.1f}s{sensor_str}{alarm_str}"
                    )
                except NetworkError as exc:
                    print(
                        f"  [{COLOR_RED}FAIL{COLOR_RESET}] {COLOR_BOLD}{machine.machine_id:<8}{COLOR_RESET} "
                        f"Backend unreachable at {BACKEND_URL} ({type(exc).__name__})"
                    )

            print(f"{COLOR_GRAY}{'-'*75}{COLOR_RESET}")
            time.sleep(TICK_INTERVAL_SEC)

    except KeyboardInterrupt:
        print(f"\n{COLOR_YELLOW}[!] Simulator stopped gracefully.{COLOR_RESET}\n")
        sys.exit(0)


if __name__ == "__main__":
    main()
