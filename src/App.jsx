import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import StorePage from './pages/StorePage';
import AdminPage from './pages/AdminPage';
import MarketerPage from './pages/MarketerPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ShippingPolicy from './pages/ShippingPolicy';
import CheckoutPage from './pages/CheckoutPage'; // IMPORT HERE

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/store" element={<StorePage />} />
        <Route path="/checkout" element={<CheckoutPage />} /> {/* NEW ROUTE */}
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/marketer" element={<MarketerPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/shipping-policy" element={<ShippingPolicy />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;