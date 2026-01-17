import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import '../styles/ThankYou.css';

const ThankYouPage = () => {
    const navigate = useNavigate();

    return (
        <div className="store-bg">
            <nav>
                <div className="logo">Evo<span>Parts</span></div>
            </nav>

            <div className="thankyou-container">
                <div className="thankyou-card">
                    <div className="success-icon-large">
                        <i className="fas fa-check-circle"></i>
                    </div>

                    <h1 className="thankyou-title">Thank You for Your Order!</h1>

                    <p className="thankyou-message">
                        Your order has been received and is being processed.
                        We'll notify you once your shipping is on the way.
                    </p>

                    <div className="order-info">
                        <div className="info-item">
                            <i className="fas fa-box"></i>
                            <div>
                                <h3>Order Processing</h3>
                                <p>Your items are being prepared for shipment</p>
                            </div>
                        </div>

                        <div className="info-item">
                            <i className="fas fa-shipping-fast"></i>
                            <div>
                                <h3>Shipping Updates</h3>
                                <p>You'll receive tracking information via email</p>
                            </div>
                        </div>

                        <div className="info-item">
                            <i className="fas fa-headset"></i>
                            <div>
                                <h3>Need Help?</h3>
                                <p>Contact us at <a href="mailto:evoautopartslimited@gmail.com">evoautopartslimited@gmail.com</a></p>
                            </div>
                        </div>
                    </div>

                    <div className="thankyou-actions">
                        <button
                            className="btn-primary"
                            onClick={() => navigate('/store')}
                        >
                            <i className="fas fa-home"></i> Go to Home Page
                        </button>

                        <button
                            className="btn-secondary"
                            onClick={() => navigate('/store')}
                        >
                            <i className="fas fa-shopping-bag"></i> Continue Shopping
                        </button>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ThankYouPage;
