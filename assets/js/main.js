// =====================================================================
// main.js — Inicialización general y efectos de scroll
// Proyecto: Web Fernando Flores Pérez — Casamayor Librada
// =====================================================================

(function () {
  'use strict';

  // ----------------------------------------------------------------
  // 1. AÑO ACTUAL EN EL PIE DE PÁGINA
  // ----------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    const yearEl = document.getElementById('footer-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  });

  // ----------------------------------------------------------------
  // 2. SOMBRA EN LA CABECERA AL HACER SCROLL
  // ----------------------------------------------------------------
  (function initHeaderScroll() {
    const header = document.getElementById('header');
    if (!header) return;

    function onScroll() {
      if (window.scrollY > 10) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Estado inicial
  })();

  // ----------------------------------------------------------------
  // 3. INTERSECTION OBSERVER — Efecto de entrada al hacer scroll
  //    Añade la clase "visible" a los elementos con clase "reveal"
  // ----------------------------------------------------------------
  (function initScrollReveal() {
    // Si el navegador no soporta IntersectionObserver, mostrar todo
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            // Una vez visible, dejar de observar para mejorar el rendimiento
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold:  0.12,  // Activar cuando el 12% del elemento sea visible
        rootMargin: '0px 0px -32px 0px'
      }
    );

    // Observar todos los elementos con clase "reveal"
    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  })();

  // ----------------------------------------------------------------
  // 4. NAVEGACIÓN ACTIVA — Resaltar el enlace de la sección actual
  // ----------------------------------------------------------------
  (function initActiveNav() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    if (!navLinks.length || !sections.length) return;

    const observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach(function (link) {
              const href = link.getAttribute('href');
              if (href === '#' + id) {
                link.classList.add('active');
              } else {
                link.classList.remove('active');
              }
            });
          }
        });
      },
      {
        threshold:  0.5,
        rootMargin: '-' + (68 + 20) + 'px 0px -40% 0px'
      }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  })();

})();
