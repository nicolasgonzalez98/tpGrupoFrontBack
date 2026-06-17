import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PrimeReactProvider } from 'primereact/api';

// IMPORTANTE: el orden importa. Tailwind se carga PRIMERO para que su "preflight"
// (reset que pone border:0 en todos los elementos) no pise los estilos de los
// componentes de PrimeReact. El tema de PrimeReact se carga DESPUÉS y gana.
import './index.css';

// PrimeReact: tema Lara + core. (El front Angular usa el preset "Aura" de PrimeNG 19;
// Aura solo existe en PrimeReact 11 —hoy en alpha—, así que en estable 10.x se usa
// "Lara", su predecesor directo. Migrar a Aura = cambiar este import cuando v11 sea estable.)
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';

// Configura los interceptores de Axios (adjunta el JWT, maneja 401). Debe ir antes del render.
import './services/http';

import App from './App';
import { AuthProvider } from './context/AuthContext';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <PrimeReactProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </PrimeReactProvider>
  </React.StrictMode>
);
