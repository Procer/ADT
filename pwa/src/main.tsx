import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initGlobalErrorHandlers } from './logger';

// Inicializar el monitor de errores para App-Logs
initGlobalErrorHandlers();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
