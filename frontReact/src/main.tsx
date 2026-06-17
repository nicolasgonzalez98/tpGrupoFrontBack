import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PrimeReactProvider } from 'primereact/api';

// PrimeReact: tema Lara + core + iconos.
// Nota: el front Angular usa el preset "Aura" de PrimeNG 19. Aura solo existe en
// PrimeReact 11 (hoy en alpha). En la versión estable (10.x) el equivalente visual
// más cercano es "Lara" (predecesor directo de Aura). Se puede migrar a Aura cuando
// PrimeReact 11 sea estable cambiando únicamente este import + PrimeReactProvider.
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';

import './index.css';
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
