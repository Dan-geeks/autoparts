import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import ProfileSidebar from '../components/ProfileSidebar';
import { db, auth } from '../firebaseConfig';
import { collection, query, onSnapshot, addDoc, getDocs, where } from "firebase/firestore";
import '../styles/Store.css';
import '../styles/Theme.css';

const StorePage = () => {
    const navigate = useNavigate();
    const [parts, setParts] = useState([]);
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [userEmail, setUserEmail] = useState(null);
    const [filters, setFilters] = useState({ brand: 'all', year: 'all' });

    // Track quantities for each product
    const [quantities, setQuantities] = useState({});

    // Listen for auth state changes
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setUserEmail(user.email);
            } else {
                setUserEmail(null);
            }
        });
        return () => unsubscribe();
    }, []);

    // Computed Lists for Dropdowns
    const [brandList, setBrandList] = useState([]);
    const [yearList, setYearList] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "spareParts"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const loadedParts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setParts(loadedParts);

            // 1. Extract Unique Brands & Years from Data
            const dataBrands = [...new Set(loadedParts.map(p => p.brand).filter(b => b))];
            const dataYears = [...new Set(loadedParts.map(p => p.year).filter(y => y))];

            // 2. Define Defaults (if data is empty)
            const defaultBrands = [
                "Toyota", "BMW", "Mercedes", "Honda", "Nissan",
                "Subaru", "Volkswagen", "Audi", "Ford", "Chevrolet",
                "Hyundai", "Kia", "Mazda", "Land Rover", "Jeep",
                "Lexus", "Volvo", "Porsche", "Mitsubishi", "Isuzu"
            ].sort();

            const defaultYears = Array.from({ length: 26 }, (_, i) => (2000 + i).toString()).reverse(); // 2000-2025

            // 3. Set State: Use Data if available, otherwise use Defaults
            setBrandList(dataBrands.length > 0 ? dataBrands.sort() : defaultBrands);
            setYearList(dataYears.length > 0 ? dataYears.sort((a, b) => b - a) : defaultYears);
        });
        return () => unsubscribe();
    }, []);

    const filteredParts = parts.filter(item => {
        const itemYear = item.year?.toString();
        // Case insensitive comparison for brands just in case
        const matchesBrand = filters.brand === 'all' || item.brand?.toLowerCase() === filters.brand.toLowerCase();
        const matchesYear = filters.year === 'all' || itemYear === filters.year;

        return matchesBrand && matchesYear;
    });

    const addToCart = (item, quantity = 1) => {
        // Check if item already exists in cart
        const existingIndex = cart.findIndex(cartItem => cartItem.id === item.id);

        if (existingIndex !== -1) {
            // Item exists, update quantity
            const newCart = [...cart];
            newCart[existingIndex].quantity = (newCart[existingIndex].quantity || 1) + quantity;
            setCart(newCart);
        } else {
            // New item, add with quantity
            setCart([...cart, { ...item, quantity }]);
        }

        // Reset quantity for this product
        setQuantities(prev => ({ ...prev, [item.id]: 1 }));
    };
    const removeFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const checkout = async (method, formData) => {
        const total = cart.reduce((sum, item) => sum + item.price, 0);

        try {
            const orderData = {
                items: cart,
                total: total,
                customer: { phone: formData.phone, address: formData.address },
                date: new Date(),
                status: "Paid"
            };

            if (formData.marketerCode) {
                const q = query(collection(db, "marketers"), where("code", "==", formData.marketerCode));
                const snap = await getDocs(q);

                if (!snap.empty) {
                    const marketerId = snap.docs[0].id;
                    await addDoc(collection(db, "marketers", marketerId, "sales"), {
                        ...orderData,
                        marketerCode: formData.marketerCode,
                        status: "New"
                    });
                    alert("Order placed successfully! Marketer tracked.");
                } else {
                    alert("Order placed, but Marketer Code was invalid.");
                }
            } else {
                alert("Order placed successfully!");
            }

            setCart([]);
            setIsCartOpen(false);

        } catch (err) {
            console.error(err);
            alert("Error processing order: " + err.message);
        }
    };

    return (
        <div className="store-bg">
            <nav>
                <div className="logo">Evo<span>Parts</span></div>
                <div className="nav-icons">
                    <i
                        className="fas fa-user-circle"
                        onClick={() => setIsProfileOpen(true)}
                        style={{
                            cursor: 'pointer',
                            fontSize: '1.8rem',
                            color: '#fff',
                            marginRight: '20px',
                            transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => e.target.style.color = '#e50914'}
                        onMouseLeave={(e) => e.target.style.color = '#fff'}
                    ></i>
                    <div style={{ position: 'relative' }}>
                        <i
                            className="fas fa-shopping-cart"
                            onClick={() => setIsCartOpen(!isCartOpen)}
                            style={{ cursor: 'pointer' }}
                        >
                            <span className="cart-count">{cart.length}</span>
                        </i>
                        {isCartOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '50px',
                                right: '0',
                                background: 'var(--card-bg, #1a1a1a)',
                                border: '2px solid var(--border-color, #333)',
                                borderRadius: '12px',
                                padding: '20px',
                                minWidth: '380px',
                                maxWidth: '420px',
                                zIndex: 1000,
                                boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                                animation: 'slideDown 0.3s ease'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '2px solid var(--border-color, #333)', paddingBottom: '12px' }}>
                                    <div>
                                        <h3 style={{ color: 'var(--text-primary, #fff)', margin: 0, fontSize: '1.2rem' }}>Shopping Cart</h3>
                                        <p style={{ color: 'var(--text-secondary, #888)', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                                            {cart.length} {cart.length === 1 ? 'item' : 'items'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsCartOpen(false)}
                                        style={{
                                            background: 'var(--hover-bg, #333)',
                                            border: 'none',
                                            color: 'var(--text-secondary, #888)',
                                            fontSize: '24px',
                                            cursor: 'pointer',
                                            padding: '0',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = 'var(--danger, #e74c3c)';
                                            e.target.style.color = '#fff';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = 'var(--hover-bg, #333)';
                                            e.target.style.color = 'var(--text-secondary, #888)';
                                        }}
                                    >×</button>
                                </div>
                                {cart.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '40px 20px',
                                        color: 'var(--text-secondary, #888)'
                                    }}>
                                        <i className="fas fa-shopping-cart" style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.3 }}></i>
                                        <p style={{ margin: '0', fontSize: '1rem' }}>Your cart is empty</p>
                                        <p style={{ margin: '10px 0 0 0', fontSize: '0.85rem' }}>Add items to get started</p>
                                    </div>
                                ) : (
                                    <>
                                    <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '15px' }}>
                                    {cart.map((item, index) => (
                                        <div key={index} style={{
                                            display: 'flex',
                                            gap: '12px',
                                            marginBottom: '15px',
                                            paddingBottom: '15px',
                                            borderBottom: '1px solid var(--border-color, #333)',
                                            animation: 'fadeIn 0.3s ease'
                                        }}>
                                            <img
                                                src={item.mainImage || item.image || 'https://via.placeholder.com/80'}
                                                alt={item.name}
                                                style={{
                                                    width: '80px',
                                                    height: '80px',
                                                    objectFit: 'cover',
                                                    borderRadius: '8px',
                                                    border: '2px solid var(--border-color, #333)'
                                                }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: 'var(--text-primary, #fff)', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '4px' }}>{item.name}</div>
                                                <div style={{ color: 'var(--text-secondary, #888)', fontSize: '0.75rem', marginBottom: '6px' }}>
                                                    {item.brand} | {item.compatibleYears?.join(', ') || item.year}
                                                </div>

                                                {/* Quantity Controls */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                    <button
                                                        onClick={() => {
                                                            const newCart = [...cart];
                                                            if (newCart[index].quantity > 1) {
                                                                newCart[index].quantity--;
                                                                setCart(newCart);
                                                            }
                                                        }}
                                                        style={{
                                                            background: 'var(--hover-bg, #333)',
                                                            border: 'none',
                                                            color: 'var(--text-primary, #fff)',
                                                            width: '24px',
                                                            height: '24px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.background = 'var(--primary, #e50914)'}
                                                        onMouseLeave={(e) => e.target.style.background = 'var(--hover-bg, #333)'}
                                                    >
                                                        <i className="fas fa-minus"></i>
                                                    </button>
                                                    <span style={{
                                                        color: 'var(--text-primary, #fff)',
                                                        fontSize: '0.9rem',
                                                        minWidth: '30px',
                                                        textAlign: 'center',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {item.quantity || 1}
                                                    </span>
                                                    <button
                                                        onClick={() => {
                                                            const newCart = [...cart];
                                                            newCart[index].quantity = (newCart[index].quantity || 1) + 1;
                                                            setCart(newCart);
                                                        }}
                                                        style={{
                                                            background: 'var(--hover-bg, #333)',
                                                            border: 'none',
                                                            color: 'var(--text-primary, #fff)',
                                                            width: '24px',
                                                            height: '24px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.background = 'var(--primary, #e50914)'}
                                                        onMouseLeave={(e) => e.target.style.background = 'var(--hover-bg, #333)'}
                                                    >
                                                        <i className="fas fa-plus"></i>
                                                    </button>
                                                </div>

                                                {/* Price and Subtotal */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                    <div style={{ color: 'var(--text-secondary, #888)', fontSize: '0.8rem' }}>
                                                        {item.currency} {Number(item.price).toLocaleString()} each
                                                    </div>
                                                    {item.quantity > 1 && (
                                                        <div style={{ color: 'var(--primary, #e50914)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                                            Subtotal: {item.currency} {(Number(item.price) * item.quantity).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(index)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'var(--text-secondary, #888)',
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '16px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s',
                                                    alignSelf: 'flex-start'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.background = 'var(--danger, #e74c3c)';
                                                    e.target.style.color = '#fff';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.background = 'transparent';
                                                    e.target.style.color = 'var(--text-secondary, #888)';
                                                }}
                                                title="Remove from cart"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div style={{
                                    borderTop: '2px solid var(--border-color, #333)',
                                    paddingTop: '15px'
                                }}>
                                    <div style={{ marginBottom: '15px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ color: 'var(--text-secondary, #888)', fontSize: '0.9rem' }}>Subtotal:</span>
                                            <span style={{ color: 'var(--text-primary, #fff)', fontSize: '0.95rem' }}>
                                                {cart[0]?.currency || 'KES'} {cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0).toLocaleString()}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color, #333)' }}>
                                            <span style={{ color: 'var(--text-secondary, #888)', fontSize: '0.85rem' }}>Shipping:</span>
                                            <span style={{ color: 'var(--success, #2ecc71)', fontSize: '0.85rem', fontWeight: 'bold' }}>Calculated at checkout</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-primary, #fff)', fontSize: '1rem', fontWeight: 'bold' }}>Total:</span>
                                            <span style={{ color: 'var(--primary, #e50914)', fontSize: '1.3rem', fontWeight: 'bold' }}>
                                                {cart[0]?.currency || 'KES'} {cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setIsCartOpen(false);
                                            navigate('/checkout', { state: { cart } });
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '14px',
                                            background: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)',
                                            border: 'none',
                                            borderRadius: '8px',
                                            color: '#fff',
                                            fontSize: '1rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                            boxShadow: '0 4px 12px rgba(229, 9, 20, 0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.transform = 'translateY(-2px)';
                                            e.target.style.boxShadow = '0 6px 16px rgba(229, 9, 20, 0.4)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.transform = 'translateY(0)';
                                            e.target.style.boxShadow = '0 4px 12px rgba(229, 9, 20, 0.3)';
                                        }}
                                    >
                                        <i className="fas fa-lock"></i>
                                        Proceed to Checkout
                                    </button>
                                </div>
                                </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <section className="hero">
                <h1>Find The Right Parts</h1>
                <div className="filter-container">

                    {/* UPDATED: Dynamic Brand Select */}
                    <select id="brandSelect" onChange={(e) => setFilters(prev => ({ ...prev, brand: e.target.value }))}>
                        <option value="all">All Brands</option>
                        {brandList.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>

                    {/* UPDATED: Dynamic Year Select */}
                    <select id="yearSelect" onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}>
                        <option value="all">All Years</option>
                        {yearList.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                </div>
            </section>

            <div className="store-container">
                <h2 className="section-title">Available Spare Parts</h2>
                <div className="grid">
                    {filteredParts.length === 0 ? <p style={{ color: '#888' }}>No parts found matching filters.</p> : filteredParts.map(item => (
                        <div className="card" key={item.id}>
                            <div
                                onClick={() => navigate(`/product/${item.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                {(item.mainImage || item.image) && (item.mainImage || item.image) !== "" ? (
                                    <img
                                        src={item.mainImage || item.image}
                                        className="card-img"
                                        alt={item.name}
                                        onError={(e) => { e.target.src = "https://via.placeholder.com/300"; }}
                                    />
                                ) : (
                                    <div className="card-img">
                                        <i className="fas fa-camera" style={{ fontSize: '3rem', color: '#555' }}></i>
                                    </div>
                                )}

                                <div className="card-body">
                                    <div className="card-brand">
                                        {item.brand} {item.model && `- ${item.model}`}
                                        {item.compatibleYears && item.compatibleYears.length > 0 ? (
                                            <span> | {item.compatibleYears.join(', ')}</span>
                                        ) : item.year && (
                                            <span> | {item.year}</span>
                                        )}
                                    </div>
                                    <h3 className="card-title">{item.name}</h3>

                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                        {item.condition && (
                                            <div style={{
                                                display: 'inline-block',
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                background: item.condition === 'New' ? '#2ecc71' : item.condition.includes('Like New') ? '#3498db' : '#95a5a6',
                                                color: '#fff'
                                            }}>
                                                {item.condition}
                                            </div>
                                        )}
                                        {item.quantity && (
                                            <div style={{
                                                display: 'inline-block',
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                background: '#f39c12',
                                                color: '#fff'
                                            }}>
                                                {item.quantity} available
                                            </div>
                                        )}
                                    </div>

                                    {/* Show discount - supports both old format (discountCode/discountPercent) and new format (discount object) */}
                                    {(item.discountCode || item.discount) && (
                                        <div style={{
                                            padding: '6px 10px',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            fontWeight: 'bold',
                                            marginBottom: '10px',
                                            background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                                            color: '#fff',
                                            textAlign: 'center'
                                        }}>
                                            <i className="fas fa-tag" style={{ marginRight: '5px' }}></i>
                                            {item.discount ? (
                                                <>
                                                    {item.discount.code} - {item.discount.type === 'percentage' ? `${item.discount.value}% OFF` : `${item.currency} ${item.discount.value} OFF`}
                                                </>
                                            ) : (
                                                <>{item.discountCode} - Save {item.discountPercent}%</>
                                            )}
                                        </div>
                                    )}

                                    <div className="card-price">
                                        {item.currency || 'KES'} {Number(item.price).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '0 15px 15px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setQuantities(prev => ({
                                                ...prev,
                                                [item.id]: Math.max(1, (prev[item.id] || 1) - 1)
                                            }));
                                        }}
                                        style={{
                                            background: '#333',
                                            border: 'none',
                                            color: '#fff',
                                            width: '35px',
                                            height: '35px',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontSize: '1.2rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <i className="fas fa-minus"></i>
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantities[item.id] || 1}
                                        onChange={(e) => {
                                            e.stopPropagation();
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val) && val >= 1) {
                                                setQuantities(prev => ({ ...prev, [item.id]: val }));
                                            }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            width: '60px',
                                            textAlign: 'center',
                                            background: '#1a1a1a',
                                            border: '1px solid #333',
                                            color: '#fff',
                                            padding: '8px',
                                            borderRadius: '5px',
                                            fontSize: '1rem'
                                        }}
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setQuantities(prev => ({
                                                ...prev,
                                                [item.id]: (prev[item.id] || 1) + 1
                                            }));
                                        }}
                                        style={{
                                            background: '#333',
                                            border: 'none',
                                            color: '#fff',
                                            width: '35px',
                                            height: '35px',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            fontSize: '1.2rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <i className="fas fa-plus"></i>
                                    </button>
                                </div>
                                <button
                                    className="btn-add"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(item, quantities[item.id] || 1);
                                    }}
                                >
                                    <i className="fas fa-cart-plus"></i> Add to Cart
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>



            <Footer />

            {/* Profile Sidebar */}
            <ProfileSidebar
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
                userEmail={userEmail}
            />
        </div>
    );
};

export default StorePage;