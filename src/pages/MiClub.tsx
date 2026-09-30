import { useEffect, useState } from 'react';
import { CYCLE_DAYS, PLANS, barberById, planById, serviceById, type PlanId } from '../lib/catalog';
import { fmtDate, fmtDateLong, fmtTime, fmtWeekday, money, plural } from '../lib/format';
import {
  bookingView,
  cancelCheck,
  daysLeft,
  membershipState,
  unitName,
  usage,
  usedInWeek,
  type Booking,
  type Member,
} from '../lib/rules';
import { actions, useNow, useProfile, useStore } from '../lib/store';
import { addDays } from '../lib/time';
import { Icon, SERVICE_ICON } from '../components/Icon';
import { ProfileBar } from '../components/ProfileBar';
import { Modal, UsageRing, initials, useToast } from '../components/ui';

export function MiClub({ params }: { params: URLSearchParams }) {
  const member = useProfile();
  return (
    <main className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">Mi club</p>
            <h1>{member ? `Hola, ${member.name.split(' ')[0]}` : 'Acceso de miembros'}</h1>
          </div>
          {member && (
            <a className="btn btn-dark" href="#/reservar">
              Reservar turno <Icon name="arrow" size={16} />
            </a>
          )}
        </div>
        <ProfileBar />
        {member ? <MemberView member={member} openRenew={params.get('renovar') === '1'} /> : <MemberPicker />}
      </div>
    </main>
  );
}

function MemberPicker() {
  const s = useStore();
  const now = useNow();
  return (
    <div className="stack">
      <div className="card">
        <div className="card-title">
          <h2>Entra a tu membresía</h2>
        </div>
        <p className="muted" style={{ fontSize: 14, marginBottom: 16 }}>
          Esta versión de demostración no pide contraseña: elige un miembro de ejemplo para ver sus usos, turnos y renovación.
        </p>
        <div className="member-pick">
          {s.members.map((m) => {
            const st = membershipState(m, now);
            return (
              <button key={m.id} className="opt" onClick={() => actions.setProfile(m.id)}>
                <span className="avatar" style={{ gridRow: 'span 2' }}>
                  {initials(m.name)}
                </span>
                <span className="opt-main">
                  <span>{m.name}</span>
                  <StatePill member={m} now={now} />
                </span>
                <span className="opt-sub">
                  {planById(m.planId).name} ·{' '}
                  {st === 'expired' ? `venció el ${fmtDate(m.cycleEnd)}` : `vence el ${fmtDate(m.cycleEnd)}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="notice">
        <Icon name="crown" />
        <div className="grow">
          <b>¿Aún no eres miembro?</b> Elige un plan y empieza a reservar con prioridad hoy mismo.
          <div className="actions">
            <a className="btn btn-dark btn-sm" href="#/unirme">
              Unirme al club
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StatePill({ member, now }: { member: Member; now: number }) {
  const st = membershipState(member, now);
  if (st === 'expired') return <span className="pill bad">Vencida</span>;
  if (st === 'expiring') {
    const d = daysLeft(member, now);
    return <span className="pill warn">{d <= 1 ? 'Vence mañana' : `Vence en ${d} días`}</span>;
  }
  return <span className="pill ok">Activa</span>;
}

function MemberView({ member, openRenew }: { member: Member; openRenew: boolean }) {
  const s = useStore();
  const now = useNow();
  const toast = useToast();
  const [renewOpen, setRenewOpen] = useState(openRenew);
  const [toCancel, setToCancel] = useState<Booking | null>(null);

  useEffect(() => setRenewOpen(openRenew), [openRenew]);

  const plan = planById(member.planId);
  const st = membershipState(member, now);
  const rows = usage(member, s.bookings);
  const left = daysLeft(member, now);
  const elapsed = Math.min(1, Math.max(0, (now - member.cycleStart) / (member.cycleEnd - member.cycleStart)));
  const mine = s.bookings.filter((b) => b.memberId === member.id);
  const upcoming = mine.filter((b) => bookingView(b, now) === 'upcoming').sort((a, b) => a.start - b.start);
  const history = mine.filter((b) => bookingView(b, now) !== 'upcoming').sort((a, b) => b.start - a.start);
  const payments = s.payments.filter((p) => p.memberId === member.id).sort((a, b) => b.at - a.at);

  return (
    <div className="stack">
      {st === 'expired' && (
        <div className="notice bad">
          <Icon name="alert" />
          <div className="grow">
            <b>Tu membresía venció el {fmtDate(member.cycleEnd)}.</b> Mientras no renueves, no puedes reservar como miembro ni
            usar la agenda prioritaria.
            <div className="actions">
              <button className="btn btn-dark btn-sm" onClick={() => setRenewOpen(true)}>
                Renovar ahora
              </button>
            </div>
          </div>
        </div>
      )}
      {st === 'expiring' && (
        <div className="notice warn">
          <Icon name="bell" />
          <div className="grow">
            <b>Tu plan vence {left <= 1 ? 'mañana' : `en ${left} días`}</b> ({fmtDateLong(member.cycleEnd)}). Renueva para
            mantener tu prioridad en la agenda; los usos que no aproveches no se acumulan.
            <div className="actions">
              <button className="btn btn-dark btn-sm" onClick={() => setRenewOpen(true)}>
                Renovar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="club-grid">
        <div className="stack">
          <div className="member-card">
            <div className="top">
              <div>
                <p className="eyebrow">Membresía</p>
                <h2>{plan.name}</h2>
                <span className="muted">{money(plan.price)} / mes</span>
              </div>
              <StatePill member={member} now={now} />
            </div>
            <div className="meta">
              <div>
                <span>Ciclo actual</span>
                <b>
                  {fmtDate(member.cycleStart)} – {fmtDate(member.cycleEnd)}
                </b>
              </div>
              <div>
                <span>{st === 'expired' ? 'Estado' : 'Quedan'}</span>
                <b>{st === 'expired' ? 'Sin renovar' : plural(left, 'día', 'días')}</b>
              </div>
            </div>
            <div className="bar" aria-hidden="true">
              <i style={{ width: `${elapsed * 100}%` }} />
            </div>
            <div className="actions">
              <a className="btn btn-gold" href="#/reservar" aria-disabled={st === 'expired'}>
                Reservar turno
              </a>
              <button className="btn btn-line on-dark" onClick={() => setRenewOpen(true)}>
                <Icon name="refresh" size={16} /> Renovar
              </button>
            </div>
          </div>

          <section className="card">
            <div className="card-title">
              <h2>Usos del ciclo</h2>
              <span className="muted" style={{ fontSize: 13 }}>
                Semana del turno: lun–dom
              </span>
            </div>
            <div className="uses">
              {rows.map((r) => {
                const week = usedInWeek(member.id, r.serviceId, now, s.bookings);
                return (
                  <div className="use" key={r.serviceId}>
                    <UsageRing available={st === 'expired' ? 0 : r.available} total={r.included} />
                    <div>
                      <h3>{serviceById(r.serviceId).name}</h3>
                      <p>
                        {st === 'expired'
                          ? 'Renueva para volver a usarlo'
                          : r.available === 0
                            ? 'Agotado en este ciclo'
                            : `${plural(r.available, 'disponible', 'disponibles')} de ${r.included}`}
                      </p>
                      <p>
                        Esta semana: {Math.min(week, r.weekly)}/{r.weekly}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
              Máximo {plan.items.map((i) => `${i.weekly} ${unitName(i.serviceId, i.weekly)}`).join(' y ')} por semana. Cancela con
              más de 4 horas y el uso vuelve.
            </p>
          </section>
        </div>

        <div className="stack">
          <section className="card">
            <div className="card-title">
              <h2>Próximos turnos</h2>
              <span className="pill gray">{upcoming.length}</span>
            </div>
            {upcoming.length === 0 ? (
              <div className="empty">
                No tienes turnos reservados.{' '}
                <a className="link" href="#/reservar">
                  Reservar
                </a>
              </div>
            ) : (
              upcoming.map((b) => <Appt key={b.id} b={b} now={now} onCancel={() => setToCancel(b)} />)
            )}
          </section>

          <section className="card">
            <div className="card-title">
              <h2>Historial</h2>
            </div>
            {history.length === 0 ? (
              <div className="empty">Aún no hay turnos anteriores.</div>
            ) : (
              history.slice(0, 8).map((b) => <Appt key={b.id} b={b} now={now} />)
            )}
          </section>

          <section className="card">
            <div className="card-title">
              <h2>Pagos</h2>
            </div>
            {payments.map((p) => (
              <div className="renew-row" key={p.id}>
                <div>
                  <b>
                    {p.kind === 'alta' ? 'Alta en el club' : 'Renovación'} · {planById(p.planId).name}
                  </b>
                  <span>{fmtDateLong(p.at)}</span>
                </div>
                <b>{money(p.amount)}</b>
              </div>
            ))}
          </section>
        </div>
      </div>

      {renewOpen && (
        <RenewModal
          member={member}
          onClose={() => setRenewOpen(false)}
          onDone={() => {
            setRenewOpen(false);
            toast('Membresía renovada: tus usos se reiniciaron');
            if (window.location.hash.includes('renovar')) window.location.hash = '/mi-club';
          }}
        />
      )}

      {toCancel && (
        <CancelModal
          b={toCancel}
          now={now}
          onClose={() => setToCancel(null)}
          onDone={(refund) => {
            setToCancel(null);
            toast(refund ? 'Turno cancelado · el uso volvió a tu plan' : 'Turno cancelado');
          }}
        />
      )}
    </div>
  );
}

function Appt({ b, now, onCancel }: { b: Booking; now: number; onCancel?: () => void }) {
  const view = bookingView(b, now);
  const svc = serviceById(b.serviceId);
  return (
    <div className="appt">
      <div className="appt-date">
        <small>{fmtWeekday(b.start)}</small>
        <b>{new Date(b.start).getDate()}</b>
      </div>
      <div className="appt-main">
        <div style={{ minWidth: 0 }}>
          <b>
            <Icon name={SERVICE_ICON[b.serviceId]} size={15} /> {svc.name}
          </b>
          <span>
            {fmtTime(b.start)} · {barberById(b.barberId).name}
            {b.asMember ? ' · uso del plan' : ` · ${money(svc.price)}`}
          </span>
        </div>
        {view === 'upcoming' && onCancel && (
          <button className="btn btn-line btn-sm" onClick={onCancel}>
            Cancelar
          </button>
        )}
        {view === 'done' && <span className="pill gray">Realizado</span>}
        {view === 'cancelled' && <span className="pill gray">{b.asMember ? 'Cancelado · uso devuelto' : 'Cancelado'}</span>}
        {view === 'cancelled-late' && <span className="pill warn">Cancelado tarde · uso descontado</span>}
      </div>
    </div>
  );
}

function CancelModal({
  b,
  now,
  onClose,
  onDone,
}: {
  b: Booking;
  now: number;
  onClose: () => void;
  onDone: (refund: boolean) => void;
}) {
  const check = cancelCheck(b, now);
  return (
    <Modal label="Cancelar turno" onClose={onClose}>
      <p className="eyebrow">Cancelar turno</p>
      <h2>{serviceById(b.serviceId).name}</h2>
      <p className="muted">
        {fmtDateLong(b.start)} · {fmtTime(b.start)} con {barberById(b.barberId).name}
      </p>
      <div className={`notice ${check.refund ? 'ok' : 'warn'}`} style={{ marginTop: 16 }}>
        <Icon name={check.refund ? 'check' : 'alert'} />
        <div className="grow">{check.message}</div>
      </div>
      <div className="actions">
        <button className="btn btn-line" onClick={onClose}>
          Mantener turno
        </button>
        <button
          className="btn btn-dark"
          disabled={!check.allowed}
          onClick={() => {
            const r = actions.cancel(b.id);
            onDone(!!r?.refund);
          }}
        >
          Cancelar turno
        </button>
      </div>
    </Modal>
  );
}

export function RenewModal({ member, onClose, onDone }: { member: Member; onClose: () => void; onDone: () => void }) {
  const now = useNow();
  const [planId, setPlanId] = useState<PlanId>(member.planId);
  const plan = planById(planId);
  return (
    <Modal label="Renovar membresía" onClose={onClose}>
      <p className="eyebrow">Renovar membresía</p>
      <h2>{member.name}</h2>
      <p className="muted" style={{ fontSize: 14 }}>
        El nuevo ciclo empieza hoy y dura {CYCLE_DAYS} días (hasta el {fmtDate(addDays(now, CYCLE_DAYS))}). Los usos se reinician
        completos.
      </p>
      <div className="plan-pick" style={{ margin: '16px 0' }}>
        {PLANS.map((p) => (
          <button
            key={p.id}
            className={`plan-opt${planId === p.id ? ' sel' : ''}`}
            onClick={() => setPlanId(p.id)}
            aria-pressed={planId === p.id}
          >
            <span className="row">
              <h3 style={{ fontSize: 18 }}>{p.name}</h3>
              <span className="price" style={{ fontSize: 18 }}>
                {money(p.price)}
              </span>
            </span>
            <p>
              {p.items.map((i) => `${i.included} ${unitName(i.serviceId, i.included)}`).join(' · ')}
              {p.id === member.planId ? ' · tu plan actual' : ''}
            </p>
          </button>
        ))}
      </div>
      <p className="muted" style={{ fontSize: 12.5 }}>
        Pago simulado para la demostración: en la barbería se cobra en efectivo, tarjeta, Nequi o transferencia.
      </p>
      <div className="actions">
        <button className="btn btn-line" onClick={onClose}>
          Ahora no
        </button>
        <button
          className="btn btn-dark"
          onClick={() => {
            actions.renew(member.id, planId);
            onDone();
          }}
        >
          Pagar {money(plan.price)} y renovar
        </button>
      </div>
    </Modal>
  );
}
