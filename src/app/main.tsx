import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import { QueryProvider } from '@/app/providers/QueryProvider';
import { App } from '@/app/App';

// Side-effect stylesheets: the theme contract must be registered before any
// component style that reads from it.
import '@/styles/global/Theme.css';
import '@/styles/global/Global.css';

registerSW({ immediate: true });

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Missing #root element');

createRoot(rootEl).render(
  <StrictMode>
    <QueryProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryProvider>
  </StrictMode>,
);
