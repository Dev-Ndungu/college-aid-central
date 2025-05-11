
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Root element not found');

document.title = "The Writers Hub";
createRoot(rootElement).render(<App />);
