// Iconos de trazo fino (24×24, stroke = currentColor).
const PATHS: Record<string, string> = {
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  check: 'M5 12.5l4.5 4.5L19 7',
  x: 'M6 6l12 12M18 6L6 18',
  menu: 'M4 7h16M4 12h16M4 17h16',
  plus: 'M12 5v14M5 12h14',
  play: 'M9 7.5v9l7.5-4.5z',
  lock: 'M7 11V8a5 5 0 0110 0v3M5.5 11h13v9h-13z',
  clock: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7.5V12l3 2',
  calendar: 'M4 6.5h16V20H4zM4 10.5h16M8.5 3.5v5M15.5 3.5v5M8 14h2M11.5 14h2M15 14h1.5M8 17h2M11.5 17h2',
  chart: 'M4 20h16M7 17v-5M11 17V8M15 17v-7M19 17V5',
  bell: 'M6 16.5V11a6 6 0 0112 0v5.5l1.5 1.5h-15zM10 20.5a2 2 0 004 0',
  crown: 'M4 18h16M4.5 15.5L3 7l5 3.5L12 5l4 5.5L21 7l-1.5 8.5z',
  diamond: 'M7 4h10l4 5-9 11L3 9zM3 9h18M9.5 4L8 9l4 11M14.5 4L16 9l-4 11',
  scissors: 'M6.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM6.5 20a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM8.6 7.6L20 17M8.6 16.4L20 7',
  razor: 'M3 14.5L14.5 3l3 3L6 17.5zM6 17.5l2.5 2.5M15.5 12.5l5 5-2.5 2.5-5-5',
  beard: 'M5 5c0 7 2 13 7 15 5-2 7-8 7-15M8.5 12.5c1.2 1 2.2 1.4 3.5 1.4s2.3-.4 3.5-1.4M10.5 17h3',
  face: 'M12 3.5c-4 0-6.5 3-6.5 7.5 0 5 3 9.5 6.5 9.5s6.5-4.5 6.5-9.5c0-4.5-2.5-7.5-6.5-7.5zM9.5 10.5h.01M14.5 10.5h.01M10 15c1.2.8 2.8.8 4 0M4 8.5l2 .5M20 8.5l-2 .5',
  combo:
    'M5.5 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM5.5 14a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM7.5 6.5l6 4M7.5 10.5l6-4M13 14c0 3.5 1.5 6 4 7 2.5-1 4-3.5 4-7',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6',
  users:
    'M9 11.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20c.8-3.6 3.3-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.8a3.5 3.5 0 010 6.4M18 14.8c1.8.8 3 2.5 3.5 5.2',
  pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0114 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  instagram:
    'M7 3.5h10A3.5 3.5 0 0120.5 7v10a3.5 3.5 0 01-3.5 3.5H7A3.5 3.5 0 013.5 17V7A3.5 3.5 0 017 3.5zM12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM17.2 6.8h.01',
  card: 'M3.5 6h17v12h-17zM3.5 10h17M7 14.5h4',
  refresh: 'M19.5 12a7.5 7.5 0 11-2.2-5.3M19.5 4.5v4h-4',
  glass: 'M6 4h12l-1.5 15.5h-9zM6.7 11h10.6',
  spark: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10',
  info: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 11v5.5M12 7.5h.01',
  alert: 'M12 4l9 16H3zM12 10v4.5M12 17.5h.01',
  settings:
    'M12 15a3 3 0 100-6 3 3 0 000 6zM19 12l2-1.5-2-3.5-2.4.6a7 7 0 00-1.7-1L14.5 4h-5l-.4 2.6a7 7 0 00-1.7 1L5 7 3 10.5 5 12l-2 1.5L5 17l2.4-.6a7 7 0 001.7 1l.4 2.6h5l.4-2.6a7 7 0 001.7-1L19 17l2-3.5z',
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export const SERVICE_ICON: Record<string, IconName> = {
  corte: 'scissors',
  barba: 'beard',
  'corte-barba': 'combo',
  afeitado: 'razor',
  facial: 'face',
};
