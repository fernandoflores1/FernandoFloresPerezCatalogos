// =====================================================================
// build.js — Genera assets/js/config.js a partir de variables de entorno
// Se ejecuta en Vercel antes de servir los archivos estáticos.
// Localmente no hace falta ejecutarlo: edita config.js directamente.
// =====================================================================

const fs = require('fs');

const apiKey   = process.env.DRIVE_API_KEY         || '';
const folderId = process.env.DRIVE_ROOT_FOLDER_ID  || '1oHM88zT4X7PNdjLpkU8m6bIDGE5D4W24';

if (!apiKey) {
  console.warn('[build.js] AVISO: DRIVE_API_KEY no está definida. Los catálogos no cargarán.');
}

const contenido = `// Generado automáticamente por build.js — no editar a mano en producción
const CONFIG = {
  DRIVE_API_KEY: '${apiKey}',
  DRIVE_ROOT_FOLDER_ID: '${folderId}'
};
`;

fs.writeFileSync('assets/js/config.js', contenido, 'utf8');
console.log('[build.js] assets/js/config.js generado correctamente.');
