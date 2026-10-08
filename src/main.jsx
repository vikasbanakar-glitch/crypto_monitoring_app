import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// AG Grid Module Registration & Theme CSS
import { ModuleRegistry, AllCommunityModule,ValidationModule } from 'ag-grid-community';
// import 'ag-grid-community/styles/ag-grid.css';
// import 'ag-grid-community/styles/ag-theme-quartz.css'; // Standardized to Quartz theme

// Register all community features (resolves Error #200 & #239)
ModuleRegistry.registerModules([AllCommunityModule, ValidationModule]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);