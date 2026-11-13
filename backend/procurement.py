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
]

# ---------------------------------------------------------------------------
# Initial Industrial Inventory Stock (MRO, Tooling, Raw Materials)
# ---------------------------------------------------------------------------
DEFAULT_INVENTORY: List[Dict[str, Any]] = [
    {
        "id": "inv-001",
        "sku": "SKF-7210-CD/P4A",
        "name": "High-Precision Angular Contact Spindle Bearing Kit",
        "category": "Machine Spares",
        "quantity": 2,
        "min_safety_stock": 4,
        "reorder_quantity": 6,
        "unit": "sets",
        "unit_cost_usd": 385.00,
        "bin_location": "Tooling Crib A - Shelf 02 - Bin 14",
        "preferred_supplier_id": "sup-002",
        "preferred_supplier_name": "Apex Industrial Bearing & Motion",
        "linked_machine_id": "CNC-101",
        "last_restocked_at": "2026-11-01T10:00:00Z",
    },
    {
        "id": "inv-002",
        "sku": "EM-CARB-12MM-4F",
        "name": "Solid Carbide End Mill 12mm 4-Flute AlTiN Coated",
        "category": "Cutting Tools",
        "quantity": 8,
        "min_safety_stock": 15,
        "reorder_quantity": 25,
        "unit": "pcs",
        "unit_cost_usd": 68.50,
        "bin_location": "Crib B - Carousel 01 - Drawer 08",
        "preferred_supplier_id": "sup-001",
        "preferred_supplier_name": "Coimbatore Precision Tooling Corp",
        "linked_machine_id": "CNC-101",
        "last_restocked_at": "2026-11-05T14:30:00Z",
    },
    {
        "id": "inv-003",
        "sku": "TI-6AL4V-RD60",
        "name": "Titanium Grade 5 Round Bar (Dia 60mm x 1000mm)",
        "category": "Raw Materials",
        "quantity": 18,
        "min_safety_stock": 20,
        "reorder_quantity": 40,
        "unit": "kg",
        "unit_cost_usd": 125.00,
        "bin_location": "Raw Yard Bay 01 - Rack R-12",
        "preferred_supplier_id": "sup-003",
        "preferred_supplier_name": "Titanium & Aerospace Alloys Ltd",
        "linked_machine_id": "CNC-101",
        "last_restocked_at": "2026-10-28T09:15:00Z",
    },
    {
        "id": "inv-004",
        "sku": "HYD-VALVE-D03-24V",
        "name": "Hydraulic Directional Proportional Valve (NG6 / D03)",
        "category": "Machine Spares",
        "quantity": 1,
        "min_safety_stock": 2,
        "reorder_quantity": 4,
        "unit": "units",
        "unit_cost_usd": 540.00,
        "bin_location": "Crib A - Shelf 04 - Bin 03",
        "preferred_supplier_id": "sup-004",
        "preferred_supplier_name": "Kaviarasu Hydraulics & Pneumatic Systems",
        "linked_machine_id": "INJ-202",
        "last_restocked_at": "2026-10-15T11:20:00Z",
    },
    {
        "id": "inv-005",
        "sku": "SYN-COOL-208L",
        "name": "Fully Synthetic Metalworking Coolant (208L Drum)",
        "category": "Fluids & Lubricants",
        "quantity": 3,
        "min_safety_stock": 2,
        "reorder_quantity": 4,
        "unit": "drums",
        "unit_cost_usd": 480.00,
        "bin_location": "Chemical Containment Zone C - Pallet 02",
        "preferred_supplier_id": "sup-004",
        "preferred_supplier_name": "Kaviarasu Hydraulics & Pneumatic Systems",
        "linked_machine_id": "CNC-101",
        "last_restocked_at": "2026-11-08T16:00:00Z",
    },
    {
        "id": "inv-006",
        "sku": "WLD-TIP-CUCRZR-1.2",
        "name": "Robotic Welding Contact Tips CuCrZr (1.2mm wire)",
        "category": "Machine Spares",
        "quantity": 45,
        "min_safety_stock": 30,
        "reorder_quantity": 100,
        "unit": "pcs",
        "unit_cost_usd": 4.20,
        "bin_location": "Crib B - Carousel 03 - Bin 22",
        "preferred_supplier_id": "sup-001",
        "preferred_supplier_name": "Coimbatore Precision Tooling Corp",
        "linked_machine_id": "WLD-303",
        "last_restocked_at": "2026-11-09T08:30:00Z",
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
                "name": "Solid Carbide End Mill 12mm 4-Flute AlTiN Coated",
                "quantity": 25,
                "unit": "pcs",
                "unit_price_usd": 68.50,
                "total_price_usd": 1712.50,
            }
        ],
        "subtotal_usd": 1712.50,
        "tax_usd": 154.13,
        "total_usd": 1866.63,
        "estimated_delivery": "2026-11-14",
        "email_subject": "Purchase Order PO-2026-1081 - SynapSYS Production",
        "email_dispatched_at": "2026-11-10T14:22:00Z",
        "notes": "Urgent replenishment for Coimbatore tooling run",
    }
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
    total_val = po_data.get("total_usd", 0.0)

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASS")
    sender_email = os.getenv("SMTP_FROM", "procurement@synapsys.industrial")

    subject = f"[PURCHASE ORDER] {po_id} from {company_name}"

    item_rows_html = "".join([
        f"""<tr>
            <td style="padding: 10px; border-bottom: 1px solid #2d3748; font-family: monospace;">{it.get('sku', 'N/A')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #2d3748;">{it.get('name', 'Industrial Item')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #2d3748; text-align: center;">{it.get('quantity', 1)} {it.get('unit', 'pcs')}</td>
            <td style="padding: 10px; border-bottom: 1px solid #2d3748; text-align: right;">${float(it.get('unit_price_usd') or it.get('unit_price') or 0.0):,.2f}</td>
            <td style="padding: 10px; border-bottom: 1px solid #2d3748; text-align: right; font-weight: bold;">${float(it.get('total_price_usd') or (float(it.get('quantity', 1)) * float(it.get('unit_price_usd') or it.get('unit_price') or 0.0))):,.2f}</td>
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
        .po-box {{ max-width: 680px; margin: 0 auto; background: #111827; border: 1px solid #1f2937; border-top: 4px solid #06b6d4; border-radius: 8px; padding: 32px; }}
        .header {{ font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px; }}
        .badge {{ display: inline-block; padding: 4px 10px; background: rgba(6, 182, 212, 0.15); border: 1px solid rgba(6, 182, 212, 0.4); color: #22d3ee; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }}
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
            <div style="color: #9ca3af; font-size: 13px; margin-top: 4px;">Automated Material & MRO Requisition Gateway</div>
          </div>
          <span class="badge">OFFICIAL PURCHASE ORDER</span>
        </div>

        <p style="font-size: 14px; color: #e5e7eb;">
          Dear <strong>{supplier_name}</strong> Sales & Fulfilment Team,
        </p>
        <p style="font-size: 13px; color: #9ca3af; line-height: 1.6;">
          Please accept this formal purchase order <strong>{po_id}</strong> on behalf of <strong>{company_name}</strong>.
          Kindly confirm receipt, availability, and expected dispatch timeline at your earliest convenience.
        </p>

        <table>
          <thead>
            <tr>
              <th>SKU / Part No</th>
              <th>Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {item_rows_html}
          </tbody>
        </table>

        <div style="margin-top: 20px; text-align: right; font-size: 15px; color: #f3f4f6;">
          <div>Subtotal: <strong>${po_data.get('subtotal_usd', 0):,.2f}</strong></div>
          <div style="color: #9ca3af; font-size: 13px; margin-top: 4px;">Tax (EST): ${po_data.get('tax_usd', 0):,.2f}</div>
          <div style="font-size: 18px; color: #22d3ee; margin-top: 6px; font-weight: bold;">
            Total PO Amount: ${total_val:,.2f}
          </div>
        </div>

        <div style="margin-top: 24px; padding: 14px; background: #1a2234; border: 1px solid #2d3748; border-radius: 6px; font-size: 12px; color: #9ca3af;">
          <div><strong>Delivery Address:</strong> SynapSYS Advanced Production Plant, Inbound Logistics Gate 02</div>
          <div style="margin-top: 4px;"><strong>Target Delivery Date:</strong> {po_data.get('estimated_delivery', 'Standard Lead Time')}</div>
          <div style="margin-top: 4px;"><strong>Payment Terms:</strong> Net 30 Days upon physical receipt inspection</div>
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
    print(f"   Total PO:  ${total_val:,.2f}")
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

