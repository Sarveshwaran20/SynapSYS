import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { dur, ease } from '../../lib/motion';

const TableInitialMountContext = createContext<boolean>(false);

export interface MotionTableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const MotionTableBody: React.FC<MotionTableBodyProps> = React.memo(
  ({ children, className = '' }) => {
    const isInitialRef = useRef<boolean>(true);

    useEffect(() => {
      const id = requestAnimationFrame(() => {
        isInitialRef.current = false;
      });
      return () => cancelAnimationFrame(id);
    }, []);

    return (
      <TableInitialMountContext.Provider value={isInitialRef.current}>
        <tbody className={className}>{children}</tbody>
      </TableInitialMountContext.Provider>
    );
  }
);

MotionTableBody.displayName = 'MotionTableBody';

export interface MotionTableRowProps {
  index: number;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const MotionTableRow: React.FC<MotionTableRowProps> = React.memo(
  ({ index, children, className = '', onClick }) => {
    const shouldReduce = useReducedMotion();
    const isTableInitial = useContext(TableInitialMountContext);
    const animateInitialRef = useRef<boolean>(
      !shouldReduce && isTableInitial && index < 12
    );
    const [animating, setAnimating] = useState<boolean>(
      animateInitialRef.current
    );

    if (shouldReduce || !animateInitialRef.current) {
      return (
        <tr
          onClick={onClick}
          className={`transition-colors duration-[120ms] ${className}`}
        >
          {children}
        </tr>
      );
    }

    return (
      <motion.tr
        onClick={onClick}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: dur.base,
          delay: index * 0.025,
          ease,
        }}
        onAnimationComplete={() => setAnimating(false)}
        style={{ willChange: animating ? 'transform, opacity' : 'auto' }}
        className={`transition-colors duration-[120ms] ${className}`}
      >
        {children}
      </motion.tr>
    );
  }
);

MotionTableRow.displayName = 'MotionTableRow';

