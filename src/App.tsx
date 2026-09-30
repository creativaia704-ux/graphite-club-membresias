import { useEffect } from 'react';
import { Footer, Header } from './components/Layout';
import { ToastProvider, useRoute } from './components/ui';
import { Landing } from './pages/Landing';
import { MiClub } from './pages/MiClub';
import { Panel } from './pages/Panel';
import { Reservar } from './pages/Reservar';
import { Unirme } from './pages/Unirme';

// Rutas que son secciones de la landing (#/planes → scroll a #planes)
const SECTIONS = ['/planes', '/servicios', '/como-funciona', '/preguntas'];

export default function App() {
  const { path, params } = useRoute();
  const isSection = SECTIONS.includes(path);

  useEffect(() => {
    if (isSection) {
      requestAnimationFrame(() => document.getElementById(path.slice(1))?.scrollIntoView({ behavior: 'smooth' }));
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [path, isSection]);

  let page;
  switch (path) {
    case '/reservar':
      page = <Reservar params={params} />;
      break;
    case '/mi-club':
      page = <MiClub params={params} />;
      break;
    case '/unirme':
      page = <Unirme key={params.get('plan') ?? ''} params={params} />;
      break;
    case '/panel':
      page = <Panel />;
      break;
    default:
      page = <Landing />;
  }

  return (
    <ToastProvider>
      <Header path={path} />
      {page}
      <Footer />
    </ToastProvider>
  );
}
