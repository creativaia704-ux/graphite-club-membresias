// Estado global persistido en localStorage. Se sincroniza entre pestañas con el evento "storage".
import { useEffect, useState, useSyncExternalStore } from 'react';
import { planById, serviceById, type PlanId, type ServiceId } from './catalog';
import {
  applyCancel,
  cancelCheck,
  newCycle,
  renewMember,
  validateBooking,
  type Booking,
  type Member,
  type Payment,
  type Validation,
} from './rules';
import { buildSeed } from './seed';
import { MIN } from './time';

const KEY = 'graphite-club:v1';

export interface State {
  version: 1;
  members: Member[];
  bookings: Booking[];
  payments: Payment[];
  /** 'public' o id de miembro: con quién se está usando la app (demo sin login) */
  profile: string;
  /** desfase del reloj simulado (herramienta de pruebas del panel) */
  clockOffset: number;
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

function fresh(): State {
  return { version: 1, ...buildSeed(Date.now()), profile: 'public', clockOffset: 0 };
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.version === 1 && Array.isArray(parsed.members)) return parsed;
    }
  } catch {
    /* datos corruptos: se regeneran */
  }
  const s = fresh();
  localStorage.setItem(KEY, JSON.stringify(s));
  return s;
}

let state: State = load();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function commit(next: State) {
  state = next;
  localStorage.setItem(KEY, JSON.stringify(state));
  emit();
}

window.addEventListener('storage', (e) => {
  if (e.key === KEY) {
    state = load();
    emit();
  }
});

export const getState = () => state;
export const now = () => Date.now() + state.clockOffset;

export function useStore(): State {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

/** "Ahora" reactivo: se actualiza cada 30 s y cuando cambia el reloj simulado. */
export function useNow(): number {
  const s = useStore();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  void tick;
  return Date.now() + s.clockOffset;
}

export function useProfile(): Member | null {
  const s = useStore();
  return s.members.find((m) => m.id === s.profile) ?? null;
}

// ---------- Acciones ----------

export const actions = {
  setProfile(profile: string) {
    commit({ ...state, profile });
  },

  join(data: { name: string; phone: string; planId: PlanId }): Member {
    const t = now();
    const member: Member = { id: uid('m'), name: data.name, phone: data.phone, planId: data.planId, joinedAt: t, ...newCycle(t) };
    const payment: Payment = {
      id: uid('p'),
      memberId: member.id,
      planId: data.planId,
      amount: planById(data.planId).price,
      at: t,
      kind: 'alta',
    };
    commit({ ...state, members: [...state.members, member], payments: [...state.payments, payment], profile: member.id });
    return member;
  },

  book(req: {
    member: Member | null;
    serviceId: ServiceId;
    barberId: string | 'any';
    start: number;
    customerName: string;
    customerPhone: string;
    /** miembro dueño del turno aunque reserve como público (p. ej. membresía vencida) */
    ownerId?: string | null;
  }): Validation & { booking?: Booking } {
    const t = now();
    const v = validateBooking(req, state.bookings, t);
    if (!v.ok) return v;
    const booking: Booking = {
      id: uid('b'),
      memberId: req.member?.id ?? req.ownerId ?? null,
      customerName: req.customerName,
      customerPhone: req.customerPhone,
      serviceId: req.serviceId,
      barberId: v.barberId,
      start: req.start,
      end: req.start + serviceById(req.serviceId).duration * MIN,
      asMember: v.asMember,
      status: 'confirmed',
      createdAt: t,
    };
    commit({ ...state, bookings: [...state.bookings, booking] });
    return { ...v, booking };
  },

  cancel(bookingId: string) {
    const t = now();
    const b = state.bookings.find((x) => x.id === bookingId);
    if (!b) return null;
    const check = cancelCheck(b, t);
    if (!check.allowed) return check;
    commit({ ...state, bookings: state.bookings.map((x) => (x.id === bookingId ? applyCancel(x, t) : x)) });
    return check;
  },

  renew(memberId: string, planId?: PlanId) {
    const t = now();
    const m = state.members.find((x) => x.id === memberId);
    if (!m) return;
    const renewed = { ...renewMember(m, t), planId: planId ?? m.planId };
    const payment: Payment = {
      id: uid('p'),
      memberId,
      planId: renewed.planId,
      amount: planById(renewed.planId).price,
      at: t,
      kind: 'renovacion',
    };
    commit({
      ...state,
      members: state.members.map((x) => (x.id === memberId ? renewed : x)),
      payments: [...state.payments, payment],
    });
  },

  shiftClock(ms: number) {
    commit({ ...state, clockOffset: state.clockOffset + ms });
  },

  resetClock() {
    commit({ ...state, clockOffset: 0 });
  },

  resetData() {
    commit(fresh());
  },
};
