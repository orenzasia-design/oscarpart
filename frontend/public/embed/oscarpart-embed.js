/**
 * OSCARPART Embeddable Widget
 * ─────────────────────────────────────────────────────────────
 * Cara pakai di landing page Anda:
 *
 *   <!-- Letakkan di mana Anda ingin widget muncul -->
 *   <div id="oscarpart-rfq"></div>
 *
 *   <!-- Konfigurasi (opsional) -->
 *   <script>
 *     window.OSCARPART_CONFIG = {
 *       apiUrl:    'https://api.oscarpart.id/api/v1',   // URL API backend Anda
 *       waNumber:  '6281234567890',                     // Nomor WA bisnis
 *       theme:     'light',                             // 'light' | 'dark'
 *       containerId: 'oscarpart-rfq',                   // ID container target
 *     };
 *   </script>
 *   <script src="https://cdn.oscarpart.id/embed/oscarpart-embed.js" defer></script>
 *
 * ─────────────────────────────────────────────────────────────
 * Alternatif: embed via iframe (paling sederhana)
 *
 *   <iframe
 *     src="https://app.oscarpart.id/embed/oscarpart-widget.html"
 *     style="width:100%;height:700px;border:none;border-radius:12px;"
 *     title="OSCARPART RFQ Widget"
 *   ></iframe>
 *
 * ─────────────────────────────────────────────────────────────
 */

(function () {
  'use strict';

  const cfg = window.OSCARPART_CONFIG || {};
  const API_URL    = cfg.apiUrl    || 'http://localhost:4000/api/v1';
  const WA_NUMBER  = cfg.waNumber  || '6281234567890';
  const CONTAINER  = cfg.containerId || 'oscarpart-rfq';
  const WIDGET_URL = cfg.widgetUrl  || '/embed/oscarpart-widget.html';

  function init() {
    const container = document.getElementById(CONTAINER);
    if (!container) {
      console.warn(`[OSCARPART] Container #${CONTAINER} tidak ditemukan.`);
      return;
    }

    // Create iframe
    const iframe = document.createElement('iframe');
    iframe.src   = `${WIDGET_URL}?apiUrl=${encodeURIComponent(API_URL)}&waNumber=${encodeURIComponent(WA_NUMBER)}`;
    iframe.title = 'OSCARPART Parts & Quotation';
    iframe.style.cssText = [
      'width: 100%',
      'min-height: 680px',
      'border: none',
      'border-radius: 12px',
      'box-shadow: 0 4px 24px rgba(0,0,0,0.10)',
      'display: block',
    ].join(';');
    iframe.setAttribute('loading', 'lazy');

    // Auto-resize via postMessage
    window.addEventListener('message', (e) => {
      if (e.data && e.data.type === 'OSCARPART_RESIZE' && e.data.height) {
        iframe.style.minHeight = (e.data.height + 40) + 'px';
      }
    });

    container.appendChild(iframe);
  }

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
