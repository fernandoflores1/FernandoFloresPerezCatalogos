// =====================================================================
// build.js — Genera assets/js/config.js para producción en Vercel
//
// IMPORTANTE: en producción la API key NO se escribe aquí.
// Las llamadas a Drive se hacen desde api/catalogos.js (servidor).
// Solo se escribe el DRIVE_ROOT_FOLDER_ID, que no es sensible.
// =====================================================================

const fs = require('fs');

const folderId = process.env.DRIVE_ROOT_FOLDER_ID || '1oHM88zT4X7PNdjLpkU8m6bIDGE5D4W24';

// En producción no incluimos DRIVE_API_KEY: la usa el servidor, nunca el navegador
const contenido = `// Generado por build.js — no editar manualmente en producción
const CONFIG = {
  DRIVE_ROOT_FOLDER_ID: '${folderId}'
};
`;

fs.writeFileSync('assets/js/config.js', contenido, 'utf8');
console.log('[build.js] config.js generado (sin API key — usa proxy /api/catalogos).');
