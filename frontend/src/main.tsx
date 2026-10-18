import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const raiz = document.getElementById('raiz');
if (!raiz) {
  throw new Error('Elemento #raiz não encontrado.');
}

createRoot(raiz).render(
  <StrictMode>
    <h1>Organização de Recursos</h1>
  </StrictMode>,
);
