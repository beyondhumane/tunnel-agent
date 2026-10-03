import '@fontsource-variable/inter';
import '@fontsource-variable/geist-mono';
import { StrictMode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { detectLang } from './lib/i18n';
import './index.css';
import { Site } from './App';

document.documentElement.setAttribute('data-ready', '');

const lang = detectLang();
const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <Site path={window.location.pathname} lang={lang} />
  </StrictMode>
);

// Pages are prerendered in English; other languages render fresh instead of hydrating.
if (lang === 'en' && root.dataset.path === window.location.pathname) hydrateRoot(root, app);
else {
  const r = createRoot(root);
  flushSync(() => r.render(app));
}
document.documentElement.classList.remove('lang-pending');
