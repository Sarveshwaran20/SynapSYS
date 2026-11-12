import React from 'react';

export interface LaurelMarkProps {
  children: React.ReactNode;
}

export const LaurelMark: React.FC<LaurelMarkProps> = React.memo(({ children }) => {
  return (
    <div className="inline-flex items-center gap-2">
      <svg
        className="w-5 h-5 text-g-blue flex-shrink-0 opacity-85"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* Left & Right Laurel Sprigs Framing Mark */}
        <path d="M9.5 19.5C6.2 17.8 4.5 14.5 4.8 10.8C5 8.5 6.1 6.5 7.7 5.2" />
        <path d="M14.5 19.5C17.8 17.8 19.5 14.5 19.2 10.8C19 8.5 17.9 6.5 16.3 5.2" />
        <path d="M5.2 13.5C6.6 13.1 7.6 12.1 7.9 10.8" />
        <path d="M5.8 9.2C7.1 9.1 8 8.3 8.4 7.1" />
        <path d="M18.8 13.5C17.4 13.1 16.4 12.1 16.1 10.8" />
        <path d="M18.2 9.2C16.9 9.1 16 8.3 15.6 7.1" />
      </svg>
      {children}
    </div>
  );
});

LaurelMark.displayName = 'LaurelMark';

