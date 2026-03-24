import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Suppress harmless console errors and warnings
const originalError = window.console.error;
const originalWarn = window.console.warn;

// Patterns of errors/warnings to suppress
const suppressPatterns = [
  'ResizeObserver loop',
  'Invalid argument provided to upgrade MDL element',
  'Invalid argument provided to downgrade MDL nodes',
  'Cannot set properties of null',
  'Cross-Origin-Opener-Policy policy would block',
  'addDevModeBanner',
  'onboarding.js'
];

window.console.error = (...args) => {
  const message = args.join(' ');
  const shouldSuppress = suppressPatterns.some(pattern => message.includes(pattern));
  if (!shouldSuppress) {
    originalError(...args);
  }
};

window.console.warn = (...args) => {
  const message = args.join(' ');
  const shouldSuppress = suppressPatterns.some(pattern => message.includes(pattern));
  if (!shouldSuppress) {
    originalWarn(...args);
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
