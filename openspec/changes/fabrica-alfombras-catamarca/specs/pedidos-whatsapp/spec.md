# Spec Delta

## Purpose

Permitir preparar pedidos de alfombras desde un carrito y continuar la conversación comercial por WhatsApp con un resumen persistido.

## ADDED Requirements

### Requirement: Carrito persistente sin registro
El visitante SHALL agregar alfombras disponibles, cambiar cantidades enteras positivas, quitar líneas y consultar subtotales y total. El carrito SHALL conservarse al recargar en el mismo navegador sin exigir cuenta.

#### Scenario: Editar carrito
- **WHEN** el visitante agrega dos unidades, recarga y luego quita la línea
- **THEN** el carrito conserva inicialmente las dos unidades y después actualiza el total y su estado vacío.

### Requirement: Validación comercial del pedido
La confirmación SHALL exigir email válido y un carrito no vacío, validar cantidades y disponibilidad y recalcular precios vigentes en el servidor. Un cambio de precio SHALL requerir nueva confirmación del visitante.

#### Scenario: Producto ya vendido
- **WHEN** se confirma un carrito que contiene una alfombra vendida o despublicada
- **THEN** se rechaza la confirmación, se explica qué producto cambió y no se crea un pedido parcial.

#### Scenario: Manipulación del total
- **WHEN** el navegador envía precios o totales alterados
- **THEN** esos valores no se usan para fijar el importe del pedido.

#### Scenario: Precio actualizado
- **WHEN** el precio vigente difiere del visto al preparar el carrito
- **THEN** se informa el nuevo importe antes de permitir una nueva confirmación.

### Requirement: Pedido pendiente antes de WhatsApp
El sistema SHALL guardar un pedido pendiente con referencia, email, fecha, productos, cantidades, precios y total antes de ofrecer el enlace de WhatsApp. El resumen SHALL conservar los importes originales aunque luego cambie el catálogo.

#### Scenario: Confirmación correcta
- **WHEN** se confirma un carrito válido
- **THEN** se crea un único pedido para esa confirmación y se ofrece WhatsApp con referencia, productos, cantidades, total y email.

#### Scenario: Reintento o fallo de guardado
- **WHEN** se repite la misma confirmación o falla el guardado
- **THEN** el reintento reutiliza el pedido ya creado, o se informa el error sin abrir WhatsApp si no se guardó.

### Requirement: Coordinación manual y privacidad
El sistema SHALL informar que pago y entrega se coordinan manualmente; no SHALL interpretar abrir WhatsApp como mensaje enviado, cobro o reserva de stock. Los pedidos no SHALL ser enumerables públicamente.

#### Scenario: WhatsApp no abre
- **WHEN** el dispositivo no abre WhatsApp tras crear el pedido
- **THEN** se conserva la referencia y se ofrece reintentar el enlace sin crear otro pedido ni marcarlo como pagado.

#### Scenario: Consulta no autorizada
- **WHEN** un visitante intenta listar pedidos o consultar un identificador ajeno sin autorización
- **THEN** no obtiene los datos personales ni el resumen del pedido.
