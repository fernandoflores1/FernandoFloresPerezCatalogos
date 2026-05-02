// =====================================================================
// drive.js — Carga y renderizado de catálogos desde Google Drive
//
// En PRODUCCIÓN (Vercel): usa /api/catalogos (proxy servidor).
//   → La API key NUNCA llega al navegador.
//
// En LOCAL (localhost): llama directamente a Drive API con config.js.
//   → Solo para desarrollo; la key no sale de tu máquina.
//
// SEGURIDAD: nunca se usa innerHTML con datos externos.
//            Todos los textos se insertan con textContent.
// =====================================================================

(function () {
  'use strict';

  var DRIVE_BASE  = 'https://www.googleapis.com/drive/v3/files';
  var MIME_FOLDER = 'application/vnd.google-apps.folder';
  var MIME_PDF    = 'application/pdf';

  // Detectar si estamos en local para elegir el modo de llamada
  var ES_LOCAL = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);

  // ----------------------------------------------------------------
  // Obtener hijos de una carpeta
  // ----------------------------------------------------------------
  async function fetchChildren(folderId, mimeType) {
    return ES_LOCAL
      ? fetchDirecto(folderId, mimeType)
      : fetchProxy(folderId, mimeType);
  }

  // ----------------------------------------------------------------
  // Modo producción: proxy seguro en el servidor de Vercel
  // La API key se queda en el servidor y nunca llega al navegador.
  // ----------------------------------------------------------------
  async function fetchProxy(folderId, mimeType) {
    var esCarpe  = mimeType === MIME_FOLDER;
    var params   = new URLSearchParams(
      esCarpe
        ? { accion: 'carpetas' }
        : { accion: 'archivos', carpeta: folderId }
    );

    var respuesta = await fetch('/api/catalogos?' + params.toString());

    if (!respuesta.ok) {
      throw new Error('Error del servidor: ' + respuesta.status);
    }

    var datos = await respuesta.json();
    return datos.files || [];
  }

  // ----------------------------------------------------------------
  // Modo local: llamada directa a Drive API (usa config.js local)
  // ----------------------------------------------------------------
  async function fetchDirecto(folderId, mimeType) {
    if (
      typeof CONFIG === 'undefined' ||
      !CONFIG.DRIVE_API_KEY ||
      CONFIG.DRIVE_API_KEY === 'TU_API_KEY_AQUI'
    ) {
      throw new Error('API Key no configurada en config.js para desarrollo local');
    }

    var params = new URLSearchParams({
      q:        "'" + folderId + "' in parents and trashed=false and mimeType='" + mimeType + "'",
      fields:   'files(id,name)',
      orderBy:  'name',
      pageSize: '100',
      key:      CONFIG.DRIVE_API_KEY
    });

    var respuesta = await fetch(DRIVE_BASE + '?' + params.toString());

    if (!respuesta.ok) {
      throw new Error('Error Drive API: ' + respuesta.status);
    }

    var datos = await respuesta.json();
    return datos.files || [];
  }

  // ----------------------------------------------------------------
  // Crear icono SVG de carpeta
  // ----------------------------------------------------------------
  function crearIconoCarpeta(tam) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width',  tam || '40');
    svg.setAttribute('height', tam || '40');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z');
    svg.appendChild(path);
    return svg;
  }

  // ----------------------------------------------------------------
  // Crear icono SVG de PDF
  // ----------------------------------------------------------------
  function crearIconoPdf() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('class', 'pdf-icon');
    svg.setAttribute('aria-hidden', 'true');
    var p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p1.setAttribute('d', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z');
    var p2 = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    p2.setAttribute('points', '14 2 14 8 20 8');
    svg.appendChild(p1);
    svg.appendChild(p2);
    return svg;
  }

  // ----------------------------------------------------------------
  // Crear icono de chevron (flecha)
  // ----------------------------------------------------------------
  function crearIconoChevron() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('class', 'folder-chevron');
    svg.setAttribute('aria-hidden', 'true');
    var pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    pl.setAttribute('points', '6 9 12 15 18 9');
    svg.appendChild(pl);
    return svg;
  }

  // ----------------------------------------------------------------
  // Abrir / cerrar la lista de PDFs de una tarjeta de carpeta
  // ----------------------------------------------------------------
  async function toggleCarpeta(card, folderId) {
    var estaAbierta = card.classList.contains('open');
    var pdfList     = card.querySelector('.pdf-list');

    if (estaAbierta) {
      card.classList.remove('open');
      pdfList.classList.remove('open');
      card.setAttribute('aria-expanded', 'false');
      return;
    }

    card.classList.add('open');
    pdfList.classList.add('open');
    card.setAttribute('aria-expanded', 'true');

    // Si ya están cargados no volvemos a pedir
    if (pdfList.dataset.loaded === 'true') return;

    // Spinner dentro de la tarjeta
    while (pdfList.firstChild) pdfList.removeChild(pdfList.firstChild);
    var loadingDiv = document.createElement('div');
    loadingDiv.className = 'folder-loading';
    var spinner = document.createElement('div');
    spinner.className = 'folder-spinner';
    loadingDiv.appendChild(spinner);
    pdfList.appendChild(loadingDiv);

    try {
      var pdfs = await fetchChildren(folderId, MIME_PDF);

      while (pdfList.firstChild) pdfList.removeChild(pdfList.firstChild);
      pdfList.dataset.loaded = 'true';

      if (pdfs.length === 0) {
        var vacio = document.createElement('p');
        vacio.className   = 'folder-empty';
        vacio.textContent = 'Esta carpeta no tiene catálogos disponibles.';
        pdfList.appendChild(vacio);
        return;
      }

      pdfs.forEach(function (pdf) {
        var link = document.createElement('a');
        link.className = 'pdf-item';
        link.href      = 'https://drive.google.com/file/d/' + encodeURIComponent(pdf.id) + '/view';
        link.target    = '_blank';
        link.rel       = 'noopener noreferrer';
        link.setAttribute('aria-label', 'Abrir: ' + pdf.name);

        var nombre = document.createElement('span');
        nombre.className   = 'pdf-name';
        nombre.textContent = pdf.name; // textContent siempre, nunca innerHTML

        link.appendChild(crearIconoPdf());
        link.appendChild(nombre);
        pdfList.appendChild(link);
      });

    } catch (err) {
      while (pdfList.firstChild) pdfList.removeChild(pdfList.firstChild);
      var errMsg = document.createElement('p');
      errMsg.className   = 'folder-empty';
      errMsg.textContent = 'No se pudo cargar este catálogo. Inténtalo más tarde.';
      pdfList.appendChild(errMsg);
      console.error('[drive.js] Error al cargar PDFs:', err);
    }
  }

  // ----------------------------------------------------------------
  // Crear la tarjeta visual de una carpeta
  // ----------------------------------------------------------------
  function crearTarjetaCarpeta(carpeta, indice) {
    var card = document.createElement('div');
    card.className = 'folder-card';
    card.style.setProperty('--card-index', indice);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-expanded', 'false');

    var header = document.createElement('div');
    header.className = 'folder-header';

    var iconoWrapper = document.createElement('span');
    iconoWrapper.className = 'folder-icon';
    iconoWrapper.appendChild(crearIconoCarpeta(40));

    var nombre = document.createElement('span');
    nombre.className   = 'folder-name';
    nombre.textContent = carpeta.name; // textContent, nunca innerHTML

    header.appendChild(iconoWrapper);
    header.appendChild(nombre);
    header.appendChild(crearIconoChevron());

    var pdfList = document.createElement('div');
    pdfList.className = 'pdf-list';

    card.appendChild(header);
    card.appendChild(pdfList);

    card.addEventListener('click', function () {
      toggleCarpeta(card, carpeta.id);
    });

    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });

    return card;
  }

  // ----------------------------------------------------------------
  // Punto de entrada: carga las carpetas raíz y construye el grid
  // ----------------------------------------------------------------
  async function iniciarCatalogos() {
    var grid    = document.getElementById('catalogs-grid');
    var spinner = document.getElementById('catalogs-spinner');
    var errorEl = document.getElementById('catalogs-error');
    var errText = document.getElementById('catalogs-error-text');

    if (!grid) return;

    // En local, verificar que config.js está relleno
    if (ES_LOCAL) {
      var sinConfig =
        typeof CONFIG === 'undefined' ||
        !CONFIG.DRIVE_API_KEY ||
        CONFIG.DRIVE_API_KEY === 'TU_API_KEY_AQUI';

      if (sinConfig) {
        if (spinner) spinner.hidden = true;
        if (errorEl) {
          errorEl.hidden = false;
          if (errText) errText.textContent = 'Rellena DRIVE_API_KEY en assets/js/config.js para ver los catálogos en local.';
        }
        return;
      }
    }

    var folderId = (typeof CONFIG !== 'undefined' && CONFIG.DRIVE_ROOT_FOLDER_ID)
      ? CONFIG.DRIVE_ROOT_FOLDER_ID
      : '1oHM88zT4X7PNdjLpkU8m6bIDGE5D4W24';

    try {
      var carpetas = await fetchChildren(folderId, MIME_FOLDER);

      if (spinner) spinner.hidden = true;

      if (carpetas.length === 0) {
        if (errorEl) {
          errorEl.hidden = false;
          if (errText) errText.textContent = 'Aún no hay catálogos disponibles. Vuelve pronto.';
        }
        return;
      }

      carpetas.forEach(function (carpeta, i) {
        grid.appendChild(crearTarjetaCarpeta(carpeta, i));
      });

    } catch (err) {
      if (spinner) spinner.hidden = true;
      if (errorEl) {
        errorEl.hidden = false;
        if (errText) errText.textContent = 'No se ha podido conectar con los catálogos. Comprueba tu conexión e inténtalo de nuevo.';
      }
      console.error('[drive.js] Error al cargar catálogos:', err);
    }
  }

  document.addEventListener('DOMContentLoaded', iniciarCatalogos);

})();
