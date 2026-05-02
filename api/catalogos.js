// =====================================================================
// api/catalogos.js — Proxy seguro para Google Drive API
//
// Vercel ejecuta este archivo en el SERVIDOR, no en el navegador.
// La API key nunca sale del servidor: el navegador solo ve los datos
// de carpetas y archivos, jamás la clave.
//
// Rutas:
//   GET /api/catalogos?accion=carpetas          → subcarpetas raíz
//   GET /api/catalogos?accion=archivos&carpeta=ID → PDFs de una carpeta
// =====================================================================

const DRIVE_BASE   = 'https://www.googleapis.com/drive/v3/files';
const MIME_FOLDER  = 'application/vnd.google-apps.folder';
const MIME_PDF     = 'application/pdf';

// Validación estricta de IDs de Google Drive (solo alfanumérico, guion y guion bajo)
function esIdValido(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{10,}$/.test(id);
}

module.exports = async function handler(req, res) {
  // Log de diagnóstico — visible en Vercel → Functions → Logs
  console.log('[api/catalogos] Petición recibida:', req.method, req.url);
  console.log('[api/catalogos] DRIVE_API_KEY presente:', !!process.env.DRIVE_API_KEY);
  console.log('[api/catalogos] DRIVE_ROOT_FOLDER_ID presente:', !!process.env.DRIVE_ROOT_FOLDER_ID);

  // Solo aceptar GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey      = process.env.DRIVE_API_KEY;
  const rootFolder  = process.env.DRIVE_ROOT_FOLDER_ID;

  if (!apiKey || !rootFolder) {
    console.error('[api/catalogos] Faltan variables de entorno DRIVE_API_KEY o DRIVE_ROOT_FOLDER_ID');
    return res.status(500).json({ error: 'Configuración del servidor incompleta' });
  }

  const { accion, carpeta } = req.query;
  let folderId, mimeType;

  if (accion === 'carpetas') {
    // Listar subcarpetas de la carpeta raíz
    folderId = rootFolder;
    mimeType = MIME_FOLDER;

  } else if (accion === 'archivos') {
    // Listar PDFs de una subcarpeta concreta
    if (!esIdValido(carpeta)) {
      return res.status(400).json({ error: 'ID de carpeta no válido' });
    }
    folderId = carpeta;
    mimeType = MIME_PDF;

  } else {
    return res.status(400).json({ error: 'Parámetro "accion" no válido' });
  }

  try {
    const params = new URLSearchParams({
      q:        `'${folderId}' in parents and trashed=false and mimeType='${mimeType}'`,
      fields:   'files(id,name)',
      orderBy:  'name',
      pageSize: '100',
      key:      apiKey
    });

    const respuesta = await fetch(`${DRIVE_BASE}?${params.toString()}`);

    if (!respuesta.ok) {
      const texto = await respuesta.text();
      console.error('[api/catalogos] Error de Drive API:', respuesta.status, texto);
      return res.status(502).json({ error: 'Error al conectar con Google Drive' });
    }

    const datos = await respuesta.json();

    // Caché de 5 minutos en el Edge de Vercel para no agotar la cuota
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.status(200).json({ files: datos.files || [] });

  } catch (err) {
    console.error('[api/catalogos] Error inesperado:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
