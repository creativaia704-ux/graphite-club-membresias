import { useState } from 'react';
import { CYCLE_DAYS, MEMBER_WINDOW_DAYS, PLANS, planById, type PlanId } from '../lib/catalog';
import { fmtDate, money } from '../lib/format';
import { unitName } from '../lib/rules';
import { actions, useNow } from '../lib/store';
import { addDays } from '../lib/time';
import { Icon } from '../components/Icon';
import { go, useToast } from '../components/ui';

export function Unirme({ params }: { params: URLSearchParams }) {
  const now = useNow();
  const toast = useToast();
  const initial = PLANS.find((p) => p.id === params.get('plan'))?.id ?? 'club-corte';
  const [planId, setPlanId] = useState<PlanId>(initial);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const plan = planById(planId);
  const nameOk = name.trim().length >= 3;
  const phoneOk = phone.replace(/\D/g, '').length >= 7;

  const submit = () => {
    setTouched(true);
    if (!nameOk || !phoneOk) return;
    actions.join({ name: name.trim(), phone: phone.trim(), planId });
    toast(`Bienvenido al club, ${name.trim().split(' ')[0]}`);
    go('/mi-club');
  };

  return (
    <main className="page">
      <div className="wrap">
        <div className="page-head">
          <div>
            <p className="eyebrow">Membresía</p>
            <h1>Unirme al club</h1>
          </div>
        </div>
        <div className="join-grid">
          <div className="stack">
            <section className="card">
              <h2 className="step-label">
                <i>1</i> Elige tu plan
              </h2>
              <div className="plan-pick">
                {PLANS.map((p) => (
                  <button
                    key={p.id}
                    className={`plan-opt${planId === p.id ? ' sel' : ''}`}
                    onClick={() => setPlanId(p.id)}
                    aria-pressed={planId === p.id}
                  >
                    <span className="row">
                      <h3>{p.name}</h3>
                      <span className="price">
                        {money(p.price)}
                        <small className="muted" style={{ fontSize: 12, fontFamily: 'var(--f-body)' }}>
                          {' '}
                          / mes
                        </small>
                      </span>
                    </span>
                    <p>
                      {p.items
                        .map((i) => `${i.included} ${unitName(i.serviceId, i.included)} (máx. ${i.weekly}/semana)`)
                        .join(' · ')}
                    </p>
                    {p.featured && (
                      <span className="pill gold" style={{ justifySelf: 'start' }}>
                        El más elegido
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </section>
            <section className="card">
              <h2 className="step-label">
                <i>2</i> Tus datos
              </h2>
              <div className="fields two">
                <div className="field">
                  <label htmlFor="j-name">Nombre y apellido</label>
                  <input
                    id="j-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    placeholder="Ej. Carlos Restrepo"
                  />
                  {touched && !nameOk && <span className="err">Escribe tu nombre.</span>}
                </div>
                <div className="field">
                  <label htmlFor="j-phone">Celular</label>
                  <input
                    id="j-phone"
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
          <aside className="card dark book-summary">
            <p className="eyebrow">Tu membresía</p>
            <h2 style={{ fontSize: 30, margin: '8px 0 4px', color: 'var(--gold)' }}>{plan.name}</h2>
            <p className="muted" style={{ fontSize: 14, marginBottom: 18 }}>
              {plan.tagline}
            </p>
            <ul className="summary-list">
              {plan.items.map((i) => (
                <li key={i.serviceId}>
                  <span>{unitName(i.serviceId, 2).replace(/^./, (c) => c.toUpperCase())}</span>
                  <span>
                    {i.included} al mes · {i.weekly} por semana
                  </span>
                </li>
              ))}
              <li>
                <span>Agenda</span>
                <span>Prioritaria · {MEMBER_WINDOW_DAYS} días</span>
              </li>
              <li>
                <span>Ciclo</span>
                <span>Hoy – {fmtDate(addDays(now, CYCLE_DAYS))}</span>
              </li>
              <li>
                <span>Total</span>
                <span style={{ fontSize: 18 }}>{money(plan.price)}</span>
              </li>
            </ul>
            <button className="btn btn-gold btn-block" onClick={submit}>
              Confirmar y pagar <Icon name="arrow" size={16} />
            </button>
            <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
              Pago simulado para la demostración. Sin permanencia: renuevas solo si quieres seguir en el club.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
