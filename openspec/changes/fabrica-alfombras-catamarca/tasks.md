# Tasks

## 1. Base e integración de datos

- [x] 1.1 Leer las guías locales de Next.js para layouts, estilos, acciones, cookies y rutas dinámicas; registrar las APIs elegidas en documentación técnica con sus referencias.
- [x] 1.2 Preparar cliente de PocketBase de servidor y variables de ejemplo sin secretos; verificar conexión y que las credenciales no lleguen al bundle cliente.
- [x] 1.3 Crear migraciones de las colecciones y reglas del diseño; verificar en instancia de prueba que ejecutarlas dos veces no duplique registros ni abra acceso a borradores o pedidos.
- [x] 1.4 Documentar preparación del entorno y primer administrador; ejecutar los pasos en la base de prueba y verificar acceso sin alta pública.

## 2. Administración y publicación

- [x] 2.1 Implementar login, sesión y logout del personal; comprobar acceso válido, sesión inválida y rechazo de endpoints directos sin autenticar.
- [x] 2.2 Adaptar formularios editoriales para noticias, reels, colecciones y productos; verificar CRUD, borrador, publicación, duplicación con imagen, vista previa y prioridad.
- [x] 2.3 Implementar edición de banner, páginas institucionales y configuración pública/comercial; comprobar persistencia de cambios y rechazo de WhatsApp inválido.
- [x] 2.4 Validar archivos, URLs y texto enriquecido; añadir pruebas de cargas inválidas, contenido ejecutable y solicitudes de origen no permitido.
- [x] 2.5 Documentar cómo publicar y marcar productos vendidos; verificar el recorrido completo desde el panel hasta la consulta pública sin filtrar borradores.

## 3. Sitio institucional

- [x] 3.1 Reproducir composición, estilos y tipografía de Feria del Libro con identidad de la fábrica; comparar capturas de portada en escritorio y móvil y comprobar ausencia de textos del evento.
- [x] 3.2 Crear La fábrica y Proceso artesanal, navegación y ubicación; verificar enlaces, teclado, menú móvil y estados de contenido pendiente.
- [x] 3.3 Implementar noticias, detalles y reels publicados; verificar orden, límite de portada, listado completo y enlaces externos.
- [x] 3.4 Implementar listado y detalle de colecciones con enlace a tienda filtrada; verificar que una colección en borrador no sea accesible públicamente.

## 4. Tienda y carrito

- [x] 4.1 Implementar tienda con estilos aislados de Tienda Cata, tarjetas y filtro por colección; comparar capturas y verificar que navegar entre tienda e inicio no mezcle estilos.
- [x] 4.2 Implementar ampliación de fotografía y datos de alfombra; verificar teclado, foco, cierre del diálogo, etiqueta Vendido y bloqueo de agregar.
- [x] 4.3 Implementar carrito persistente con cantidades, eliminación y totales; verificar recarga, almacenamiento local inválido y carrito vacío.
- [x] 4.4 Diferenciar error de catálogo y catálogo vacío; comprobar ambos estados con fallos simulados y documentar el comportamiento.

## 5. Pedidos y WhatsApp

- [x] 5.1 Implementar confirmación en servidor con email, límites de entrada, control de frecuencia, disponibilidad y precios vigentes; probar cantidades inválidas, total manipulado, producto vendido y reconfirmación por cambio de precio.
- [x] 5.2 Guardar líneas e importes inmutables, token privado y clave única de confirmación; verificar reintentos concurrentes sin duplicados ni pedidos parciales ante fallo.
- [x] 5.3 Crear resumen privado y enlace WhatsApp con número configurado; verificar referencia, productos, cantidades, total y email, y reintento del enlace sin crear pedido nuevo.
- [x] 5.4 Implementar consulta administrativa de pedidos; probar denegación pública, token inválido y conservación del resumen tras editar o eliminar productos.
- [x] 5.5 Documentar coordinación manual, ausencia de reserva y recuperación si WhatsApp no abre; comprobar esos avisos en carrito y resumen.

## 6. Integración y preparación para publicación

- [x] 6.1 Ejecutar lint y build, y recorrer publicación de contenido → colección → tienda → carrito → pedido → consulta administrativa; registrar resultados y corregir fallos.
- [x] 6.2 Revisar visualmente ambas referencias en escritorio y móvil, navegación por teclado y ausencia de desbordamiento; conservar evidencia de las pantallas principales.
- [x] 6.3 Preparar lista de datos reales pendientes, configuración de despliegue y procedimiento de respaldo/reversión; verificar que no se habiliten pedidos sin WhatsApp válido ni se incluyan secretos o datos de las referencias.
