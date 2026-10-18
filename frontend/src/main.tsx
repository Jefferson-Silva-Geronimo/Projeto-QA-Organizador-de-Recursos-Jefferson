import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ProvedorDeSessao } from '@/autenticacao/ProvedorDeSessao';
import { aplicarTemaGuardado } from '@/estilo/tema';
import { Rotas } from '@/Rotas';
import '@/estilo/tokens.css';
import '@/estilo/base.css';

const raiz = document.getElementById('raiz');
if (!raiz) {
  throw new Error('Elemento #raiz não encontrado.');
}

// A URL da API vem do ambiente (VITE_API_URL). Vazia significa o mesmo endereço da página.
const urlDaApi = import.meta.env.VITE_API_URL ?? '';

aplicarTemaGuardado();

const consultas = new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } });

createRoot(raiz).render(
  <StrictMode>
    <QueryClientProvider client={consultas}>
      <ProvedorDeSessao baseUrl={urlDaApi}>
        <BrowserRouter>
          <Rotas />
        </BrowserRouter>
      </ProvedorDeSessao>
    </QueryClientProvider>
  </StrictMode>,
);
