# Spec Delta

## Purpose

Presentar la identidad y el trabajo de Fábrica de Alfombras Catamarca conservando la experiencia visual del sitio Feria del Libro.

## ADDED Requirements

### Requirement: Apariencia institucional de referencia
El sitio SHALL conservar la composición, tipografía, colores, tarjetas, banner, noticias, reels y pie de Feria del Libro, sustituyendo identidad y contenido por los de la fábrica.

#### Scenario: Revisión de la portada
- **WHEN** se compara la portada con la referencia local de Feria del Libro
- **THEN** se reconoce la misma apariencia institucional, con el nombre Fábrica de Alfombras Catamarca y sin textos o imágenes del evento.

### Requirement: Navegación y secciones propias
El sitio SHALL ofrecer Inicio, La fábrica, Proceso artesanal, Colecciones, Noticias, Tienda y Ubicación, reemplazando Cronograma e Invitados.

#### Scenario: Recorrido institucional
- **WHEN** el visitante selecciona La fábrica o Proceso artesanal
- **THEN** accede al contenido publicado correspondiente, con imágenes y texto, y puede volver al inicio o abrir la tienda.

#### Scenario: Navegación móvil
- **WHEN** se visita desde una pantalla angosta
- **THEN** todas las opciones siguen accesibles mediante navegación adaptada, sin desbordamiento horizontal.

### Requirement: Noticias reels y ubicación
El sitio SHALL mostrar noticias publicadas con listado y detalle, reels con enlace externo y ubicación configurada de la fábrica, sin publicar información ficticia cuando falten datos.

#### Scenario: Contenido disponible
- **WHEN** existe una noticia publicada, un reel y una ubicación configurada
- **THEN** el visitante puede leer la noticia completa, abrir el reel y consultar la ubicación desde la portada.

#### Scenario: Contenido pendiente
- **WHEN** una sección no tiene contenido publicado
- **THEN** muestra un estado vacío claro y no expone borradores.
