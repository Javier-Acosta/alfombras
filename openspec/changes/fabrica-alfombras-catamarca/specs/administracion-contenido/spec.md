# Spec Delta

## Purpose

Permitir que el personal autorizado mantenga el sitio y la tienda sin editar código, protegiendo borradores y datos de los pedidos.

## ADDED Requirements

### Requirement: Acceso administrativo autenticado
El panel SHALL exigir autenticación del personal y verificar autorización en cada lectura privada y modificación. No SHALL permitir registro público de administradores ni exponer credenciales en el navegador.

#### Scenario: Acceso sin sesión
- **WHEN** una persona sin sesión solicita una operación administrativa
- **THEN** se exige iniciar sesión y se rechaza la operación, incluso accediendo directamente al endpoint.

#### Scenario: Cerrar sesión
- **WHEN** un administrador cierra sesión
- **THEN** no puede continuar consultando pedidos ni modificando contenido con esa sesión.

### Requirement: Gestión editorial
El panel SHALL permitir crear, editar, eliminar, previsualizar, guardar borradores, publicar, despublicar, duplicar y ordenar por prioridad noticias, reels, colecciones y alfombras. SHALL permitir editar el banner, La fábrica, Proceso artesanal y ubicación.

#### Scenario: Duplicación editorial
- **WHEN** se duplica una publicación con imagen
- **THEN** se crea una copia editable en borrador conservando la imagen sin modificar el original.

#### Scenario: Publicación y prioridad
- **WHEN** se publica contenido y se aumenta su prioridad
- **THEN** aparece antes que otros registros de su misma sección con menor prioridad; los borradores continúan privados.

### Requirement: Configuración y validación
El panel SHALL permitir editar nombre, descripción, logo, colores institucionales, redes, pie, ubicación y WhatsApp comercial. SHALL validar imágenes y campos requeridos y rechazar contenido ejecutable en textos enriquecidos.

#### Scenario: Archivo inválido
- **WHEN** se carga un archivo no permitido o que excede el límite informado
- **THEN** se rechaza con un mensaje y se conserva la información previa.

#### Scenario: Datos comerciales pendientes
- **WHEN** no hay un número de WhatsApp válido configurado
- **THEN** se informa en el panel y la tienda bloquea confirmar pedidos con una explicación al visitante.

### Requirement: Consulta de pedidos
El personal autorizado SHALL consultar pedidos con referencia, fecha, estado pendiente, email, productos, cantidades y total, sin marcar automáticamente pagos o entregas.

#### Scenario: Consultar pedido recibido
- **WHEN** el administrador abre un pedido creado desde la tienda
- **THEN** ve el resumen persistido y el email de contacto, aunque se hayan actualizado los productos.
