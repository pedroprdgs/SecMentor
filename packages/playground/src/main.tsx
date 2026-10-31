import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App.js';
import './app/styles.css';
try { const redirect = sessionStorage.getItem('secmentor-spa-redirect'); if (redirect && redirect.startsWith(import.meta.env.BASE_URL) && !redirect.startsWith('//')) { sessionStorage.removeItem('secmentor-spa-redirect'); history.replaceState(null, '', redirect); } } catch { /* A navegação local não depende de armazenamento. */ }
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
