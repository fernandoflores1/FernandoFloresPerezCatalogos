// =====================================================================
// theme.js — Lógica del modo claro / oscuro
// Proyecto: Web Fernando Flores Pérez — Casamayor Librada
// =====================================================================

(function () {
  'use strict';

  const STORAGE_KEY = 'theme-preference';
  const DARK        = 'dark';
  const LIGHT       = 'light';

  // Lee la preferencia guardada; si no hay ninguna, usa modo claro por defecto
  function getPreferredTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === DARK || stored === LIGHT) return stored;
    return LIGHT; // siempre claro si el usuario no ha elegido antes
  }

  // Aplica el tema al elemento <html> y actualiza el aria-label del botón
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);

    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.setAttribute(
        'aria-label',
        theme === DARK ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'
      );
    }
  }

  // Aplica el tema lo antes posible (evita parpadeo)
  applyTheme(getPreferredTheme());

  // Registra el manejador del botón cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;

    btn.addEventListener('click', function () {
      const current = document.documentElement.getAttribute('data-theme');
      const next    = current === DARK ? LIGHT : DARK;

      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next);
    });

    // Solo sincronizar con el sistema si el usuario ya ha elegido manualmente
    // (si no ha elegido, mantenemos el default claro)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === DARK || stored === LIGHT) {
        // no hacer nada: el usuario tiene su propia preferencia guardada
      }
    });
  });

})();
