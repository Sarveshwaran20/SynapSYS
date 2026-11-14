import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { InventoryItem } from '../../../types';

export interface SmartCribMatrixProps {
  items: InventoryItem[];
  onStockAdjust: (itemId: string, delta: number) => void;
  formatCurrency: (inr: number, usd: number) => string;
}

interface CribBin {
  binCode: string;
  shelf: string;
  aisle: string;
  item?: InventoryItem;
  capacity: number;
}

export const SmartCribMatrix: React.FC<SmartCribMatrixProps> = ({
  items,
  onStockAdjust,
  formatCurrency,
}) => {
  const [selectedBin, setSelectedBin] = useState<string | null>('Bin 14');
  const [rfidLog, setRfidLog] = useState<
    Array<{ id: string; time: string; text: string; type: 'inbound' | 'outbound' }>
  >([
    {
      id: 'rfid-1',
      time: '15:24:10',
      text: 'RFID Tag #EPC-9942-SKF verified at Tooling Crib Gate 02. Requisition for CNC-101.',
      type: 'outbound',
    },
    {
      id: 'rfid-2',
      time: '14:12:05',
      text: 'Batch Receipt #EPC-8821 verified from Apex Industrial. +10 Spindle Bearings binned.',
      type: 'inbound',
    },
  ]);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerLaserColor, setScannerLaserColor] = useState<'cyan' | 'emerald'>('cyan');

  // Generate 16 physical bins mapped to items
  const bins: CribBin[] = [
    { binCode: 'Bin 14', shelf: 'Shelf 02', aisle: 'Crib 04', item: items[0], capacity: 10 },
    { binCode: 'Bin 08', shelf: 'Shelf 01', aisle: 'Crib 04', item: items[1], capacity: 60 },
    { binCode: 'Bin 03', shelf: 'Shelf 03', aisle: 'Crib 02', item: items[2], capacity: 40 },
    { binCode: 'Bin 22', shelf: 'Shelf 04', aisle: 'Crib 01', item: items[3], capacity: 15 },
    { binCode: 'Bin 05', shelf: 'Shelf 01', aisle: 'Crib 03', item: items[4], capacity: 100 },
    { binCode: 'Bin 19', shelf: 'Shelf 02', aisle: 'Crib 02', item: items[5], capacity: 50 },
    { binCode: 'Bin 01', shelf: 'Shelf 01', aisle: 'Crib 01', capacity: 20 },
    { binCode: 'Bin 02', shelf: 'Shelf 01', aisle: 'Crib 01', capacity: 20 },
    { binCode: 'Bin 07', shelf: 'Shelf 02', aisle: 'Crib 03', capacity: 30 },
    { binCode: 'Bin 09', shelf: 'Shelf 03', aisle: 'Crib 04', capacity: 25 },
    { binCode: 'Bin 11', shelf: 'Shelf 04', aisle: 'Crib 02', capacity: 15 },
    { binCode: 'Bin 12', shelf: 'Shelf 04', aisle: 'Crib 02', capacity: 15 },
    { binCode: 'Bin 16', shelf: 'Shelf 05', aisle: 'Crib 01', capacity: 40 },
    { binCode: 'Bin 17', shelf: 'Shelf 05', aisle: 'Crib 01', capacity: 40 },
    { binCode: 'Bin 20', shelf: 'Shelf 06', aisle: 'Crib 04', capacity: 50 },
    { binCode: 'Bin 24', shelf: 'Shelf 06', aisle: 'Crib 04', capacity: 50 },
  ];

  const triggerRfidScan = (type: 'inbound' | 'outbound') => {
    setIsScanning(true);
    setScannerLaserColor(type === 'inbound' ? 'emerald' : 'cyan');

    const targetItem = items[0];
    if (targetItem) {
      if (type === 'inbound') {
        onStockAdjust(targetItem.id, 5);
      } else {
        onStockAdjust(targetItem.id, -1);
      }
    }

    const now = new Date().toLocaleTimeString();
    const newLog = {
      id: `rfid-${Date.now()}`,
      time: now,
      text:
        type === 'inbound'
          ? `Inbound RFID Gate 02: Stock receipt scanned for ${targetItem?.sku || 'SKU'} (+5 pcs binned).`
          : `Floor Requisition: Line Operator scanned ${targetItem?.sku || 'SKU'} (-1 pc dispatched).`,
      type,
    };

    setTimeout(() => {
      setRfidLog((prev) => [newLog, ...prev.slice(0, 7)]);
      setIsScanning(false);
    }, 600);
  };

  const activeBinData = bins.find((b) => b.binCode === selectedBin);

  return (
    <div className="space-y-6">
      {/* Top RFID Simulation Action Bar */}
      <div className="p-4 sm:p-5 rounded-xl bg-g-surface border border-g-border flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <h3 className="text-sm font-bold text-g-text uppercase tracking-wider font-cinzel">
              Smart Storage Matrix &bull; 3D Crib Layout &amp; RFID Radar
            </h3>
          </div>
          <p className="text-xs text-g-textSecondary mt-0.5">
            Real-time physical bin mapping with simulated RFID handheld checkout and LED beacon locating.
          </p>
        </div>

        {/* RFID Quick Scan Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isScanning}
            onClick={() => triggerRfidScan('inbound')}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Scan Inbound (+5 Pcs)</span>
          </button>

          <button
            type="button"
            disabled={isScanning}
            onClick={() => triggerRfidScan('outbound')}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
            </svg>
            <span>Line Requisition (-1 Pc)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Physical Shelving Matrix + Selected Bin Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 4x4 Isometric Physical Storage Matrix */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-g-surface border border-g-border space-y-4 relative overflow-hidden">
          {/* Laser Sweep Animation Overlay */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ top: '0%', opacity: 0.9 }}
                animate={{ top: '100%', opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
                className={`absolute left-0 right-0 h-1 z-20 pointer-events-none shadow-lg ${
                  scannerLaserColor === 'emerald'
                    ? 'bg-emerald-400 shadow-emerald-400/80'
                    : 'bg-cyan-400 shadow-cyan-400/80'
                }`}
              />
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between border-b border-g-border pb-3">
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-g-text font-bold">Physical Tooling Crib 04</span>
              <span className="text-g-textMuted">&bull;</span>
              <span className="text-g-textSecondary">Aisle 02 &bull; 16 Dynamic Smart Bins</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-g-textSecondary">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Optimal Stock
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Low Buffer
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-g-textMuted/40" /> Empty / Available
              </span>
            </div>
          </div>

          {/* 4x4 Interactive Bin Cells */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {bins.map((bin) => {
              const isSelected = selectedBin === bin.binCode;
              const hasItem = Boolean(bin.item);
              const isLowStock = bin.item ? bin.item.quantity < bin.item.min_safety_stock : false;

              return (
                <motion.button
                  key={bin.binCode}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setSelectedBin(bin.binCode)}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-500/15 ring-2 ring-cyan-500/40 shadow-sm'
                      : hasItem
                      ? 'border-g-border bg-g-surfaceElevated hover:border-g-borderHover'
                      : 'border-dashed border-g-border/50 bg-g-surface/50 opacity-60'
                  }`}
                >
                  {/* Bin Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-mono font-bold text-g-text">
                      {bin.binCode}
                    </span>
                    <span className="text-[10px] font-mono text-g-textMuted">
                      {bin.shelf}
                    </span>
                  </div>

                  {hasItem && bin.item ? (
                    <div>
                      <div className="text-xs font-semibold text-g-text truncate font-sans" title={bin.item.name}>
                        {bin.item.name}
                      </div>
                      <div className="text-[10px] font-mono text-g-textMuted truncate">
                        {bin.item.sku}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs font-mono">
                        <span className={isLowStock ? 'text-amber-400 font-bold' : 'text-emerald-400 font-semibold'}>
                          {bin.item.quantity} {bin.item.unit}
                        </span>
                        <span className="text-[10px] text-g-textMuted">
                          Cap: {bin.capacity}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-[10px] font-mono text-g-textMuted">
                      Available Bin
                    </div>
                  )}

                  {/* Active LED Beacon Pulse */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 animate-ping pointer-events-none" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Bin RFID Telemetry & Audit Stream */}
        <div className="p-5 rounded-xl bg-g-surface border border-g-border space-y-4">
          <div className="border-b border-g-border pb-3">
            <h4 className="text-xs font-bold text-g-text uppercase tracking-wider font-cinzel">
              Smart Bin Inspection
            </h4>
            <span className="text-[11px] text-g-textSecondary">
              Active Selection: <strong className="text-cyan-400 font-mono">{selectedBin}</strong>
            </span>
          </div>

          {activeBinData && activeBinData.item ? (
            <div className="space-y-3 font-sans">
              <div className="p-3.5 rounded-lg bg-g-surfaceElevated border border-g-border space-y-1">
                <span className="text-[10px] font-mono text-g-textMuted uppercase tracking-wider block">
                  Stored SKU Component
                </span>
                <span className="text-xs font-bold text-g-text block leading-snug">
                  {activeBinData.item.name}
                </span>
                <span className="text-[11px] font-mono text-cyan-400 block">
                  {activeBinData.item.sku}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-g-surfaceElevated border border-g-border">
                  <span className="text-[10px] text-g-textMuted block">Current Stock</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {activeBinData.item.quantity} {activeBinData.item.unit}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-g-surfaceElevated border border-g-border">
                  <span className="text-[10px] text-g-textMuted block">Safety Buffer</span>
                  <span className="text-sm font-bold text-g-text">
                    Min: {activeBinData.item.min_safety_stock}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-g-surfaceElevated border border-g-border text-xs font-mono flex items-center justify-between">
                <span className="text-g-textMuted">Unit Rate:</span>
                <span className="font-bold text-g-text">
                  {formatCurrency(activeBinData.item.unit_cost_inr || activeBinData.item.unit_cost_usd * 86.0, activeBinData.item.unit_cost_usd)}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-xs font-mono text-g-textMuted">
              Select any occupied smart bin to inspect RFID parameters.
            </div>
          )}

          {/* Live RFID Audit Event Feed */}
          <div className="pt-2 border-t border-g-border">
            <span className="text-[10px] font-mono text-g-textMuted uppercase tracking-wider block mb-2">
              Real-Time RFID Gate Events
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {rfidLog.map((log) => (
                <div
                  key={log.id}
                  className="p-2 rounded-lg bg-g-surfaceElevated/70 border border-g-border text-[11px] space-y-0.5"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className={log.type === 'inbound' ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'}>
                      {log.type === 'inbound' ? 'INBOUND RECEIPT' : 'REQUISITION'}
                    </span>
                    <span className="text-g-textMuted">{log.time}</span>
                  </div>
                  <p className="text-g-textSecondary font-sans leading-tight">
                    {log.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartCribMatrix;
