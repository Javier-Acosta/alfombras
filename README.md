# Fábrica de Alfombras Catamarca

Sitio institucional basado en Feria del Libro, con La fábrica, Proceso artesanal, Colecciones, Noticias e Instagram. La sección Tienda conserva la presentación de Tienda Cata y permite preparar pedidos por WhatsApp. Pago y entrega se coordinan manualmente.

## Desarrollo local

Requiere Node.js 24 y PocketBase 0.40.4. Ejecutar `npm ci`. En Windows, colocar PocketBase en `pocketbase/pocketbase.exe` y ejecutar `node scripts/setup-local.mjs` una vez. Crea una base vacía y credenciales aleatorias en archivos excluidos de Git. Consultar el acceso en `.local/acceso.txt`.

Ejecutar `npm run dev` y abrir http://localhost:3000. El panel está en `/admin`. En próximos arranques, iniciar PocketBase con `./pocketbase/pocketbase.exe serve --http=127.0.0.1:8090 --dir=pocketbase/pb_data --migrationsDir=pocketbase/pb_migrations`.

Para una instancia externa, seguir `.env.example` y [Administración](docs/administracion.md). Nunca reutilizar credenciales o bases de los proyectos de referencia.

## Comprobaciones

- `npm run lint`
- `npm run build`
- `npm run test:unit`
- `npm run test:e2e` (requiere el entorno descartable de pruebas)

Ver [Verificación](docs/verificacion.md), [Implementación](docs/implementacion.md) y [Despliegue](docs/despliegue.md).

## OpenSpec

La propuesta, requisitos, diseño y tareas están en `openspec/changes/fabrica-alfombras-catamarca/`. Para revisar el progreso: `npx openspec instructions apply --change fabrica-alfombras-catamarca --json`.

La aplicación utiliza PocketBase independiente. Las credenciales, archivos de datos y resultados de prueba no se versionan. Los pedidos permanecen deshabilitados hasta configurar un WhatsApp comercial válido. No incluye cobro automático, logística ni reserva de stock.
