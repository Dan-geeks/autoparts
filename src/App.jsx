import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import LoginPage from './pages/LoginPage';
import StorePage from './pages/StorePage';
import AdminPage from './pages/AdminPage';
import MarketerPage from './pages/MarketerPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import ShippingPolicy from './pages/ShippingPolicy';
import CheckoutPage from './pages/CheckoutPage';
import ThankYouPage from './pages/ThankYouPage';
import ContactUs from './pages/ContactUs';
import ProductDetailPage from './pages/ProductDetailPage';
import MarketerRegistration from './pages/MarketerRegistration';
import './styles/PageTransitions.css';
import './styles/Theme.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f1419', color: '#fff' }}>
      <div>Loading...</div>
    </div>;
  }

  return isAuthenticated ? children : <Navigate to="/" replace />;
};

// Animated Routes Component
const AnimatedRoutes = () => {
  const location = useLocation();
  const nodeRef = useRef(null);

  return (
    <TransitionGroup>
      <CSSTransition
        key={location.key}
        nodeRef={nodeRef}
        classNames="fade"
        timeout={400}
      >
        <div ref={nodeRef}>
          <Routes location={location}>
            <Route path="/" element={<LoginPage />} />
            <Route path="/store" element={<ProtectedRoute><StorePage /></ProtectedRoute>} />
            <Route path="/product/:productId" element={<ProtectedRoute><ProductDetailPage /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/thank-you" element={<ProtectedRoute><ThankYouPage /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/marketer" element={<MarketerPage />} />
            <Route path="/marketer-registration" element={<MarketerRegistration />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/contact-us" element={<ContactUs />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </CSSTransition>
    </TransitionGroup>
  );
};

function App() {
  useEffect(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;