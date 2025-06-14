
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Get the root element
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Root element not found');

// Set document title
document.title = "Assignment Hub ✒️";

// Create a custom meta tag for the router
const meta = document.createElement('meta');
meta.name = 'description';
meta.content = 'Assignment Hub - Get expert assistance with your assignments';
document.head.appendChild(meta);

// Create base tag to help with routing - configured for hash router
const baseTag = document.createElement('base');
baseTag.href = window.location.pathname || '/';
document.head.prepend(baseTag);

// Clean up any payment-related URL parameters that might cause issues
if (window.location.hash.includes('access_token') && window.location.hash.includes('provider_token')) {
  // This might be a redirect from a payment provider - clean it up
  const cleanUrl = window.location.origin + window.location.pathname;
  window.history.replaceState({}, document.title, cleanUrl);
}

// Render the app
createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
