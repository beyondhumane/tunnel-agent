import '@fontsource-variable/inter';
import '@fontsource-variable/geist-mono';
import { StrictMode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './index.css';
import { Site } from './App';

document.documentElement.setAttribute('data-ready', '');

const root = document.getElementById('root')!;
const app = (
  <StrictMode>
    <Site path={window.location.pathname} />
  </StrictMode>
);

if (root.dataset.path === window.location.pathname) hydrateRoot(root, app);
else {
  const r = createRoot(root);
  flushSync(() => r.render(app));
}
