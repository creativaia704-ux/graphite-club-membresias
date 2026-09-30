// Datos de ejemplo, generados relativos a la fecha en que se abre la app por primera vez.
import { BARBERS, CYCLE_DAYS, planById, serviceById, type PlanId, type ServiceId } from './catalog';
import { barberFree, isOpenSlot, type Booking, type Member, type Payment } from './rules';
import { MIN, addDays, atTime, startOfDay } from './time';

export interface SeedData {
  members: Member[];
  bookings: Booking[];
  payments: Payment[];
}

interface MemberSeed {
  id: string;
  name: string;
  phone: string;
  planId: PlanId;
  /** inicio del ciclo actual, en días relativos a hoy */
  cycleStartDay: number;
  /** cuántos ciclos lleva en el club (para el historial de pagos) */
  cycles: number;
  bookings: [ServiceId, number, string, string?][]; // servicio, día relativo, "HH:MM", barbero preferido
}

const MEMBERS: MemberSeed[] = [
  {
    id: 'm-camilo',
    name: 'Camilo Arango',
    phone: '300 412 7788',
    planId: 'club-total',
    cycleStartDay: -12,
    cycles: 5,
    bookings: [
      ['corte-barba', -11, '11:00', 'andres'],
      ['corte-barba', -4, '18:00', 'andres'],
      ['corte-barba', 3, '17:00', 'andres'],
    ],
  },
  {
    id: 'm-sebastian',
    name: 'Sebastián Mejía',
    phone: '315 208 4410',
    planId: 'club-corte',
    cycleStartDay: -27,
    cycles: 3,
    bookings: [
      ['corte', -20, '12:00', 'julian'],
      ['barba', -13, '10:30', 'mateo'],
      ['corte', -6, '12:00', 'julian'],
    ],
  },
  {
    id: 'm-juanpablo',
    name: 'Juan Pablo Zapata',
    phone: '311 950 2231',
    planId: 'club-corte',
    cycleStartDay: -16,
    cycles: 2,
    bookings: [
      ['corte', -15, '19:00', 'julian'],
      ['corte', -8, '19:00', 'julian'],
    ],
  },
  {
    id: 'm-felipe',
    name: 'Felipe Londoño',
    phone: '320 774 1902',
    planId: 'club-barba',
    cycleStartDay: -9,
    cycles: 4,
    bookings: [
      ['barba', -8, '13:00', 'mateo'],
      ['barba', 1, '19:00', 'mateo'],
    ],
  },
  {
    id: 'm-daniel',
    name: 'Daniel Correa',
    phone: '304 561 8820',
    planId: 'club-barba',
    cycleStartDay: -33,
    cycles: 2,
    bookings: [
      ['barba', -30, '17:30', 'santiago'],
      ['barba', -23, '17:30', 'santiago'],
      ['barba', -16, '17:30', 'santiago'],
      ['barba', -9, '17:30', 'santiago'],
    ],
  },
  {
    id: 'm-alejandro',
    name: 'Alejandro Ríos',
    phone: '318 330 6674',
    planId: 'club-total',
    cycleStartDay: -3,
    cycles: 1,
    bookings: [['corte-barba', -2, '10:00', 'santiago']],
  },
  {
    id: 'm-tomas',
    name: 'Tomás Echeverri',
    phone: '301 889 0145',
    planId: 'club-corte',
    cycleStartDay: -20,
    cycles: 6,
    bookings: [
      ['corte', -18, '15:00', 'andres'],
      ['barba', -11, '15:30', 'mateo'],
      ['barba', 2, '12:30', 'mateo'],
    ],
  },
  {
    id: 'm-mauricio',
    name: 'Mauricio Duque',
    phone: '312 447 9036',
    planId: 'club-barba',
    cycleStartDay: -29,
    cycles: 3,
    bookings: [
      ['barba', -28, '11:30', 'mateo'],
      ['barba', -21, '11:30', 'mateo'],
      ['barba', -14, '11:30', 'mateo'],
      ['barba', -7, '11:30', 'mateo'],
    ],
  },
  {
    id: 'm-esteban',
    name: 'Esteban Cardona',
    phone: '317 602 5518',
    planId: 'club-total',
    cycleStartDay: -6,
    cycles: 2,
    bookings: [
      ['facial', -5, '16:00', 'santiago'],
      ['corte-barba', -5, '16:30', 'andres'],
    ],
  },
  {
    id: 'm-nicolas',
    name: 'Nicolás Uribe',
    phone: '310 225 3307',
    planId: 'club-corte',
    cycleStartDay: -40,
    cycles: 1,
    bookings: [
      ['corte', -38, '14:00', 'julian'],
      ['barba', -31, '14:00', 'mateo'],
    ],
  },
];

const PUBLIC: [string, string, ServiceId, number, string][] = [
  ['Ricardo Posada', '300 118 2290', 'corte', 0, '10:00'],
  ['Andrés Felipe Gómez', '313 402 7781', 'corte-barba', 0, '11:30'],
  ['Luis Carlos Henao', '316 905 3342', 'afeitado', 0, '15:00'],
  ['Simón Arbeláez', '305 227 6613', 'corte', 0, '17:00'],
  ['Jorge Iván Restrepo', '314 663 0098', 'barba', 1, '12:00'],
  ['Pablo Cadavid', '319 580 4471', 'corte', 1, '18:00'],
  ['Martín Salazar', '300 734 2256', 'facial', 2, '16:00'],
  ['Emilio Vásquez', '312 019 8837', 'corte-barba', 2, '19:00'],
  ['David Montoya', '321 446 1180', 'corte', 3, '10:30'],
  ['Kevin Álvarez', '301 993 5524', 'corte', -1, '11:00'],
  ['Samuel Betancur', '318 112 7760', 'barba', -1, '17:00'],
  ['Juan José Mesa', '315 870 6612', 'corte-barba', -2, '13:00'],
];

export function buildSeed(now: number): SeedData {
  const today = startOfDay(now);
  const members: Member[] = [];
  const bookings: Booking[] = [];
  const payments: Payment[] = [];
  let seq = 0;

  const place = (
    dayOffset: number,
    hhmm: string,
    serviceId: ServiceId,
    preferred: string | undefined,
  ): { start: number; end: number; barberId: string } | null => {
    const day = addDays(today, dayOffset);
    const [h, m] = hhmm.split(':').map(Number);
    const duration = serviceById(serviceId).duration;
    // Si cae fuera de horario (p. ej. domingo por la tarde) se corre a la mañana.
    const candidates = [atTime(day, h, m), atTime(day, 11, 0), atTime(day, 12, 0), atTime(day, 13, 0)];
    const order = [preferred, ...BARBERS.map((b) => b.id)].filter(Boolean) as string[];
    for (const start of candidates) {
      if (!isOpenSlot(start, duration)) continue;
      const end = start + duration * MIN;
      const barberId = order.find((id) => barberFree(id, start, end, bookings));
      if (barberId) return { start, end, barberId };
    }
    return null;
  };

  for (const s of MEMBERS) {
    const cycleStart = atTime(addDays(today, s.cycleStartDay), 9, 30);
    const joinedAt = addDays(cycleStart, -CYCLE_DAYS * (s.cycles - 1));
    members.push({
      id: s.id,
      name: s.name,
      phone: s.phone,
      planId: s.planId,
      cycleStart,
      cycleEnd: addDays(cycleStart, CYCLE_DAYS),
      joinedAt,
    });
    for (let c = 0; c < s.cycles; c++) {
      payments.push({
        id: `p-${s.id}-${c}`,
        memberId: s.id,
        planId: s.planId,
        amount: planById(s.planId).price,
        at: addDays(joinedAt, CYCLE_DAYS * c),
        kind: c === 0 ? 'alta' : 'renovacion',
      });
    }
    for (const [serviceId, day, hhmm, barber] of s.bookings) {
      const slot = place(day, hhmm, serviceId, barber);
      if (!slot) continue;
      bookings.push({
        id: `b-seed-${++seq}`,
        memberId: s.id,
        customerName: s.name,
        customerPhone: s.phone,
        serviceId,
        ...slot,
        asMember: true,
        status: 'confirmed',
        createdAt: slot.start - 3 * 24 * 60 * MIN,
      });
    }
  }

  for (const [name, phone, serviceId, day, hhmm] of PUBLIC) {
    const slot = place(day, hhmm, serviceId, undefined);
    if (!slot) continue;
    bookings.push({
      id: `b-seed-${++seq}`,
      memberId: null,
      customerName: name,
      customerPhone: phone,
      serviceId,
      ...slot,
      asMember: false,
      status: 'confirmed',
      createdAt: slot.start - 2 * 24 * 60 * MIN,
    });
  }

  return { members, bookings, payments };
}
