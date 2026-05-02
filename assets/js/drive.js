// =====================================================================
// drive.js — Conexión y renderizado de catálogos desde Google Drive
// Proyecto: Web Fernando Flores Pérez — Casamayor Librada
//
// SEGURIDAD: Nunca se usa innerHTML con datos de la API.
//            Todos los textos externos se insertan con textContent.
// =====================================================================

(function () {
  'use strict';

  // URL base de la API pública de Google Drive v3
  const DRIVE_BASE = 'https://www.googleapis.com/drive/v3/files';

  // Campos que pedimos para minimizar la respuesta
  const FIELDS_FOLDERS = 'files(id,name,mimeType)';
  const FIELDS_PDFS    = 'files(id,name,mimeType)';
  const MIME_FOLDER    = 'application/vnd.google-apps.folder';
  const MIME_PDF       = 'application/pdf';

  // ----------------------------------------------------------------
  // Obtiene los archivos hijos de una carpeta dado su ID
  // ----------------------------------------------------------------
  async function fetchChildren(folderId, mimeType) {
    const apiKey   = CONFIG.DRIVE_API_KEY;
    const mimeFilter = mimeType ? ` and mimeType='${mimeType}'` : '';

    // Construcción manual de la URL (sin template literals con datos externos)
    const params = new URLSearchParams({
      q:      "'" + folderId + "' in parents and trashed=false" + mimeFilter,
      fields:  mimeType === MIME_FOLDER ? FIELDS_FOLDERS : FIELDS_PDFS,
      orderBy: 'name',
      key:     apiKey,
      pageSize: '100'
    });

    const url = DRIVE_BASE + '?' + params.toString();
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Error al conectar con Google Drive: ' + response.status);
    }

    const data = await response.json();
    return data.files || [];
  }

  // ----------------------------------------------------------------
  // Crea el icono SVG de carpeta (no depende de ninguna librería)
  // ----------------------------------------------------------------
  function createFolderIcon(size) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size || '40');
    svg.setAttribute('height', size || '40');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z');
    svg.appendChild(path);
    return svg;
  }

  // ----------------------------------------------------------------
  // Crea el icono SVG de PDF
  // ----------------------------------------------------------------
  function createPdfIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
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

    const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p1.setAttribute('d', 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z');
    const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    p2.setAttribute('points', '14 2 14 8 20 8');

    svg.appendChild(p1);
    svg.appendChild(p2);
    return svg;
  }

  // ----------------------------------------------------------------
  // Crea el icono de chevron (flecha)
  // ----------------------------------------------------------------
  function createChevronIcon() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
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

    const pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    pl.setAttribute('points', '6 9 12 15 18 9');
    svg.appendChild(pl);
    return svg;
  }

  // ----------------------------------------------------------------
  // Abre / cierra la lista de PDFs de una carpeta
  // ----------------------------------------------------------------
  async function toggleFolder(card, folderId) {
    const isOpen  = card.classList.contains('open');
    const pdfList = card.querySelector('.pdf-list');

    if (isOpen) {
      // Cerrar
      card.classList.remove('open');
      pdfList.classList.remove('open');
      return;
    }

    // Abrir: marcar como abierta de inmediato
    card.classList.add('open');
    pdfList.classList.add('open');

    // Si ya tiene contenido cargado no volvemos a pedir
    if (pdfList.dataset.loaded === 'true') return;

    // Mostrar spinner dentro de la tarjeta
    pdfList.innerHTML = '';
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'folder-loading';
    const spinner = document.createElement('div');
    spinner.className = 'folder-spinner';
    loadingDiv.appendChild(spinner);
    pdfList.appendChild(loadingDiv);

    try {
      const pdfs = await fetchChildren(folderId, MIME_PDF);

      // Limpiar spinner
      pdfList.innerHTML = '';
      pdfList.dataset.loaded = 'true';

      if (pdfs.length === 0) {
        // Carpeta vacía
        const empty = document.createElement('p');
        empty.className = 'folder-empty';
        empty.textContent = 'Esta carpeta no tiene catálogos disponibles.';
        pdfList.appendChild(empty);
        return;
      }

      // Crear enlace por cada PDF
      pdfs.forEach(function (pdf) {
        const link = document.createElement('a');
        link.className    = 'pdf-item';
        link.href         = 'https://drive.google.com/file/d/' + encodeURIComponent(pdf.id) + '/view';
        link.target       = '_blank';
        link.rel          = 'noopener noreferrer';
        link.setAttribute('aria-label', 'Abrir catálogo: ' + pdf.name);

        const icon = createPdfIcon();

        const nameSpan = document.createElement('span');
        nameSpan.className = 'pdf-name';
        nameSpan.textContent = pdf.name; // textContent, nunca innerHTML

        link.appendChild(icon);
        link.appendChild(nameSpan);
        pdfList.appendChild(link);
      });

    } catch (err) {
      pdfList.innerHTML = '';
      const errMsg = document.createElement('p');
      errMsg.className = 'folder-empty';
      errMsg.textContent = 'No se pudo cargar este catálogo. Inténtalo más tarde.';
      pdfList.appendChild(errMsg);
      console.error('[drive.js] Error al cargar PDFs:', err);
    }
  }

  // ----------------------------------------------------------------
  // Crea la tarjeta de una carpeta y la añade al grid
  // ----------------------------------------------------------------
  function createFolderCard(folder, index) {
    const card = document.createElement('div');
    card.className = 'folder-card';
    card.style.setProperty('--card-index', index);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-expanded', 'false');

    // Encabezado de la tarjeta
    const header = document.createElement('div');
    header.className = 'folder-header';

    const iconWrapper = document.createElement('span');
    iconWrapper.className = 'folder-icon';
    iconWrapper.appendChild(createFolderIcon(40));

    const nameEl = document.createElement('span');
    nameEl.className = 'folder-name';
    nameEl.textContent = folder.name; // textContent, nunca innerHTML

    header.appendChild(iconWrapper);
    header.appendChild(nameEl);
    header.appendChild(createChevronIcon());

    // Lista de PDFs (inicialmente vacía y cerrada)
    const pdfList = document.createElement('div');
    pdfList.className = 'pdf-list';

    card.appendChild(header);
    card.appendChild(pdfList);

    // Abrir/cerrar al hacer clic o presionar Enter/Espacio
    card.addEventListener('click', function () {
      const expanded = card.classList.contains('open');
      card.setAttribute('aria-expanded', String(!expanded));
      toggleFolder(card, folder.id);
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
  // Punto de entrada: carga las carpetas raíz y renderiza el grid
  // ----------------------------------------------------------------
  async function initCatalogs() {
    const grid    = document.getElementById('catalogs-grid');
    const spinner = document.getElementById('catalogs-spinner');
    const errorEl = document.getElementById('catalogs-error');
    const errText = document.getElementById('catalogs-error-text');

    if (!grid) return;

    // Verificar que CONFIG existe y tiene los valores necesarios
    if (
      typeof CONFIG === 'undefined' ||
      !CONFIG.DRIVE_API_KEY ||
      CONFIG.DRIVE_API_KEY === 'TU_API_KEY_AQUI'
    ) {
      if (spinner) spinner.hidden = true;
      if (errorEl) {
        errorEl.hidden = false;
        if (errText) errText.textContent = 'Configura la API Key de Google Drive en assets/js/config.js para ver los catálogos.';
      }
      return;
    }

    try {
      const folders = await fetchChildren(CONFIG.DRIVE_ROOT_FOLDER_ID, MIME_FOLDER);

      // Ocultar spinner
      if (spinner) spinner.hidden = true;

      if (folders.length === 0) {
        if (errorEl) {
          errorEl.hidden = false;
          if (errText) errText.textContent = 'Aún no hay catálogos disponibles. Vuelve pronto.';
        }
        return;
      }

      // Renderizar las tarjetas
      folders.forEach(function (folder, i) {
        const card = createFolderCard(folder, i);
        grid.appendChild(card);
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

  // Iniciar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', initCatalogs);

})();
