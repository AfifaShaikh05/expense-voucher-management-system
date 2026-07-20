import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// App already contains BrowserRouter + AuthProvider — no extra wrappers needed here
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
