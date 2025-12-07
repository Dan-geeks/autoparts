import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, where, onSnapshot, doc } from "firebase/firestore";
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

    // States: 'form' | 'processing' | 'success'
    const [viewState, setViewState] = useState('form');
    const [orderId, setOrderId] = useState(null);
    const [trackingCollection, setTrackingCollection] = useState(null); // 'orders' or 'marketers/{id}/sales'

    const total = cart.reduce((sum, item) => sum + Number(item.price), 0);
    const currency = cart.length > 0 ? (cart[0].currency || 'KES') : 'KES';

    useEffect(() => {
        if (cart.length === 0 && viewState === 'form') {
            navigate('/store');
        }
    }, [cart, navigate, viewState]);

    // REAL-TIME LISTENER FOR APPROVAL
    useEffect(() => {
        if (viewState === 'processing' && orderId && trackingCollection) {
            const unsub = onSnapshot(doc(db, trackingCollection, orderId), (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.status === 'Approved' || data.status === 'Paid') {
                        setViewState('success');
                        localStorage.removeItem('cart');
                    }
                }
            });
            return () => unsub();
        }
    }, [viewState, orderId, trackingCollection]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        // 1. Prepare Data
        const orderData = {
            items: cart,
            total: total,
            customer: {
                name: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address
            },
            paymentMethod: "PayPal",
            status: "Pending Payment", // This triggers the wait
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

                    // Notify Admin
                    await addDoc(collection(db, "adminRequests"), {
                        type: "Payment Approval",
                        description: `Approve payment of ${currency} ${total} (Marketer: ${formData.marketerCode})`,
                        orderId: newOrderRef.id,
                        collectionPath: collectionPath, // Admin needs to know where to update
                        amount: total,
                        status: "Pending",
                        date: new Date()
                    });

                } else {
                    alert("Invalid Marketer Code. Processing as standard order.");
                    // Fallback to standard order
                    collectionPath = "orders";
                    newOrderRef = await addDoc(collection(db, "orders"), orderData);

                    // Notify Admin
                    await addDoc(collection(db, "adminRequests"), {
                        type: "Payment Approval",
                        description: `Approve payment of ${currency} ${total} (Direct Sale)`,
                        orderId: newOrderRef.id,
                        collectionPath: collectionPath,
                        amount: total,
                        status: "Pending",
                        date: new Date()
                    });
                }
            } else {
                // Direct Order (No Code)
                collectionPath = "orders";
                newOrderRef = await addDoc(collection(db, "orders"), orderData);

                // Notify Admin
                await addDoc(collection(db, "adminRequests"), {
                    type: "Payment Approval",
                    description: `Approve payment of ${currency} ${total} (Direct Sale)`,
                    orderId: newOrderRef.id,
                    collectionPath: collectionPath,
                    amount: total,
                    status: "Pending",
                    date: new Date()
                });
            }

            // 3. Transition UI
            setOrderId(newOrderRef.id);
            setTrackingCollection(collectionPath);
            setViewState('processing');

        } catch (err) {
            console.error(err);
            alert("Error placing order: " + err.message);
        }
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
                                <h2>Payment Instructions</h2>
                                <p style={{ color: '#ccc', marginBottom: '15px' }}>
                                    Send total via PayPal to start processing.
                                </p>

                                <div className="paypal-box">
                                    <i className="fab fa-paypal" style={{ fontSize: '2rem', color: '#003087' }}></i>
                                    <span className="paypal-email">collinskosgei32@gmail.com</span>
                                </div>

                                <button type="submit" className="place-order-btn">
                                    Confirm Order Sent
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* VIEW 2: PROCESSING ANIMATION */}
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

                {/* VIEW 3: SUCCESS ANIMATION */}
                {viewState === 'success' && (
                    <div className="status-container">
                        <i className="fas fa-check-circle success-icon"></i>
                        <h2 className="success-title">Payment Successful!</h2>
                        <p className="sub-text">Your order has been approved and is being prepared for shipping.</p>
                        <button className="place-order-btn" onClick={() => navigate('/store')} style={{ width: 'auto', padding: '10px 40px' }}>
                            Continue Shopping
                        </button>
                    </div>
                )}

            </div>
            <Footer />
        </div>
    );
};

export default CheckoutPage;