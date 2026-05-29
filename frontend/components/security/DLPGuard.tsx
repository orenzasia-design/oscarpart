'use client';

import { useEffect } from 'react';
import { useAuth } from '../../lib/auth-context';

/**
 * DLPGuard — mounts invisible security layers on protected pages:
 * 1. Disables right-click context menu
 * 2. Disables Ctrl+S / Ctrl+P / PrintScreen hints
 * 3. Renders a dynamic SVG watermark tied to the current session
 *
 * Usage: drop <DLPGuard /> inside any page that shows prices.
 */

export default function DLPGuard() {
  const { user } = useAuth();

  useEffect(() => {
    // ── Disable right-click ──────────────────────────────────
    const blockContext = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.dlp-protected') || target.closest('.price-field')) {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener('contextmenu', blockContext);

    // ── Keyboard shortcuts ───────────────────────────────────
    const blockKeys = (e: KeyboardEvent) => {
      // Ctrl+S, Ctrl+P, Ctrl+A (select all) on price views
      if ((e.ctrlKey || e.metaKey) && ['s', 'p'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', blockKeys);

    return () => {
      document.removeEventListener('contextmenu', blockContext);
      document.removeEventListener('keydown', blockKeys);
    };
  }, []);

  if (!user) return null;

  // Dynamic watermark: company + date + partial user id
  const watermarkText = [
    user.company_name || user.full_name,
    new Date().toLocaleDateString('id-ID'),
    user.id.slice(0, 8).toUpperCase(),
  ].join(' • ');

  return (
    <>
      {/* CSS-based watermark overlay — fixed, pointer-events none */}
      <div
        aria-hidden="true"
        style={{
          position:       'fixed',
          inset:          0,
          zIndex:         9999,
          pointerEvents:  'none',
          overflow:       'hidden',
          userSelect:     'none',
        }}
      >
        <svg
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'absolute', inset: 0 }}
        >
          <defs>
            <pattern
              id="watermark-pattern"
              x="0"
              y="0"
              width="400"
              height="200"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(-30)"
            >
              <text
                x="10"
                y="100"
                fontSize="12"
                fill="rgba(26,58,92,0.055)"
                fontFamily="Arial, sans-serif"
                fontWeight="600"
                letterSpacing="1"
              >
                {watermarkText}
              </text>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#watermark-pattern)" />
        </svg>
      </div>
    </>
  );
}
