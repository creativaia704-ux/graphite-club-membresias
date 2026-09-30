import { describe, expect, it } from 'vitest';
import {
  applyCancel,
  cancelCheck,
  daySlots,
  membershipState,
  renewMember,
  usage,
  validateBooking,
  type Booking,
  type Member,
} from './rules';
import { buildSeed } from './seed';
import { DAY, HOUR, MIN, addDays, atTime, startOfDay, startOfWeek } from './time';

// Miércoles 30/09/2026 09:00 hora local
const NOW = new Date(2026, 8, 30, 9, 0).getTime();
const TODAY = startOfDay(NOW);
const at = (dayOffset: number, h: number, m = 0) => atTime(addDays(TODAY, dayOffset), h, m);

const member = (planId: Member['planId'], over: Partial<Member> = {}): Member => ({
  id: 'm1',
  name: 'Camilo',
  phone: '300',
  planId,
  cycleStart: at(-5, 9),
  cycleEnd: at(25, 9),
  joinedAt: at(-5, 9),
  ...over,
});

let n = 0;
const booking = (m: Member | null, serviceId: Booking['serviceId'], start: number, over: Partial<Booking> = {}): Booking => ({
  id: `b${++n}`,
  memberId: m?.id ?? null,
  customerName: 'x',
  customerPhone: 'x',
  serviceId,
  barberId: 'andres',
  start,
  end: start + 40 * MIN,
  asMember: !!m,
  status: 'confirmed',
  createdAt: NOW - DAY,
  ...over,
});

describe('usos del ciclo (criterio 1)', () => {
  it('bloquea cuando se usaron todos los servicios del plan', () => {
    const m = member('club-corte');
    const bookings = [booking(m, 'corte', at(-4, 11)), booking(m, 'corte', at(-1, 11))];
    const v = validateBooking({ member: m, serviceId: 'corte', barberId: 'any', start: at(6, 12) }, bookings, NOW);
    expect(v).toMatchObject({ ok: false, code: 'no-uses' });
  });

  it('calcula disponibles = incluidos − activas o realizadas', () => {
    const m = member('club-total');
    const bookings = [
      booking(m, 'corte-barba', at(-4, 11)), // realizada
      booking(m, 'corte-barba', at(2, 11)), // activa
      booking(m, 'corte-barba', at(-3, 11), { status: 'cancelled', refunded: true }), // devuelta
      booking(m, 'corte-barba', at(-10, 11)), // de otro ciclo
    ];
    const row = usage(m, bookings).find((r) => r.serviceId === 'corte-barba')!;
    expect(row).toMatchObject({ included: 4, used: 2, available: 2 });
  });
});

describe('límite semanal (criterio 2)', () => {
  it('no deja pasar el límite de la semana del turno', () => {
    const m = member('club-barba');
    const bookings = [booking(m, 'barba', at(1, 12))]; // jueves
    const sameWeek = validateBooking({ member: m, serviceId: 'barba', barberId: 'any', start: at(3, 12) }, bookings, NOW); // sábado
    expect(sameWeek).toMatchObject({ ok: false, code: 'weekly-limit' });
    const nextWeek = validateBooking({ member: m, serviceId: 'barba', barberId: 'any', start: at(5, 12) }, bookings, NOW); // lunes
    expect(nextWeek.ok).toBe(true);
  });

  it('la semana va de lunes a domingo', () => {
    expect(new Date(startOfWeek(NOW)).getDay()).toBe(1);
  });
});

describe('ventana de reserva (criterio 3)', () => {
  it('miembros hasta 7 días, público hasta 3', () => {
    const m = member('club-corte');
    expect(validateBooking({ member: m, serviceId: 'corte', barberId: 'any', start: at(7, 12) }, [], NOW).ok).toBe(true);
    expect(validateBooking({ member: m, serviceId: 'corte', barberId: 'any', start: at(8, 12) }, [], NOW)).toMatchObject({
      code: 'window',
    });
    expect(validateBooking({ member: null, serviceId: 'corte', barberId: 'any', start: at(3, 12) }, [], NOW).ok).toBe(true);
    expect(validateBooking({ member: null, serviceId: 'corte', barberId: 'any', start: at(4, 12) }, [], NOW)).toMatchObject({
      code: 'window',
    });
  });

  it('no permite horarios pasados ni fuera de horario', () => {
    expect(validateBooking({ member: null, serviceId: 'corte', barberId: 'any', start: at(0, 8) }, [], NOW)).toMatchObject({
      code: 'past',
    });
    expect(validateBooking({ member: null, serviceId: 'corte', barberId: 'any', start: at(1, 19, 30) }, [], NOW)).toMatchObject({
      code: 'closed',
    });
    // domingo 04/10: cierra a las 15
    expect(
      validateBooking({ member: null, serviceId: 'corte', barberId: 'any', start: at(4, 14, 30) }, [], NOW + DAY),
    ).toMatchObject({ code: 'closed' });
  });

  it('no asigna un barbero ocupado', () => {
    const busy = ['andres', 'mateo', 'julian', 'santiago'].map((id) => booking(null, 'corte', at(1, 12), { barberId: id }));
    expect(validateBooking({ member: null, serviceId: 'barba', barberId: 'any', start: at(1, 12, 30) }, busy, NOW)).toMatchObject(
      { code: 'taken' },
    );
    const slots = daySlots(at(1, 0), 'barba', 'any', busy, NOW);
    expect(slots.find((s) => s.start === at(1, 12))!.available).toBe(false);
    expect(slots.find((s) => s.start === at(1, 13))!.available).toBe(true);
  });
});

describe('cancelación (criterio 4)', () => {
  it('con más de 4 horas devuelve el uso', () => {
    const m = member('club-barba');
    const b = booking(m, 'barba', NOW + 4 * HOUR + MIN);
    expect(cancelCheck(b, NOW).refund).toBe(true);
    const cancelled = applyCancel(b, NOW);
    expect(usage(m, [cancelled])[0].used).toBe(0);
  });

  it('con 4 horas o menos no devuelve el uso', () => {
    const m = member('club-barba');
    const b = booking(m, 'barba', NOW + 4 * HOUR);
    const cancelled = applyCancel(b, NOW);
    expect(cancelled.status).toBe('cancelled');
    expect(usage(m, [cancelled])[0].used).toBe(1);
  });
});

describe('vencimiento y renovación (criterios 5 y 6)', () => {
  it('una membresía vencida no reserva como miembro', () => {
    const m = member('club-corte', { cycleStart: at(-35, 9), cycleEnd: at(-5, 9) });
    expect(membershipState(m, NOW)).toBe('expired');
    expect(validateBooking({ member: m, serviceId: 'corte', barberId: 'any', start: at(1, 12) }, [], NOW)).toMatchObject({
      ok: false,
      code: 'expired',
    });
  });

  it('no permite reservar como miembro después del fin del ciclo', () => {
    const m = member('club-corte', { cycleStart: at(-28, 9), cycleEnd: at(2, 9) });
    expect(validateBooking({ member: m, serviceId: 'corte', barberId: 'any', start: at(3, 12) }, [], NOW)).toMatchObject({
      code: 'after-cycle',
    });
  });

  it('avisa las que están por vencer', () => {
    expect(membershipState(member('club-corte', { cycleEnd: at(3, 9) }), NOW)).toBe('expiring');
    expect(membershipState(member('club-corte'), NOW)).toBe('active');
  });

  it('renovar reinicia los usos del ciclo', () => {
    const m = member('club-corte', { cycleStart: at(-35, 9), cycleEnd: at(-5, 9) });
    const bookings = [booking(m, 'corte', at(-30, 11)), booking(m, 'corte', at(-20, 11))];
    const r = renewMember(m, NOW);
    expect(membershipState(r, NOW)).toBe('active');
    expect(usage(r, bookings).map((u) => u.available)).toEqual([2, 2]);
    expect(validateBooking({ member: r, serviceId: 'corte', barberId: 'any', start: at(1, 12) }, bookings, NOW).ok).toBe(true);
  });
});

describe('datos de ejemplo', () => {
  it('no generan turnos superpuestos por barbero', () => {
    const { bookings } = buildSeed(NOW);
    for (const a of bookings)
      for (const b of bookings) if (a !== b && a.barberId === b.barberId) expect(a.start < b.end && a.end > b.start).toBe(false);
  });
});
