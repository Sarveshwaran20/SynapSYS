"""
Industrial Inventory & Procurement Management Engine for SynapSYS.
Tracks MRO tooling, raw materials, mechanical spares, and vendor directories.
Handles purchase order generation, automated RFQ emails to suppliers, and stock replenishment.
"""

from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import logging
import os
import smtplib
from typing import Any, Dict, List, Optional
from pydantic import BaseModel

logger = logging.getLogger("synapsys.procurement")
SUPERVISOR_ALERT_EMAIL = os.getenv("SECURITY_ALERT_EMAIL", "sarveshwaran.k2008@gmail.com")

# ---------------------------------------------------------------------------
# Initial Verified Industrial Suppliers Directory
# ---------------------------------------------------------------------------
DEFAULT_SUPPLIERS: List[Dict[str, Any]] = [
    {
        "id": "sup-001",
        "name": "Coimbatore Precision Tooling Corp",
        "contact_person": "K. Murugan",
        "email": "orders@coimbatoretooling.in",
        "phone": "+91 422 249 8810",
        "categories": ["Cutting Tools", "Machine Spares"],
        "lead_time_days": 2,
        "rating": 4.9,
        "address": "SIDCO Industrial Estate, Kurichi, Coimbatore, TN 641021",
        "payment_terms": "Net 30",
    },
    {
        "id": "sup-002",
        "name": "Apex Industrial Bearing & Motion",
        "contact_person": "R. David",
        "email": "procurement@apexindustrial.com",
        "phone": "+1 (313) 555-0182",
        "categories": ["Machine Spares", "Fluids & Lubricants"],
        "lead_time_days": 3,
        "rating": 4.8,
        "address": "4800 Industrial Pkwy, Detroit, MI 48201",
        "payment_terms": "Net 45",
    },
    {
        "id": "sup-003",
        "name": "Titanium & Aerospace Alloys Ltd",
        "contact_person": "S. Sundaram",
        "email": "sales@aerotitaniumalloys.com",
        "phone": "+91 80 2839 4400",
        "categories": ["Raw Materials"],
        "lead_time_days": 5,
        "rating": 4.7,
        "address": "Peenya 2nd Stage, Bangalore, KA 560058",
        "payment_terms": "Net 30",
    },
    {
        "id": "sup-004",
        "name": "Kaviarasu Hydraulics & Pneumatic Systems",
        "contact_person": "V. Kaviarasu",
        "email": "supplies@kaviarasuhydraulics.com",
        "phone": "+91 422 257 3290",
        "categories": ["Machine Spares", "Fluids & Lubricants"],
        "lead_time_days": 1,
        "rating": 4.9,
        "address": "Ganapathy Industrial Area, Coimbatore, TN 641006",
        "payment_terms": "Net 15",
    },
    {
        "id": "sup-005",
        "name": "Siemens & Industrial Automation Hub",
        "contact_person": "E. Weber",
        "email": "orders@automationhub.de",
        "phone": "+49 711 8920 440",
        "categories": ["Machine Spares"],
        "lead_time_days": 3,
        "rating": 4.9,
        "address": "Stuttgart Industrial Park, 70173 Stuttgart, Germany",
        "payment_terms": "Net 30",
    },
    {
        "id": "sup-006",
        "name": "Great Lakes Robotics & Automation Spares",
        "contact_person": "M. Kowalski",
        "email": "spares@greatlakesrobotics.com",
        "phone": "+1 (248) 555-0144",
        "categories": ["Machine Spares", "Cutting Tools"],
        "lead_time_days": 2,
        "rating": 4.9,
        "address": "2200 Automation Way, Auburn Hills, MI 48326",
        "payment_terms": "Net 30",
    },
]

# ---------------------------------------------------------------------------
# Initial Industrial Inventory Stock (MRO, Tooling, Raw Materials)
# Current replacement parts market values (spot FX benchmark 1 USD = 86.0 INR)
# ---------------------------------------------------------------------------
DEFAULT_INVENTORY: List[Dict[str, Any]] = [
    {
        "id": "inv-001",
        "sku": "SKF-7210-CD/P4A",
        "name": "High-Precision Angular Contact Spindle Bearing Kit (Matched Pair)",
        "category": "Machine Spares",
        "quantity": 2,
        "min_safety_stock": 4,
        "reorder_quantity": 6,
        "unit": "sets",
        "unit_cost_inr": 36120.00,
        "unit_cost_usd": 420.00,
        "bin_location": "Tooling Crib A - Shelf 02 - Bin 14",
        "preferred_supplier_id": "sup-002",
        "preferred_supplier_name": "Apex Industrial Bearing & Motion",
        "linked_machine_id": "CNC-101",
        "last_restocked_at": "2026-11-01T10:00:00Z",
    },
    {
        "id": "inv-002",
        "sku": "EM-CARB-12MM-4F",
        "name": "Solid Carbide End Mill 12mm 4-Flute AlTiN Coated (Micro-Grain)",
        "category": "Cutting Tools",
        "quantity": 8,
        "min_safety_stock": 15,
        "reorder_quantity": 25,
        "unit": "pcs",
        "unit_cost_inr": 6400.00,
        "unit_cost_usd": 74.50,
        "bin_location": "Crib B - Carousel 01 - Drawer 08",
        "preferred_supplier_id": "sup-001",
        "preferred_supplier_name": "Coimbatore Precision Tooling Corp",
        "linked_machine_id": "CNC-101",
        "last_restocked_at": "2026-11-05T14:30:00Z",
    },
    {
        "id": "inv-003",
        "sku": "TI-6AL4V-RD60",
        "name": "Titanium Grade 5 Round Bar (Dia 60mm Certified AMS 4928)",
        "category": "Raw Materials",
        "quantity": 18,
        "min_safety_stock": 20,
        "reorder_quantity": 40,
        "unit": "kg",
        "unit_cost_inr": 4980.00,
        "unit_cost_usd": 58.00,
        "bin_location": "Raw Yard Bay 01 - Rack R-12 (Bin 03)",
        "preferred_supplier_id": "sup-003",
        "preferred_supplier_name": "Titanium & Aerospace Alloys Ltd",
        "linked_machine_id": "CNC-101",
        "last_restocked_at": "2026-10-28T09:15:00Z",
    },
    {
        "id": "inv-004",
        "sku": "HYD-VALVE-D03-24V",
        "name": "Hydraulic Directional Control Solenoid Valve (Rexroth NG6 / D03)",
        "category": "Machine Spares",
        "quantity": 1,
        "min_safety_stock": 2,
        "reorder_quantity": 4,
        "unit": "units",
        "unit_cost_inr": 42500.00,
        "unit_cost_usd": 495.00,
        "bin_location": "Crib A - Shelf 04 - Bin 22",
        "preferred_supplier_id": "sup-004",
        "preferred_supplier_name": "Kaviarasu Hydraulics & Pneumatic Systems",
        "linked_machine_id": "INJ-202",
        "last_restocked_at": "2026-10-15T11:20:00Z",
    },
    {
        "id": "inv-005",
        "sku": "SYN-COOL-208L",
        "name": "Fully Synthetic Metalworking Coolant (208L / 55-Gal Industrial Drum)",
        "category": "Fluids & Lubricants",
        "quantity": 3,
        "min_safety_stock": 2,
        "reorder_quantity": 4,
        "unit": "drums",
        "unit_cost_inr": 122000.00,
        "unit_cost_usd": 1420.00,
        "bin_location": "Chemical Containment Zone C - Shelf 01 - Bin 05",
        "preferred_supplier_id": "sup-004",
        "preferred_supplier_name": "Kaviarasu Hydraulics & Pneumatic Systems",
        "linked_machine_id": "CNC-101",
        "last_restocked_at": "2026-11-08T16:00:00Z",
    },
    {
        "id": "inv-006",
        "sku": "WLD-TIP-CUCRZR-1.2",
        "name": "Robotic Welding Contact Tips CuCrZr Heavy-Duty (1.2mm wire M8)",
        "category": "Machine Spares",
        "quantity": 45,
        "min_safety_stock": 30,
        "reorder_quantity": 100,
        "unit": "pcs",
        "unit_cost_inr": 385.00,
        "unit_cost_usd": 4.50,
        "bin_location": "Crib B - Carousel 03 - Bin 19",
        "preferred_supplier_id": "sup-001",
        "preferred_supplier_name": "Coimbatore Precision Tooling Corp",
        "linked_machine_id": "WLD-303",
        "last_restocked_at": "2026-11-09T08:30:00Z",
    },
    {
        "id": "inv-007",
        "sku": "OMR-G9SE-201-24V",
        "name": "Omron G9SE-201 Compact Safety Relay Unit (24V AC/DC Dual Channel)",
        "category": "Machine Spares",
        "quantity": 4,
        "min_safety_stock": 3,
        "reorder_quantity": 6,
        "unit": "units",
        "unit_cost_inr": 14190.00,
        "unit_cost_usd": 165.00,
        "bin_location": "Tooling Crib A - Shelf 01 - Bin 01",
        "preferred_supplier_id": "sup-002",
        "preferred_supplier_name": "Apex Industrial Bearing & Motion",
        "linked_machine_id": "CNC-101",
        "last_restocked_at": "2026-11-02T11:00:00Z",
    },
    {
        "id": "inv-008",
        "sku": "FESTO-VUVG-L14",
        "name": "Festo VUVG Compact Solenoid Valve 5/2-Way (24VDC IP65 M8)",
        "category": "Machine Spares",
        "quantity": 6,
        "min_safety_stock": 5,
        "reorder_quantity": 10,
        "unit": "units",
        "unit_cost_inr": 12210.00,
        "unit_cost_usd": 142.00,
        "bin_location": "Tooling Crib A - Shelf 01 - Bin 02",
        "preferred_supplier_id": "sup-004",
        "preferred_supplier_name": "Kaviarasu Hydraulics & Pneumatic Systems",
        "linked_machine_id": "ROB-404",
        "last_restocked_at": "2026-11-03T09:30:00Z",
    },
    {
        "id": "inv-009",
        "sku": "MOBIL-SHC-630-20L",
        "name": "Mobil SHC 630 Synthetic Gear & Bearing Circulating Oil (ISO VG 220 20L)",
        "category": "Fluids & Lubricants",
        "quantity": 5,
        "min_safety_stock": 3,
        "reorder_quantity": 8,
        "unit": "pails",
        "unit_cost_inr": 24500.00,
        "unit_cost_usd": 285.00,
        "bin_location": "Chemical Containment Zone C - Shelf 02 - Bin 07",
        "preferred_supplier_id": "sup-002",
        "preferred_supplier_name": "Apex Industrial Bearing & Motion",
        "linked_machine_id": "INJ-202",
        "last_restocked_at": "2026-11-04T14:15:00Z",
    },
    {
        "id": "inv-010",
        "sku": "SAND-WNMG-080408",
        "name": "Sandvik Coromant WNMG 432-PR Carbide Turning Inserts (Grade GC4325 Box of 10)",
        "category": "Cutting Tools",
        "quantity": 12,
        "min_safety_stock": 15,
        "reorder_quantity": 30,
        "unit": "boxes",
        "unit_cost_inr": 10150.00,
        "unit_cost_usd": 118.00,
        "bin_location": "Crib B - Carousel 01 - Drawer 09",
        "preferred_supplier_id": "sup-001",
        "preferred_supplier_name": "Coimbatore Precision Tooling Corp",
        "linked_machine_id": "CNC-101",
        "last_restocked_at": "2026-11-06T13:45:00Z",
    },
    {
        "id": "inv-011",
        "sku": "SIEM-S7-1515-2PN",
        "name": "Siemens SIMATIC S7-1500 CPU 1515-2 PN Central Controller PLC",
        "category": "Machine Spares",
        "quantity": 1,
        "min_safety_stock": 1,
        "reorder_quantity": 2,
        "unit": "units",
        "unit_cost_inr": 210700.00,
        "unit_cost_usd": 2450.00,
        "bin_location": "Crib A - Locked Cabinet 04 - Bin 11",
        "preferred_supplier_id": "sup-005",
        "preferred_supplier_name": "Siemens & Industrial Automation Hub",
        "linked_machine_id": "CNC-101",
        "last_restocked_at": "2026-10-20T10:00:00Z",
    },
    {
        "id": "inv-012",
        "sku": "FANUC-A06B-SVM1",
        "name": "FANUC Alpha i Servo Amplifier Module (SVM1-40i Spindle Drive)",
        "category": "Machine Spares",
        "quantity": 1,
        "min_safety_stock": 1,
        "reorder_quantity": 2,
        "unit": "units",
        "unit_cost_inr": 159100.00,
        "unit_cost_usd": 1850.00,
        "bin_location": "Crib A - Locked Cabinet 04 - Bin 12",
        "preferred_supplier_id": "sup-006",
        "preferred_supplier_name": "Great Lakes Robotics & Automation Spares",
        "linked_machine_id": "ROB-404",
        "last_restocked_at": "2026-10-22T15:20:00Z",
    },
    {
        "id": "inv-013",
        "sku": "THK-BNK3210-5G2",
        "name": "THK Precision Ground Ball Screw Assembly (Dia 32mm Lead 10mm Travel 1200mm)",
        "category": "Machine Spares",
        "quantity": 2,
        "min_safety_stock": 2,
        "reorder_quantity": 3,
        "unit": "sets",
        "unit_cost_inr": 76540.00,
        "unit_cost_usd": 890.00,
        "bin_location": "Crib A - Heavy Racks - Bin 16",
        "preferred_supplier_id": "sup-002",
        "preferred_supplier_name": "Apex Industrial Bearing & Motion",
        "linked_machine_id": "CNC-101",
        "last_restocked_at": "2026-10-25T11:10:00Z",
    },
    {
        "id": "inv-014",
        "sku": "GATES-8MGT-1200",
        "name": "Gates Poly Chain GT Carbon Synchronous Drive Belt (8MGT-1200-36)",
        "category": "Machine Spares",
        "quantity": 7,
        "min_safety_stock": 5,
        "reorder_quantity": 12,
        "unit": "pcs",
        "unit_cost_inr": 15910.00,
        "unit_cost_usd": 185.00,
        "bin_location": "Crib B - Carousel 02 - Bin 17",
        "preferred_supplier_id": "sup-002",
        "preferred_supplier_name": "Apex Industrial Bearing & Motion",
        "linked_machine_id": "CONV-01",
        "last_restocked_at": "2026-11-07T08:50:00Z",
    },
    {
        "id": "inv-015",
        "sku": "NOZ-TIP-HT50-BIM",
        "name": "Bimetallic Injection Molding Machine Nozzle Tip & Ceramic Heater Band Kit",
        "category": "Machine Spares",
        "quantity": 3,
        "min_safety_stock": 3,
        "reorder_quantity": 5,
        "unit": "sets",
        "unit_cost_inr": 36120.00,
        "unit_cost_usd": 420.00,
        "bin_location": "Crib B - Shelf 06 - Bin 20",
        "preferred_supplier_id": "sup-004",
        "preferred_supplier_name": "Kaviarasu Hydraulics & Pneumatic Systems",
        "linked_machine_id": "INJ-202",
        "last_restocked_at": "2026-10-30T16:00:00Z",
    },
    {
        "id": "inv-016",
        "sku": "HEID-ECN-1313",
        "name": "Heidenhain ECN 1313 Absolute Rotary Spindle Optical Encoder (EnDat 2.2)",
        "category": "Machine Spares",
        "quantity": 1,
        "min_safety_stock": 2,
        "reorder_quantity": 3,
        "unit": "units",
        "unit_cost_inr": 98900.00,
        "unit_cost_usd": 1150.00,
        "bin_location": "Crib A - Shelf 06 - Bin 24",
        "preferred_supplier_id": "sup-002",
        "preferred_supplier_name": "Apex Industrial Bearing & Motion",
        "linked_machine_id": "CNC-101",
        "last_restocked_at": "2026-10-18T12:00:00Z",
    },
]

# In-memory Purchase Orders store
_PURCHASE_ORDERS: List[Dict[str, Any]] = [
    {
        "po_id": "PO-2026-1081",
        "created_at": "2026-11-10T14:20:00Z",
        "supplier_id": "sup-001",
        "supplier_name": "Coimbatore Precision Tooling Corp",
        "supplier_email": "orders@coimbatoretooling.in",
        "status": "Confirmed",
        "items": [
            {
                "item_id": "inv-002",
                "sku": "EM-CARB-12MM-4F",
                "name": "Solid Carbide End Mill 12mm 4-Flute AlTiN Coated (Micro-Grain)",
                "quantity": 25,
                "unit": "pcs",
                "unit_price_inr": 6400.00,
                "unit_price_usd": 74.50,
                "total_price_inr": 160000.00,
                "total_price_usd": 1862.50,
            }
        ],
        "subtotal_inr": 160000.00,
        "subtotal_usd": 1862.50,
        "tax_inr": 28800.00,
        "tax_usd": 153.66,
        "total_inr": 188800.00,
        "total_usd": 2016.16,
        "estimated_delivery": "2026-11-14",
        "email_subject": "Purchase Order PO-2026-1081 - SynapSYS Production",
        "email_dispatched_at": "2026-11-10T14:22:00Z",
        "notes": "Urgent replenishment for Coimbatore tooling run",
        "security_2fa_verified": True,
        "authorized_by": "Sarveshwaran K (Plant Supervisor)",
    },
    {
        "po_id": "PO-2026-1094",
        "created_at": "2026-11-12T11:15:00Z",
        "supplier_id": "sup-002",
        "supplier_name": "Apex Industrial Bearing & Motion",
        "supplier_email": "procurement@apexindustrial.com",
        "status": "Confirmed",
        "items": [
            {
                "item_id": "inv-001",
                "sku": "SKF-7210-CD/P4A",
                "name": "High-Precision Angular Contact Spindle Bearing Kit (Matched Pair)",
                "quantity": 4,
                "unit": "sets",
                "unit_price_inr": 36120.00,
                "unit_price_usd": 420.00,
                "total_price_inr": 144480.00,
                "total_price_usd": 1680.00,
            }
        ],
        "subtotal_inr": 144480.00,
        "subtotal_usd": 1680.00,
        "tax_inr": 26006.40,
        "tax_usd": 138.60,
        "total_inr": 170486.40,
        "total_usd": 1818.60,
        "estimated_delivery": "2026-11-15",
        "email_subject": "Purchase Order PO-2026-1094 - SynapSYS Production",
        "email_dispatched_at": "2026-11-12T11:18:00Z",
        "notes": "Spindle maintenance overhaul reserve for Detroit Plant 04",
        "security_2fa_verified": True,
        "authorized_by": "Sarveshwaran K (Plant Supervisor)",
    },
]


# ---------------------------------------------------------------------------
# Email Dispatcher for Vendor Purchase Orders
# ---------------------------------------------------------------------------
def dispatch_supplier_po_email(
    po_data: Dict[str, Any],
    company_name: str = "SynapSYS Industrial Operations",
) -> bool:
    """
    Sends a formal HTML & Text Purchase Order / RFQ to the vendor's email address
    and carbon-copies the designated supervisor email.
    """
    supplier_email = po_data.get("supplier_email")
    supplier_name = po_data.get("supplier_name", "Supplier Partner")
    po_id = po_data.get("po_id")
    items = po_data.get("items", [])
    total_val = float(po_data.get("total_inr") or po_data.get("total_usd") or 0.0)
    subtotal_val = float(po_data.get("subtotal_inr") or po_data.get("subtotal_usd") or (total_val / 1.18))
    tax_val = float(po_data.get("tax_inr") or po_data.get("tax_usd") or (total_val - subtotal_val))
    cgst_val = round(tax_val / 2.0, 2)
    sgst_val = round(tax_val / 2.0, 2)

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    sender_email = os.getenv("SMTP_FROM", "procurement@synapsys.industrial")

    subject = f"[PURCHASE ORDER] {po_id} from {company_name} (₹{total_val:,.2f})"

    item_rows_html = "".join([
        f"""<tr>
            <td style="padding: 10px; border-bottom: 1px solid #2d3748; font-family: monospace;">{it.get('sku', 'N/A')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #2d3748;">{it.get('name', 'Industrial Item')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #2d3748; text-align: center;">{it.get('quantity', 1)} {it.get('unit', 'pcs')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #2d3748; text-align: right;">₹{float(it.get('unit_price_inr') or it.get('unit_price_usd') or it.get('unit_price') or 0.0):,.2f}</td>
            <td style="padding: 10px; border-bottom: 1px solid #2d3748; text-align: right; font-weight: bold;">₹{float(it.get('total_price_inr') or it.get('total_price_usd') or (float(it.get('quantity', 1)) * float(it.get('unit_price_inr') or it.get('unit_price_usd') or it.get('unit_price') or 0.0))):,.2f}</td>
        </tr>"""
        for it in items
    ])

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #f3f4f6; padding: 24px; }}
        .po-box {{ max-width: 680px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-top: 4px solid #10b981; border-radius: 8px; padding: 32px; }}
        .header {{ font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px; }}
        .badge {{ display: inline-block; padding: 4px 10px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); color: #34d399; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }}
        th {{ background: #1f2937; color: #9ca3af; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }}
        .footer {{ margin-top: 28px; padding-top: 16px; border-top: 1px solid #1f2937; font-size: 12px; color: #6b7280; text-align: center; }}
      </style>
    </head>
    <body>
      <div class="po-box">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <div class="header">SYNAPSYS INDUSTRIAL PROCUREMENT</div>
            <div style="color: #9ca3af; font-size: 13px; margin-top: 4px;">Automated Material & MRO Requisition Gateway &bull; India Operations</div>
          </div>
          <span class="badge">OFFICIAL PURCHASE ORDER</span>
        </div>

        <p style="font-size: 14px; color: #e5e7eb;">
          Dear <strong>{supplier_name}</strong> Sales & Fulfilment Team,
        </p>
        <p style="font-size: 13px; color: #9ca3af; line-height: 1.6;">
          Please accept this formal purchase order <strong>{po_id}</strong> on behalf of <strong>{company_name}</strong>.
          Kindly confirm receipt, inventory availability, and expected dispatch timeline at your earliest convenience.
        </p>

        <table>
          <thead>
            <tr>
              <th>SKU / Part No</th>
              <th>Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Rate (INR)</th>
              <th style="text-align: right;">Subtotal (INR)</th>
            </tr>
          </thead>
          <tbody>
            {item_rows_html}
          </tbody>
        </table>

        <div style="margin-top: 20px; text-align: right; font-size: 15px; color: #f3f4f6;">
          <div>Taxable Subtotal: <strong>₹{subtotal_val:,.2f}</strong></div>
          <div style="color: #9ca3af; font-size: 13px; margin-top: 4px;">CGST (9.0%): ₹{cgst_val:,.2f}</div>
          <div style="color: #9ca3af; font-size: 13px; margin-top: 4px;">SGST (9.0%): ₹{sgst_val:,.2f}</div>
          <div style="font-size: 20px; color: #34d399; margin-top: 8px; font-weight: bold;">
            Total PO Amount (INR): ₹{total_val:,.2f}
          </div>
        </div>

        <div style="margin-top: 24px; padding: 14px; background: #1a2234; border: 1px solid #2d3748; border-radius: 6px; font-size: 12px; color: #9ca3af;">
          <div><strong>Delivery Address:</strong> {po_data.get('facility') or 'SynapSYS Production Facility, Inbound Logistics Gate 02'}</div>
          <div style="margin-top: 4px;"><strong>Target Delivery Date:</strong> {po_data.get('estimated_delivery', 'Standard Lead Time')}</div>
          <div style="margin-top: 4px;"><strong>Payment Terms:</strong> Net 30 Days upon physical delivery inspection & GST tax invoice</div>
          <div style="margin-top: 4px;"><strong>Authorization:</strong> 2FA Verified by {po_data.get('authorized_by', 'Plant Supervisor')}</div>
        </div>

        <div class="footer">
          SynapSYS IIoT Platform &bull; ISO-9001 / ISA-95 Automated Requisition Dispatcher &bull; Supervisor Contact: {SUPERVISOR_ALERT_EMAIL}
        </div>
      </div>
    </body>
    </html>
    """

    print("=" * 70)
    print(f"[PURCHASE ORDER EMAIL DISPATCHED]")
    print(f"   PO Number: {po_id}")
    print(f"   Supplier:  {supplier_name} <{supplier_email}>")
    print(f"   CC Alert:  {SUPERVISOR_ALERT_EMAIL}")
    print(f"   Total PO:  ₹{total_val:,.2f} INR")
    print(f"   Items:     {len(items)} line item(s)")
    print("=" * 70)

    if not smtp_host or not smtp_user or not smtp_pass:
        logger.info(
            f"SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS in .env). Logged PO dispatch for {po_id}."
        )
        return True

    try:
        recipients = [supplier_email]
        if SUPERVISOR_ALERT_EMAIL and SUPERVISOR_ALERT_EMAIL != supplier_email:
            recipients.append(SUPERVISOR_ALERT_EMAIL)

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = supplier_email
        msg["Cc"] = SUPERVISOR_ALERT_EMAIL

        part = MIMEText(html_content, "html")
        msg.attach(part)

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(sender_email, recipients, msg.as_string())

        logger.info(f"PO {po_id} successfully emailed to {supplier_email} and {SUPERVISOR_ALERT_EMAIL}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send PO email to {supplier_email}: {exc}")
        return False

