# Proposal

## Why

Fábrica de Alfombras Catamarca necesita presentar su identidad y su trabajo artesanal, publicar novedades y ofrecer alfombras para la venta desde una misma aplicación. Se aprovecharán las referencias locales ya desarrolladas para mantener una experiencia conocida y administrable.

## What Changes

- Conservar la apariencia y estructura institucional de Feria del Libro, adaptando nombre, textos e imágenes a la fábrica.
- Reemplazar Cronograma e Invitados por La fábrica, Proceso artesanal y Colecciones; conservar noticias, reels, banner y ubicación.
- Agregar `/tienda` con el diseño de Tienda Cata: crema y dorado, tarjetas con fotografías ampliables, precios, estado vendido y carrito.
- Crear pedidos pendientes y abrir WhatsApp con su resumen; pago y entrega se coordinan manualmente.
- Incorporar administración de contenido, productos y consulta de pedidos, con autenticación y datos en PocketBase.
- Alcance inicial: visitantes sin registro y personal administrador. Quedan fuera cobros en línea, logística automática, fabricación a medida y gestión de producción o inventario avanzado.

## Capabilities

### New Capabilities

- `sitio-institucional`: navegación, identidad visual, historia, proceso artesanal, noticias, reels y ubicación.
- `catalogo-alfombras`: colecciones, productos publicados y presentación comercial.
- `pedidos-whatsapp`: carrito, validación del pedido y coordinación de venta por WhatsApp.
- `administracion-contenido`: acceso del personal, edición, publicación y configuración.

### Modified Capabilities

Ninguna: el proyecto actual conserva la plantilla inicial y no tiene especificaciones consolidadas.

## Impact

Se desarrollarán páginas y componentes en el proyecto Next.js actual, integración con PocketBase y migraciones propias. Las referencias `C:/Proyectos/feria-libro` y `C:/Proyectos/tienda-cata` se consultan sin modificarlas; no se copiarán sus credenciales, datos privados ni instancias de base de datos. La implementación deberá seguir las guías de Next.js instaladas en este proyecto.
