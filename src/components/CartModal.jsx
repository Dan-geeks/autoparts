import React, { useState, useEffect } from 'react';

const CartModal = ({ isOpen, onClose, cartItems, onRemove, onCheckout }) => {
    const [step, setStep] = useState('cart');
    const [formData, setFormData] = useState({ phone: '', address: '', marketerCode: '' });

    useEffect(() => {
        if (!isOpen) {
            setStep('cart');
            setFormData({ phone: '', address: '', marketerCode: '' });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const total = cartItems.reduce((sum, item) => sum + item.price, 0);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        setStep('payment');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>

                {step === 'cart' && (
                    <>
                        <h2>Your Shopping Cart</h2>
                        <div id="cartItemsContainer">
                            {cartItems.length === 0 ? <p>Cart is empty.</p> : (
                                cartItems.map((item, index) => (
                                    <div className="cart-item" key={index}>
                                        <span>{item.name}</span>
                                        <span>{item.currency || 'KES'} {item.price.toLocaleString()} <i className="fas fa-trash" style={{ color: 'red', cursor: 'pointer', marginLeft: '10px' }} onClick={() => onRemove(index)}></i></span>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="total">Total: {cartItems.length > 0 ? (cartItems[0].currency || 'KES') : 'KES'} <span>{total.toLocaleString()}</span></div>
                        <hr style={{ borderColor: '#444', margin: '20px 0' }} />
                        {cartItems.length > 0 && <button className="filter-btn" style={{ width: '100%' }} onClick={() => setStep('form')}>Proceed to Checkout</button>}
                    </>
                )}

                {step === 'form' && (
                    <>
                        <h2>Delivery Details</h2>
                        <form onSubmit={handleFormSubmit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>Phone Number</label>
                                <input type="tel" className="admin-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>Delivery Address</label>
                                <textarea className="admin-input" rows="2" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required></textarea>
                            </div>

                            {/* NEW MARKETER CODE INPUT */}
                            <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '5px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: 'var(--primary)' }}>Referral Code (Marketer)</label>
                                <input type="text" className="admin-input" placeholder="Enter code if you have one" value={formData.marketerCode} onChange={(e) => setFormData({ ...formData, marketerCode: e.target.value.toUpperCase() })} />
                            </div>

                            <button type="submit" className="filter-btn" style={{ width: '100%' }}>Continue to Payment</button>
                        </form>
                    </>
                )}

                {step === 'payment' && (
                    <div style={{ textAlign: 'center' }}>
                        <h2>Confirm Payment</h2>
                        <p>Total: {cartItems.length > 0 ? (cartItems[0].currency || 'KES') : 'KES'} {total.toLocaleString()}</p>
                        {formData.marketerCode && <p style={{ color: 'var(--primary)' }}>Referrer: {formData.marketerCode}</p>}

                        <button className="filter-btn" style={{ width: '100%', marginTop: '20px', backgroundColor: '#4caf50' }}
                            onClick={() => onCheckout('M-Pesa', formData)}>
                            Pay Now & Complete Order
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartModal;