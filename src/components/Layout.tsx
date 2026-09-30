import { useEffect, useState } from 'react';
import { fmtDateTime } from '../lib/format';
import { actions, useNow, useProfile, useStore } from '../lib/store';
import { Icon } from './Icon';

const NAV = [
  { href: '#/planes', label: 'Planes' },
  { href: '#/como-funciona', label: 'Cómo funciona' },
  { href: '#/servicios', label: 'Servicios' },
  { href: '#/reservar', label: 'Reservar' },
  { href: '#/mi-club', label: 'Mi club' },
];

export function Logo() {
  return (
    <a className="logo" href="#/" aria-label="Graphite Barber Studio, inicio">
      <b>GRAPHITE</b>
      <small>BARBER STUDIO</small>
    </a>
  );
}

export function Header({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const member = useProfile();
  const { clockOffset } = useStore();
  const now = useNow();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => setOpen(false), [path]);

  return (
    <>
      {clockOffset !== 0 && (
        <div className="clock-bar">
          Reloj simulado: {fmtDateTime(now)}
          <button className="link" onClick={() => actions.resetClock()}>
            Volver al presente
          </button>
        </div>
      )}
      <header className={`header${scrolled ? ' scrolled' : ''}`}>
        <div className="wrap header-in">
          <Logo />
          <nav className="nav" aria-label="Principal">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className={path === n.href.slice(1) ? 'active' : undefined}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className="header-cta">
            {member ? (
              <a className="btn btn-dark" href="#/mi-club">
                Mi membresía <Icon name="arrow" size={16} />
              </a>
            ) : (
              <a className="btn btn-dark" href="#/unirme">
                Unirme al club <Icon name="arrow" size={16} />
              </a>
            )}
            <button className="menu-btn" aria-label="Abrir menú" onClick={() => setOpen(true)}>
              <Icon name="menu" />
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div className="drawer dark" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="header-in">
            <Logo />
            <button className="menu-btn" aria-label="Cerrar menú" onClick={() => setOpen(false)}>
              <Icon name="x" />
            </button>
          </div>
          <nav>
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)}>
                {n.label}
              </a>
            ))}
            <a href="#/panel" onClick={() => setOpen(false)}>
              Panel barbería
            </a>
          </nav>
          <a className="btn btn-gold btn-block" href={member ? '#/mi-club' : '#/unirme'} onClick={() => setOpen(false)}>
            {member ? 'Mi membresía' : 'Unirme al club'} <Icon name="arrow" size={16} />
          </a>
        </div>
      )}
    </>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <Logo />
            <p className="muted" style={{ marginTop: 14, maxWidth: 300, fontSize: 14 }}>
              Barbería boutique en Sabaneta. Corte, barba y un whisky en la espera. Más que una barbería, un club.
            </p>
          </div>
          <div>
            <h4>El club</h4>
            <ul>
              <li>
                <a href="#/planes">Planes</a>
              </li>
              <li>
                <a href="#/unirme">Unirme</a>
              </li>
              <li>
                <a href="#/mi-club">Mi membresía</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Agenda</h4>
            <ul>
              <li>
                <a href="#/reservar">Reservar turno</a>
              </li>
              <li>
                <a href="#/servicios">Servicios</a>
              </li>
              <li>
                <a href="#/preguntas">Preguntas</a>
              </li>
            </ul>
          </div>
          <div>
            <h4>Barbería</h4>
            <ul>
              <li>
                <a href="#/panel">Panel de gestión</a>
              </li>
              <li>
                <span className="muted">@graphitebarberstudio</span>
              </li>
              <li>
                <span className="muted">Cra. 45 #70 Sur-12, Sabaneta</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Graphite Barber Studio · Sabaneta, Antioquia</span>
          <span>Lun–Sáb 10:00–20:00 · Dom 10:00–15:00</span>
        </div>
      </div>
    </footer>
  );
}
