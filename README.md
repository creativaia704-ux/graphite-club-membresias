# Graphite Barber Studio · Club de membresías

Club de membresías de corte y barba para **Graphite Barber Studio** (Sabaneta, Antioquia, Colombia).
El cliente paga un plan mensual con una cantidad de servicios incluidos; la app controla cuántos usó, no deja pasar el límite semanal, le da prioridad en la agenda y avisa las renovaciones. Para la barbería es ingreso fijo; para el cliente, su corte siempre fresco.

> **Vista previa:** https://graphite-club-membresias.vercel.app
> **Repositorio:** https://github.com/creativaia704-ux/graphite-club-membresias
> Proyecto para Kodarvia. Todos los datos son de ejemplo.

---

## Qué incluye

| Pantalla | Ruta | Para qué sirve |
| --- | --- | --- |
| Landing | `#/` | Presentación del club: servicios, planes, reserva prioritaria, cómo funciona, la app, el espacio y preguntas frecuentes. |
| Reservar | `#/reservar` | Agenda de los 4 barberos. Miembros: 7 días, consumen usos del plan. Público general: 3 días, precio suelto. |
| Mi club | `#/mi-club` | Estado de la membresía, usos del ciclo y de la semana, próximos turnos (con cancelación), historial, pagos y renovación. |
| Unirme | `#/unirme` | Alta en el club: elegir plan y datos. El ciclo de 30 días empieza ese día (pago simulado). |
| Panel | `#/panel` | Gestión de la barbería: miembros activos, ingreso fijo mensual, usos por plan, renovaciones por vencer y vencidas, agenda por día y herramientas de prueba. |

No hay login real: en **Reservar** y **Mi club** hay un selector "Estás usando la app como" para cambiar entre *Público general* y cualquiera de los miembros de ejemplo.

## Funcionalidades

- **Planes con servicios incluidos y límite semanal**: cada plan define, por servicio, cuántos usos trae el ciclo y el máximo por semana (lunes a domingo).
- **Miembros con ciclo y renovación**: ciclo de 30 días desde el pago. Estado *Activa*, *Vence en N días* (≤ 5 días) o *Vencida*.
- **Reserva prioritaria**: los miembros ven y reservan hasta 7 días adelante; el público general, hasta 3. Los días bloqueados se ven con candado.
- **Descuento de usos por reserva**: cada reserva de un servicio del plan consume un uso.
- **Devolución por cancelación a tiempo**: cancelar con **más de 4 horas** devuelve el uso; con 4 horas o menos, el turno se libera pero el uso se descuenta.
- **Renovaciones y vencimientos**: avisos en *Mi club* y en el *Panel*; renovar (se puede cambiar de plan) reinicia los usos.
- **Miembros activos y usos por plan**: métricas en el panel (miembros, ingreso fijo mensual, usos consumidos / incluidos por plan).
- **Agenda real**: horario lun–sáb 10–20 h y dom 10–15 h, turnos cada 30 min, 4 barberos sin solapamientos, duración de cada servicio.
- **Persistencia**: todo se guarda en `localStorage` y se sincroniza entre pestañas abiertas.

## Reglas de negocio

Implementadas como funciones puras en [`src/lib/rules.ts`](src/lib/rules.ts) y cubiertas por tests en [`src/lib/rules.test.ts`](src/lib/rules.test.ts).

- **Usos disponibles del servicio en el ciclo** = incluidos − reservas activas o realizadas del ciclo (una cancelación tardía cuenta como realizada; una cancelación a tiempo no cuenta).
- Una reserva pertenece al ciclo en el que cae la **fecha del turno** (`cycleStart ≤ turno < cycleEnd`).
- **Límite semanal**: se cuentan las reservas del miembro para ese servicio en la semana del turno (lunes 00:00 a domingo 23:59).
- **Fin del ciclo sin renovación**: la membresía queda *Vencida* y ya no reserva como miembro (puede reservar como público general, 3 días y precio suelto). Tampoco se puede reservar como miembro un turno posterior al fin del ciclo.
- **Renovar** abre un ciclo nuevo de 30 días desde el momento del pago; los usos del ciclo vuelven a estar completos.
- Servicios fuera del plan: un miembro activo puede reservarlos con su ventana de 7 días, pagando el precio suelto (no consumen usos).

## Catálogo

| Servicio | Duración | Precio suelto |
| --- | --- | --- |
| Corte de cabello | 40 min | $35.000 |
| Arreglo de barba | 25 min | $22.000 |
| Corte y barba | 60 min | $52.000 |
| Afeitado clásico | 30 min | $28.000 |
| Limpieza facial | 30 min | $30.000 |

| Plan | Precio / mes | Incluye | Límite semanal |
| --- | --- | --- | --- |
| Club Barba | $70.000 | 4 arreglos de barba | 1 por semana |
| Club Corte | $110.000 | 2 cortes + 2 arreglos de barba | 1 de cada uno por semana |
| Club Total | $190.000 | 4 cortes y barba + 1 limpieza facial | 1 por semana |

Barberos de ejemplo: Andrés Restrepo, Mateo Gaviria, Julián Ospina y Santiago Vélez.

## Identidad visual

El negocio no tenía logo ni colores; la identidad se propuso para el tono de **barbería boutique con trato de club** (whisky en la espera, cuero, madera): sobria, oscura y con un dorado apagado. Nada de estética de promoción: no hay descuentos, porcentajes ni urgencias.

| Paleta | Uso |
| --- | --- |
| `#161616` Grafito | Fondos oscuros, textos, botones principales |
| `#D4B98C` Dorado sutil | Acentos, títulos sobre oscuro, estado seleccionado |
| `#8B8F8A` Gris acento | Bordes, textos secundarios |
| `#2B2216` Café tabaco | Detalles cálidos (avatares, barra de reloj simulado) |
| `#F3EEE6` Crema | Fondo claro general |
| `#85663A` Dorado texto | Dorado oscurecido para texto sobre claro (contraste AA) |

| Tipografía | Uso |
| --- | --- |
| **Oswald** (500–700) | Títulos en mayúsculas: condensada y firme, con presencia de rótulo de barbería clásica |
| **Inter** (400–700) | Texto, formularios y datos: muy legible en celular |
| **Cormorant Garamond** itálica | Acentos puntuales ("Más que un corte, un club."): el toque elegante |

Logotipo: wordmark *GRAPHITE / BARBER STUDIO* en Oswald con el subtítulo espaciado en dorado. Las fotos llevan un mismo tratamiento cálido (sepia suave) para que se lean como una sola marca.

## Cómo probar los criterios de aceptación

Los datos de ejemplo se generan **relativos al día en que se abre la app** por primera vez, así los casos siempre están vigentes. En el **Panel → Herramientas de prueba** se puede adelantar el reloj (+1 h, +1 día, +7 días) y restablecer los datos.

| # | Criterio | Cómo verlo |
| --- | --- | --- |
| 1 | Sin usos no se reserva | *Reservar* como **Juan Pablo Zapata** (Club Corte): "Corte de cabello" aparece *Agotado en este ciclo (2/2)* y no se puede elegir. |
| 2 | Límite semanal | *Reservar* como **Felipe Londoño** (Club Barba, tiene barba esta semana) → "Arreglo de barba": los días de esta semana muestran *Límite semanal* y el aviso lo explica; desde el lunes siguiente sí hay horarios. |
| 3 | 7 días miembros / 3 público | En *Reservar*, como *Público general* los días +4 a +7 están con candado ("Miembros"); como cualquier miembro activo están abiertos. |
| 4 | Cancelar > 4 h devuelve el uso | Como **Camilo Arango**, reserva un servicio del plan para mañana → *Mi club* → Cancelar: "Faltan más de 4 horas: el uso vuelve a tu plan" y el contador vuelve. Para ver el caso tardío, reserva un turno de hoy (o adelanta el reloj) y cancela: el uso queda descontado. |
| 5 | Vencida no reserva como miembro | Como **Daniel Correa** o **Nicolás Uribe** (vencidas): aviso rojo, la agenda es la del público (3 días, precio suelto) y los usos no se descuentan. |
| 6 | Renovar reinicia usos | *Mi club* de **Daniel Correa** → Renovar ahora: pasa de 0/4 a 4/4 y la membresía queda *Activa*. También desde el *Panel* (Registrar pago / Renovar). |
| 7 | Persistencia | Reserva o renueva, recarga o cierra y vuelve a abrir la pestaña: todo sigue igual (`localStorage`, clave `graphite-club:v1`). |
| 8 | Celular | Diseño mobile-first probado a 390 px: sin desplazamiento horizontal, tablas convertidas en tarjetas, modales tipo hoja inferior y avisos arriba para no tapar botones. |

Otros casos de ejemplo: **Sebastián Mejía** vence en 3 días (los días posteriores al fin de ciclo muestran *Fin de ciclo*), **Mauricio Duque** vence mañana y ya usó sus 4 barbas.

Tests automáticos de las reglas (14 casos, uno o más por criterio):

```bash
npm test
```

## Stack

- [Vite](https://vite.dev) + React + TypeScript, sin librerías de UI: CSS propio con variables ([`src/styles/global.css`](src/styles/global.css)).
- Router por hash (funciona en cualquier hosting estático, sin configuración de rewrites).
- Estado global con `useSyncExternalStore` + `localStorage` ([`src/lib/store.ts`](src/lib/store.ts)).
- Vitest para las reglas de negocio.

```
src/
  lib/
    catalog.ts     servicios, planes, barberos, horario y constantes (7/3 días, 4 h, 30 días)
    rules.ts       reglas del club (funciones puras)
    rules.test.ts  tests de los criterios
    seed.ts        miembros, turnos y pagos de ejemplo
    store.ts       estado persistido y acciones (reservar, cancelar, renovar, unirse, reloj)
    time.ts        utilidades de fecha (semana lunes–domingo)
    format.ts      formato COP y fechas en es-CO
  components/      Header/Footer, iconos, modal, toast, anillo de usos, selector de perfil
  pages/           Landing, Reservar, MiClub, Unirme, Panel
```

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # tests de reglas
npm run build    # genera dist/
npm run preview  # sirve dist/
```

## Despliegue

Es un sitio estático (`dist/`), con `base: './'` y router por hash, así que funciona igual en Vercel, Netlify o GitHub Pages.

- **Vercel** (actual): el proyecto `graphite-club-membresias` está conectado a este repositorio y cada push a `main` se publica solo. Para replicarlo: importar el repositorio → framework *Vite* → build `npm run build`, salida `dist`.
- **GitHub Pages**: `npm run build` y publicar la carpeta `dist` (por ejemplo con la acción `actions/deploy-pages`).

## Supuestos

- No hay backend ni pagos reales: el alta y la renovación registran un pago simulado. Cada navegador tiene sus propios datos.
- Horarios en la hora local del navegador.
- Datos de ejemplo: la dirección (Cra. 45 #70 Sur-12), teléfonos, nombres y la cuenta de Instagram son datos de ejemplo.

## Créditos

Fotografías de [Unsplash](https://unsplash.com) (licencia Unsplash), servidas desde `images.unsplash.com`.
