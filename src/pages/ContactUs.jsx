import React, { useState } from 'react';
import Footer from '../components/Footer';

const ContactUs = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Handle form submission logic here
        alert('Thank you for your message! We will get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', color: '#f0f0f0', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' }}>
                <h1 style={{ color: '#e50914', borderBottom: '2px solid #333', paddingBottom: '10px' }}>Contact Us</h1>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '40px' }}>
                    {/* Contact Information */}
                    <div>
                        <h2 style={{ color: '#fff', marginBottom: '20px' }}>Get In Touch</h2>
                        <p style={{ lineHeight: '1.6', color: '#ccc', marginBottom: '30px' }}>
                            Have questions about our products or services? We're here to help! Reach out to us through any of the following channels.
                        </p>

                        <div style={{ marginBottom: '25px' }}>
                            <h3 style={{ color: '#e50914', fontSize: '18px', marginBottom: '10px' }}>
                                <i className="fas fa-map-marker-alt" style={{ marginRight: '10px' }}></i>
                                Our Location
                            </h3>
                            <p style={{ color: '#ccc', lineHeight: '1.6', marginLeft: '28px' }}>
                                EvoParts GmbH<br />
                                Kurfürstendamm 123<br />
                                10719 Berlin, Germany
                            </p>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <h3 style={{ color: '#e50914', fontSize: '18px', marginBottom: '10px' }}>
                                <i className="fas fa-envelope" style={{ marginRight: '10px' }}></i>
                                Email
                            </h3>
                            <p style={{ color: '#ccc', marginLeft: '28px' }}>
                                <a href="mailto:evoautopartslimited@gmail.com" style={{ color: '#ccc', textDecoration: 'none' }}>
                                    evoautopartslimited@gmail.com
                                </a>
                            </p>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <h3 style={{ color: '#e50914', fontSize: '18px', marginBottom: '10px' }}>
                                <i className="fas fa-phone" style={{ marginRight: '10px' }}></i>
                                Phone
                            </h3>
                            <p style={{ color: '#ccc', marginLeft: '28px' }}>
                                +44 20 7946 0958
                            </p>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <h3 style={{ color: '#e50914', fontSize: '18px', marginBottom: '10px' }}>
                                <i className="fab fa-whatsapp" style={{ marginRight: '10px' }}></i>
                                WhatsApp
                            </h3>
                            <p style={{ color: '#ccc', marginLeft: '28px' }}>
                                <a href="https://wa.me/442079460958" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', textDecoration: 'none' }}>
                                    Chat with us on WhatsApp
                                </a>
                            </p>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <h3 style={{ color: '#e50914', fontSize: '18px', marginBottom: '10px' }}>
                                <i className="fas fa-clock" style={{ marginRight: '10px' }}></i>
                                Business Hours
                            </h3>
                            <p style={{ color: '#ccc', lineHeight: '1.6', marginLeft: '28px' }}>
                                Monday - Friday: 9:00 AM - 6:00 PM CET<br />
                                Saturday: 10:00 AM - 4:00 PM CET<br />
                                Sunday: Closed
                            </p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div>
                        <h2 style={{ color: '#fff', marginBottom: '20px' }}>Send Us a Message</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label htmlFor="name" style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#2a2a2a',
                                        border: '1px solid #444',
                                        borderRadius: '4px',
                                        color: '#f0f0f0',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div>
                                <label htmlFor="email" style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#2a2a2a',
                                        border: '1px solid #444',
                                        borderRadius: '4px',
                                        color: '#f0f0f0',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div>
                                <label htmlFor="subject" style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
                                    Subject *
                                </label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#2a2a2a',
                                        border: '1px solid #444',
                                        borderRadius: '4px',
                                        color: '#f0f0f0',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div>
                                <label htmlFor="message" style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
                                    Message *
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows="6"
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        backgroundColor: '#2a2a2a',
                                        border: '1px solid #444',
                                        borderRadius: '4px',
                                        color: '#f0f0f0',
                                        fontSize: '14px',
                                        resize: 'vertical',
                                        fontFamily: 'Arial, sans-serif'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                style={{
                                    padding: '14px 28px',
                                    backgroundColor: '#e50914',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.3s'
                                }}
                                onMouseOver={(e) => e.target.style.backgroundColor = '#b8070d'}
                                onMouseOut={(e) => e.target.style.backgroundColor = '#e50914'}
                            >
                                Send Message
                            </button>
                        </form>
                    </div>
                </div>

                <div style={{ marginTop: '40px' }}>
                    <a href="/store" style={{ color: '#e50914', textDecoration: 'none', fontWeight: 'bold' }}>&larr; Back to Store</a>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default ContactUs;
