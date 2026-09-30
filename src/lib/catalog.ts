// Catálogo de Graphite Barber Studio: servicios, planes, barberos y horario.

export type ServiceId = 'corte' | 'barba' | 'corte-barba' | 'afeitado' | 'facial';

export interface Service {
  id: ServiceId;
  name: string;
  short: string;
  duration: number; // minutos
  price: number; // COP, precio suelto
  description: string;
  image: string;
}

const img = (id: string, w = 800) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const SERVICES: Service[] = [
  {
    id: 'corte',
    name: 'Corte de cabello',
    short: 'Corte',
    duration: 40,
    price: 35000,
    description: 'Asesoría, corte a tijera o máquina y acabado con producto.',
    image: img('1640301133857-c4bc5789c1bb'),
  },
  {
    id: 'barba',
    name: 'Arreglo de barba',
    short: 'Barba',
    duration: 25,
    price: 22000,
    description: 'Perfilado, rebaje y aceite. Toalla caliente incluida.',
    image: img('1599011176306-4a96f1516d4d'),
  },
  {
    id: 'corte-barba',
    name: 'Corte y barba',
    short: 'Corte y barba',
    duration: 60,
    price: 52000,
    description: 'El ritual completo: corte, barba y acabado en una sola visita.',
    image: img('1630827020718-3433092696e7'),
  },
  {
    id: 'afeitado',
    name: 'Afeitado clásico',
    short: 'Afeitado',
    duration: 30,
    price: 28000,
    description: 'Navaja, espuma caliente y bálsamo. A la vieja escuela.',
    image: img('1761148438883-e34e0289a214'),
  },
  {
    id: 'facial',
    name: 'Limpieza facial',
    short: 'Facial',
    duration: 30,
    price: 30000,
    description: 'Limpieza profunda, exfoliación y mascarilla hidratante.',
    image: img('1728949202477-bad2935775cb'),
  },
];

export type PlanId = 'club-barba' | 'club-corte' | 'club-total';

export interface PlanItem {
  serviceId: ServiceId;
  included: number; // usos por ciclo mensual
  weekly: number; // máximo por semana (lunes a domingo)
}

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // COP por ciclo de 30 días
  tagline: string;
  items: PlanItem[];
  featured?: boolean;
}

export const CYCLE_DAYS = 30;
export const MEMBER_WINDOW_DAYS = 7;
export const PUBLIC_WINDOW_DAYS = 3;
export const REFUND_HOURS = 4;
export const RENEWAL_ALERT_DAYS = 5;

export const PLANS: Plan[] = [
  {
    id: 'club-barba',
    name: 'Club Barba',
    price: 70000,
    tagline: 'Para quien lleva la barba como firma.',
    items: [{ serviceId: 'barba', included: 4, weekly: 1 }],
  },
  {
    id: 'club-corte',
    name: 'Club Corte',
    price: 110000,
    tagline: 'Corte cada quince días y barba siempre en su punto.',
    featured: true,
    items: [
      { serviceId: 'corte', included: 2, weekly: 1 },
      { serviceId: 'barba', included: 2, weekly: 1 },
    ],
  },
  {
    id: 'club-total',
    name: 'Club Total',
    price: 190000,
    tagline: 'El ritual completo, cada semana.',
    items: [
      { serviceId: 'corte-barba', included: 4, weekly: 1 },
      { serviceId: 'facial', included: 1, weekly: 1 },
    ],
  },
];

export interface Barber {
  id: string;
  name: string;
  role: string;
}

export const BARBERS: Barber[] = [
  { id: 'andres', name: 'Andrés Restrepo', role: 'Maestro barbero' },
  { id: 'mateo', name: 'Mateo Gaviria', role: 'Especialista en barba' },
  { id: 'julian', name: 'Julián Ospina', role: 'Fade & texturas' },
  { id: 'santiago', name: 'Santiago Vélez', role: 'Afeitado clásico' },
];

// Horario: índice = día de la semana de JS (0 = domingo)
export const HOURS: Record<number, { open: number; close: number }> = {
  0: { open: 10, close: 15 },
  1: { open: 10, close: 20 },
  2: { open: 10, close: 20 },
  3: { open: 10, close: 20 },
  4: { open: 10, close: 20 },
  5: { open: 10, close: 20 },
  6: { open: 10, close: 20 },
};

export const SLOT_STEP_MIN = 30;

export const IMAGES = {
  hero: img('1517832606299-7ae9b720a186', 1600),
  interior: img('1585747860715-2ba37e788b70', 900),
  whisky: img('1671713682331-98086e7b9804', 900),
  chair: img('1576168056582-0a851a87ab8e', 900),
};

export const serviceById = (id: ServiceId) => SERVICES.find((s) => s.id === id)!;
export const planById = (id: PlanId) => PLANS.find((p) => p.id === id)!;
export const barberById = (id: string) => BARBERS.find((b) => b.id === id)!;
