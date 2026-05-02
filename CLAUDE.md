# Proyecto: Web personal de Fernando Flores Pérez — Casamayor Librada

## Skill de diseño
Lee el archivo `frontend-design.md` antes de escribir cualquier línea de HTML, CSS o JS.
Aplica sus principios de diseño en todo el proyecto sin excepción.

---

## Contexto del proyecto
Web personal y profesional para Fernando Flores Pérez, Jefe de Suministro de la tienda
Casamayor Librada (Mérida, Badajoz). Actúa como tarjeta de presentación digital y
catálogo de recursos para sus clientes. Se desplegará en **Vercel** (gratuito, permite
dominio personalizado) o en **Netlify** como alternativa (también gratuito con dominio
personalizable).

---

## Stack técnico
- HTML5, CSS3 y JavaScript vanilla (sin frameworks, sin dependencias de servidor)
- Proyecto **multi-archivo** con estructura clara y separación de responsabilidades
- Google Drive API (clave pública, sin OAuth) para leer carpetas y PDFs
- Compatible con móvil en primer lugar (mobile-first)

---

## Estructura de archivos del proyecto
```
/
├── index.html              ← estructura HTML principal
├── assets/
│   ├── css/
│   │   ├── main.css        ← estilos generales, variables, tipografía
│   │   ├── sections.css    ← estilos de cada sección
│   │   └── animations.css  ← keyframes y efectos de entrada
│   ├── js/
│   │   ├── config.example.js  ← plantilla pública (sin datos sensibles)
│   │   ├── config.js          ← API key real (en .gitignore, nunca se sube)
│   │   ├── theme.js           ← lógica del modo claro/oscuro
│   │   ├── drive.js           ← conexión y renderizado de catálogos de Drive
│   │   └── main.js            ← inicialización general y scroll effects
│   └── img/
│       ├── logo.png        ← logo de Casamayor (ya existe)
│       └── foto.jpg        ← foto de Fernando (puede no existir; usar placeholder)
├── vercel.json             ← cabeceras de seguridad y configuración de despliegue
├── .gitignore              ← incluye assets/js/config.js
├── frontend-design.md      ← skill de diseño (leer antes de empezar)
├── CLAUDE.md               ← este archivo
└── README.md               ← instrucciones para API key y despliegue
```

---

## Seguridad
- La API key de Google Drive se lee desde `assets/js/config.js`, que está en `.gitignore`
  y nunca se sube a GitHub ni a Vercel a través del repositorio
- Incluir `assets/js/config.example.js` como plantilla vacía para que cualquiera sepa
  cómo configurarlo:
  ```js
  // Copia este archivo como config.js y rellena tu API key
  const CONFIG = {
    DRIVE_API_KEY: 'TU_API_KEY_AQUI',
    DRIVE_ROOT_FOLDER_ID: '1oHM88zT4X7PNdjLpkU8m6bIDGE5D4W24'
  };
  ```
- Crear `vercel.json` con cabeceras `Content-Security-Policy`, `X-Frame-Options`,
  `X-Content-Type-Options` y `Referrer-Policy` para proteger la web de ataques básicos
- Sanitizar siempre los nombres de archivos y carpetas que devuelve la API de Drive antes
  de insertarlos en el DOM: usar `textContent` siempre, nunca `innerHTML` con datos externos
- No exponer rutas internas ni datos sensibles en el HTML

---

## Diseño

### Colores
- Base corporativa: azul marino `#1B2A6B` y blanco `#FFFFFF`
- **Elige tú los colores complementarios** que mejor armonicen con el logo de Casamayor
  (archivo `assets/img/logo.png`). Puede ser un acento dorado, gris azulado, verde oscuro
  o cualquier tono que quede elegante junto al azul marino. Que transmita confianza,
  campo y profesionalidad
- Definir todas las variables de color en `:root` dentro de `main.css`, con variantes
  para modo claro y modo oscuro

### Modo claro / modo oscuro
- Botón toggle visible en la cabecera (icono sol/luna)
- Por defecto, detectar la preferencia del sistema con `prefers-color-scheme`
- Guardar la elección del usuario en `localStorage` para recordarla entre visitas
- Transición suave entre modos (transition en background-color y color)

### Tipografía
- Elegir fuentes de Google Fonts distintivas y elegantes, acordes al sector
  agrícola-profesional. Nunca Inter, Roboto ni Arial
- Cargar solo los pesos necesarios para no penalizar la velocidad de carga

### Animaciones
- Efectos de entrada al hacer scroll: fade-in con ligero desplazamiento hacia arriba
  en secciones y tarjetas de catálogo (Intersection Observer API)
- Hover en tarjetas: ligera elevación con sombra suave y transición de color
- Transición suave al cargar la página
- Elegancia por encima de espectáculo: pocas animaciones pero bien ejecutadas

---

## Estructura de la web

### Cabecera fija
- Logo de Casamayor a la izquierda
- Navegación con enlaces ancla (Inicio, Catálogos)
- Botón toggle modo claro/oscuro a la derecha

### Sección 1 — Sobre mí
- Foto de perfil circular (placeholder elegante si `foto.jpg` no existe aún)
- **Nombre**: Fernando Flores Pérez
- **Puesto**: Jefe de Suministro — Casamayor Librada
- **Texto descriptivo**: genera un texto breve y profesional de 3-4 líneas que presente
  a Fernando como experto en suministros agrícolas y recambios, con trato cercano
  al cliente y amplio conocimiento del sector. Que suene natural y cercano, no corporativo
- **Teléfono**: 664 404 590 → enlace `tel:664404590` para llamar directamente desde móvil
- **Horario**:
  - Lunes a viernes: 07:00–14:00 y 16:30–20:00
  - Sábados: 07:00–13:00
- **Dirección**: Av. de Alange, Km.1, 800, 06800 Mérida, Badajoz → enlace a Google Maps

### Sección 2 — Catálogos
Conectada a Google Drive mediante la API pública (clave leída desde `CONFIG`).

**Carpeta raíz**: ID leído desde `CONFIG.DRIVE_ROOT_FOLDER_ID`

Comportamiento:
- Al cargar, leer automáticamente las subcarpetas de la carpeta raíz y mostrarlas
  como tarjetas con el nombre de cada marca o categoría
- Al tocar una tarjeta, mostrar los PDFs que contiene con animación suave
- Al tocar un PDF, abrirlo en una nueva pestaña del navegador
- Si se añaden carpetas o PDFs nuevos en Drive, aparecen automáticamente sin tocar el código
- Spinner de carga mientras se obtienen los datos de Drive
- Mensaje claro si una carpeta está vacía o hay error de conexión

---

## README.md — debe incluir paso a paso
1. Cómo obtener la Google Drive API key (Google Cloud Console, gratis)
2. Cómo crear `config.js` a partir de `config.example.js` y pegar la API key
3. Cómo hacer la carpeta raíz de Drive pública ("cualquiera con el enlace")
4. Cómo desplegar en **Vercel** (recomendado):
   - Conectar el repositorio de GitHub a Vercel
   - Añadir la variable de entorno `DRIVE_API_KEY` en el panel de Vercel (así no va en el código)
   - URL gratuita tipo `fernandoflores.vercel.app` o conectar dominio propio
5. Como alternativa, cómo desplegar en **Netlify** (subdominio personalizable gratuito)
6. Cómo añadir la URL final en el perfil de WhatsApp Business

---

## Notas importantes
- Los precios de productos **nunca** se muestran en ningún lugar de la web
- Optimizada para móvil ya que los clientes la abrirán desde WhatsApp
- Código comentado en español, fácil de mantener por alguien sin experiencia técnica
- Para la API key en producción en Vercel: usar variables de entorno del panel de Vercel
  en lugar del archivo config.js, e inyectarla en el JS durante el build si es necesario