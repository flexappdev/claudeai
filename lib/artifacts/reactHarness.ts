// Builds an iframe srcdoc that boots React 19 + Babel standalone + Tailwind
// CDN + lucide-react UMD + recharts UMD, then renders a single-file default
// export component supplied as TSX/JSX source.

const REACT_CDN = "https://unpkg.com/react@19/umd/react.production.min.js";
const REACT_DOM_CDN = "https://unpkg.com/react-dom@19/umd/react-dom.production.min.js";
const BABEL_CDN = "https://unpkg.com/@babel/standalone/babel.min.js";
const LUCIDE_CDN = "https://unpkg.com/lucide-react@latest/dist/umd/lucide-react.js";
const RECHARTS_CDN = "https://unpkg.com/recharts/umd/Recharts.js";
const TAILWIND_CDN = "https://cdn.tailwindcss.com";

const ESC = (s: string) => s.replace(/<\/script>/gi, "<\\/script>");

export function buildReactSrcdoc(source: string, isDark: boolean): string {
  // Source may use `export default` — Babel parses it, but standalone Babel
  // also strips ESM exports when preset-env + transform-modules-commonjs aren't
  // present. We wrap and unwrap explicitly to expose the default.
  const wrapped = `
const __exports = {};
const __module = { exports: __exports };
${ESC(source)}
const __Default = typeof __module.exports?.default !== 'undefined'
  ? __module.exports.default
  : (typeof exports !== 'undefined' && typeof exports.default !== 'undefined'
      ? exports.default
      : (typeof Component !== 'undefined' ? Component
        : (typeof App !== 'undefined' ? App
          : __module.exports)));
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(__Default));
`;

  return `<!doctype html>
<html lang="en" class="${isDark ? "dark" : ""}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<script src="${TAILWIND_CDN}"></script>
<script>
  tailwind = window.tailwind || {};
  tailwind.config = { darkMode: 'class' };
</script>
<style>
  html, body { margin: 0; padding: 0; background: ${isDark ? "#262624" : "#FFFFFF"}; color: ${isDark ? "#F5F4EF" : "#1A1915"}; font-family: ui-sans-serif, system-ui, sans-serif; }
  #root { padding: 16px; }
  .__err { background:#fee; color:#900; border:1px solid #f99; padding:12px; border-radius:8px; font-family:ui-monospace, SFMono-Regular, monospace; white-space:pre-wrap; }
</style>
<script src="${REACT_CDN}" crossorigin></script>
<script src="${REACT_DOM_CDN}" crossorigin></script>
<script src="${BABEL_CDN}"></script>
<script src="${LUCIDE_CDN}" crossorigin></script>
<script src="${RECHARTS_CDN}" crossorigin></script>
</head>
<body>
<div id="root"></div>
<script>
  window.addEventListener('error', (e) => {
    const root = document.getElementById('root');
    root.innerHTML = '<div class="__err">' + (e.error?.stack || e.message || 'Unknown error') + '</div>';
  });
  window.addEventListener('unhandledrejection', (e) => {
    const root = document.getElementById('root');
    root.innerHTML = '<div class="__err">' + (e.reason?.stack || e.reason || 'Unhandled rejection') + '</div>';
  });
</script>
<script type="text/babel" data-presets="env,react,typescript">
try {
${ESC(wrapped)}
} catch (e) {
  document.getElementById('root').innerHTML = '<div class="__err">' + (e.stack || e.message) + '</div>';
}
</script>
</body>
</html>`;
}

export function buildHtmlSrcdoc(source: string, isDark: boolean): string {
  const trimmed = source.trim();
  // If the artifact is a complete document, render as-is.
  if (/^<!doctype html|^<html/i.test(trimmed)) return trimmed;
  return `<!doctype html>
<html lang="en" class="${isDark ? "dark" : ""}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  html, body { margin: 0; padding: 16px; background: ${isDark ? "#262624" : "#FFFFFF"}; color: ${isDark ? "#F5F4EF" : "#1A1915"}; font-family: ui-sans-serif, system-ui, sans-serif; }
</style>
</head>
<body>${ESC(trimmed)}</body>
</html>`;
}
