import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './App.js';
import { resolveMountElement } from './lib/bootstrap.js';

ReactDOM.createRoot(resolveMountElement((id) => document.getElementById(id)) as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
