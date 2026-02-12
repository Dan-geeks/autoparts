import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc } from "firebase/firestore";
import Footer from '../components/Footer';
import '../styles/Login.css';

const MarketerRegistration = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    // Check if user is logged in and pre-fill email
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user && user.email) {
                setFormData(prev => ({
                    ...prev,
                    email: user.email
                }));
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Store request in adminRequests collection for admin approval
            await addDoc(collection(db, "adminRequests"), {
                type: "Marketer Registration",
                description: `New Registration: ${formData.name} (${formData.email})`,
                details: {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    status: 'Pending Approval'
                },
                status: "Pending",
                date: new Date()
            });
            setSubmitted(true);
        } catch (err) {
            alert("Error submitting request: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-bg">
            <div className="login-container">
                <div className="login-logo">Join<span>EvoParts</span></div>

                {!submitted ? (
                    <>
                        <h3>Marketer Registration</h3>
                        <p style={{ color: '#ccc', marginBottom: '20px', fontSize: '0.9rem' }}>
                            {isLoggedIn
                                ? 'Complete your marketer registration. Your email has been pre-filled.'
                                : 'Submit your details to join our marketing team.'}
                        </p>
                        {isLoggedIn && (
                            <div style={{
                                background: 'rgba(46, 204, 113, 0.1)',
                                border: '1px solid rgba(46, 204, 113, 0.3)',
                                borderRadius: '8px',
                                padding: '12px',
                                marginBottom: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <i className="fas fa-check-circle" style={{ color: '#2ecc71', fontSize: '1.2rem' }}></i>
                                <span style={{ color: '#ccc', fontSize: '0.85rem' }}>
                                    You're logged in. Just add your name and phone number.
                                </span>
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className="form-section active">
                            <div className="input-group">
                                <label>Full Name</label>
                                <input
                                    className="input-field"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Enter your full name"
                                />
                            </div>
                            <div className="input-group">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    className="input-field"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="email@example.com"
                                    disabled={isLoggedIn}
                                    style={{
                                        background: isLoggedIn ? '#2a2a2a' : '#1a1a1a',
                                        cursor: isLoggedIn ? 'not-allowed' : 'text'
                                    }}
                                />
                                {isLoggedIn && (
                                    <small style={{ color: '#888', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                                        Email from your logged-in account
                                    </small>
                                )}
                            </div>
                            <div className="input-group">
                                <label>Phone Number</label>
                                <input
                                    type="tel"
                                    className="input-field"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    placeholder="+254..."
                                />
                            </div>
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? "Submitting..." : "Submit Application"}
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <i className="fas fa-check-circle" style={{ fontSize: '3rem', color: '#4caf50', marginBottom: '15px' }}></i>
                        <h3>Application Sent!</h3>
                        <p style={{ color: '#ccc' }}>
                            Your application is being reviewed. We will contact you via email once approved.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketerRegistration;
