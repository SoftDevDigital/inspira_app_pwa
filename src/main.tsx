import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {registerServiceWorker} from './registerSW';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Registramos el Service Worker para habilitar la PWA (offline + instalable).
registerServiceWorker();
