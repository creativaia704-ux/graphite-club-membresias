import { useMemo, useState } from 'react';
import { BARBERS, barberById, planById, serviceById } from '../lib/catalog';
import { fmtDate, fmtDateLong, fmtTime, fmtWeekday, money, plural } from '../lib/format';
import { daysLeft, isActive, membershipState, planStats, usage, type Member } from '../lib/rules';
import { actions, useNow, useStore } from '../lib/store';
import { DAY, HOUR, addDays, sameDay, startOfDay } from '../lib/time';
import { Icon } from '../components/Icon';
import { go, useToast } from '../components/ui';
import { RenewModal, StatePill } from './MiClub';

type Filter = 'all' | 'active' | 'expiring' | 'expired';

export function Panel() {
  const s = useStore();
  const now = useNow();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [renewing, setRenewing] = useState<Member | null>(null);
  const [agendaDay, setAgendaDay] = useState(0);

  const stats = planStats(s.members, s.bookings, now);
  const active = s.members.filter((m) => isActive(m, now));
  const expiring = s.members.filter((m) => membershipState(m, now) === 'expiring').sort((a, b) => a.cycleEnd - b.cycleEnd);
  const expired = s.members.filter((m) => membershipState(m, now) === 'expired').sort((a, b) => b.cycleEnd - a.cycleEnd);
  const mrr = stats.reduce((acc, p) => acc + p.revenue, 0);

  const list = s.members
    .filter((m) => filter === 'all' || membershipState(m, now) === filter || (filter === 'active' && isActive(m, now)))
    .sort((a, b) => a.cycleEnd - b.cycleEnd);

  const today = startOfDay(now);
  const day = addDays(today, agendaDay);
  const agenda = useMemo(
    () => s.bookings.filter((b) => b.status === 'confirmed' && sameDay(b.start, day)).sort((a, b) => a.start - b.start),
    [s.bookings, day],
  );

  return (
    <main className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">Graphite Barber Studio</p>
            <h1>Panel del club</h1>
          </div>
          <span className="muted" style={{ fontSize: 14 }}>
            {fmtDateLong(now)} · {fmtTime(now)}
          </span>
        </div>

        <div className="kpis">
          <div className="kpi dark">
            <span>
              <Icon name="users" size={15} /> Miembros activos
            </span>
            <b>{active.length}</b>
            <small>de {s.members.length} registrados</small>
          </div>
          <div className="kpi">
            <span>
              <Icon name="card" size={15} /> Ingreso fijo mensual
            </span>
            <b>{money(mrr)}</b>
            <small>planes activos</small>
          </div>
          <div className="kpi">
            <span>
              <Icon name="bell" size={15} /> Por vencer (≤ 5 días)
            </span>
            <b>{expiring.length}</b>
            <small>{money(expiring.reduce((a, m) => a + planById(m.planId).price, 0))} a renovar</small>
          </div>
          <div className="kpi">
            <span>
              <Icon name="alert" size={15} /> Vencidas
            </span>
            <b>{expired.length}</b>
            <small>sin renovar</small>
          </div>
        </div>

        <div className="panel-grid">
          <div className="stack">
            <section className="card">
              <div className="card-title">
                <h2>Miembros activos y usos por plan</h2>
              </div>
              {stats.map((p) => {
                const pct = p.included ? Math.round((p.used / p.included) * 100) : 0;
                return (
                  <div className="plan-stat" key={p.planId}>
                    <div className="row">
                      <h3>{planById(p.planId).name}</h3>
                      <span className="nums">
                        <b>{plural(p.active, 'miembro activo', 'miembros activos')}</b> · {money(p.revenue)}/mes
                      </span>
                    </div>
                    <div className="bar light" role="img" aria-label={`${p.used} de ${p.included} usos consumidos`}>
                      <i style={{ width: `${pct}%` }} />
                    </div>
                    <span className="nums">
                      <b>
                        {p.used} de {p.included} usos
                      </b>{' '}
                      consumidos en el ciclo ({pct}%){p.expiring ? ` · ${p.expiring} por vencer` : ''}
                    </span>
                  </div>
                );
              })}
            </section>

            <section className="card">
              <div className="card-title">
                <h2>Agenda</h2>
                <span className="pill gray">{plural(agenda.length, 'turno', 'turnos')}</span>
              </div>
              <div className="chips" style={{ marginBottom: 10 }}>
                {Array.from({ length: 8 }, (_, i) => (
                  <button
                    key={i}
                    className={`chip${agendaDay === i ? ' sel' : ''}`}
                    onClick={() => setAgendaDay(i)}
                    style={{ padding: '0 12px' }}
                  >
                    {i === 0 ? 'Hoy' : `${fmtWeekday(addDays(today, i))} ${new Date(addDays(today, i)).getDate()}`}
                  </button>
                ))}
              </div>
              {agenda.length === 0 ? (
                <div className="empty">Sin turnos este día.</div>
              ) : (
                agenda.map((b) => (
                  <div className="agenda-item" key={b.id}>
                    <time>{fmtTime(b.start)}</time>
                    <div style={{ minWidth: 0 }}>
                      <b>{b.customerName}</b>
                      <span>
                        {serviceById(b.serviceId).name} · {barberById(b.barberId).name.split(' ')[0]}
                      </span>
                    </div>
                    <span className={`pill ${b.asMember ? 'gold' : 'gray'}`}>{b.asMember ? 'Club' : 'Público'}</span>
                  </div>
                ))
              )}
              <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
                {BARBERS.length} barberos · el público ve 3 días, los miembros 7.
              </p>
            </section>
          </div>

          <div className="stack">
            <section className="card">
              <div className="card-title">
                <h2>Renovaciones</h2>
                <Icon name="bell" />
              </div>
              {expiring.length + expired.length === 0 && <div className="empty">No hay renovaciones pendientes.</div>}
              {[...expiring, ...expired].map((m) => {
                const st = membershipState(m, now);
                return (
                  <div className="renew-row" key={m.id}>
                    <div>
                      <b>{m.name}</b>
                      <span>
                        {planById(m.planId).name} ·{' '}
                        {st === 'expired'
                          ? `venció hace ${plural(Math.max(1, Math.floor((now - m.cycleEnd) / DAY)), 'día', 'días')}`
                          : daysLeft(m, now) <= 1
                            ? 'vence mañana'
                            : `vence en ${daysLeft(m, now)} días`}
                      </span>
                    </div>
                    <button className="btn btn-dark btn-sm" onClick={() => setRenewing(m)}>
                      Registrar pago
                    </button>
                  </div>
                );
              })}
            </section>

            <section className="card tools">
              <div className="card-title">
                <h2>Herramientas de prueba</h2>
                <Icon name="settings" />
              </div>
              <p className="muted" style={{ fontSize: 13.5 }}>
                Adelanta el reloj para probar vencimientos, límites semanales y cancelaciones tardías sin esperar. Reloj actual:{' '}
                <b style={{ color: 'var(--ink)' }}>
                  {fmtDateLong(now)} · {fmtTime(now)}
                </b>
              </p>
              <div className="row">
                <button className="btn btn-line btn-sm" onClick={() => actions.shiftClock(HOUR)}>
                  +1 hora
                </button>
                <button className="btn btn-line btn-sm" onClick={() => actions.shiftClock(DAY)}>
                  +1 día
                </button>
                <button className="btn btn-line btn-sm" onClick={() => actions.shiftClock(7 * DAY)}>
                  +7 días
                </button>
                <button className="btn btn-line btn-sm" disabled={s.clockOffset === 0} onClick={() => actions.resetClock()}>
                  Volver al presente
                </button>
              </div>
              <div className="row">
                <button
                  className="btn btn-dark btn-sm"
                  onClick={() => {
                    if (window.confirm('¿Borrar los cambios y volver a los datos de ejemplo?')) {
                      actions.resetData();
                      toast('Datos de ejemplo restablecidos');
                    }
                  }}
                >
                  Restablecer datos de ejemplo
                </button>
              </div>
            </section>
          </div>
        </div>
        <section className="card" style={{ marginTop: 20 }}>
          <div className="card-title">
            <h2>Miembros</h2>
          </div>
          <div className="chips" style={{ marginBottom: 12 }}>
            {(
              [
                ['all', 'Todos'],
                ['active', 'Activos'],
                ['expiring', 'Por vencer'],
                ['expired', 'Vencidos'],
              ] as [Filter, string][]
            ).map(([k, l]) => (
              <button key={k} className={`chip${filter === k ? ' sel' : ''}`} onClick={() => setFilter(k)}>
                {l}
              </button>
            ))}
          </div>
          <div className="table-wrap">
            <table className="table responsive">
              <thead>
                <tr>
                  <th>Miembro</th>
                  <th>Estado</th>
                  <th>Ciclo</th>
                  <th>Usos disponibles</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <b>{m.name}</b>
                      <span className="sub">
                        {planById(m.planId).name} · {m.phone}
                      </span>
                    </td>
                    <td>
                      <StatePill member={m} now={now} />
                    </td>
                    <td data-full>
                      <span className="sub" style={{ color: 'var(--ink)' }}>
                        {fmtDate(m.cycleStart)} – {fmtDate(m.cycleEnd)}
                      </span>
                    </td>
                    <td data-full>
                      <div className="mini-uses">
                        {isActive(m, now) ? (
                          usage(m, s.bookings).map((u) => (
                            <span key={u.serviceId}>
                              {serviceById(u.serviceId).short} {u.available}/{u.included}
                            </span>
                          ))
                        ) : (
                          <span>Sin usos · vencida</span>
                        )}
                      </div>
                    </td>
                    <td data-full>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-line btn-sm"
                          onClick={() => {
                            actions.setProfile(m.id);
                            go('/mi-club');
                          }}
                        >
                          Ver como
                        </button>
                        <button className="btn btn-dark btn-sm" onClick={() => setRenewing(m)}>
                          Renovar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && <div className="empty">No hay miembros en este filtro.</div>}
          </div>
        </section>
      </div>

      {renewing && (
        <RenewModal
          member={renewing}
          onClose={() => setRenewing(null)}
          onDone={() => {
            toast(`${renewing.name.split(' ')[0]} renovó: usos reiniciados`);
            setRenewing(null);
          }}
        />
      )}
    </main>
  );
}
