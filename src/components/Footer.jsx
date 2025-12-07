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
                        <li><a href="/store#contact">Contact Us</a></li>
                        <li><a href="/privacy-policy">Privacy Policy</a></li>
                        <li><a href="/terms-of-service">Terms of Service</a></li>
                        <li><a href="/shipping-policy">Shipping Policy</a></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h4>Contact Info</h4>
                    <p><i className="fas fa-map-marker-alt"></i> 1234 Auto Drive, Detroit, MI 48202</p>
                    <p><i className="fas fa-phone"></i> +1 (555) 123-4567</p>
                    <p><i className="fas fa-envelope"></i> support@evoparts.com</p>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} EvoParts. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
