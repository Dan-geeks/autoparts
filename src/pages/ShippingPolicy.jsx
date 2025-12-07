import React from 'react';
import Footer from '../components/Footer';

const ShippingPolicy = () => {
    return (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', color: '#f0f0f0', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 style={{ color: '#e50914', borderBottom: '2px solid #333', paddingBottom: '10px' }}>Shipping Policy</h1>
                <p style={{ marginTop: '20px', lineHeight: '1.6' }}>Last updated: {new Date().toLocaleDateString()}</p>

                <h2 style={{ color: '#fff', marginTop: '30px' }}>1. Shipment Processing Time</h2>
                <p style={{ lineHeight: '1.6', color: '#ccc' }}>
                    All orders are processed within 2-3 business days. Orders are not shipped or delivered on weekends or holidays.
                </p>

                <h2 style={{ color: '#fff', marginTop: '30px' }}>2. Shipping Rates & Delivery Estimates</h2>
                <p style={{ lineHeight: '1.6', color: '#ccc' }}>
                    Shipping charges for your order will be calculated and displayed at checkout.
                    <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                        <li>Standard Shipping (5-7 business days): Free</li>
                        <li>Expedited Shipping (2-3 business days): $12.95</li>
                        <li>Overnight Delivery (1-2 business days): $24.95</li>
                    </ul>
                </p>

                <h2 style={{ color: '#fff', marginTop: '30px' }}>3. Shipment Confirmation & Order Tracking</h2>
                <p style={{ lineHeight: '1.6', color: '#ccc' }}>
                    You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours.
                </p>

                <h2 style={{ color: '#fff', marginTop: '30px' }}>4. Customs, Duties and Taxes</h2>
                <p style={{ lineHeight: '1.6', color: '#ccc' }}>
                    EvoParts is not responsible for any customs and taxes applied to your order. All fees imposed during or after shipping are the responsibility of the customer (tariffs, taxes, etc.).
                </p>

                <div style={{ marginTop: '40px' }}>
                    <a href="/store" style={{ color: '#e50914', textDecoration: 'none', fontWeight: 'bold' }}>&larr; Back to Store</a>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ShippingPolicy;
