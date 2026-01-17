import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { db } from '../firebaseConfig';
import { collection, query, onSnapshot, addDoc, getDocs, where } from "firebase/firestore";
import '../styles/Store.css';

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
    const [filters, setFilters] = useState({ brand: 'all', year: 'all' });

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

    const addToCart = (item) => setCart([...cart, item]);
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
                    <i className="fas fa-shopping-cart" onClick={() => navigate('/checkout', { state: { cart } })}>
                        <span className="cart-count">{cart.length}</span>
                    </i>
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
                            {item.image && item.image !== "" ? (
                                <img
                                    src={item.image}
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
                                <div className="card-brand">{item.brand} | {item.year}</div>
                                <h3 className="card-title">{item.name}</h3>

                                {item.condition && (
                                    <div style={{
                                        display: 'inline-block',
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        marginBottom: '10px',
                                        background: item.condition === 'New' ? '#2ecc71' : item.condition === 'Like New' ? '#3498db' : '#95a5a6',
                                        color: '#fff'
                                    }}>
                                        {item.condition}
                                    </div>
                                )}

                                <div className="card-price">
                                    {item.currency || 'KES'} {Number(item.price).toLocaleString()}
                                </div>

                                <button className="btn-add" onClick={() => addToCart(item)}>
                                    <i className="fas fa-cart-plus"></i> Add to Cart
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>



            <Footer />
        </div>
    );
};

export default StorePage;