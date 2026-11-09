import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext'

// Suppress annoying browser extension warnings/errors in console
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Using DEFAULT root logger')) return;
  originalWarn(...args);
};

console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('message channel closed before a response was received')) return;
  originalError(...args);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)

