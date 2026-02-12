import React from 'react';


const Footer = () => {
    return (
        <footer className="site-footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h3>Evo<span>Parts</span></h3>
                    <p>Premium quality car parts for BMW, Mercedes, and Toyota. Your trusted partner in automotive excellence.</p>
                </div>
                <div className="footer-section">
                    <h4>Customer Service</h4>
                    <ul>
                        <li><a href="/contact-us">Contact Us</a></li>
                        <li><a href="/marketer">Become a Marketer</a></li>
                        <li><a href="/privacy-policy">Privacy Policy</a></li>
                        <li><a href="/terms-of-service">Terms of Service</a></li>
                        <li><a href="/shipping-policy">Shipping Policy</a></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h4>Contact Us</h4>
                    <p><i className="fas fa-map-marker-alt"></i> Europe</p>
                    <p>
                        <i className="fas fa-envelope"></i>
                        <a href="mailto:evoautopartslimited@gmail.com" style={{ color: '#ccc', textDecoration: 'none', marginLeft: '5px' }}>
                            evoautopartslimited@gmail.com
                        </a>
                    </p>
                    <p>
                        <i className="fab fa-whatsapp"></i>
                        <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', textDecoration: 'none', marginLeft: '5px' }}>
                            WhatsApp Chat
                        </a>
                    </p>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} EvoParts. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
