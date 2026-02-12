import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { createPayPalOrder, capturePayPalPayment } from '../config/paypalConfig';
import PayPalCardPayment from '../components/PayPalCardPayment';
import '../styles/Checkout.css';

const CheckoutPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [cart, setCart] = useState(() => {
        const navCart = location.state?.cart;
        const storedCart = localStorage.getItem('cart');
        return navCart ? navCart : (storedCart ? JSON.parse(storedCart) : []);
    });

    // Sync cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        marketerCode: ''
    });

    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [discountError, setDiscountError] = useState('');
    const [checkingDiscount, setCheckingDiscount] = useState(false);

    // States: 'form' | 'payment' | 'processing' | 'success'
    const [viewState, setViewState] = useState('form');
    const [orderId, setOrderId] = useState(null);
    const [trackingCollection, setTrackingCollection] = useState(null); // 'orders' or 'marketers/{id}/sales'
    const [payPalOrderId, setPayPalOrderId] = useState(null);

    const subtotal = cart.reduce((sum, item) => sum + Number(item.price), 0);
    const discountAmount = appliedDiscount ? appliedDiscount.amount : 0;
    const total = subtotal - discountAmount;
    const currency = cart.length > 0 ? (cart[0].currency || 'KES') : 'KES';

    useEffect(() => {
        if (cart.length === 0 && viewState === 'form') {
            navigate('/store');
        }
    }, [cart, navigate, viewState]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- DISCOUNT CODE VALIDATION ---
    const applyDiscountCode = async () => {
        if (!discountCode.trim()) return;

        setCheckingDiscount(true);
        setDiscountError('');
        setAppliedDiscount(null);

        try {
            // Search for product with this discount code
            const q = query(collection(db, "spareParts"), where("discount.code", "==", discountCode.toUpperCase()));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setDiscountError('Invalid discount code');
                setCheckingDiscount(false);
                return;
            }

            const productWithDiscount = snapshot.docs[0].data();
            const discount = productWithDiscount.discount;

            // Calculate discount amount
            let discountAmt = 0;
            if (discount.type === 'percentage') {
                discountAmt = (subtotal * discount.value) / 100;
            } else {
                discountAmt = discount.value;
            }

            // Ensure discount doesn't exceed total
            discountAmt = Math.min(discountAmt, subtotal);

            setAppliedDiscount({
                code: discount.code,
                type: discount.type,
                value: discount.value,
                amount: discountAmt,
                productName: productWithDiscount.name
            });

        } catch (err) {
            console.error('Error validating discount:', err);
            setDiscountError('Error validating code. Try again.');
        } finally {
            setCheckingDiscount(false);
        }
    };

    const removeDiscount = () => {
        setAppliedDiscount(null);
        setDiscountCode('');
        setDiscountError('');
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        // Move to payment view
        setViewState('payment');
    };

    const handlePaymentSuccess = async (paymentData) => {
        // 1. Prepare Order Data
        const orderData = {
            items: cart,
            subtotal: subtotal,
            discount: appliedDiscount ? {
                code: appliedDiscount.code,
                type: appliedDiscount.type,
                value: appliedDiscount.value,
                amount: appliedDiscount.amount
            } : null,
            total: total,
            customer: {
                name: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address
            },
            paymentMethod: "PayPal Card Payment",
            paymentId: paymentData.paymentId,
            paypalOrderId: paymentData.orderId,
            status: "Paid", // Payment already captured
            date: new Date()
        };

        try {
            let newOrderRef;
            let collectionPath;

            // 2. Determine Logic based on Marketer Code
            if (formData.marketerCode) {
                const q = query(collection(db, "marketers"), where("code", "==", formData.marketerCode.toUpperCase()));
                const snap = await getDocs(q);

                if (!snap.empty) {
                    const marketerId = snap.docs[0].id;
                    collectionPath = `marketers/${marketerId}/sales`;

                    // Add to Marketer's Sales
                    newOrderRef = await addDoc(collection(db, collectionPath), {
                        ...orderData,
                        marketerCode: formData.marketerCode.toUpperCase()
                    });

                } else {
                    // Fallback to standard order
                    collectionPath = "orders";
                    newOrderRef = await addDoc(collection(db, "orders"), orderData);
                }
            } else {
                // Direct Order (No Code)
                collectionPath = "orders";
                newOrderRef = await addDoc(collection(db, "orders"), orderData);
            }

            // 3. Transition to Success
            setOrderId(newOrderRef.id);
            setTrackingCollection(collectionPath);
            setViewState('success');
            localStorage.removeItem('cart');

            // Redirect to Thank You page after 2 seconds
            setTimeout(() => {
                navigate('/thank-you');
            }, 2000);

        } catch (err) {
            console.error(err);
            alert("Error saving order: " + err.message);
        }
    };

    const handlePaymentError = (error) => {
        console.error('Payment error:', error);
        alert('Payment failed: ' + error.message);
        setViewState('form');
    };

    const removeFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    return (
        <div className="store-bg">
            <nav style={{ position: 'relative' }}>
                <div className="logo">Evo<span>Parts</span> Checkout</div>
            </nav>

            <div className="checkout-container">

                {/* VIEW 1: FORM */}
                {viewState === 'form' && (
                    <form onSubmit={handlePlaceOrder} className="checkout-grid">
                        <div className="left-col">
                            <div className="checkout-section">
                                <h2>Shipping Information</h2>
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input name="fullName" className="checkout-input" required value={formData.fullName} onChange={handleInputChange} placeholder="John Doe" />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" name="email" className="checkout-input" required value={formData.email} onChange={handleInputChange} placeholder="john@example.com" />
                                </div>
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="tel" name="phone" className="checkout-input" required value={formData.phone} onChange={handleInputChange} placeholder="+44..." />
                                </div>
                                <div className="form-group">
                                    <label>Delivery Address</label>
                                    <textarea name="address" className="checkout-input checkout-textarea" required value={formData.address} onChange={handleInputChange} placeholder="Street, City, Building..."></textarea>
                                </div>
                            </div>

                            <div className="checkout-section">
                                <h2>Referral</h2>
                                <div className="form-group">
                                    <label>Referral code (Optional)</label>
                                    <input name="marketerCode" className="checkout-input" value={formData.marketerCode} onChange={handleInputChange} placeholder="Enter code here" />
                                </div>
                            </div>

                            <div className="checkout-section">
                                <h2>Discount Code</h2>
                                <div className="form-group">
                                    <label>Have a discount code?</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text"
                                            className="checkout-input"
                                            placeholder="Enter discount code"
                                            value={discountCode}
                                            onChange={(e) => {
                                                setDiscountCode(e.target.value.toUpperCase());
                                                setDiscountError('');
                                            }}
                                            disabled={appliedDiscount !== null}
                                            style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '1px' }}
                                        />
                                        {!appliedDiscount ? (
                                            <button
                                                type="button"
                                                onClick={applyDiscountCode}
                                                disabled={!discountCode.trim() || checkingDiscount}
                                                style={{
                                                    padding: '12px 20px',
                                                    background: discountCode.trim() ? '#2ecc71' : '#555',
                                                    border: 'none',
                                                    borderRadius: '5px',
                                                    color: '#fff',
                                                    fontWeight: 'bold',
                                                    cursor: discountCode.trim() ? 'pointer' : 'not-allowed',
                                                    transition: 'all 0.3s'
                                                }}
                                            >
                                                {checkingDiscount ? 'Checking...' : 'Apply'}
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={removeDiscount}
                                                style={{
                                                    padding: '12px 20px',
                                                    background: '#e74c3c',
                                                    border: 'none',
                                                    borderRadius: '5px',
                                                    color: '#fff',
                                                    fontWeight: 'bold',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s'
                                                }}
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>

                                    {discountError && (
                                        <div style={{ color: '#e74c3c', marginTop: '10px', fontSize: '0.9rem' }}>
                                            <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
                                            {discountError}
                                        </div>
                                    )}

                                    {appliedDiscount && (
                                        <div style={{
                                            marginTop: '15px',
                                            padding: '15px',
                                            background: 'rgba(46, 204, 113, 0.1)',
                                            border: '1px solid #2ecc71',
                                            borderRadius: '8px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ color: '#2ecc71', fontWeight: 'bold', marginBottom: '5px' }}>
                                                        <i className="fas fa-check-circle" style={{ marginRight: '8px' }}></i>
                                                        Discount Applied!
                                                    </div>
                                                    <div style={{ color: '#ccc', fontSize: '0.85rem' }}>
                                                        Code: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{appliedDiscount.code}</span>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ color: '#2ecc71', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                                        -{currency} {appliedDiscount.amount.toLocaleString()}
                                                    </div>
                                                    <div style={{ color: '#888', fontSize: '0.8rem' }}>
                                                        {appliedDiscount.type === 'percentage' ? `${appliedDiscount.value}% off` : 'Fixed discount'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="right-col">
                            <div className="checkout-section">
                                <h2>Order Summary</h2>
                                <div className="summary-list">
                                    {cart.map((item, index) => (
                                        <div key={index} className="summary-item">
                                            <div className="item-info">
                                                <span className="item-name">{item.name}</span>
                                                <span className="item-brand">{item.brand} | {item.compatibleYears?.join(', ') || item.year}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div className="item-price">
                                                    {item.currency} {Number(item.price).toLocaleString()}
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(index)}
                                                    style={{
                                                        background: '#e74c3c',
                                                        border: 'none',
                                                        color: '#fff',
                                                        width: '30px',
                                                        height: '30px',
                                                        borderRadius: '5px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = '#c0392b'}
                                                    onMouseLeave={(e) => e.target.style.background = '#e74c3c'}
                                                    title="Remove from cart"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ borderTop: '1px solid #333', paddingTop: '15px', marginTop: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#ccc' }}>
                                        <span>Subtotal</span>
                                        <span>{currency} {subtotal.toLocaleString()}</span>
                                    </div>

                                    {appliedDiscount && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#2ecc71' }}>
                                            <span>Discount ({appliedDiscount.code})</span>
                                            <span>-{currency} {appliedDiscount.amount.toLocaleString()}</span>
                                        </div>
                                    )}

                                    <div className="summary-total">
                                        <span>Total</span>
                                        <span>{currency} {total.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="checkout-section">
                                <h2>Ready to Pay</h2>
                                <p style={{ color: '#ccc', marginBottom: '15px' }}>
                                    Click below to proceed with secure card payment via PayPal.
                                </p>

                                <button type="submit" className="place-order-btn">
                                    Proceed to Payment
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* VIEW 2: PAYMENT */}
                {viewState === 'payment' && (
                    <div className="checkout-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div className="checkout-section">
                            <button
                                onClick={() => setViewState('form')}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#0070ba',
                                    cursor: 'pointer',
                                    marginBottom: '20px',
                                    fontSize: '14px'
                                }}
                            >
                                ← Back to Order Details
                            </button>

                            <h2>Secure Payment</h2>
                            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#16213e', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <span style={{ color: '#ccc' }}>Order Total:</span>
                                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '20px' }}>
                                        {currency} {total.toLocaleString()}
                                    </span>
                                </div>
                                <div style={{ fontSize: '12px', color: '#888' }}>
                                    Customer: {formData.fullName}
                                </div>
                            </div>

                            <PayPalCardPayment
                                amount={total}
                                currency={currency}
                                customerData={formData}
                                onSuccess={async (paymentData) => {
                                    setViewState('processing');
                                    await handlePaymentSuccess({
                                        paymentId: paymentData.paymentId,
                                        orderId: paymentData.orderId,
                                        status: paymentData.status,
                                        captureDetails: paymentData.captureResult
                                    });
                                }}
                                onError={(error) => {
                                    console.error('Payment error:', error);
                                    alert('Payment failed: ' + error.message + '\n\nPlease check your card details and try again.');
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* VIEW 3: PROCESSING ANIMATION */}
                {viewState === 'processing' && (
                    <div className="status-container">
                        <div className="spinner-box"></div>
                        <h2 className="processing-text">Payment is being processed...</h2>
                        <p className="sub-text">Please wait while we verify your transaction.</p>
                        <button className="continue-btn" onClick={() => navigate('/store')}>
                            Continue Shopping
                        </button>
                    </div>
                )}

                {/* VIEW 4: SUCCESS ANIMATION */}
                {viewState === 'success' && (
                    <div className="status-container">
                        <i className="fas fa-check-circle success-icon"></i>
                        <h2 className="success-title">Payment Successful!</h2>
                        <p className="sub-text">Redirecting to confirmation page...</p>
                    </div>
                )}

            </div>
            <Footer />
        </div>
    );
};

export default CheckoutPage;