/**
 * Vstupní bod aplikace — React root, i18n, globální styly
 *
 * @author Roman Hlaváček
 * @created 2026-04-24
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './i18n';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
