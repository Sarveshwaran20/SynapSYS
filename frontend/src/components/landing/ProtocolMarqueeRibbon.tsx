import React from 'react';

const PROTOCOL_ITEMS = [
  'OPC-UA IEC 62541',
  'MQTT Sparkplug B',
  'Supabase PostgreSQL Sync',
  'Modbus TCP / RTU',
  'ISO-22400 OEE Engine',
  'ISA-18.2 Alarm Rationalization',
  'Fanuc FOCAS Bus',
  'Siemens S7-1500 PLC',
];

export const ProtocolMarqueeRibbon: React.FC = React.memo(() => (
  <div className="w-full py-3.5 border-y border-g-border bg-g-surface/70 backdrop-blur-xs overflow-hidden">
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="lp-marquee-mask overflow-hidden">
        <div className="lp-marquee-track gap-8 sm:gap-12 items-center">
          {[...PROTOCOL_ITEMS, ...PROTOCOL_ITEMS].map((item, idx) => (
            <div
              key={`${item}-${idx}`}
              className="inline-flex items-center gap-2.5 text-xs font-mono uppercase tracking-[0.1em] text-g-textSecondary shrink-0"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-g-blue" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
));

ProtocolMarqueeRibbon.displayName = 'ProtocolMarqueeRibbon';

