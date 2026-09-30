import { useEffect, useMemo, useState } from 'react';
import { BARBERS, HOURS, SERVICES, barberById, planById, serviceById, type ServiceId } from '../lib/catalog';
import { fmtDate, fmtDateLong, fmtTime, fmtWeekday, money } from '../lib/format';
import { daySlots, isActive, memberServiceCheck, planItem, usage, windowDays, type Booking } from '../lib/rules';
import { actions, useNow, useProfile, useStore } from '../lib/store';
import { addDays, atTime, startOfDay } from '../lib/time';
import { Icon, SERVICE_ICON } from '../components/Icon';
import { ProfileBar } from '../components/ProfileBar';
import { Modal, go, useToast } from '../components/ui';

export function Reservar({ params }: { params: URLSearchParams }) {
  const s = useStore();
  const now = useNow();
  const member = useProfile();
  const toast = useToast();

  const expired = !!member && !isActive(member, now);
  const clubMember = member && !expired ? member : null; // reserva con beneficios del club
  const maxDays = windowDays(!!clubMember);
  const today = startOfDay(now);

  const initialService = SERVICES.find((x) => x.id === params.get('servicio'))?.id ?? null;
  const [serviceId, setServiceId] = useState<ServiceId | null>(initialService);
  const [barberId, setBarberId] = useState<string>('any');
  const [day, setDay] = useState<number>(today);
  const [slot, setSlot] = useState<number | null>(null);
  const [name, setName] = useState(member?.name ?? '');
  const [phone, setPhone] = useState(member?.phone ?? '');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Booking | null>(null);

  // Al cambiar de perfil: datos del cliente y ventana de días.
  useEffect(() => {
    setName(member?.name ?? '');
    setPhone(member?.phone ?? '');
    setSlot(null);
    setError(null);
    if (clubMember && serviceId) {
      const item = planItem(planById(clubMember.planId), serviceId);
      const row = item && usage(clubMember, s.bookings).find((u) => u.serviceId === serviceId);
      if (row && row.available === 0) setServiceId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.profile]);

  useEffect(() => {
    if (day < today || day > addDays(today, maxDays)) setDay(today);
  }, [day, today, maxDays]);

  const usageRows = clubMember ? usage(clubMember, s.bookings) : [];

  // ---------- estado de cada servicio ----------
  const serviceInfo = (id: ServiceId) => {
    const svc = serviceById(id);
    if (!clubMember) return { disabled: false, tag: money(svc.price), cls: '' };
    const row = usageRows.find((u) => u.serviceId === id);
    if (!row) return { disabled: false, tag: `Servicio suelto · ${money(svc.price)}`, cls: '' };
    if (row.available === 0) return { disabled: true, tag: `Agotado en este ciclo (${row.used}/${row.included})`, cls: 'bad' };
    return {
      disabled: false,
      tag: `Incluido · ${row.available} de ${row.included} ${row.available === 1 ? 'disponible' : 'disponibles'}`,
      cls: 'ok',
    };
  };

  // ---------- días ----------
  const days = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => {
        const d = addDays(today, i);
        let reason: string | null = null;
        let locked = false;
        if (i > maxDays) {
          locked = true;
          reason = 'Miembros';
        } else if (serviceId) {
          const h = HOURS[new Date(d).getDay()];
          if (clubMember) {
            const check = memberServiceCheck(clubMember, serviceId, atTime(d, h.open), s.bookings, now);
            if (check && !check.ok && (check.code === 'weekly-limit' || check.code === 'after-cycle'))
              reason = check.code === 'weekly-limit' ? 'Límite semanal' : 'Fin de ciclo';
          }
          if (!reason && !daySlots(d, serviceId, barberId, s.bookings, now).some((x) => x.available)) reason = 'Completo';
        }
        return { d, i, locked, reason };
      }),
    [today, maxDays, serviceId, barberId, clubMember, s.bookings, now],
  );

  const dayInfo = days.find((x) => x.d === day);
  const dayCheck =
    clubMember && serviceId
      ? memberServiceCheck(clubMember, serviceId, atTime(day, HOURS[new Date(day).getDay()].open), s.bookings, now)
      : null;

  const slots = useMemo(() => {
    if (!serviceId) return [];
    const inPlan = clubMember && planItem(planById(clubMember.planId), serviceId);
    return daySlots(day, serviceId, barberId, s.bookings, now).map((x) =>
      inPlan && x.start >= clubMember!.cycleEnd ? { ...x, available: false } : x,
    );
  }, [day, serviceId, barberId, s.bookings, now, clubMember]);

  useEffect(() => {
    if (slot && !slots.some((x) => x.start === slot && x.available)) setSlot(null);
  }, [slots, slot]);

  // ---------- confirmar ----------
  const svc = serviceId ? serviceById(serviceId) : null;
  const inPlan = !!(clubMember && serviceId && planItem(planById(clubMember.planId), serviceId));
  const row = inPlan ? usageRows.find((u) => u.serviceId === serviceId) : null;
  const nameOk = name.trim().length >= 3;
  const phoneOk = phone.replace(/\D/g, '').length >= 7;
  const canConfirm = !!(svc && slot && nameOk && phoneOk);

  const confirm = () => {
    setTouched(true);
    if (!svc || !slot || !nameOk || !phoneOk) return;
    const res = actions.book({
      member: clubMember,
      ownerId: member?.id ?? null,
      serviceId: svc.id,
      barberId,
      start: slot,
      customerName: name.trim(),
      customerPhone: phone.trim(),
    });
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setError(null);
    setDone(res.booking!);
    setSlot(null);
    toast('Turno reservado');
  };

  return (
    <main className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">Agenda</p>
            <h1>Reservar turno</h1>
          </div>
        </div>

        <ProfileBar />

        {expired && member && (
          <div className="notice bad" style={{ marginBottom: 20 }}>
            <Icon name="alert" />
            <div className="grow">
              <b>
                Tu membresía {planById(member.planId).name} venció el {fmtDate(member.cycleEnd)}.
              </b>{' '}
              No puedes reservar como miembro: por ahora reservas como público general (precio suelto, hasta 3 días).
              <div className="actions">
                <a className="btn btn-dark btn-sm" href="#/mi-club?renovar=1">
                  Renovar membresía
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="book-grid">
          <div className="stack">
            {/* 1. servicio */}
            <section className="card">
              <h2 className="step-label">
                <i>1</i> Servicio
              </h2>
              <div className="opt-grid">
                {[...SERVICES]
                  .sort((a, b) =>
                    clubMember
                      ? +!planItem(planById(clubMember.planId), a.id) - +!planItem(planById(clubMember.planId), b.id)
                      : 0,
                  )
                  .map((x) => {
                    const info = serviceInfo(x.id);
                    return (
                      <button
                        key={x.id}
                        className={`opt${serviceId === x.id ? ' sel' : ''}`}
                        disabled={info.disabled}
                        aria-pressed={serviceId === x.id}
                        onClick={() => {
                          setServiceId(x.id);
                          setSlot(null);
                          setError(null);
                        }}
                      >
                        <span className="ic">
                          <Icon name={SERVICE_ICON[x.id]} />
                        </span>
                        <span className="opt-main">
                          <span>{x.name}</span>
                        </span>
                        <span className="opt-sub">
                          <span>{x.duration} min</span>
                          <span className={`tag ${info.cls}`}>{info.tag}</span>
                        </span>
                      </button>
                    );
                  })}
              </div>
              {clubMember && usageRows.some((u) => u.available === 0) && (
                <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
                  Los servicios agotados vuelven a estar disponibles cuando renuevas tu membresía (vence el{' '}
                  {fmtDate(clubMember.cycleEnd)}).
                </p>
              )}
            </section>

            {/* 2. barbero */}
            <section className="card">
              <h2 className="step-label">
                <i>2</i> Barbero
              </h2>
              <div className="chips">
                <button className={`chip${barberId === 'any' ? ' sel' : ''}`} onClick={() => setBarberId('any')}>
                  El primero disponible
                </button>
                {BARBERS.map((b) => (
                  <button key={b.id} className={`chip${barberId === b.id ? ' sel' : ''}`} onClick={() => setBarberId(b.id)}>
                    {b.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </section>

            {/* 3. día */}
            <section className="card">
              <h2 className="step-label">
                <i>3</i> Día
              </h2>
              <div className="days">
                {days.map(({ d, i, locked, reason }) => (
                  <button
                    key={d}
                    className={`day${day === d ? ' sel' : ''}${locked ? ' locked' : ''}`}
                    disabled={locked}
                    onClick={() => {
                      setDay(d);
                      setSlot(null);
                    }}
                    title={locked ? 'Reserva prioritaria para miembros del club' : undefined}
                  >
                    <small>{i === 0 ? 'Hoy' : fmtWeekday(d)}</small>
                    <b>{new Date(d).getDate()}</b>
                    {locked ? (
                      <em>
                        <Icon name="lock" size={10} /> {reason}
                      </em>
                    ) : (
                      reason && <em>{reason}</em>
                    )}
                  </button>
                ))}
              </div>
              {!clubMember && (
                <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
                  <Icon name="lock" size={13} /> Los días bloqueados son reserva prioritaria de los miembros del club.{' '}
                  <a href="#/unirme" className="link">
                    Unirme
                  </a>
                </p>
              )}
            </section>

            {/* 4. hora */}
            <section className="card">
              <h2 className="step-label">
                <i>4</i> Hora
              </h2>
              {!serviceId ? (
                <div className="empty">Elige un servicio para ver los horarios disponibles.</div>
              ) : dayCheck && !dayCheck.ok && dayInfo?.reason !== 'Completo' && dayCheck.code !== 'no-uses' ? (
                <div className="notice warn">
                  <Icon name="info" />
                  <div className="grow">{dayCheck.message}</div>
                </div>
              ) : (
                <>
                  <p className="muted" style={{ fontSize: 13.5, marginBottom: 12 }}>
                    {fmtDateLong(day)} · {svc!.duration} min
                  </p>
                  {slots.length === 0 ? (
                    <div className="empty">La barbería no atiende este día.</div>
                  ) : (
                    <div className="slots">
                      {slots.map((x) => (
                        <button
                          key={x.start}
                          className={`slot${slot === x.start ? ' sel' : ''}`}
                          disabled={!x.available}
                          aria-pressed={slot === x.start}
                          onClick={() => {
                            setSlot(x.start);
                            setError(null);
                          }}
                        >
                          {fmtTime(x.start)}
                        </button>
                      ))}
                    </div>
                  )}
                  {slots.length > 0 && !slots.some((x) => x.available) && (
                    <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
                      No quedan horarios para este día. Prueba con otro día u otro barbero.
                    </p>
                  )}
                </>
              )}
            </section>

            {/* 5. datos */}
            <section className="card">
              <h2 className="step-label">
                <i>5</i> Tus datos
              </h2>
              <div className="fields two">
                <div className="field">
                  <label htmlFor="bk-name">Nombre y apellido</label>
                  <input
                    id="bk-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Ej. Carlos Restrepo"
                  />
                  {touched && !nameOk && <span className="err">Escribe tu nombre.</span>}
                </div>
                <div className="field">
                  <label htmlFor="bk-phone">Celular</label>
                  <input
                    id="bk-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="300 000 0000"
                  />
                  {touched && !phoneOk && <span className="err">Escribe un celular válido.</span>}
                </div>
              </div>
            </section>
          </div>

          {/* resumen */}
          <aside className="card dark book-summary">
            <p className="eyebrow">Resumen</p>
            <h2 style={{ fontSize: 26, margin: '8px 0 18px' }}>{svc ? svc.name : 'Tu turno'}</h2>
            <ul className="summary-list">
              <li>
                <span>Día</span>
                <span>{fmtDateLong(day)}</span>
              </li>
              <li>
                <span>Hora</span>
                <span>{slot ? fmtTime(slot) : '—'}</span>
              </li>
              <li>
                <span>Barbero</span>
                <span>{barberId === 'any' ? 'El primero disponible' : barberById(barberId).name}</span>
              </li>
              <li>
                <span>Duración</span>
                <span>{svc ? `${svc.duration} min` : '—'}</span>
              </li>
              <li>
                <span>{inPlan ? 'Plan' : 'Precio'}</span>
                <span>
                  {svc ? (inPlan ? `Consume 1 uso · quedan ${row!.available - 1}` : `${money(svc.price)} en la barbería`) : '—'}
                </span>
              </li>
            </ul>
            {error && (
              <div className="notice bad" style={{ marginBottom: 14, color: 'var(--ink)' }}>
                <Icon name="alert" />
                <div className="grow">{error}</div>
              </div>
            )}
            <button className="btn btn-gold btn-block" disabled={!svc || !slot} onClick={confirm}>
              Confirmar reserva
            </button>
            {!canConfirm && svc && slot && (
              <p className="muted" style={{ fontSize: 12.5, marginTop: 10, textAlign: 'center' }}>
                Completa tu nombre y celular.
              </p>
            )}
            <p className="muted" style={{ fontSize: 12.5, marginTop: 14 }}>
              Cancela con más de 4 horas de anticipación y{inPlan ? ' el uso vuelve a tu plan.' : ' liberas el turno sin costo.'}
            </p>
          </aside>
        </div>
      </div>

      {done && (
        <Modal label="Reserva confirmada" onClose={() => setDone(null)}>
          <p className="eyebrow">Reserva confirmada</p>
          <h2>Te esperamos, {done.customerName.split(' ')[0]}</h2>
          <ul className="summary-list" style={{ marginTop: 16 }}>
            <li>
              <span>Servicio</span>
              <span>{serviceById(done.serviceId).name}</span>
            </li>
            <li>
              <span>Cuándo</span>
              <span>
                {fmtDateLong(done.start)} · {fmtTime(done.start)}
              </span>
            </li>
            <li>
              <span>Barbero</span>
              <span>{barberById(done.barberId).name}</span>
            </li>
            <li>
              <span>{done.asMember ? 'Plan' : 'Precio'}</span>
              <span>{done.asMember ? 'Se descontó 1 uso' : money(serviceById(done.serviceId).price)}</span>
            </li>
          </ul>
          <div className="actions">
            <button className="btn btn-line" onClick={() => setDone(null)}>
              Reservar otro
            </button>
            {member ? (
              <button className="btn btn-dark" onClick={() => go('/mi-club')}>
                Ver mi club
              </button>
            ) : (
              <button className="btn btn-dark" onClick={() => go('/unirme')}>
                Conocer el club
              </button>
            )}
          </div>
        </Modal>
      )}
    </main>
  );
}
