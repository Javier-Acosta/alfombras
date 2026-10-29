# Design

## Context

Ver `proposal.md` para la motivación. El proyecto actual es una plantilla Next.js 16.4 con React 19 y OpenSpec. Se inspeccionaron en las referencias `app/page.tsx`, estilos, componentes de navegación y catálogo, documentación de administración y ventas. Feria del Libro dispone de `components/`, `lib/`, endpoints administrativos y migraciones PocketBase. Tienda Cata usa `app/components/`, `app/lib/`, acciones de servidor, carrito local y pedidos pendientes con token. Las referencias usan versiones de Next.js distintas: no se trasladarán APIs sin revisar las guías locales del proyecto destino.

## Goals / Non-Goals

**Goals:** separar presentación institucional y comercial, compartir datos y autenticación, definir migraciones reproducibles y verificaciones de comportamiento.

**Non-Goals:** copiar bases existentes, contenido del evento, usuarios o secretos; introducir un segundo proyecto Next.js o cambiar el stack para reproducir las referencias.

## Decisions

### Dos áreas visuales en una aplicación

Usar App Router con grupos de rutas y un marco público compartido (`SiteFrame`) para el tema configurado, logo, encabezado, menú completo y pie. La tienda y las páginas institucionales usan la misma identidad visual a pedido del usuario; el catálogo y el carrito conservan CSS Modules para sus componentes y heredan las variables y la tipografía institucionales. Verificar la continuidad al navegar entre Home y tienda, junto con el carrito y el diálogo, en escritorio y móvil.

Rutas propuestas: `/`, `/la-fabrica`, `/proceso-artesanal`, `/colecciones`, `/colecciones/[id]`, `/noticias`, `/noticias/[id]`, `/tienda`, `/pedido/[token]`, `/admin/login`, `/admin` y pantallas de contenido, productos, pedidos y configuración. Ubicación será una sección del inicio. No se crearán rutas de cronograma o invitados. El detalle ampliado de producto seguirá el diálogo de Tienda Cata, con foco controlado y cierre por teclado.

### PocketBase independiente

Usar una instancia o base exclusiva de la fábrica. Consultas públicas sin privilegios limitadas a publicaciones; mutaciones y pedidos mediante servidor. Migraciones propias idempotentes y credenciales solo en entorno. La alternativa de reutilizar la base de una referencia mezcla datos y permisos de aplicaciones independientes.

Modelo inicial propuesto:

| Colección | Datos principales | Acceso |
| --- | --- | --- |
| staff (auth) | email, nombre, credenciales | personal habilitado; sin alta pública |
| site_settings | nombre, descripción, logo, colores, redes, pie, dirección, enlace de mapa, WhatsApp | lectura pública de campos públicos; escritura personal |
| institutional_pages | clave factory/process, título, cuerpo, imagen, published | público solo publicado |
| banners | título, imagen, published, priority | público solo publicado |
| news | título, resumen, cuerpo, imagen, fecha, published, priority | público solo publicado |
| reels | título, URL, portada, published, priority | público solo publicado |
| collections | nombre, descripción, imagen, published, priority | público solo publicado |
| products | nombre, descripción, imagen, precio entero en centavos, moneda ARS, medidas, materiales, colección opcional, sold, published, priority | público solo publicado |
| orders | referencia, hash del token de acceso, clave de idempotencia única, email, estado pending, líneas JSON inmutables, total entero, moneda | sin lectura o escritura pública directa |

Supuestos de primera versión: un rol de personal administrador; una imagen principal por producto como en Tienda Cata; medidas y materiales descriptivos opcionales; disponibilidad manual mediante Vendido, sin conteo automático de existencias. No se implementa gestión de ayudantes en este alcance. Orden de listas: prioridad descendente y creación descendente; banner por prioridad y actualización. Portada con hasta seis noticias y acceso al listado completo.

### Flujo de compra sin pasarela

Guardar solo identificadores y cantidades del carrito en almacenamiento local con una clave propia de alfombras; validar también su formato al recuperarlo. Mostrar precios de catálogo, pero resolver disponibilidad e importes de nuevo en servidor. Ante precio cambiado, devolver carrito actualizado para nueva confirmación. Rechazar vendido/despublicado y cantidades fuera de límites documentados. Crear el pedido mediante una única escritura que incluya todas las líneas para evitar pedidos parciales. Una clave de confirmación única evita duplicados en reintentos; no usar el precio del cliente como fuente de verdad.

Después de guardar, presentar resumen en `/pedido/[token]` con token aleatorio no adivinable, no indexable y sin recursos de terceros que filtren la URL. Persistir hash del token; acceso solo al resumen asociado. WhatsApp usa exclusivamente el número comercial validado en configuración y un mensaje codificado. Reabrir WhatsApp reutiliza el pedido. No existe garantía de envío del mensaje ni reserva: otros compradores pueden solicitar la misma pieza y el personal resuelve disponibilidad manualmente.

### Administración única

Adaptar formularios y flujo editorial de Feria del Libro para contenido y productos, con precio y vendido de Tienda Cata. Sesión de personal con cookie HttpOnly, SameSite y Secure en producción, validada con PocketBase. Verificar origen y permisos en mutaciones; sanitizar contenido enriquecido y restringir URLs y archivos. Límites iniciales: imágenes PNG/JPEG/WebP hasta 5 MB, banner hasta 10 MB, informados junto al campo. El MVP consulta pedidos, sin incorporar estados contables o logísticos nuevos. El número de WhatsApp no se hereda de Tienda Cata.

## Risks / Trade-offs

- [CSS y tipografías de referencias] → aislar estilos y verificar ambos espacios tras cada integración.
- [Solicitud de la misma alfombra por varias personas] → aviso de coordinación manual; pedido pendiente no reserva ni descuenta unidades.
- [Abuso de creación pública de pedidos] → límites de líneas/cantidades, tamaño de entrada, control de frecuencia en servidor y mensajes sin revelar internals.
- [Filtración de borradores o pedidos] → reglas PocketBase y pruebas de acceso directo sin sesión; token de acceso no enumerable.
- [Faltan activos institucionales] → estados vacíos y contenido de prueba solo local; no publicar historia, dirección o productos inventados.

## Migration Plan

1. Preparar variables de entorno de ejemplo sin valores privados; confirmar destino PocketBase antes de aplicar migraciones remotas.
2. Crear esquema en entorno de prueba, reglas y primer usuario mediante mecanismo privado; verificar repetición de migraciones.
3. Implementar y comprobar contenido, catálogo y pedido completo con productos de prueba; revisar visualmente las referencias.
4. Cargar logo, banner, contenido y número comercial reales antes de habilitar pedidos; publicar solo material aprobado.
5. Para despliegue, respaldar datos y archivos. Ante fallo, volver a la versión anterior de la aplicación; restaurar base solo mediante respaldo verificado, conservando los pedidos nuevos antes de revertir datos.

## Open Questions

- Logo, banner, fotografías, historia y textos definitivos de proceso artesanal.
- Dirección, horarios de atención, redes y número comercial de WhatsApp.
- URL pública y destino de despliegue; no bloquean la especificación funcional.
