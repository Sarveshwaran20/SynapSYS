import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLoopSlot } from '../../lib/motion';

export interface PipelineLinkItem {
  id: string;
  connected: boolean;
}

export interface PipelineNodeItem {
  id: string;
  label: string;
  color?: string;
  active?: boolean;
  labelClassName?: string;
}

export interface PipelineFlowProps {
  nodes: PipelineNodeItem[];
  links: PipelineLinkItem[];
  durationSec?: number;
  className?: string;
}

const TravelingDot: React.FC<{
  travelWidth: number;
  connected: boolean;
  durationSec: number;
  delaySec: number;
}> = React.memo(({ travelWidth, connected, durationSec, delaySec }) => {
  const dotRef = useRef<HTMLSpanElement>(null);
  const canAnimate = useLoopSlot(dotRef, connected && travelWidth > 12);

  if (!connected) {
    return null;
  }

  if (!canAnimate) {
    return (
      <span
        ref={dotRef}
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none opacity-60"
        style={{ backgroundColor: 'var(--g-blue)' }}
      />
    );
  }

  return (
    <motion.span
      ref={dotRef}
      aria-hidden="true"
      className="absolute top-1/2 left-0 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none"
      style={{
        backgroundColor: 'var(--g-blue)',
        boxShadow: '0 0 8px color-mix(in srgb, var(--g-blue) 20%, transparent)',
        willChange: 'transform, opacity',
      }}
      initial={{ x: 0, opacity: 0 }}
      animate={{
        x: [0, Math.max(0, travelWidth - 6)],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration: durationSec,
        delay: delaySec,
        repeat: Infinity,
        ease: 'linear',
        times: [0, 0.08, 0.92, 1],
      }}
    />
  );
});

TravelingDot.displayName = 'TravelingDot';

const PipelineLinkSegment: React.FC<{
  link: PipelineLinkItem;
  durationSec: number;
  staggerOffsetSec: number;
}> = React.memo(({ link, durationSec, staggerOffsetSec }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(180);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    const measure = () => {
      const next = el.clientWidth;
      if (next > 0) setWidth(next);
    };

    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={trackRef}
      className="relative flex-1 h-4 flex items-center mx-1"
      aria-hidden="true"
    >
      {/* Base structural track */}
      <div
        className="w-full h-[2px] rounded-full transition-colors duration-300"
        style={{
          backgroundColor: link.connected
            ? 'color-mix(in srgb, var(--g-blue) 45%, var(--g-border))'
            : 'var(--g-border)',
          opacity: link.connected ? 0.9 : 0.45,
        }}
      />

      {/* Active streaming dot (only when connected; standby stays static) */}
      {link.connected ? (
        <TravelingDot
          travelWidth={width}
          connected={link.connected}
          durationSec={durationSec}
          delaySec={staggerOffsetSec}
        />
      ) : (
        <span
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full opacity-40"
          style={{ backgroundColor: 'var(--g-text-muted)' }}
        />
      )}
    </div>
  );
});

PipelineLinkSegment.displayName = 'PipelineLinkSegment';

export const PipelineFlow: React.FC<PipelineFlowProps> = React.memo(
  ({ nodes, links, durationSec = 2.5, className = '' }) => {
    return (
      <div className={`w-full select-none ${className}`}>
        {/* Nodes & connecting links row */}
        <div className="flex items-center w-full px-2 py-2">
          {nodes.map((node, index) => {
            const link = links[index];
            const nodeColor = node.color || 'var(--g-blue)';
            return (
              <React.Fragment key={node.id}>
                <div className="relative flex items-center justify-center shrink-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full transition-opacity duration-200"
                    style={{
                      backgroundColor: nodeColor,
                      opacity: node.active === false ? 0.45 : 1,
                    }}
                  />
                </div>
                {index < nodes.length - 1 && link && (
                  <PipelineLinkSegment
                    link={link}
                    durationSec={durationSec}
                    staggerOffsetSec={index * 0.45}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Aligned labels row */}
        <div className="flex items-center justify-between text-[11px] text-g-textSecondary px-1 mt-1 font-mono gap-2">
          {nodes.map((node, idx) => (
            <span
              key={node.id}
              className={`truncate ${
                idx === 0
                  ? 'text-left'
                  : idx === nodes.length - 1
                  ? 'text-right'
                  : 'text-center'
              } ${node.labelClassName || ''}`}
            >
              {node.label}
            </span>
          ))}
        </div>
      </div>
    );
  }
);

PipelineFlow.displayName = 'PipelineFlow';

