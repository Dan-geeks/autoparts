import React, { useState, useEffect } from 'react';

const CartModal = ({ isOpen, onClose, cartItems, onRemove }) => {
    const [step, setStep] = useState('cart'); // 'cart', 'form', 'payment'
    const [formData, setFormData] = useState({ phone: '', address: '' });

    // Reset step when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setStep('cart');
            setFormData({ phone: '', address: '' });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const total = cartItems.reduce((sum, item) => sum + item.price, 0);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        if (!formData.phone || !formData.address) {
            alert('Please fill in both fields.');
            return;
        }
        setStep('payment');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>

                {/* STEP 1: CART LIST */}
                {step === 'cart' && (
                    <>
                        <h2>Your Shopping Cart</h2>
                        <div id="cartItemsContainer">
                            {cartItems.length === 0 ? (
                                <p>Cart is empty.</p>
                            ) : (
                                cartItems.map((item, index) => (
                                    <div className="cart-item" key={index}>
                                        <span>{item.name}</span>
                                        <span>
                                            KES {item.price.toLocaleString()}{' '}
                                            <i
                                                className="fas fa-trash"
                                                style={{ color: 'red', cursor: 'pointer', marginLeft: '10px' }}
                                                onClick={() => onRemove(index)}
                                            ></i>
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="total">Total: KES <span id="cartTotal">{total.toLocaleString()}</span></div>

                        <hr style={{ borderColor: '#444', margin: '20px 0' }} />

                        {cartItems.length > 0 && (
                            <button
                                className="filter-btn"
                                style={{ width: '100%' }}
                                onClick={() => setStep('form')}
                            >
                                Proceed to Checkout
                            </button>
                        )}
                    </>
                )}

                {/* STEP 2: DETAILS FORM */}
                {step === 'form' && (
                    <>
                        <h2><i className="fas fa-truck" style={{ marginRight: '10px' }}></i>Delivery Details</h2>
                        <p style={{ color: '#bbb', marginBottom: '20px' }}>Where should we send your parts?</p>

                        <form onSubmit={handleFormSubmit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>Phone Number</label>
                                <input
                                    type="tel"
                                    className="admin-input"
                                    placeholder="+254 7..."
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>Delivery Address</label>
                                <textarea
                                    className="admin-input"
                                    placeholder="County, Town, Street, Building..."
                                    rows="3"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    required
                                ></textarea>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="button" className="filter-btn" style={{ backgroundColor: '#444' }} onClick={() => setStep('cart')}>Back</button>
                                <button type="submit" className="filter-btn" style={{ flex: 1 }}>Continue to Payment</button>
                            </div>
                        </form>
                    </>
                )}

                {/* STEP 3: PAYMENT INSTRUCTIONS */}
                {step === 'payment' && (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', color: '#4caf50', marginBottom: '10px' }}>
                            <i className="fab fa-paypal"></i>
                        </div>
                        <h2>Payment Instructions</h2>
                        <p>Complete your order by sending payment to our PayPal address below.</p>

                        <div style={{ backgroundColor: '#333', padding: '15px', borderRadius: '10px', margin: '20px 0', border: '1px solid #444' }}>
                            <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '0.9rem' }}>PAYPAL EMAIL</p>
                            <p style={{ margin: '0', fontSize: '1.2rem', fontWeight: 'bold', color: 'white', wordBreak: 'break-all' }}>
                                payments@autospares.com
                            </p>
                        </div>

                        <div style={{ backgroundColor: 'rgba(211, 47, 47, 0.1)', padding: '15px', borderRadius: '10px', marginBottom: '20px', border: '1px solid var(--primary)' }}>
                            <p style={{ margin: '0 0 5px 0', color: '#d32f2f', fontSize: '0.9rem' }}>AMOUNT TO PAY</p>
                            <p style={{ margin: '0', fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>
                                KES {total.toLocaleString()}
                            </p>
                        </div>

                        <p style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '20px' }}>
                            Please reference your phone number <b>{formData.phone}</b> in the payment notes.
                        </p>

                        <button className="filter-btn" style={{ width: '100%', backgroundColor: '#4caf50' }} onClick={onClose}>
                            I Have Made Payment
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartModal;
