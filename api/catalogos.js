// =====================================================================
// api/catalogos.js — Proxy seguro para Google Drive API
//
// Rutas:
//   GET /api/catalogos?accion=carpetas          → subcarpetas raíz
//   GET /api/catalogos?accion=archivos&carpeta=ID → todos los archivos
//                                                   (PDFs, imágenes, etc.)
// =====================================================================

const DRIVE_BASE  = 'https://www.googleapis.com/drive/v3/files';
const MIME_FOLDER = 'application/vnd.google-apps.folder';

function esIdValido(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{10,}$/.test(id);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const apiKey     = process.env.DRIVE_API_KEY;
  const rootFolder = process.env.DRIVE_ROOT_FOLDER_ID || '1oHM88zT4X7PNdjLpkU8m6bIDGE5D4W24';

  if (!apiKey) {
    console.error('[api/catalogos] Falta DRIVE_API_KEY');
    return res.status(500).json({ error: 'Configuración del servidor incompleta' });
  }

  const { accion, carpeta } = req.query;
  let query;

  if (accion === 'carpetas') {
    // Solo subcarpetas de la raíz
    query = `'${rootFolder}' in parents and trashed=false and mimeType='${MIME_FOLDER}'`;

  } else if (accion === 'archivos') {
    // Todos los archivos de una subcarpeta (PDFs, imágenes, lo que sea)
    if (!esIdValido(carpeta)) {
      return res.status(400).json({ error: 'ID de carpeta no válido' });
    }
    query = `'${carpeta}' in parents and trashed=false and mimeType!='${MIME_FOLDER}'`;

  } else {
    return res.status(400).json({ error: 'Parámetro "accion" no válido' });
  }

  try {
    const params = new URLSearchParams({
      q:        query,
      fields:   'files(id,name,mimeType)',  // mimeType para elegir el icono correcto
      orderBy:  'name',
      pageSize: '100',
      key:      apiKey
    });

    const respuesta = await fetch(`${DRIVE_BASE}?${params.toString()}`);

    if (!respuesta.ok) {
      const texto = await respuesta.text();
      console.error('[api/catalogos] Error Drive API:', respuesta.status, texto);
      return res.status(502).json({ error: 'Error al conectar con Google Drive' });
    }

    const datos = await respuesta.json();

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    return res.status(200).json({ files: datos.files || [] });

  } catch (err) {
    console.error('[api/catalogos] Error inesperado:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
