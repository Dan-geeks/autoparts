import React from 'react';
import Footer from '../components/Footer';

const PrivacyPolicy = () => {
    return (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', color: '#f0f0f0', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 style={{ color: '#e50914', borderBottom: '2px solid #333', paddingBottom: '10px' }}>Privacy Policy</h1>
                <p style={{ marginTop: '20px', lineHeight: '1.6' }}>Last updated: {new Date().toLocaleDateString()}</p>

                <h2 style={{ color: '#fff', marginTop: '30px' }}>1. Introduction</h2>
                <p style={{ lineHeight: '1.6', color: '#ccc' }}>
                    Welcome to EvoParts. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website.
                </p>

                <h2 style={{ color: '#fff', marginTop: '30px' }}>2. Data We Collect</h2>
                <p style={{ lineHeight: '1.6', color: '#ccc' }}>
                    We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:
                    <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                        <li>Identity Data includes first name, last name, username or similar identifier.</li>
                        <li>Contact Data includes billing address, delivery address, email address and telephone numbers.</li>
                        <li>Transaction Data includes details about payments to and from you and other details of products and services you have purchased from us.</li>
                    </ul>
                </p>

                <h2 style={{ color: '#fff', marginTop: '30px' }}>3. How We Use Your Data</h2>
                <p style={{ lineHeight: '1.6', color: '#ccc' }}>
                    We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                    <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
                        <li>Where we need to perform the contract we are about to enter into or have entered into with you.</li>
                        <li>Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.</li>
                    </ul>
                </p>

                <h2 style={{ color: '#fff', marginTop: '30px' }}>4. Data Security</h2>
                <p style={{ lineHeight: '1.6', color: '#ccc' }}>
                    We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way, altered or disclosed.
                </p>

                <div style={{ marginTop: '40px' }}>
                    <a href="/store" style={{ color: '#e50914', textDecoration: 'none', fontWeight: 'bold' }}>&larr; Back to Store</a>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PrivacyPolicy;
