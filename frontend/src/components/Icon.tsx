import React from 'react';

const paths: Record<string, string> = {
  home: 'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
  users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M17 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87',
  plus: 'M12 5v14M5 12h14',
  clock: 'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  mail: 'M3 5h18v14H3zM3 5l9 7 9-7',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  message: 'M21 4H3v13h5l4 4 4-4h5zM7 8h10M7 12h6',
  chart: 'M4 3v17h17M8 15v-4M13 15V7M18 15V5',
  document: 'M5 3h10l4 4v14H5zM14 3v5h5M9 12h6M9 16h6',
  search: 'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  chevron: 'm9 5 7 7-7 7',
  refresh: 'M20 7a9 9 0 1 0 1 9M20 3v5h-5',
};
export default function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name] ?? paths.grid} /></svg>;
}
