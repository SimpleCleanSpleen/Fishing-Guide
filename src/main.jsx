import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { DataProvider } from './context/DataContext.jsx';
import { LocationProvider } from './context/LocationContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* HashRouter (#/map, #/log...) works on static hosts like GitHub Pages with no server rewrites. */}
    <HashRouter>
      <AuthProvider>
        <LocationProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </LocationProvider>
      </AuthProvider>
    </HashRouter>
  </React.StrictMode>,
);
