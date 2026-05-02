# Guía de Diseño — Web Fernando Flores Pérez

## Identidad visual

### Paleta de colores

| Token                | Modo claro  | Modo oscuro | Uso                         |
|----------------------|-------------|-------------|-----------------------------|
| `--color-brand`      | `#1B2A6B`   | `#2E4A9E`   | Cabecera, énfasis, CTA      |
| `--color-accent`     | `#C9A84C`   | `#D4B865`   | Iconos, bordes hover, links |
| `--bg-primary`       | `#F4F6FB`   | `#0E1728`   | Fondo de página             |
| `--bg-secondary`     | `#FFFFFF`   | `#162040`   | Fondo de secciones alternas |
| `--bg-card`          | `#FFFFFF`   | `#1B2A4E`   | Tarjetas y paneles          |
| `--text-primary`     | `#1A1F33`   | `#E8EEF7`   | Texto principal             |
| `--text-secondary`   | `#4A5270`   | `#9BABC9`   | Subtítulos, descripciones   |
| `--border`           | `#D8DEF0`   | `#263660`   | Bordes suaves               |
| `--shadow`           | `rgba(27,42,107,.10)` | `rgba(0,0,0,.35)` | Sombras de tarjetas |

### Acento dorado
El dorado `#C9A84C` evoca el trigo y la maquinaria agrícola. Se usa con moderación como
acento para separadores, iconos y estados hover — nunca como color de fondo de área grande.

---

## Tipografía

| Rol        | Familia             | Pesos cargados | Uso                              |
|------------|---------------------|----------------|----------------------------------|
| Títulos    | Playfair Display    | 400, 700       | `<h1>`, `<h2>`, nombre           |
| Cuerpo     | Lora                | 400, 500       | Párrafos, etiquetas, nav         |

- Tamaño base: `16px` en móvil, `17px` en escritorio
- Escala tipográfica: `h1` 2.2rem → `h2` 1.7rem → `h3` 1.25rem
- Interlineado: `1.7` en párrafos, `1.2` en títulos grandes
- No se usarán nunca: Inter, Roboto, Arial, Helvetica como primera opción

---

## Espaciado y layout

- Sistema de 8px: márgenes y paddings en múltiplos de 8 (8, 16, 24, 32, 48, 64, 96px)
- Ancho máximo de contenido: `1100px`, centrado
- Padding horizontal de sección: `24px` móvil → `48px` escritorio
- Las secciones principales tienen `padding-block: 80px` escritorio, `56px` móvil

---

## Componentes

### Cabecera fija
- Fondo: `--color-brand` con ligera transparencia + blur (backdrop-filter)
- Altura: `64px` móvil, `72px` escritorio
- Logo a la izquierda, nav central/derecha, toggle tema a la derecha
- Sombra suave al hacer scroll (clase `.scrolled` añadida por JS)

### Tarjetas de carpeta (catálogos)
- Fondo: `--bg-card`
- Borde: `1px solid --border`
- Borde-radio: `12px`
- Sombra en reposo: sutil (`--shadow`)
- Hover: elevación con `translateY(-4px)` y sombra más pronunciada
- Transición: `transform 0.25s ease, box-shadow 0.25s ease`
- Icono de carpeta + nombre en `textContent` (nunca `innerHTML` con datos externos)

### Ítems de PDF
- Lista compacta dentro de la carpeta expandida
- Icono PDF rojo + nombre del archivo
- Hover: background tintado con acento dorado suave
- `target="_blank"` con `rel="noopener noreferrer"`

### Tarjetas de contacto
- Tres tarjetas: Teléfono, Horario, Dirección
- Iconos SVG inline (no dependencia de librería de iconos)
- Clickables donde corresponda (teléfono y dirección)

---

## Animaciones

### Principios
- Elegancia por encima de espectáculo
- Duración máxima: 600ms
- Solo se anima `opacity`, `transform` y `box-shadow` (GPU-friendly)
- Respetar `prefers-reduced-motion`

### Animaciones concretas
| Tipo              | Implementación                                              |
|-------------------|-------------------------------------------------------------|
| Entrada al scroll | `IntersectionObserver` → clase `.visible` → fade + translateY(20px→0) |
| Carga de página   | Fade-in de `<body>` (opacity 0 → 1 en 400ms)               |
| Hover tarjeta     | `translateY(-4px)` + sombra via CSS transition              |
| Expansión PDFs    | `max-height` transition de 0 → auto via CSS                 |
| Spinner Drive     | Rotación continua via `@keyframes spin`                     |
| Toggle tema       | `transition: background-color 300ms, color 300ms` en `:root`|

---

## Accesibilidad

- Contraste de texto ≥ 4.5:1 en todos los modos
- Todos los elementos interactivos con `focus-visible` visible
- `alt` descriptivo en todas las imágenes
- `aria-label` en botón de tema
- Semántica HTML correcta: `<header>`, `<main>`, `<section>`, `<footer>`, `<nav>`

---

## Seguridad en el DOM

- **Nunca** `innerHTML` para datos de la API de Drive
- Usar siempre `document.createElement` + `element.textContent`
- Atributos como `href` solo de fuentes conocidas (prefijos validados)
- Los IDs de Drive se usan solo en URLs controladas (`https://drive.google.com/file/d/ID/view`)
