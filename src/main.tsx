
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

// Create base tag to help with routing - properly configured for SPAs
const baseTag = document.createElement('base');
baseTag.href = '/';
document.head.prepend(baseTag);

// Render the app
createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
