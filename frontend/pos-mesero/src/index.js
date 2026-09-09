import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './theme.css';
import './styles/restobar-tokens.css';
import './styles/restobar-components.css';
import './App.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Habilita "Instalar app" en el navegador (PWA) para que el mesero pueda
// agregarla a su pantalla de inicio.
serviceWorkerRegistration.register();