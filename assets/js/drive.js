// =====================================================================
// drive.js — Catálogos de Google Drive con modal y miniaturas
//
// Producción (Vercel): usa /api/catalogos — la API key nunca llega al navegador.
// Local:               llama directamente a Drive API con config.js.
//
// SEGURIDAD: nunca se usa innerHTML con datos externos.
//            Todos los textos externos se insertan con textContent.
// =====================================================================

(function () {
  'use strict';

  var DRIVE_BASE  = 'https://www.googleapis.com/drive/v3/files';
  var MIME_FOLDER = 'application/vnd.google-apps.folder';
  var ES_LOCAL    = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);

  // ----------------------------------------------------------------
  // API: obtener carpetas raíz
  // ----------------------------------------------------------------
  async function fetchCarpetas() {
    return ES_LOCAL
      ? fetchDirectoQuery(CONFIG.DRIVE_ROOT_FOLDER_ID, "mimeType='" + MIME_FOLDER + "'")
      : fetchProxy('carpetas', null);
  }

  // ----------------------------------------------------------------
  // API: obtener archivos de una carpeta (cualquier tipo excepto subcarpetas)
  // ----------------------------------------------------------------
  async function fetchArchivos(folderId) {
    return ES_LOCAL
      ? fetchDirectoQuery(folderId, "mimeType!='" + MIME_FOLDER + "'")
      : fetchProxy('archivos', folderId);
  }

  // ----------------------------------------------------------------
  // Proxy seguro (producción)
  // ----------------------------------------------------------------
  async function fetchProxy(accion, carpetaId) {
    var params = accion === 'carpetas'
      ? new URLSearchParams({ accion: 'carpetas' })
      : new URLSearchParams({ accion: 'archivos', carpeta: carpetaId });

    var r = await fetch('/api/catalogos?' + params.toString());

    if (!r.ok) {
      var msg = '';
      try { msg = await r.text(); } catch (e) {}
      console.error('[drive.js] Error servidor:', r.status, msg);
      throw new Error('Error del servidor: ' + r.status);
    }

    var datos = await r.json();
    return datos.files || [];
  }

  // ----------------------------------------------------------------
  // Llamada directa a Drive (desarrollo local)
  // ----------------------------------------------------------------
  async function fetchDirectoQuery(folderId, filtroMime) {
    if (typeof CONFIG === 'undefined' || !CONFIG.DRIVE_API_KEY || CONFIG.DRIVE_API_KEY === 'TU_API_KEY_AQUI') {
      throw new Error('API Key no configurada en config.js');
    }
    var params = new URLSearchParams({
      q:        "'" + folderId + "' in parents and trashed=false and " + filtroMime,
      fields:   'files(id,name,mimeType)',
      orderBy:  'name',
      pageSize: '100',
      key:      CONFIG.DRIVE_API_KEY
    });
    var r = await fetch(DRIVE_BASE + '?' + params.toString());
    if (!r.ok) throw new Error('Error Drive API: ' + r.status);
    var datos = await r.json();
    return datos.files || [];
  }

  // ----------------------------------------------------------------
  // Helpers SVG
  // ----------------------------------------------------------------
  function crearSvg(attrs) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    Object.keys(attrs).forEach(function (k) { svg.setAttribute(k, attrs[k]); });
    return svg;
  }

  function crearNs(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }

  function iconoCarpeta() {
    var svg = crearSvg({ width: '40', height: '40', viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round',
      'stroke-linejoin': 'round', 'aria-hidden': 'true' });
    svg.appendChild(crearNs('path', { d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' }));
    return svg;
  }

  function iconoArchivo(mimeType) {
    var esImagen = mimeType && mimeType.startsWith('image/');
    var svg = crearSvg({ width: '18', height: '18', viewBox: '0 0 24 24', fill: 'none',
      stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round',
      'stroke-linejoin': 'round', 'aria-hidden': 'true',
      class: esImagen ? 'pdf-icon file-icon--image' : 'pdf-icon file-icon--doc' });

    if (esImagen) {
      svg.appendChild(crearNs('rect', { x: '3', y: '3', width: '18', height: '18', rx: '2', ry: '2' }));
      svg.appendChild(crearNs('circle', { cx: '8.5', cy: '8.5', r: '1.5' }));
      svg.appendChild(crearNs('polyline', { points: '21 15 16 10 5 21' }));
    } else {
      svg.appendChild(crearNs('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }));
      svg.appendChild(crearNs('polyline', { points: '14 2 14 8 20 8' }));
    }
    return svg;
  }

  // ----------------------------------------------------------------
  // MODAL — abrir, cerrar y rellenar
  // ----------------------------------------------------------------
  function abrirModal(carpeta) {
    var modal  = document.getElementById('catalog-modal');
    var titulo = document.getElementById('modal-title');
    var cuerpo = document.getElementById('modal-body');
    if (!modal) return;

    titulo.textContent = carpeta.name;

    // Limpiar y mostrar spinner
    while (cuerpo.firstChild) cuerpo.removeChild(cuerpo.firstChild);
    var spinWrap = document.createElement('div');
    spinWrap.className = 'modal-spinner';
    var spin = document.createElement('div');
    spin.className = 'spinner';
    spinWrap.appendChild(spin);
    cuerpo.appendChild(spinWrap);

    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    // Cargar archivos
    fetchArchivos(carpeta.id).then(function (archivos) {
      while (cuerpo.firstChild) cuerpo.removeChild(cuerpo.firstChild);
      renderContenidoModal(cuerpo, archivos);
    }).catch(function (err) {
      while (cuerpo.firstChild) cuerpo.removeChild(cuerpo.firstChild);
      var p = document.createElement('p');
      p.className   = 'modal-empty';
      p.textContent = 'No se pudo cargar el contenido. Inténtalo más tarde.';
      cuerpo.appendChild(p);
      console.error('[drive.js] Error cargando modal:', err);
    });
  }

  function cerrarModal() {
    var modal = document.getElementById('catalog-modal');
    if (!modal) return;
    modal.hidden = true;
    document.body.style.overflow = '';
  }

  function renderContenidoModal(cuerpo, archivos) {
    if (archivos.length === 0) {
      var vacio = document.createElement('p');
      vacio.className   = 'modal-empty';
      vacio.textContent = 'Esta carpeta no tiene archivos disponibles.';
      cuerpo.appendChild(vacio);
      return;
    }

    var imagenes = archivos.filter(function (f) { return f.mimeType && f.mimeType.startsWith('image/'); });
    var docs     = archivos.filter(function (f) { return !f.mimeType || !f.mimeType.startsWith('image/'); });

    // --- Cuadrícula de imágenes ---
    if (imagenes.length > 0) {
      if (docs.length > 0) {
        var labelImg = document.createElement('p');
        labelImg.className   = 'modal-section-label';
        labelImg.textContent = 'Imágenes';
        cuerpo.appendChild(labelImg);
      }

      var grid = document.createElement('div');
      grid.className = 'img-grid';

      imagenes.forEach(function (img) {
        var a = document.createElement('a');
        a.className = 'img-grid-item';
        a.href      = 'https://drive.google.com/file/d/' + encodeURIComponent(img.id) + '/view';
        a.target    = '_blank';
        a.rel       = 'noopener noreferrer';
        a.setAttribute('aria-label', 'Ver: ' + img.name);

        var imagen = document.createElement('img');
        // Miniatura pública de Drive (funciona con archivos compartidos "cualquiera con el enlace")
        imagen.src     = 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(img.id) + '&sz=w320';
        imagen.alt     = img.name;
        imagen.loading = 'lazy';
        // Si la miniatura falla, mostrar icono genérico
        imagen.onerror = function () {
          this.style.display = 'none';
          var ph = document.createElement('div');
          ph.className   = 'img-placeholder';
          ph.textContent = '🖼';
          this.parentNode.appendChild(ph);
        };

        a.appendChild(imagen);
        grid.appendChild(a);
      });

      cuerpo.appendChild(grid);
    }

    // --- Lista de documentos (PDFs, etc.) ---
    if (docs.length > 0) {
      if (imagenes.length > 0) {
        var labelDoc = document.createElement('p');
        labelDoc.className   = 'modal-section-label';
        labelDoc.textContent = 'Documentos';
        cuerpo.appendChild(labelDoc);
      }

      var lista = document.createElement('div');
      lista.className = 'modal-file-list';

      docs.forEach(function (doc) {
        var link = document.createElement('a');
        link.className = 'pdf-item';
        link.href      = 'https://drive.google.com/file/d/' + encodeURIComponent(doc.id) + '/view';
        link.target    = '_blank';
        link.rel       = 'noopener noreferrer';
        link.setAttribute('aria-label', 'Abrir: ' + doc.name);

        var nombre = document.createElement('span');
        nombre.className   = 'pdf-name';
        nombre.textContent = doc.name;

        link.appendChild(iconoArchivo(doc.mimeType));
        link.appendChild(nombre);
        lista.appendChild(link);
      });

      cuerpo.appendChild(lista);
    }
  }

  // ----------------------------------------------------------------
  // Tarjeta de carpeta (simplificada — solo abre modal, sin expansión)
  // ----------------------------------------------------------------
  function crearTarjetaCarpeta(carpeta, indice) {
    var card = document.createElement('div');
    card.className = 'folder-card';
    card.style.setProperty('--card-index', indice);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Abrir catálogo: ' + carpeta.name);

    var header = document.createElement('div');
    header.className = 'folder-header';

    var iconoWrap = document.createElement('span');
    iconoWrap.className = 'folder-icon';
    iconoWrap.appendChild(iconoCarpeta());

    var nombre = document.createElement('span');
    nombre.className   = 'folder-name';
    nombre.textContent = carpeta.name;

    // Pequeña flecha "abrir" en lugar del chevron desplegable
    var hint = document.createElement('span');
    hint.className = 'folder-open-hint';
    hint.setAttribute('aria-hidden', 'true');
    hint.textContent = 'Ver →';

    header.appendChild(iconoWrap);
    header.appendChild(nombre);
    header.appendChild(hint);
    card.appendChild(header);

    card.addEventListener('click', function () { abrirModal(carpeta); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirModal(carpeta); }
    });

    return card;
  }

  // ----------------------------------------------------------------
  // Inicializar eventos del modal (cierre)
  // ----------------------------------------------------------------
  function initModal() {
    var modal   = document.getElementById('catalog-modal');
    var btnClose = document.getElementById('modal-close-btn');
    if (!modal) return;

    btnClose.addEventListener('click', cerrarModal);

    // Cerrar al hacer clic en el fondo oscuro
    modal.addEventListener('click', function (e) {
      if (e.target === modal) cerrarModal();
    });

    // Cerrar con Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) cerrarModal();
    });
  }

  // ----------------------------------------------------------------
  // Punto de entrada: carga carpetas y monta el grid
  // ----------------------------------------------------------------
  async function iniciarCatalogos() {
    var grid    = document.getElementById('catalogs-grid');
    var spinner = document.getElementById('catalogs-spinner');
    var errorEl = document.getElementById('catalogs-error');
    var errText = document.getElementById('catalogs-error-text');

    if (!grid) return;

    if (ES_LOCAL) {
      var sinConfig = typeof CONFIG === 'undefined' || !CONFIG.DRIVE_API_KEY || CONFIG.DRIVE_API_KEY === 'TU_API_KEY_AQUI';
      if (sinConfig) {
        if (spinner) spinner.hidden = true;
        if (errorEl) { errorEl.hidden = false; if (errText) errText.textContent = 'Rellena DRIVE_API_KEY en assets/js/config.js para ver los catálogos en local.'; }
        return;
      }
    }

    try {
      var carpetas = await fetchCarpetas();
      if (spinner) spinner.hidden = true;

      if (carpetas.length === 0) {
        if (errorEl) { errorEl.hidden = false; if (errText) errText.textContent = 'Aún no hay catálogos disponibles. Vuelve pronto.'; }
        return;
      }

      carpetas.forEach(function (carpeta, i) {
        grid.appendChild(crearTarjetaCarpeta(carpeta, i));
      });

    } catch (err) {
      if (spinner) spinner.hidden = true;
      if (errorEl) { errorEl.hidden = false; if (errText) errText.textContent = 'No se ha podido conectar con los catálogos. Comprueba tu conexión e inténtalo de nuevo.'; }
      console.error('[drive.js] Error al cargar catálogos:', err);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initModal();
    iniciarCatalogos();
  });

})();
