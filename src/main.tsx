import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { FichaPublica } from './views/FichaPublica';
import './index.css';

// If URL contains ?ficha, render the public enrollment form instead of the app
const isFicha = new URLSearchParams(window.location.search).has('ficha');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isFicha ? <FichaPublica /> : <App />}
  </React.StrictMode>
);
