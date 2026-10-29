# Implementación

Guías leídas de Next.js 16.4 en `node_modules/next/dist/docs/01-app/`:

- `01-getting-started/03-layouts-and-pages.md`: App Router y layouts anidados.
- `01-getting-started/11-css.md`: aislamiento con CSS Modules y ámbitos explícitos; no importar dos hojas globales incompatibles.
- `01-getting-started/07-mutating-data.md`: las operaciones públicas requieren validación y autenticación propia.
- `01-getting-started/15-route-handlers.md`: endpoints GET/POST/PATCH/DELETE con Request/Response.
- `03-api-reference/04-functions/cookies.md`: `await cookies()`, mutación solo en handlers.
- `03-api-reference/03-file-conventions/dynamic-routes.md`: parámetros y searchParams asincrónicos.
- `03-api-reference/05-config/01-next-config-js/cacheComponents.md`: se desactiva Cache Components para usar renderizado dinámico de las referencias y sesiones sin guardar contenido privado en caché.

Se usa una sola aplicación con grupos de rutas. `SiteFrame` comparte el tema configurado, encabezado, logo y pie entre páginas institucionales y comerciales; ambos usan los estilos bajo `.institution`. El CSS Module de la tienda conserva sus componentes de catálogo, diálogo, carrito y pedido, heredando fuente y variables del tema institucional. Se retiró la regla Turbopack `as: '*.css'` de la plantilla: convertía los módulos en CSS global y dejaba vacías sus clases importadas. No se necesita un loader de Tailwind para estas hojas CSS nativas. Datos de PocketBase consultados en servidor; cookies HttpOnly del personal; credenciales privilegiadas aisladas mediante `server-only`. La creación de pedidos usa un Route Handler con verificación de origen y validación del catálogo en servidor.

Fuentes locales Geist y Playfair Display recuperadas de los activos ya presentes en la referencia Tienda Cata, bajo sus licencias SIL Open Font License. Los avisos se conservan en `public/fonts/`; no se descargan fuentes durante el build ni al visitar un pedido privado.
