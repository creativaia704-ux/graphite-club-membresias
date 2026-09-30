const cop = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

export const money = (n: number) => `$${cop.format(n)}`;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '');

export const fmtDateLong = (ts: number) =>
  cap(new Date(ts).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }));

export const fmtWeekday = (ts: number) => cap(new Date(ts).toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', ''));

export const fmtTime = (ts: number) => {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const fmtDateTime = (ts: number) => `${fmtDateLong(ts)} · ${fmtTime(ts)}`;

export const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
