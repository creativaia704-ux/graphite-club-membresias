// Reglas del club. Funciones puras: reciben el estado y "now", no leen el reloj ni el storage.
import {
  BARBERS,
  CYCLE_DAYS,
  HOURS,
  MEMBER_WINDOW_DAYS,
  PUBLIC_WINDOW_DAYS,
  REFUND_HOURS,
  RENEWAL_ALERT_DAYS,
  SLOT_STEP_MIN,
  planById,
  serviceById,
  type Plan,
  type PlanId,
  type PlanItem,
  type ServiceId,
} from './catalog';
import { fmtDate, fmtDateLong } from './format';
import { DAY, HOUR, MIN, addDays, atTime, dayDiff, startOfDay, startOfWeek } from './time';

export interface Member {
  id: string;
  name: string;
  phone: string;
  planId: PlanId;
  cycleStart: number;
  cycleEnd: number;
  joinedAt: number;
}

export interface Booking {
  id: string;
  memberId: string | null;
  customerName: string;
  customerPhone: string;
  serviceId: ServiceId;
  barberId: string;
  start: number;
  end: number;
  /** true si la reserva consume un uso del plan */
  asMember: boolean;
  status: 'confirmed' | 'cancelled';
  createdAt: number;
  cancelledAt?: number;
  /** solo en canceladas: si se devolvió el uso */
  refunded?: boolean;
}

export interface Payment {
  id: string;
  memberId: string;
  planId: PlanId;
  amount: number;
  at: number;
  kind: 'alta' | 'renovacion';
}

// ---------- Membresía ----------

export type MembershipState = 'active' | 'expiring' | 'expired';

export const isActive = (m: Member, now: number) => now >= m.cycleStart && now < m.cycleEnd;

export function daysLeft(m: Member, now: number): number {
  return Math.max(0, Math.ceil((m.cycleEnd - now) / DAY));
}

export function membershipState(m: Member, now: number): MembershipState {
  if (!isActive(m, now)) return 'expired';
  return daysLeft(m, now) <= RENEWAL_ALERT_DAYS ? 'expiring' : 'active';
}

/** Renovar: arranca un ciclo nuevo de 30 días desde el pago y los usos vuelven a cero. */
export function renewMember(m: Member, now: number): Member {
  return { ...m, cycleStart: now, cycleEnd: addDays(now, CYCLE_DAYS) };
}

export function newCycle(now: number) {
  return { cycleStart: now, cycleEnd: addDays(now, CYCLE_DAYS) };
}

// ---------- Usos ----------

/** Una reserva consume uso si está activa/realizada o si se canceló tarde (sin devolución). */
export const consumesUse = (b: Booking) => b.asMember && (b.status === 'confirmed' || (b.status === 'cancelled' && !b.refunded));

export function planItem(plan: Plan, serviceId: ServiceId): PlanItem | undefined {
  return plan.items.find((i) => i.serviceId === serviceId);
}

export function usedInCycle(m: Member, serviceId: ServiceId, bookings: Booking[]): number {
  return bookings.filter(
    (b) => b.memberId === m.id && b.serviceId === serviceId && consumesUse(b) && b.start >= m.cycleStart && b.start < m.cycleEnd,
  ).length;
}

export interface UsageRow {
  serviceId: ServiceId;
  included: number;
  weekly: number;
  used: number;
  available: number;
}

/** Usos disponibles = incluidos − reservas activas o realizadas del ciclo. */
export function usage(m: Member, bookings: Booking[]): UsageRow[] {
  return planById(m.planId).items.map((i) => {
    const used = usedInCycle(m, i.serviceId, bookings);
    return { ...i, used, available: Math.max(0, i.included - used) };
  });
}

export function usedInWeek(memberId: string, serviceId: ServiceId, ts: number, bookings: Booking[]): number {
  const from = startOfWeek(ts);
  const to = addDays(from, 7);
  return bookings.filter(
    (b) => b.memberId === memberId && b.serviceId === serviceId && consumesUse(b) && b.start >= from && b.start < to,
  ).length;
}

// ---------- Agenda ----------

export const windowDays = (asMember: boolean) => (asMember ? MEMBER_WINDOW_DAYS : PUBLIC_WINDOW_DAYS);

export function isOpenSlot(start: number, durationMin: number): boolean {
  const h = HOURS[new Date(start).getDay()];
  if (!h) return false;
  const day = startOfDay(start);
  return start >= atTime(day, h.open) && start + durationMin * MIN <= atTime(day, h.close);
}

export function barberFree(barberId: string, start: number, end: number, bookings: Booking[]): boolean {
  return !bookings.some((b) => b.barberId === barberId && b.status === 'confirmed' && b.start < end && b.end > start);
}

export function freeBarbers(start: number, end: number, bookings: Booking[]): string[] {
  return BARBERS.filter((b) => barberFree(b.id, start, end, bookings)).map((b) => b.id);
}

export interface Slot {
  start: number;
  available: boolean;
  barbers: string[];
}

export function daySlots(day: number, serviceId: ServiceId, barberId: string | 'any', bookings: Booking[], now: number): Slot[] {
  const h = HOURS[new Date(day).getDay()];
  if (!h) return [];
  const duration = serviceById(serviceId).duration;
  const slots: Slot[] = [];
  for (let t = atTime(day, h.open); t + duration * MIN <= atTime(day, h.close); t += SLOT_STEP_MIN * MIN) {
    const end = t + duration * MIN;
    const barbers = (barberId === 'any' ? freeBarbers(t, end, bookings) : [barberId]).filter((id) =>
      barberFree(id, t, end, bookings),
    );
    slots.push({ start: t, available: t > now && barbers.length > 0, barbers });
  }
  return slots;
}

// ---------- Validación de reservas ----------

export interface BookingRequest {
  member: Member | null; // null = público general
  serviceId: ServiceId;
  barberId: string | 'any';
  start: number;
}

export type BookingError = 'expired' | 'after-cycle' | 'no-uses' | 'weekly-limit' | 'window' | 'past' | 'closed' | 'taken';

export type Validation = { ok: true; asMember: boolean; barberId: string } | { ok: false; code: BookingError; message: string };

const fail = (code: BookingError, message: string): Validation => ({ ok: false, code, message });

export const unitName = (serviceId: ServiceId, n: number) => {
  const names: Record<ServiceId, [string, string]> = {
    corte: ['corte', 'cortes'],
    barba: ['arreglo de barba', 'arreglos de barba'],
    'corte-barba': ['corte y barba', 'cortes y barba'],
    afeitado: ['afeitado', 'afeitados'],
    facial: ['limpieza facial', 'limpiezas faciales'],
  };
  return names[serviceId][n === 1 ? 0 : 1];
};

/**
 * Chequeo específico del plan (sin agenda): ¿puede este miembro usar este servicio del plan
 * para un turno en esta fecha? Se usa en el formulario y en validateBooking.
 */
export function memberServiceCheck(
  m: Member,
  serviceId: ServiceId,
  start: number,
  bookings: Booking[],
  now: number,
): Validation | null {
  if (!isActive(m, now)) {
    return fail('expired', `Tu membresía venció el ${fmtDate(m.cycleEnd)}. Renueva para volver a reservar como miembro.`);
  }
  const item = planItem(planById(m.planId), serviceId);
  if (!item) return null; // servicio fuera del plan: se reserva como servicio suelto
  if (start >= m.cycleEnd) {
    return fail(
      'after-cycle',
      `Tu ciclo termina el ${fmtDate(m.cycleEnd)}. Para reservar después de esa fecha, renueva tu membresía.`,
    );
  }
  const used = usedInCycle(m, serviceId, bookings);
  if (used >= item.included) {
    return fail(
      'no-uses',
      `Ya usaste ${item.included === 1 ? 'la' : 'los'} ${item.included} ${unitName(serviceId, item.included)} de tu plan en este ciclo. Se reinician al renovar.`,
    );
  }
  const inWeek = usedInWeek(m.id, serviceId, start, bookings);
  if (inWeek >= item.weekly) {
    return fail(
      'weekly-limit',
      `Tu plan permite ${item.weekly} ${unitName(serviceId, item.weekly)} por semana y ya tienes ${inWeek === 1 ? 'uno' : inWeek} en la semana del ${fmtDate(startOfWeek(start))}.`,
    );
  }
  return null;
}

export function validateBooking(req: BookingRequest, bookings: Booking[], now: number): Validation {
  const { member, serviceId, start } = req;
  const service = serviceById(serviceId);
  const end = start + service.duration * MIN;

  let asMember = false;
  if (member) {
    const planCheck = memberServiceCheck(member, serviceId, start, bookings, now);
    if (planCheck && !planCheck.ok) return planCheck;
    asMember = !!planItem(planById(member.planId), serviceId);
  }

  // Ventana: miembros activos 7 días, público general 3.
  const priority = !!member && isActive(member, now);
  const maxDays = windowDays(priority);
  if (start <= now) return fail('past', 'Ese horario ya pasó. Elige otro turno.');
  if (dayDiff(now, start) > maxDays) {
    return fail(
      'window',
      priority
        ? `Como miembro puedes reservar hasta ${MEMBER_WINDOW_DAYS} días adelante.`
        : `El público general reserva hasta ${PUBLIC_WINDOW_DAYS} días adelante. Los miembros del club, hasta ${MEMBER_WINDOW_DAYS}.`,
    );
  }
  if (!isOpenSlot(start, service.duration)) {
    return fail('closed', 'La barbería no atiende en ese horario.');
  }

  const candidates = req.barberId === 'any' ? BARBERS.map((b) => b.id) : [req.barberId];
  const barberId = candidates.find((id) => barberFree(id, start, end, bookings));
  if (!barberId) return fail('taken', 'Ese turno acaba de ocuparse. Elige otro horario.');

  return { ok: true, asMember, barberId };
}

// ---------- Cancelación ----------

export interface CancelCheck {
  allowed: boolean;
  refund: boolean;
  message: string;
}

export function cancelCheck(b: Booking, now: number): CancelCheck {
  if (b.status !== 'confirmed' || b.start <= now) {
    return { allowed: false, refund: false, message: 'Este turno ya no se puede cancelar.' };
  }
  const refund = b.start - now > REFUND_HOURS * HOUR;
  if (!b.asMember) return { allowed: true, refund: false, message: 'El turno se liberará para otro cliente.' };
  return refund
    ? { allowed: true, refund: true, message: `Faltan más de ${REFUND_HOURS} horas: el uso vuelve a tu plan.` }
    : {
        allowed: true,
        refund: false,
        message: `Faltan menos de ${REFUND_HOURS} horas: el turno se libera pero el uso no se devuelve.`,
      };
}

export function applyCancel(b: Booking, now: number): Booking {
  const c = cancelCheck(b, now);
  if (!c.allowed) return b;
  return { ...b, status: 'cancelled', cancelledAt: now, refunded: b.asMember ? c.refund : undefined };
}

// ---------- Estado de una reserva para mostrar ----------

export type BookingView = 'upcoming' | 'done' | 'cancelled' | 'cancelled-late';

export function bookingView(b: Booking, now: number): BookingView {
  if (b.status === 'cancelled') return b.asMember && !b.refunded ? 'cancelled-late' : 'cancelled';
  return b.end <= now ? 'done' : 'upcoming';
}

// ---------- Métricas para el panel ----------

export interface PlanStats {
  planId: PlanId;
  active: number;
  expiring: number;
  used: number;
  included: number;
  revenue: number;
}

export function planStats(members: Member[], bookings: Booking[], now: number): PlanStats[] {
  return (['club-barba', 'club-corte', 'club-total'] as PlanId[]).map((planId) => {
    const plan = planById(planId);
    const act = members.filter((m) => m.planId === planId && isActive(m, now));
    let used = 0;
    let included = 0;
    for (const m of act) {
      for (const row of usage(m, bookings)) {
        used += row.used;
        included += row.included;
      }
    }
    return {
      planId,
      active: act.length,
      expiring: act.filter((m) => membershipState(m, now) === 'expiring').length,
      used,
      included,
      revenue: act.length * plan.price,
    };
  });
}

export const describeCycle = (m: Member) => `${fmtDate(m.cycleStart)} – ${fmtDate(m.cycleEnd)}`;
export const describeDay = fmtDateLong;
