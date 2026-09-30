import type { CSSProperties } from 'react';
import { IMAGES, MEMBER_WINDOW_DAYS, PLANS, PUBLIC_WINDOW_DAYS, SERVICES, serviceById, type Plan } from '../lib/catalog';
import { money } from '../lib/format';
import { unitName } from '../lib/rules';
import { Icon, SERVICE_ICON, type IconName } from '../components/Icon';
import { UsageRing } from '../components/ui';

const PLAN_ICON: Record<string, IconName> = { 'club-barba': 'beard', 'club-corte': 'scissors', 'club-total': 'diamond' };

function planLines(plan: Plan): string[] {
  const lines = plan.items.map((i) => `${i.included} ${unitName(i.serviceId, i.included)}`);
  const weekly =
    plan.items.length > 1 && plan.items.every((i) => i.weekly === 1)
      ? plan.id === 'club-corte'
        ? 'Máximo 1 de cada uno por semana'
        : 'Máximo 1 corte y barba por semana'
      : `Máximo ${plan.items[0].weekly} por semana`;
  return [...lines, weekly, `Reserva prioritaria · ${MEMBER_WINDOW_DAYS} días`, 'Válido por 30 días'];
}

const FAQ: [string, string][] = [
  [
    '¿Cómo funcionan los planes de membresía?',
    'Pagas un plan mensual y durante 30 días tienes una cantidad de servicios incluidos. Cada vez que reservas un servicio de tu plan se descuenta un uso, y desde la app ves cuántos te quedan. Para que el turno siempre esté fresco, cada plan tiene un límite semanal.',
  ],
  [
    '¿Qué pasa si no uso todos mis servicios?',
    'Los usos pertenecen al ciclo de 30 días y no se acumulan al siguiente. Al renovar, tu ciclo vuelve a empezar con todos los servicios del plan disponibles. Te avisamos 5 días antes del vencimiento para que los aproveches.',
  ],
  [
    '¿Puedo cancelar o reprogramar una reserva?',
    'Sí, desde “Mi club”. Si cancelas con más de 4 horas de anticipación, el uso vuelve a tu plan y puedes reservar otro horario. Con menos de 4 horas, el turno se libera pero el uso se descuenta.',
  ],
  [
    '¿Cuánta anticipación tengo para reservar?',
    `Los miembros del club ven y reservan la agenda hasta ${MEMBER_WINDOW_DAYS} días adelante. El público general, hasta ${PUBLIC_WINDOW_DAYS}. Así el viernes por la tarde siempre tiene lugar para ti.`,
  ],
  [
    '¿Cómo se realiza el pago de la membresía?',
    'Pagas el plan en la barbería (efectivo, tarjeta, Nequi o transferencia Bancolombia) y tu ciclo de 30 días arranca ese mismo día. No hay permanencia: renuevas solo si quieres seguir en el club.',
  ],
  [
    '¿Dónde está ubicada la barbería?',
    'En Sabaneta, Antioquia: Cra. 45 #70 Sur-12, a dos cuadras del parque principal. Atendemos de lunes a sábado de 10:00 a 20:00 y los domingos de 10:00 a 15:00.',
  ],
];

export function Landing() {
  return (
    <main>
      {/* HERO */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <p className="eyebrow">Club de membresías · Sabaneta</p>
            <h1>
              Tu estilo
              <span className="gold">siempre al día</span>
            </h1>
            <p className="hero-lead">
              Membresías mensuales para que siempre te veas bien. Reserva con prioridad, controla tus usos y disfruta de una
              experiencia premium en Sabaneta, Colombia.
            </p>
            <div className="hero-actions">
              <a className="btn btn-dark" href="#/unirme">
                Unirme al club <Icon name="arrow" size={16} />
              </a>
              <a className="btn btn-line" href="#/como-funciona">
                <Icon name="play" size={16} /> Ver cómo funciona
              </a>
            </div>
            <ul className="hero-feats" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li>
                <Icon name="crown" size={26} /> Reserva prioritaria
              </li>
              <li>
                <Icon name="calendar" size={26} /> Control de usos en tu plan
              </li>
              <li>
                <Icon name="diamond" size={26} /> Experiencia exclusiva
              </li>
            </ul>
          </div>
          <div className="hero-visual">
            <img src={IMAGES.hero} alt="Barbero perfilando la barba de un cliente" fetchPriority="high" />
            <div className="hero-badge">
              <Icon name="glass" size={22} />
              <div>
                <b>Whisky en la espera</b>
                Cortesía del club
              </div>
            </div>
            <p className="hero-quote">
              Más que un corte,
              <br />
              un club.
            </p>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section className="section" id="servicios" style={{ paddingTop: 24 }}>
        <div className="wrap services-grid">
          <div className="section-head reveal">
            <p className="eyebrow">Nuestros servicios</p>
            <h2>Tratamientos diseñados para ti</h2>
            <p className="muted">
              Estilo, precisión y cuidado en cada detalle. Servicios profesionales con la mejor experiencia en Sabaneta.
            </p>
            <a className="btn btn-dark btn-sm" href="#/reservar" style={{ marginTop: 22 }}>
              Reservar turno <Icon name="arrow" size={16} />
            </a>
          </div>
          <div className="service-list">
            {SERVICES.map((s, i) => (
              <article className="service-card reveal" key={s.id} style={{ '--d': i } as CSSProperties}>
                <Icon name={SERVICE_ICON[s.id]} size={26} />
                <h3>{s.name}</h3>
                <span className="dur">{s.duration} min</span>
                <span className="price">{money(s.price)}</span>
                <img src={s.image} alt={s.name} loading="lazy" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section className="section plans dark" id="planes">
        <div className="wrap">
          <div className="plans-grid">
            <div className="section-head reveal">
              <p className="eyebrow">Planes de membresía</p>
              <h2>
                Elige tu plan,
                <br />
                disfruta del club
              </h2>
              <p className="muted">
                Planes mensuales con servicios incluidos, límite semanal y reserva prioritaria. Tu estilo, siempre en buenas
                manos.
              </p>
            </div>
            <div className="plan-cards">
              {PLANS.map((p, i) => (
                <article
                  className={`plan reveal${p.featured ? ' featured' : ''}`}
                  key={p.id}
                  style={{ '--d': i } as CSSProperties}
                >
                  {p.featured && <span className="plan-flag">El más elegido</span>}
                  <div className="plan-icon">
                    <Icon name={PLAN_ICON[p.id]} size={26} />
                  </div>
                  <h3>{p.name}</h3>
                  <p className="price">
                    {money(p.price)} <small>/ mes</small>
                  </p>
                  <p className="tagline">{p.tagline}</p>
                  <ul>
                    {planLines(p).map((l) => (
                      <li key={l}>
                        <Icon name="check" size={16} />
                        {l}
                      </li>
                    ))}
                  </ul>
                  <a className={`btn ${p.featured ? 'btn-gold' : 'btn-line'}`} href={`#/unirme?plan=${p.id}`}>
                    Elegir plan
                  </a>
                </article>
              ))}
            </div>
          </div>

          <div className="priority reveal">
            <div>
              <p className="eyebrow">Reserva prioritaria</p>
              <h3 style={{ marginTop: 10 }}>Tu agenda se abre antes</h3>
              <p className="muted" style={{ marginTop: 8, fontSize: 14.5 }}>
                Los miembros ven y reservan {MEMBER_WINDOW_DAYS} días adelante. El público general, {PUBLIC_WINDOW_DAYS}. El
                viernes ya no se llena sin ti.
              </p>
            </div>
            <div className="prio-rows">
              <div className="prio-row">
                <span>Miembros del club</span>
                <div className="prio-days">
                  {Array.from({ length: 8 }, (_, i) => (
                    <i key={i} className="on">
                      {i === 0 ? 'Hoy' : `+${i}`}
                    </i>
                  ))}
                </div>
              </div>
              <div className="prio-row">
                <span>Público general</span>
                <div className="prio-days">
                  {Array.from({ length: 8 }, (_, i) => (
                    <i key={i} className={i <= PUBLIC_WINDOW_DAYS ? 'on-gray' : ''}>
                      {i <= PUBLIC_WINDOW_DAYS ? i === 0 ? 'Hoy' : `+${i}` : <Icon name="lock" size={14} />}
                    </i>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section className="section" id="como-funciona">
        <div className="wrap steps-grid">
          <div className="section-head reveal">
            <p className="eyebrow">Cómo funciona</p>
            <h2>En 4 pasos</h2>
            <p className="muted">Un proceso simple para que siempre tengas tu próximo turno asegurado.</p>
          </div>
          <ol className="steps stagger reveal">
            {(
              [
                ['card', 'Elige tu plan', 'Selecciona la membresía que mejor se adapte a tu estilo y págala en la barbería.'],
                [
                  'calendar',
                  'Reserva tus turnos',
                  `Accede a la agenda con prioridad: hasta ${MEMBER_WINDOW_DAYS} días adelante, con el barbero que prefieras.`,
                ],
                [
                  'scissors',
                  'Disfruta el servicio',
                  'Cada reserva consume un uso de tu plan. Si cancelas con más de 4 h, el uso vuelve.',
                ],
                ['refresh', 'Renueva y sigue', 'Te avisamos antes del vencimiento. Al renovar, tus usos se reinician.'],
              ] as [IconName, string, string][]
            ).map(([icon, t, d], i) => (
              <li key={t}>
                <span className="step-n">{i + 1}</span>
                <div>
                  <h3>
                    <Icon name={icon} size={18} /> {t}
                  </h3>
                  <p>{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* APP */}
      <section className="section app-sec">
        <div className="wrap app-grid">
          <PhoneMockups />
          <div>
            <p className="eyebrow">Tu membresía siempre contigo</p>
            <h2 className="reveal" style={{ fontSize: 'clamp(34px, 6vw, 50px)', fontWeight: 700, margin: '12px 0 14px' }}>
              Controla tus usos y reserva desde el celular
            </h2>
            <p className="muted">
              Consulta cuántos servicios te quedan, reserva tu próximo turno y recibe recordatorios de renovación. Todo en un solo
              lugar.
            </p>
            <ul className="feat-list stagger reveal">
              {(
                [
                  ['calendar', 'Agenda en tiempo real', 'Ve los horarios libres de los cuatro barberos y reserva en segundos.'],
                  ['chart', 'Control de tus usos', 'Revisa los cortes y servicios disponibles del ciclo y de la semana.'],
                  ['bell', 'Avisos de renovación', 'Te avisamos 5 días antes de que venza tu plan.'],
                ] as [IconName, string, string][]
              ).map(([icon, t, d]) => (
                <li key={t}>
                  <span className="ic">
                    <Icon name={icon} />
                  </span>
                  <div>
                    <b>{t}</b>
                    <span>{d}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a className="btn btn-dark" href="#/unirme">
                Unirme al club <Icon name="arrow" size={16} />
              </a>
              <a className="btn btn-line" href="#/mi-club">
                Ver la app
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ESPACIO */}
      <section className="section" style={{ paddingBottom: 56 }}>
        <div className="wrap space-grid">
          <div className="section-head reveal">
            <p className="eyebrow">Barbería boutique en Sabaneta</p>
            <h2>Un espacio pensado para hombres que cuidan su estilo</h2>
            <p className="muted">Un ambiente exclusivo, buena música y un whisky en la espera. Más que una barbería, un club.</p>
          </div>
          <div className="space-imgs stagger reveal">
            <figure>
              <img src={IMAGES.interior} alt="Sillas de barbero de cuero en el salón" loading="lazy" />
              <figcaption>Cuero y madera</figcaption>
            </figure>
            <figure>
              <img src={IMAGES.whisky} alt="Vaso de whisky en la sala de espera" loading="lazy" />
              <figcaption>Un whisky mientras esperas</figcaption>
            </figure>
            <figure>
              <img src={IMAGES.chair} alt="Detalle de sillas clásicas de barbería" loading="lazy" />
              <figcaption>Tu silla, tu barbero</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* INFO */}
      <section className="info-bar">
        <ul className="wrap info-grid stagger reveal">
          <li>
            <Icon name="pin" size={24} />
            <div>
              <b>Sabaneta,</b> Antioquia, Colombia
            </div>
          </li>
          <li>
            <Icon name="users" size={24} />
            <div>
              <b>4 barberos</b> profesionales
            </div>
          </li>
          <li>
            <Icon name="clock" size={24} />
            <div>
              <b>Lun – Sáb 10:00 – 20:00</b> Dom 10:00 – 15:00
            </div>
          </li>
          <li>
            <Icon name="instagram" size={24} />
            <div>
              <b>@graphitebarberstudio</b> Síguenos
            </div>
          </li>
        </ul>
      </section>

      {/* FAQ */}
      <section className="section" id="preguntas">
        <div className="wrap faq-grid">
          <div className="section-head reveal">
            <p className="eyebrow">Preguntas frecuentes</p>
            <h2>¿Tienes dudas?</h2>
            <p className="muted">Aquí respondemos las consultas más comunes sobre el club de membresías.</p>
          </div>
          <div className="faq-list stagger reveal">
            {FAQ.map(([q, a]) => (
              <details className="faq-item" key={q}>
                <summary>
                  {q} <Icon name="plus" size={18} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="wrap" style={{ paddingBottom: 24 }}>
        <div className="cta-band reveal">
          <p className="eyebrow on-dark">Graphite Barber Studio</p>
          <h2>Tu silla te espera</h2>
          <p>Elige tu plan hoy y reserva tu primer turno con la agenda prioritaria del club.</p>
          <div className="row">
            <a className="btn btn-gold" href="#/unirme">
              Unirme al club <Icon name="arrow" size={16} />
            </a>
            <a className="btn btn-line on-dark" href="#/reservar">
              Reservar sin membresía
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

function PhoneMockups() {
  const rows: [string, string][] = [
    ['combo', 'Corte y barba'],
    ['face', 'Limpieza facial'],
  ];
  return (
    <div className="phones reveal" aria-hidden="true">
      <div className="phone a">
        <div className="phone-screen">
          <p className="ph-title">
            Mi membresía<small>Club Total</small>
          </p>
          <div className="ph-ring">
            <UsageRing
              available={3}
              total={4}
              size={112}
              dark
              label={
                <span>
                  <span className="ring-label" style={{ fontSize: 30 }}>
                    3/4
                  </span>
                  <br />
                  <small style={{ fontSize: 9, color: '#a9ada7' }}>disponibles</small>
                </span>
              }
            />
          </div>
          {rows.map(([icon, name], i) => (
            <div className="ph-row" key={name}>
              <Icon name={icon as IconName} size={14} /> {name}
              <b>{i === 0 ? '3/4' : '1/1'}</b>
            </div>
          ))}
          <div className="ph-row">
            <Icon name="bell" size={14} /> Renueva el 28 oct
          </div>
          <span className="ph-btn">Reservar turno</span>
        </div>
      </div>
      <div className="phone b">
        <div className="phone-screen">
          <p className="ph-title">Reservar turno</p>
          <div className="ph-days">
            {['Lun 5', 'Mar 6', 'Mié 7', 'Jue 8', 'Vie 9'].map((d, i) => (
              <span key={d} className={i === 4 ? 'on' : ''}>
                {d.split(' ')[0]}
                <br />
                <b>{d.split(' ')[1]}</b>
              </span>
            ))}
          </div>
          <p style={{ fontSize: 10, margin: '0 0 6px', color: '#5d615c' }}>{serviceById('corte-barba').name} · 60 min</p>
          <div className="ph-slots">
            {['10:00', '10:30', '11:00', '12:00', '13:30', '15:00', '16:00', '17:00', '17:30', '18:00', '18:30', '19:00'].map(
              (t) => (
                <span key={t} className={t === '17:30' ? 'on' : ['10:30', '16:00', '18:00'].includes(t) ? 'off' : ''}>
                  {t}
                </span>
              ),
            )}
          </div>
          <span className="ph-confirm">Confirmar reserva</span>
        </div>
      </div>
    </div>
  );
}
