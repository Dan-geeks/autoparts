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

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        marketerCode: ''
    });


    // States: 'form' | 'payment' | 'processing' | 'success'
    const [viewState, setViewState] = useState('form');
    const [orderId, setOrderId] = useState(null);
    const [trackingCollection, setTrackingCollection] = useState(null); // 'orders' or 'marketers/{id}/sales'
    const [payPalOrderId, setPayPalOrderId] = useState(null);

    const total = cart.reduce((sum, item) => sum + Number(item.price), 0);
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

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        // Move to payment view
        setViewState('payment');
    };

    const handlePaymentSuccess = async (paymentData) => {
        // 1. Prepare Order Data
        const orderData = {
            items: cart,
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
                                    <input type="tel" name="phone" className="checkout-input" required value={formData.phone} onChange={handleInputChange} placeholder="+254..." />
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
                        </div>

                        <div className="right-col">
                            <div className="checkout-section">
                                <h2>Order Summary</h2>
                                <div className="summary-list">
                                    {cart.map((item, index) => (
                                        <div key={index} className="summary-item">
                                            <div className="item-info">
                                                <span className="item-name">{item.name}</span>
                                                <span className="item-brand">{item.brand} | {item.year}</span>
                                            </div>
                                            <div className="item-price">
                                                {item.currency} {Number(item.price).toLocaleString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="summary-total">
                                    <span>Total</span>
                                    <span>{currency} {total.toLocaleString()}</span>
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