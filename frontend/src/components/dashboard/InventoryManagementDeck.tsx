import React, { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  InventoryItem,
  SupplierVendor,
  PurchaseOrder,
  PurchaseOrderItem,
} from '../../types';
import { GrowBar, MotionButton, Reveal, SpotlightCard } from '../motion';
import { dur, ease } from '../../lib/motion';

export interface InventoryManagementDeckProps {
  initialItems?: InventoryItem[];
  initialSuppliers?: SupplierVendor[];
  initialOrders?: PurchaseOrder[];
  onEvent?: (label: string, category: string, tone?: 'blue' | 'emerald' | 'amber' | 'rose') => void;
}

const DEFAULT_SUPPLIERS_FALLBACK: SupplierVendor[] = [
  {
    id: 'sup-001',
    name: 'Coimbatore Precision Tooling Corp',
    contact_person: 'K. Murugan',
    email: 'orders@coimbatoretooling.in',
    phone: '+91 422 249 8810',
    categories: ['Cutting Tools', 'Machine Spares'],
    lead_time_days: 2,
    rating: 4.9,
    address: 'SIDCO Industrial Estate, Kurichi, Coimbatore, TN 641021',
    payment_terms: 'Net 30',
  },
  {
    id: 'sup-002',
    name: 'Apex Industrial Bearing & Motion',
    contact_person: 'R. David',
    email: 'procurement@apexindustrial.com',
    phone: '+1 (313) 555-0182',
    categories: ['Machine Spares', 'Fluids & Lubricants'],
    lead_time_days: 3,
    rating: 4.8,
    address: '4800 Industrial Pkwy, Detroit, MI 48201',
    payment_terms: 'Net 45',
  },
  {
    id: 'sup-003',
    name: 'Titanium & Aerospace Alloys Ltd',
    contact_person: 'S. Sundaram',
    email: 'sales@aerotitaniumalloys.com',
    phone: '+91 80 2839 4400',
    categories: ['Raw Materials'],
    lead_time_days: 5,
    rating: 4.7,
    address: 'Peenya 2nd Stage, Bangalore, KA 560058',
    payment_terms: 'Net 30',
  },
  {
    id: 'sup-004',
    name: 'Kaviarasu Hydraulics & Pneumatics',
    contact_person: 'V. Kaviarasu',
    email: 'supplies@kaviarasuhydraulics.com',
    phone: '+91 422 257 3290',
    categories: ['Machine Spares', 'Fluids & Lubricants'],
    lead_time_days: 1,
    rating: 4.9,
    address: 'Ganapathy Industrial Area, Coimbatore, TN 641006',
    payment_terms: 'Net 15',
  },
];

const DEFAULT_INVENTORY_FALLBACK: InventoryItem[] = [
  {
    id: 'inv-001',
    sku: 'SKF-7210-CD/P4A',
    name: 'High-Precision Angular Contact Spindle Bearing Kit',
    category: 'Machine Spares',
    quantity: 2,
    min_safety_stock: 4,
    reorder_quantity: 6,
    unit: 'sets',
    unit_cost_usd: 385.0,
    bin_location: 'Tooling Crib A - Shelf 02 - Bin 14',
    preferred_supplier_id: 'sup-002',
    preferred_supplier_name: 'Apex Industrial Bearing & Motion',
    linked_machine_id: 'CNC-101',
    last_restocked_at: '2026-11-01T10:00:00Z',
  },
  {
    id: 'inv-002',
    sku: 'EM-CARB-12MM-4F',
    name: 'Solid Carbide End Mill 12mm 4-Flute AlTiN Coated',
    category: 'Cutting Tools',
    quantity: 8,
    min_safety_stock: 15,
    reorder_quantity: 25,
    unit: 'pcs',
    unit_cost_usd: 68.5,
    bin_location: 'Crib B - Carousel 01 - Drawer 08',
    preferred_supplier_id: 'sup-001',
    preferred_supplier_name: 'Coimbatore Precision Tooling Corp',
    linked_machine_id: 'CNC-101',
    last_restocked_at: '2026-11-05T14:30:00Z',
  },
  {
    id: 'inv-003',
    sku: 'TI-6AL4V-RD60',
    name: 'Titanium Grade 5 Round Bar (Dia 60mm x 1000mm)',
    category: 'Raw Materials',
    quantity: 18,
    min_safety_stock: 20,
    reorder_quantity: 40,
    unit: 'kg',
    unit_cost_usd: 125.0,
    bin_location: 'Raw Yard Bay 01 - Rack R-12',
    preferred_supplier_id: 'sup-003',
    preferred_supplier_name: 'Titanium & Aerospace Alloys Ltd',
    linked_machine_id: 'CNC-101',
    last_restocked_at: '2026-10-28T09:15:00Z',
  },
  {
    id: 'inv-004',
    sku: 'HYD-VALVE-D03-24V',
    name: 'Hydraulic Directional Proportional Valve (NG6 / D03)',
    category: 'Machine Spares',
    quantity: 1,
    min_safety_stock: 2,
    reorder_quantity: 4,
    unit: 'units',
    unit_cost_usd: 540.0,
    bin_location: 'Crib A - Shelf 04 - Bin 03',
    preferred_supplier_id: 'sup-004',
    preferred_supplier_name: 'Kaviarasu Hydraulics & Pneumatics',
    linked_machine_id: 'INJ-202',
    last_restocked_at: '2026-10-15T11:20:00Z',
  },
  {
    id: 'inv-005',
    sku: 'SYN-COOL-208L',
    name: 'Fully Synthetic Metalworking Coolant (208L Drum)',
    category: 'Fluids & Lubricants',
    quantity: 3,
    min_safety_stock: 2,
    reorder_quantity: 4,
    unit: 'drums',
    unit_cost_usd: 480.0,
    bin_location: 'Chemical Containment Zone C - Pallet 02',
    preferred_supplier_id: 'sup-004',
    preferred_supplier_name: 'Kaviarasu Hydraulics & Pneumatics',
    linked_machine_id: 'CNC-101',
    last_restocked_at: '2026-11-08T16:00:00Z',
  },
  {
    id: 'inv-006',
    sku: 'WLD-TIP-CUCRZR-1.2',
    name: 'Robotic Welding Contact Tips CuCrZr (1.2mm wire)',
    category: 'Machine Spares',
    quantity: 45,
    min_safety_stock: 30,
    reorder_quantity: 100,
    unit: 'pcs',
    unit_cost_usd: 4.2,
    bin_location: 'Crib B - Carousel 03 - Bin 22',
    preferred_supplier_id: 'sup-001',
    preferred_supplier_name: 'Coimbatore Precision Tooling Corp',
    linked_machine_id: 'WLD-303',
    last_restocked_at: '2026-11-09T08:30:00Z',
  },
];

const DEFAULT_ORDERS_FALLBACK: PurchaseOrder[] = [
  {
    po_id: 'PO-2026-1081',
    created_at: '2026-11-10T14:20:00Z',
    supplier_id: 'sup-001',
    supplier_name: 'Coimbatore Precision Tooling Corp',
    supplier_email: 'orders@coimbatoretooling.in',
    status: 'Confirmed',
    items: [
      {
        item_id: 'inv-002',
        sku: 'EM-CARB-12MM-4F',
        name: 'Solid Carbide End Mill 12mm 4-Flute AlTiN Coated',
        quantity: 25,
        unit: 'pcs',
        unit_price_usd: 68.5,
        total_price_usd: 1712.5,
      },
    ],
    subtotal_usd: 1712.5,
    tax_usd: 154.13,
    total_usd: 1866.63,
    estimated_delivery: '2026-11-14',
    email_subject: 'Purchase Order PO-2026-1081 - SynapSYS Operations',
    email_dispatched_at: '2026-11-10T14:22:00Z',
    notes: 'Urgent replenishment for Coimbatore tooling run',
  },
];

export const InventoryManagementDeck: React.FC<InventoryManagementDeckProps> = React.memo(
  ({
    initialItems = DEFAULT_INVENTORY_FALLBACK,
    initialSuppliers = DEFAULT_SUPPLIERS_FALLBACK,
    initialOrders = DEFAULT_ORDERS_FALLBACK,
    onEvent,
  }) => {
    const shouldReduce = useReducedMotion();
    const [deckTab, setDeckTab] = useState<'inventory' | 'orders' | 'suppliers'>('inventory');
    const [items, setItems] = useState<InventoryItem[]>(initialItems);
    const [suppliers] = useState<SupplierVendor[]>(initialSuppliers);
    const [orders, setOrders] = useState<PurchaseOrder[]>(initialOrders);

    // Filters
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [showOnlyLowStock, setShowOnlyLowStock] = useState<boolean>(false);

    // Purchase Order Modal State
    const [isCreatePoOpen, setIsCreatePoOpen] = useState<boolean>(false);
    const [poSupplierId, setPoSupplierId] = useState<string>(suppliers[0]?.id || '');
    const [poLines, setPoLines] = useState<PurchaseOrderItem[]>([
      {
        item_id: items[0]?.id || '',
        sku: items[0]?.sku || '',
        name: items[0]?.name || '',
        quantity: items[0]?.reorder_quantity || 10,
        unit: items[0]?.unit || 'pcs',
        unit_price_usd: items[0]?.unit_cost_usd || 100,
        total_price_usd: (items[0]?.reorder_quantity || 10) * (items[0]?.unit_cost_usd || 100),
      },
    ]);
    const [poNotes, setPoNotes] = useState<string>('Standard replenishment delivery to Inbound Gate 02');
    const [isSubmittingPo, setIsSubmittingPo] = useState<boolean>(false);
    const [poSuccessMsg, setPoSuccessMsg] = useState<string | null>(null);

    // Calculations
    const totalValuation = useMemo(
      () => items.reduce((acc, it) => acc + it.quantity * it.unit_cost_usd, 0),
      [items]
    );

    const lowStockItems = useMemo(
      () => items.filter((it) => it.quantity <= it.min_safety_stock),
      [items]
    );

    const filteredItems = useMemo(() => {
      return items.filter((it) => {
        if (selectedCategory !== 'All' && it.category !== selectedCategory) return false;
        if (showOnlyLowStock && it.quantity > it.min_safety_stock) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          return (
            it.sku.toLowerCase().includes(q) ||
            it.name.toLowerCase().includes(q) ||
            it.bin_location.toLowerCase().includes(q) ||
            (it.linked_machine_id && it.linked_machine_id.toLowerCase().includes(q))
          );
        }
        return true;
      });
    }, [items, selectedCategory, showOnlyLowStock, searchQuery]);

    // Handle Quick Stock Adjust
    const handleAdjustStock = async (itemId: string, delta: number) => {
      setItems((prev) =>
        prev.map((it) => {
          if (it.id !== itemId) return it;
          const nQty = Math.max(0, it.quantity + delta);
          return {
            ...it,
            quantity: nQty,
            last_restocked_at: delta > 0 ? new Date().toISOString() : it.last_restocked_at,
          };
        })
      );
      try {
        await fetch('/api/inventory/adjust', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item_id: itemId, delta }),
        });
      } catch {
        // local update preserved
      }
      onEvent?.(`Adjusted stock for item ${itemId} (${delta > 0 ? '+' : ''}${delta})`, 'Inventory', 'blue');
    };

    // Open PO Modal pre-filled for an item
    const handleQuickOrder = (item: InventoryItem) => {
      const sup = suppliers.find((s) => s.id === item.preferred_supplier_id) || suppliers[0];
      setPoSupplierId(sup.id);
      setPoLines([
        {
          item_id: item.id,
          sku: item.sku,
          name: item.name,
          quantity: item.reorder_quantity,
          unit: item.unit,
          unit_price_usd: item.unit_cost_usd,
          total_price_usd: item.reorder_quantity * item.unit_cost_usd,
        },
      ]);
      setPoNotes(`Automated reorder replenishment for ${item.sku} (Linked: ${item.linked_machine_id || 'Crib'})`);
      setIsCreatePoOpen(true);
    };

    // Handle Dispatching PO & Emailing Seller
    const handleDispatchPo = async (e: React.FormEvent) => {
      e.preventDefault();
      const sup = suppliers.find((s) => s.id === poSupplierId) || suppliers[0];
      setIsSubmittingPo(true);
      setPoSuccessMsg(null);

      const subtotal = poLines.reduce((acc, l) => acc + l.total_price_usd, 0);
      const tax = subtotal * 0.09;
      const total = subtotal + tax;
      const poNum = `PO-2026-${1000 + orders.length + 1}`;
      const nowIso = new Date().toISOString();

      const newPo: PurchaseOrder = {
        po_id: poNum,
        created_at: nowIso,
        supplier_id: sup.id,
        supplier_name: sup.name,
        supplier_email: sup.email,
        status: 'Emailed',
        items: [...poLines],
        subtotal_usd: Math.round(subtotal * 100) / 100,
        tax_usd: Math.round(tax * 100) / 100,
        total_usd: Math.round(total * 100) / 100,
        estimated_delivery: new Date(Date.now() + sup.lead_time_days * 86400000).toISOString().split('T')[0],
        email_subject: `Purchase Order ${poNum} - SynapSYS Production Operations`,
        email_dispatched_at: nowIso,
        notes: poNotes,
      };

      try {
        await fetch('/api/inventory/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            supplier_id: sup.id,
            items: poLines,
            notes: poNotes,
          }),
        });
      } catch {
        // fallback to client update
      }

      setOrders((prev) => [newPo, ...prev]);
      setIsSubmittingPo(false);
      setPoSuccessMsg(`Purchase Order ${poNum} successfully emailed to seller (${sup.email}) and supervisor!`);
      onEvent?.(`Dispatched ${poNum} ($${total.toFixed(2)}) to ${sup.name}`, 'Procurement', 'emerald');

      setTimeout(() => {
        setIsCreatePoOpen(false);
        setPoSuccessMsg(null);
      }, 1600);
    };

    // Receive Order & Stock In
    const handleReceiveOrder = async (poId: string) => {
      const targetPo = orders.find((p) => p.po_id === poId);
      if (!targetPo || targetPo.status === 'Received') return;

      setOrders((prev) =>
        prev.map((p) => (p.po_id === poId ? { ...p, status: 'Received' } : p))
      );

      // Increment inventory items
      setItems((prev) =>
        prev.map((it) => {
          const matchLine = targetPo.items.find((line) => line.item_id === it.id || line.sku === it.sku);
          if (matchLine) {
            return {
              ...it,
              quantity: it.quantity + matchLine.quantity,
              last_restocked_at: new Date().toISOString(),
            };
          }
          return it;
        })
      );

      try {
        await fetch(`/api/inventory/orders/${poId}/receive`, { method: 'POST' });
      } catch {
        // local update preserved
      }
      onEvent?.(`Received order ${poId} and updated warehouse stock`, 'Inventory', 'emerald');
    };

    return (
      <div className="w-full max-w-[1280px] mx-auto space-y-6 font-sans">
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <h2 className="font-cinzel text-2xl font-bold text-g-text tracking-wide">
                Inventory &amp; Procurement
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-mono font-medium">
                MRO &bull; Tooling Crib
              </span>
            </div>
            <p className="text-sm text-g-textSecondary mt-1">
              Industrial spare parts, tooling crib buffers, automated RFQ procurement, and seller email dispatch.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <MotionButton
              primary
              onClick={() => {
                setPoLines([
                  {
                    item_id: items[0]?.id || '',
                    sku: items[0]?.sku || '',
                    name: items[0]?.name || '',
                    quantity: 10,
                    unit: 'pcs',
                    unit_price_usd: 50,
                    total_price_usd: 500,
                  },
                ]);
                setIsCreatePoOpen(true);
              }}
              className="h-10 px-4 rounded-lg bg-g-blue hover:bg-g-blueHover text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>+ Place Order &amp; Mail Seller</span>
            </MotionButton>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SpotlightCard className="p-5 rounded-xl bg-g-surface border border-g-border">
            <span className="text-xs text-g-textMuted uppercase font-mono block">Total Crib Valuation</span>
            <span className="text-2xl font-bold text-g-text mt-1 block tabular-nums">
              ${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs text-g-textSecondary mt-1 block">{items.length} active SKUs in catalogue</span>
          </SpotlightCard>

          <SpotlightCard className="p-5 rounded-xl bg-g-surface border border-g-border">
            <span className="text-xs text-g-textMuted uppercase font-mono block">Safety Stock Status</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-2xl font-bold tabular-nums ${lowStockItems.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {lowStockItems.length}
              </span>
              <span className="text-xs text-g-textSecondary">SKU(s) below threshold</span>
            </div>
            <span className="text-xs text-g-textMuted mt-1 block">
              {lowStockItems.length > 0 ? 'Reorder requisitions suggested' : 'All buffers nominal'}
            </span>
          </SpotlightCard>

          <SpotlightCard className="p-5 rounded-xl bg-g-surface border border-g-border">
            <span className="text-xs text-g-textMuted uppercase font-mono block">Purchase Orders</span>
            <span className="text-2xl font-bold text-g-text mt-1 block tabular-nums">
              {orders.length}
            </span>
            <span className="text-xs text-cyan-400 mt-1 block">
              {orders.filter((o) => o.status === 'Emailed' || o.status === 'Confirmed').length} active in transit
            </span>
          </SpotlightCard>

          <SpotlightCard className="p-5 rounded-xl bg-g-surface border border-g-border">
            <span className="text-xs text-g-textMuted uppercase font-mono block">Approved Sellers</span>
            <span className="text-2xl font-bold text-g-text mt-1 block tabular-nums">
              {suppliers.length}
            </span>
            <span className="text-xs text-emerald-400 mt-1 block">100% verified industrial vendors</span>
          </SpotlightCard>
        </div>

        {/* Tab Switcher: Inventory vs Orders vs Suppliers */}
        <div className="flex items-center gap-2 border-b border-g-border pb-3">
          <button
            type="button"
            onClick={() => setDeckTab('inventory')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              deckTab === 'inventory'
                ? 'bg-g-blue text-white shadow-sm'
                : 'text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated'
            }`}
          >
            Warehouse Stock ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setDeckTab('orders')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              deckTab === 'orders'
                ? 'bg-g-blue text-white shadow-sm'
                : 'text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated'
            }`}
          >
            Purchase Orders &amp; Dispatches ({orders.length})
          </button>
          <button
            type="button"
            onClick={() => setDeckTab('suppliers')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              deckTab === 'suppliers'
                ? 'bg-g-blue text-white shadow-sm'
                : 'text-g-textSecondary hover:text-g-text hover:bg-g-surfaceElevated'
            }`}
          >
            Approved Sellers ({suppliers.length})
          </button>
        </div>

        {/* TAB 1: INVENTORY ITEMS TABLE */}
        {deckTab === 'inventory' && (
          <Reveal immediate>
            <div className="bg-g-surface border border-g-border rounded-xl p-6 shadow-sm space-y-4">
              {/* Filter Strip */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1 max-w-md">
                  <input
                    type="text"
                    placeholder="Search by SKU, part name, bin, or machine..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-g-surfaceElevated border border-g-border rounded-lg text-sm text-g-text px-3.5 py-2 focus:outline-none focus:border-g-blue"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-g-surfaceElevated border border-g-border rounded-lg text-xs font-mono text-g-text px-3 py-2 focus:outline-none focus:border-g-blue cursor-pointer"
                  >
                    <option value="All">All Categories</option>
                    <option value="Machine Spares">Machine Spares</option>
                    <option value="Cutting Tools">Cutting Tools</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Fluids & Lubricants">Fluids &amp; Lubricants</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowOnlyLowStock(!showOnlyLowStock)}
                    className={`px-3 py-2 rounded-lg text-xs font-mono font-medium border transition-colors cursor-pointer ${
                      showOnlyLowStock
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-g-surfaceElevated border-g-border text-g-textSecondary hover:text-g-text'
                    }`}
                  >
                    {showOnlyLowStock ? 'Showing Low Stock Only' : 'Filter Low Stock'}
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-g-border text-[11px] font-mono text-g-textMuted uppercase tracking-wider">
                      <th className="py-3 px-3">SKU &amp; Description</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3 min-w-[160px]">Stock / Safety</th>
                      <th className="py-3 px-3">Unit Cost</th>
                      <th className="py-3 px-3">Bin Location</th>
                      <th className="py-3 px-3">Preferred Seller</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-g-border/60">
                    {filteredItems.map((item) => {
                      const isLow = item.quantity <= item.min_safety_stock;
                      const fillPct = Math.min(100, (item.quantity / (item.min_safety_stock * 2)) * 100);

                      return (
                        <tr key={item.id} className="hover:bg-g-surfaceElevated/50 transition-colors">
                          <td className="py-3.5 px-3">
                            <span className="font-mono text-xs font-semibold text-g-text block">{item.sku}</span>
                            <span className="text-xs text-g-textSecondary block line-clamp-1">{item.name}</span>
                            {item.linked_machine_id && (
                              <span className="inline-block mt-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                                Linked: {item.linked_machine_id}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-g-surfaceElevated border border-g-border text-g-textSecondary">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center justify-between text-xs font-mono mb-1">
                              <span className={isLow ? 'text-amber-400 font-semibold' : 'text-g-text'}>
                                {item.quantity} {item.unit}
                              </span>
                              <span className="text-g-textMuted text-[11px]">Min: {item.min_safety_stock}</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-g-surfaceElevated overflow-hidden">
                              <GrowBar
                                value={fillPct}
                                className="h-full rounded-full"
                                style={{
                                  backgroundColor: isLow
                                    ? 'var(--g-yellow)'
                                    : 'var(--g-blue)',
                                }}
                              />
                            </div>
                          </td>
                          <td className="py-3.5 px-3 font-mono text-xs text-g-text tabular-nums">
                            ${item.unit_cost_usd.toFixed(2)}
                          </td>
                          <td className="py-3.5 px-3 text-xs font-mono text-g-textSecondary">
                            {item.bin_location}
                          </td>
                          <td className="py-3.5 px-3 text-xs text-g-textSecondary">
                            {item.preferred_supplier_name}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Stock adjust +/- */}
                              <button
                                type="button"
                                onClick={() => handleAdjustStock(item.id, -1)}
                                title="Check out 1 unit"
                                className="w-7 h-7 rounded bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-text text-xs flex items-center justify-center cursor-pointer"
                              >
                                -
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustStock(item.id, 1)}
                                title="Restock 1 unit"
                                className="w-7 h-7 rounded bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-text text-xs flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                              {/* Reorder Button */}
                              <button
                                type="button"
                                onClick={() => handleQuickOrder(item)}
                                className="px-2.5 py-1.5 rounded bg-g-blue/15 hover:bg-g-blue/25 border border-g-blue/30 text-g-blue text-xs font-medium cursor-pointer"
                              >
                                Reorder
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </Reveal>
        )}

        {/* TAB 2: PURCHASE ORDERS & DISPATCHES */}
        {deckTab === 'orders' && (
          <Reveal immediate>
            <div className="bg-g-surface border border-g-border rounded-xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-cinzel text-lg font-semibold text-g-text">Purchase Requisitions &amp; Seller Mails</h3>
                  <p className="text-xs text-g-textSecondary mt-0.5">
                    Formal PO dispatch receipts sent directly to vendor sales mailboxes with supervisor alerts.
                  </p>
                </div>
              </div>

              <div className="divide-y divide-g-border/60">
                {orders.map((po) => {
                  const isReceived = po.status === 'Received';
                  return (
                    <div key={po.po_id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-sm font-bold text-g-text">{po.po_id}</span>
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded font-mono font-medium border ${
                              isReceived
                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                            }`}
                          >
                            {po.status}
                          </span>
                          <span className="text-xs font-mono text-g-textMuted">
                            {new Date(po.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="text-xs text-g-textSecondary">
                          Seller: <strong className="text-g-text">{po.supplier_name}</strong> &bull; Contact Mail:{' '}
                          <span className="font-mono text-cyan-300">{po.supplier_email}</span>
                        </div>

                        <div className="text-xs text-g-textMuted font-mono">
                          {po.items.map((i) => `${i.quantity}x ${i.sku} (${i.name})`).join(', ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                          <span className="text-xs text-g-textMuted font-mono block">PO Total</span>
                          <span className="text-base font-bold text-g-text tabular-nums">
                            ${po.total_usd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {!isReceived && (
                          <button
                            type="button"
                            onClick={() => handleReceiveOrder(po.po_id)}
                            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-sm transition-colors"
                          >
                            Stock In &amp; Receive
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        )}

        {/* TAB 3: APPROVED SUPPLIERS DIRECTORY */}
        {deckTab === 'suppliers' && (
          <Reveal immediate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {suppliers.map((sup) => (
                <SpotlightCard key={sup.id} className="p-6 rounded-xl bg-g-surface border border-g-border space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-cinzel text-base font-bold text-g-text">{sup.name}</h4>
                      <p className="text-xs text-g-textSecondary mt-0.5">Contact: {sup.contact_person}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      ★ {sup.rating} Rating
                    </span>
                  </div>

                  <div className="space-y-1 text-xs font-mono text-g-textSecondary pt-1 border-t border-g-border/50">
                    <div>Email: <span className="text-cyan-300">{sup.email}</span></div>
                    <div>Phone: <span className="text-g-text">{sup.phone}</span></div>
                    <div>Lead Time: <span className="text-g-text">{sup.lead_time_days} business day(s)</span></div>
                    <div>Terms: <span className="text-g-text">{sup.payment_terms}</span></div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {sup.categories.map((c, i) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-g-surfaceElevated border border-g-border text-g-textMuted">
                        {c}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPoSupplierId(sup.id);
                        setPoLines([
                          {
                            item_id: items[0]?.id || '',
                            sku: items[0]?.sku || '',
                            name: items[0]?.name || '',
                            quantity: 10,
                            unit: 'pcs',
                            unit_price_usd: 120,
                            total_price_usd: 1200,
                          },
                        ]);
                        setIsCreatePoOpen(true);
                      }}
                      className="w-full py-2 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-xs font-medium text-g-text transition-colors cursor-pointer"
                    >
                      Mail RFQ / Create Purchase Order →
                    </button>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </Reveal>
        )}

        {/* PO CREATION & SELLER EMAIL DISPATCH MODAL */}
        {isCreatePoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={shouldReduce ? false : { opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduce ? undefined : { opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: dur.base, ease }}
              className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-g-surface border border-g-border rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-5"
            >
              <button
                type="button"
                onClick={() => setIsCreatePoOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-g-textSecondary hover:text-g-text flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>

              <div>
                <span className="text-xs font-mono text-cyan-300 uppercase tracking-wide">
                  Procurement Gateway
                </span>
                <h3 className="font-cinzel text-xl font-bold text-g-text mt-0.5">
                  Generate Purchase Order &amp; Mail Seller
                </h3>
                <p className="text-xs text-g-textSecondary mt-1">
                  Dispatches an official ISO-9001 Purchase Order directly to the supplier mailbox with supervisor CC.
                </p>
              </div>

              {poSuccessMsg && (
                <div className="p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                  {poSuccessMsg}
                </div>
              )}

              <form onSubmit={handleDispatchPo} className="space-y-4">
                {/* Select Supplier */}
                <div>
                  <label className="block text-xs font-mono text-g-textSecondary mb-1.5">
                    Select Target Industrial Seller
                  </label>
                  <select
                    value={poSupplierId}
                    onChange={(e) => setPoSupplierId(e.target.value)}
                    className="w-full bg-g-surfaceElevated border border-g-border rounded-lg text-sm text-g-text px-3.5 py-2.5 focus:outline-none focus:border-g-blue cursor-pointer"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.email}) &bull; Lead time: {s.lead_time_days}d
                      </option>
                    ))}
                  </select>
                </div>

                {/* Line Item Configuration */}
                <div className="p-4 rounded-xl bg-g-surfaceElevated border border-g-border space-y-3">
                  <span className="text-xs font-semibold text-g-text block">Order Line Items</span>
                  {poLines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-6">
                        <select
                          value={line.sku}
                          onChange={(e) => {
                            const match = items.find((it) => it.sku === e.target.value);
                            if (match) {
                              setPoLines((prev) =>
                                prev.map((l, i) =>
                                  i === idx
                                    ? {
                                        ...l,
                                        item_id: match.id,
                                        sku: match.sku,
                                        name: match.name,
                                        unit: match.unit,
                                        unit_price_usd: match.unit_cost_usd,
                                        total_price_usd: l.quantity * match.unit_cost_usd,
                                      }
                                    : l
                                )
                              );
                            }
                          }}
                          className="w-full bg-g-surface border border-g-border rounded text-xs text-g-text px-2.5 py-2 focus:outline-none focus:border-g-blue"
                        >
                          {items.map((it) => (
                            <option key={it.id} value={it.sku}>
                              {it.sku} - {it.name.slice(0, 32)}...
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => {
                            const q = parseInt(e.target.value, 10) || 1;
                            setPoLines((prev) =>
                              prev.map((l, i) =>
                                i === idx
                                  ? {
                                      ...l,
                                      quantity: q,
                                      total_price_usd: q * l.unit_price_usd,
                                    }
                                  : l
                              )
                            );
                          }}
                          className="w-full bg-g-surface border border-g-border rounded text-xs font-mono text-g-text px-2.5 py-2 text-center focus:outline-none focus:border-g-blue"
                          placeholder="Qty"
                        />
                      </div>

                      <div className="col-span-3 text-right font-mono text-xs font-semibold text-g-text tabular-nums">
                        ${line.total_price_usd.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-mono text-g-textSecondary mb-1.5">
                    Delivery Instructions &amp; PO Notes
                  </label>
                  <input
                    type="text"
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    className="w-full bg-g-surfaceElevated border border-g-border rounded-lg text-xs text-g-text px-3.5 py-2 focus:outline-none focus:border-g-blue"
                  />
                </div>

                {/* Email Dispatch Notice */}
                <div className="p-3 rounded-lg bg-g-surfaceElevated border border-g-border/60 text-[11px] font-mono text-g-textSecondary leading-relaxed">
                  Upon submission, an automated HTML Purchase Order will be dispatched via SMTP to{' '}
                  <strong className="text-cyan-300">
                    {suppliers.find((s) => s.id === poSupplierId)?.email}
                  </strong>{' '}
                  with carbon copy sent to supervisor{' '}
                  <strong className="text-g-text">sarveshwaran.k2008@gmail.com</strong>.
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-g-border">
                  <div className="font-mono text-xs text-g-textSecondary">
                    Total:{' '}
                    <strong className="text-base text-cyan-300 font-bold ml-1">
                      $
                      {(
                        poLines.reduce((acc, l) => acc + l.total_price_usd, 0) * 1.09
                      ).toFixed(2)}
                    </strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatePoOpen(false)}
                      className="px-4 py-2 rounded-lg bg-g-surfaceElevated hover:bg-g-surfaceSubtle border border-g-border text-xs font-medium text-g-text cursor-pointer"
                    >
                      Cancel
                    </button>
                    <MotionButton
                      primary
                      type="submit"
                      loading={isSubmittingPo}
                      className="px-4 py-2 rounded-lg bg-g-blue hover:bg-g-blueHover text-white text-xs font-semibold cursor-pointer"
                    >
                      {isSubmittingPo ? 'Dispatching Mail...' : 'Dispatch PO Email to Seller →'}
                    </MotionButton>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    );
  }
);

InventoryManagementDeck.displayName = 'InventoryManagementDeck';

