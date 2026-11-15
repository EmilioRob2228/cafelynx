# CafeLYNX

Pedidos anticipados para la Cafetería 3 del TecNM Celaya, Campus II. El cliente arma su pedido
desde el celular, lo sigue en tiempo real y paga en caja al recogerlo. La cafetería gestiona los
pedidos, edita el menú y consulta estadísticas desde `/admin`.

**Stack:** React + Vite, Tailwind CSS 4, Framer Motion, Radix UI, Supabase (Postgres, Auth, Realtime).
Se publica como un solo sitio en Vercel.

## Rutas

| Ruta | Quién | Qué hace |
|---|---|---|
| `/` | Cliente | Menú, carrito y envío del pedido |
| `/pedido/:id` | Cliente | Seguimiento, aviso de "listo" y encuesta de satisfacción |
| `/admin` | Cafetería | Tablero de pedidos en vivo (Pendiente, Preparando, Listo, Entregado) |
| `/admin/menu` | Cafetería | Alta, edición, precios y disponibilidad de productos |
| `/admin/estadisticas` | Cafetería | Ventas, horas pico, más/menos vendidos, tiempos, encuestas y CSV |

## Probarlo en tu computadora (modo demostración)

```bash
npm install
npm run dev
```

Sin variables de Supabase la app corre en **modo demostración**: guarda todo en el navegador y el
panel admin entra con la contraseña `lince`. Sirve para revisar el diseño y el flujo completo.

## Conectar Supabase (necesario para el piloto)

1. Crea un proyecto en [supabase.com](https://supabase.com) (plan gratuito).
2. **SQL Editor**: ejecuta `supabase/schema.sql` completo y después `supabase/seed.sql` (menú inicial).
3. **Authentication > Users > Add user**: crea la cuenta de la cafetería (correo y contraseña).
4. **Authentication > Sign In / Providers**: desactiva *Allow new users to sign up*, para que nadie más pueda registrarse.
5. En el **SQL Editor** autoriza ese correo como administrador:
   ```sql
   insert into public.admins (email) values ('correo-de-la-cafeteria@ejemplo.com');
   ```
6. **Project Settings > API**: copia la *Project URL* y la clave *anon public*. Crea `.env.local` (ver `.env.example`):
   ```
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-clave-anon
   ```
   Nunca uses la clave `service_role` en el front.
7. `npm run dev` y prueba: hacer un pedido, entrar a `/admin/login` y mover el pedido.

## Publicar (GitHub + Vercel)

1. Sube el proyecto a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com): *Add New > Project*, elige el repositorio. Framework: Vite.
3. En *Environment Variables* agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Cada `git push` a `main` vuelve a publicar el sitio. `vercel.json` ya redirige `/admin` y `/pedido/...` a la app.

Los cambios de estructura en la base de datos se aplican ejecutando SQL en Supabase; no pasan por GitHub.

## Cómo se cubren los requisitos del documento

| Requisito | Dónde |
|---|---|
| Consultar el menú y seleccionar productos | `/` (menú real de la Cafetería 3, opciones de precio, disponibilidad por día) |
| Pedido anticipado | Carrito y confirmación con nombre |
| Pago en la cafetería, sin pagos en línea | Aviso en el carrito y en el seguimiento; "Entregar y cobrar" en el panel |
| Registro digital de las transacciones | Tablas `orders` y `order_items`, con el precio vigente al momento del pedido |
| Mejor organización de comandas | Tablero en vivo con sonido de pedido nuevo y tiempo de espera por tarjeta |
| Medición de tiempos de espera | Marcas de tiempo por estado; promedios y CSV en estadísticas |
| Satisfacción y usabilidad | Encuesta de 2 preguntas al estar listo el pedido; meta de 80% en estadísticas |
| Historial de ventas, más y menos vendidos | `/admin/estadisticas` |

Una venta cuenta cuando el pedido se marca como **entregado y cobrado**; los cancelados no suman.

## Límites conocidos

- El seguimiento consulta el estado cada 3 segundos (no usa websockets en el lado del cliente).
- El aviso de "listo" (sonido, confeti, vibración) funciona con la página abierta. La vibración solo existe en Android; en iPhone no.
- No hay notificaciones push con la pantalla bloqueada.
- Los proyectos gratuitos de Supabase se pausan tras 7 días sin actividad: verifica que esté activo antes del piloto.
- `legacy/` conserva el prototipo anterior (Express + SQLite). Ya no se usa.
