import React from 'react';
import Footer from '../components/Footer';

const TermsOfService = () => {
    return (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', color: '#f0f0f0', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 style={{ color: '#e50914', borderBottom: '2px solid #333', paddingBottom: '10px' }}>Terms of Service</h1>
                <p style={{ marginTop: '20px', lineHeight: '1.6' }}>Last updated: {new Date().toLocaleDateString()}</p>

                <h2 style={{ color: '#fff', marginTop: '30px' }}>1. Agreement to Terms</h2>
                <p style={{ lineHeight: '1.6', color: '#ccc' }}>
                    By accessing or using our website, you agree to be bound by these Terms. If you do not agree to any part of the terms, then you may not access the Service.
                </p>

                <h2 style={{ color: '#fff', marginTop: '30px' }}>2. Purchases</h2>
                <p style={{ lineHeight: '1.6', color: '#ccc' }}>
                    If you wish to purchase any product or service made available through the Service ("Purchase"), you may be asked to supply certain information relevant to your Purchase including, without limitation, your credit card number, the expiration date of your credit card, your billing address, and your shipping information.
                </p>

                <h2 style={{ color: '#fff', marginTop: '30px' }}>3. Content</h2>
                <p style={{ lineHeight: '1.6', color: '#ccc' }}>
                    Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.
                </p>

                <h2 style={{ color: '#fff', marginTop: '30px' }}>4. Changes</h2>
                <p style={{ lineHeight: '1.6', color: '#ccc' }}>
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect.
                </p>

                <div style={{ marginTop: '40px' }}>
                    <a href="/store" style={{ color: '#e50914', textDecoration: 'none', fontWeight: 'bold' }}>&larr; Back to Store</a>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default TermsOfService;
