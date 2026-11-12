# SynapSYS: Enterprise Manufacturing Data Engine & Real-Time OEE Analytics
**Problem Statement PS-002: Production Monitoring & OEE Analytics Dashboard**

SynapSYS is an enterprise industrial IoT (IIoT) telemetry and performance analytics platform inspired by **Google Cloud Manufacturing Data Engine** architecture. It ingests live edge telemetry, calculates Overall Equipment Effectiveness (OEE) according to **ISO-22400 / ISA-95 standards**, delivers **Nakajima Six Big Losses** decomposition, tracks **Active MES Work Orders**, models **ISO-50001 Energy Intensity**, and provides an interactive **Spatial Digital Twin** and conversational **Copilot AI**.

---

## Innovative Industry 4.0 Capabilities

1. **Interactive Digital Twin Shop Floor (Spatial SCADA Layout)**:
   - A live 2D spatial schematic of Detroit Site 04 showing production cells across `Bay 02` (Milling), `Bay 04` (Injection), and `Bay 01` (Robotic Welding).
   - Animated material conveyor flow tracks with transfer station coordinates.
   - Live equipment node states, thermal readings, and click-to-inspect physical mapping.
2. **SynapSYS Copilot AI (Grounded Industrial Reasoning)**:
   - An intelligent engineering assistant embedded in the top bar.
   - Slide-over conversational interface grounded in real-time telemetry, active alarms, and MES work orders.
   - Quick diagnostic prompt chips:
     - `Analyze OEE Bottlenecks`
     - `Predict Component Failures (RUL)`
     - `Calculate Shift Financial ROI`
   - Returns structured engineering analysis with telemetry citations and suggested standard operating procedure (SOP) actions.
3. **ISO-50001 Energy Intensity & Carbon Footprint Tracking (ESG)**:
   - Real-time electrical demand monitoring (`79.3 kW`).
   - Specific energy consumption intensity per unit (`0.43 kWh/unit`).
   - Carbon footprint emission indexing (`165.5 gCO2/unit`) and renewable grid tracking (`44.5% Green Energy`).
4. **Nakajima Six Big Losses Decomposition (ISO-22400)**:
   - Breaks down theoretical capacity loss across Unplanned Stoppages, Setup/Adjustments, Micro-stops, Speed Loss, Process Defects, and Startup Rejects.
5. **MES Active Work Order Tracking**:
   - Real production jobs mapped to physical assets (Pratt & Whitney, Bosch, Ford EV) with batch targets, parts produced, and estimated completion times.

---

## OEE Calculation Standard (ISO-22400)

$$\text{OEE} = \text{Availability} \times \text{Performance} \times \text{Quality}$$

* **Availability ($A$)**: $\frac{\text{Operating Run Time}}{\text{Planned Time}} = \frac{\text{Uptime}}{\text{Uptime} + \text{Downtime}}$
* **Performance ($P$)**: $\frac{\text{Ideal Cycle Time} \times \text{Total Output}}{\text{Operating Run Time}}$
* **Quality ($Q$)**: $\frac{\text{Conforming Units}}{\text{Total Output}}$

---

## Quick Launch Instructions

### Option 1: Turnkey Launcher (Bash)
```bash
./run.sh
```

### Option 2: Step-by-Step Launch (Fish / Bash)

#### 1. Backend Server (Terminal 1)
```fish
cd /home/sarvesh/Sandbox/SynapSYS/backend
source venv/bin/activate.fish
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
* Interactive API Documentation: **`http://localhost:8000/docs`**
* Consolidated Live Telemetry Feed: **`http://localhost:8000/api/dashboard`**
* Copilot Query Endpoint: **`POST http://localhost:8000/api/copilot/query`**

#### 2. Telemetry Simulator (Terminal 2)
```fish
cd /home/sarvesh/Sandbox/SynapSYS/simulator
../backend/venv/bin/python simulator.py
```

#### 3. React Frontend (Terminal 3)
```fish
cd /home/sarvesh/Sandbox/SynapSYS/frontend
npm run dev
```
* Dashboard URL: **`http://localhost:5173`**
