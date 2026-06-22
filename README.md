# 🍗 KFC E-commerce

Plataforma de e-commerce full-stack inspirada en KFC: catálogo de productos, carrito persistente, checkout con pagos (Stripe test), seguimiento de pedidos, programa de lealtad, motor de recomendaciones híbrido y un panel de administración con simulaciones de negocio (ML vs sin ML, tráfico, inventario, personal de cocina y delivery por zona).

Proyecto demo educativo — no afiliado oficialmente a KFC Corporation.

## Requisitos

- Docker y Docker Compose
- Node.js 18+ (solo si quieres correr backend/frontend fuera de Docker)

## Instalación y ejecución

```bash
git clone <este-repositorio>
cd kfc-ecommerce
cp .env.example .env
docker-compose up --build
```

O usa el script de configuración guiada:

```bash
./scripts/setup.sh
```

Esto levanta 4 servicios: PostgreSQL, Redis, el backend (Express + Prisma) y el frontend (Vite + React). Al iniciar, el backend ejecuta automáticamente las migraciones de Prisma y el seed de datos de ejemplo.

- **Frontend:** http://localhost:5173
- **Backend / API:** http://localhost:5000/api
- **Health check:** http://localhost:5000/health

### Comandos útiles (Makefile)

```bash
make up        # levantar los contenedores
make build     # levantar reconstruyendo imágenes
make down      # detener contenedores
make reset     # detener y borrar volúmenes (reinicia la base de datos)
make logs      # ver logs en vivo
make seed      # volver a ejecutar el seed
make migrate   # aplicar migraciones de Prisma
```

## Accesos de prueba

| Rol      | Correo            | Contraseña |
|----------|--------------------|------------|
| Admin    | admin@kfc.com      | admin123   |
| Cliente  | cliente@kfc.com    | cliente123 |

El cliente demo viene precargado con 300 puntos de lealtad (nivel Silver). También se crean 4 clientes adicionales (`maria@kfc.com`, `carlos@kfc.com`, `ana@kfc.com`, `luis@kfc.com`, contraseña `demo1234`) para tener datos variados con los que el motor de recomendaciones (filtrado colaborativo) pueda trabajar.

## Funcionalidades principales

- **Catálogo y menú**: 25 productos (pollo, combos, acompañamientos, bebidas, postres) con filtros por categoría, búsqueda, ordenamiento, nivel de picante y alérgenos.
- **Carrito persistente**: se guarda en `localStorage` para invitados y se sincroniza con el carrito del servidor al iniciar sesión.
- **Checkout**: 4 tipos de pedido (delivery, pickup, dine-in, drive-thru) cada uno con sus propios requisitos, cupones, y pago vía Stripe en modo test (con simulación automática si no se configuran credenciales reales).
- **Seguimiento de pedido**: timeline visual según el tipo de pedido y estado actual.
- **Programa de lealtad**: acumulación de puntos (1 punto por sol gastado), niveles Silver/Gold/Platinum y canje de recompensas.
- **Motor de recomendaciones**: algoritmo híbrido ponderado (filtrado colaborativo 30%, contenido 15%, categoría 20%, boost de selección 30%, boost de búsqueda 20%) más reglas contextuales de KFC (complementos, hora del día, tamaño de grupo, preferencia de picante).
- **Panel de administración**: dashboard de métricas, CRUD de productos/promociones, gestión de pedidos, y 5 simulaciones de negocio (incluyendo reporte PDF descargable de "ML vs sin ML").
- **Nutrición y salud**: calculadora de calorías y filtros por alérgenos.
- **Ubicaciones**: mapa interactivo con sucursales en Trujillo, Perú, y cálculo de distancia.
- **Favoritos, historial de pedidos con reordenar, soporte (FAQ + chat simulado + tickets), autenticación JWT.**

## Estructura de carpetas

```
kfc-ecommerce/
├── backend/            # API Express + TypeScript + Prisma
│   ├── prisma/         # schema.prisma y seed.ts
│   └── src/
│       ├── controllers/  # lógica de cada recurso (auth, productos, pedidos, etc.)
│       ├── routes/       # definición de rutas Express
│       ├── services/     # motor de recomendaciones, simulaciones, Stripe, lealtad, PDF
│       ├── middleware/   # auth (JWT) y manejo de errores
│       └── lib/          # clientes de Prisma y Redis
├── frontend/           # React + TypeScript + Tailwind + Vite
│   └── src/
│       ├── pages/         # las 16 pantallas de la plataforma
│       ├── components/    # common, home, cart
│       ├── store/         # Zustand: auth y carrito
│       ├── hooks/          # recomendaciones, favoritos
│       └── services/       # cliente Axios
└── scripts/             # setup.sh y seed-local.sh
```

## Variables de entorno

Ver `.env.example` en la raíz para la lista completa. Las más relevantes:

```
DATABASE_URL=postgresql://kfc:kfc_password@postgres:5432/kfc_ecommerce
JWT_SECRET=...
STRIPE_SECRET_KEY=sk_test_...
GOOGLE_MAPS_API_KEY=...
REDIS_URL=redis://redis:6379

VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_GOOGLE_MAPS_API_KEY=...
```

> Si no configuras una clave real de Stripe, el backend simula automáticamente una respuesta de pago exitosa para que el flujo de checkout funcione igual en la demo. El mapa de ubicaciones usa el embed público de Google Maps, que no requiere API key para esta demo.

## Notas técnicas

- El motor de recomendaciones normaliza los puntajes (min-max) y cachea resultados en Redis por 2 minutos para mejorar el rendimiento.
- Las simulaciones de "tráfico por hora" y "personal en cocina" usan un modelo estadístico típico de QSR (picos de almuerzo y cena) combinado con datos reales de pedidos cuando están disponibles.
- El reporte PDF de "ML vs sin ML" se genera en el backend con `pdfkit` y usa el ticket promedio (AOV) calculado de pedidos reales en la base de datos.
