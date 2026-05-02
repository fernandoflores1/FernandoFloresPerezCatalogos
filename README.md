# Web personal — Fernando Flores Pérez · Casamayor Librada

Tarjeta de presentación digital con catálogo de PDFs conectado a Google Drive.  
Stack: HTML5 + CSS3 + JavaScript vanilla · Sin frameworks · Sin servidor.

---

## Requisitos previos

- Una cuenta de Google (para Google Cloud y Google Drive)
- Un repositorio de GitHub (para desplegar en Vercel)

---

## 1. Obtener la API Key de Google Drive (gratis)

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un **proyecto nuevo** (o usa uno existente)
3. En el menú lateral: **APIs y servicios → Biblioteca**
4. Busca **"Google Drive API"** y pulsa **Habilitar**
5. Ve a **APIs y servicios → Credenciales → Crear credenciales → Clave de API**
6. Copia la clave generada
7. (Recomendado) Restringe la clave a:
   - **Restricción de aplicación**: sitios web HTTP referentes → añade tu dominio
   - **Restricción de API**: Google Drive API

---

## 2. Crear el archivo de configuración local

```bash
# En la raíz del proyecto:
cp assets/js/config.example.js assets/js/config.js
```

Abre `assets/js/config.js` y rellena tu API Key:

```js
const CONFIG = {
  DRIVE_API_KEY: 'AIzaSy...',                        // ← tu clave aquí
  DRIVE_ROOT_FOLDER_ID: '1oHM88zT4X7PNdjLpkU8m6bIDGE5D4W24'
};
```

> `config.js` está en `.gitignore` y **nunca se sube a GitHub**.

---

## 3. Hacer la carpeta de Drive pública

Para que la API pueda leer los archivos sin necesidad de login:

1. Abre [Google Drive](https://drive.google.com) y navega a la carpeta raíz de catálogos
2. Clic derecho → **Compartir**
3. En "Acceso general", selecciona **"Cualquiera con el enlace"** → rol **Lector**
4. Guarda los cambios

> Repite este paso para **cada subcarpeta** de marcas/categorías.

---

## 4. Desplegar en Vercel (recomendado)

### Paso a paso

1. **Sube el proyecto a GitHub** (el archivo `config.js` NO se sube gracias al `.gitignore`)

2. **Conecta Vercel con GitHub**:
   - Ve a [vercel.com](https://vercel.com) → Inicia sesión con GitHub
   - Pulsa **"Add New Project"** → selecciona tu repositorio

3. **Añade la variable de entorno en Vercel** (para que la API Key no esté en el código):
   - En el panel del proyecto: **Settings → Environment Variables**
   - Añade: `DRIVE_API_KEY` = (tu API Key)
   - Guarda y redespliega

   > Para usar variables de entorno de Vercel, necesitarás un paso de build que inyecte
   > el valor en `config.js`. La solución más sencilla para un sitio estático es añadir
   > en `vercel.json` un `build.command` con `sed` o usar [Vercel Edge Config](https://vercel.com/docs/storage/edge-config).
   > **Para empezar**, puedes subir `config.js` directamente al repositorio privado
   > (solo si el repositorio es privado y de confianza).

4. **URL gratuita**: Vercel asigna automáticamente una URL del tipo:
   `https://nombre-proyecto.vercel.app`

5. **Dominio personalizado** (opcional):
   - En Vercel: **Settings → Domains → Add domain**
   - Apunta tu dominio con un registro CNAME en tu proveedor DNS

---

## 5. Alternativa: desplegar en Netlify

1. Ve a [netlify.com](https://www.netlify.com) → Inicia sesión
2. **"Add new site → Import an existing project"** → conecta con GitHub
3. Deja el "Build command" vacío y "Publish directory" como `/` (raíz)
4. Pulsa **Deploy**
5. En **Site configuration → Environment variables** puedes añadir `DRIVE_API_KEY`
6. El subdominio gratuito es del tipo `nombre-elegido.netlify.app`
   - Puedes personalizarlo en **Site configuration → Change site name**

---

## 6. Añadir la URL en WhatsApp Business

1. Abre **WhatsApp Business** en tu móvil
2. Ve a **Ajustes → Herramientas para la empresa → Perfil de empresa**
3. En el campo **Sitio web**, pega tu URL (p.ej. `https://fernandoflores.vercel.app`)
4. Guarda los cambios

Los clientes podrán tocar el enlace desde tu perfil o desde mensajes para ver los catálogos directamente.

---

## Estructura del proyecto

```
/
├── index.html                 ← página principal
├── assets/
│   ├── css/
│   │   ├── main.css           ← variables, reset, tipografía
│   │   ├── sections.css       ← estilos por sección
│   │   └── animations.css     ← keyframes y efectos
│   ├── js/
│   │   ├── config.example.js  ← plantilla pública (sí se sube)
│   │   ├── config.js          ← API Key real (NO se sube)
│   │   ├── theme.js           ← modo claro / oscuro
│   │   ├── drive.js           ← carga de catálogos de Drive
│   │   └── main.js            ← scroll, header, año del footer
│   └── img/
│       ├── logo.png           ← logo de Casamayor
│       └── foto.jpg           ← foto de Fernando
├── vercel.json                ← cabeceras de seguridad
├── .gitignore
└── README.md
```

---

## Añadir nuevos catálogos

Solo tienes que subir nuevas carpetas o PDFs a Google Drive en la carpeta raíz configurada.  
La web los cargará automáticamente en la próxima visita. No hace falta tocar el código.

---

## Notas importantes

- Los **precios de productos nunca se muestran** en ningún lugar de la web
- El código está comentado en español para facilitar el mantenimiento
- Optimizado para móvil (los clientes la abrirán desde WhatsApp)
