import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CustomerApp from './pages/CustomerApp';
import KitchenDisplay from './pages/KitchenDisplay';
import PickupDisplay from './pages/PickupDisplay';
import AdminPortal from './pages/AdminPortal';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CustomerApp />} />
        <Route path="/kitchen" element={<KitchenDisplay />} />
        <Route path="/pickup" element={<PickupDisplay />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
