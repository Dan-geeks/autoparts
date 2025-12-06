import React, { useState } from 'react';
import { parts as initialParts } from '../data/parts';
import CartModal from '../components/CartModal';
import AdminModal from '../components/AdminModal';
import '../styles/Store.css';

const StorePage = () => {
    const [parts, setParts] = useState(initialParts);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAdminOpen, setIsAdminOpen] = useState(false);

    const [filters, setFilters] = useState({
        brand: 'all',
        year: 'all'
    });

    // Derived state for filtered parts
    const filteredParts = parts.filter(item => {
        return (filters.brand === 'all' || item.brand === filters.brand) &&
            (filters.year === 'all' || item.year === filters.year);
    });

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    // Main filter button action (though real-time filtering is better, user had a button)
    // We'll just make the button trigger search or just let selects drive it. 
    // User code: Selects updated values, Button called "filterParts()".
    // I will make the button redundant or just refresh, but React updates automatically. 
    // To match user UX, I will only apply filters when "Search Parts" is clicked?
    // Nah, reactive is better. But if strict:
    // "Search Parts" button can initiate the fetch.
    // Let's stick to reactive for better UX, but keep the button for UI fidelity.

    // Actually, let's make it state-based but triggered by button if needed. 
    // Simpler: Just make the selects update a temporary state, and button "applies" it?
    // Or just make it instant. Instant is expected in React. I will keep the button as a visual indicator or "Refresh".

    const addToCart = (item) => {
        setCart([...cart, item]);
        alert(item.name + " added to cart!");
    };

    const removeFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const checkout = (method) => {
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        if (cart.length === 0) return alert("Cart is empty!");
        alert("Initiating " + method + " transaction for KES " + total.toLocaleString() + "...");
        // Payment gateway logic here
    };

    const addNewItem = (newItem) => {
        const itemWithId = { ...newItem, id: parts.length + 1 };
        setParts([...parts, itemWithId]);
        alert("New part added successfully!");
    };

    return (
        <div className="store-bg">
            <nav>
                <div className="logo">Auto<span>Spares</span></div>
                <div className="nav-icons">
                    <i className="fas fa-user-cog" onClick={() => setIsAdminOpen(true)} title="Admin Panel"></i>
                    <i className="fas fa-shopping-cart" onClick={() => setIsCartOpen(true)}>
                        <span className="cart-count">{cart.length}</span>
                    </i>
                </div>
            </nav>

            <section className="hero">
                <h1>Find The Right Parts</h1>
                <p>Select your vehicle details below</p>

                <div className="filter-container">
                    <select id="brandSelect" onChange={(e) => handleFilterChange('brand', e.target.value)}>
                        <option value="all">All Brands</option>
                        <option value="BMW">BMW</option>
                        <option value="Mercedes">Mercedes</option>
                        <option value="Toyota">Toyota</option>
                    </select>

                    <select id="yearSelect" onChange={(e) => handleFilterChange('year', e.target.value)}>
                        <option value="all">All Years</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2015">2015</option>
                    </select>

                    <button className="filter-btn">Search Parts</button>
                </div>
            </section>

            <div className="store-container">
                <h2 className="section-title">Available Spare Parts ({filteredParts.length})</h2>
                <div className="grid">
                    {filteredParts.length === 0 ? (
                        <p>No parts found matching your criteria.</p>
                    ) : (
                        filteredParts.map(item => (
                            <div className="card" key={item.id}>
                                <img
                                    src={item.image || "https://via.placeholder.com/300x200?text=No+Image+Added"}
                                    className="card-img"
                                    alt={item.name}
                                    onError={(e) => { e.target.src = "https://via.placeholder.com/300x200?text=Image+Not+Found"; }}
                                />
                                <div className="card-body">
                                    <div className="card-brand">{item.brand} | {item.year}</div>
                                    <h3 className="card-title">{item.name}</h3>
                                    <div className="card-price">KES {item.price.toLocaleString()}</div>
                                    <button className="btn-add" onClick={() => addToCart(item)}>
                                        <i className="fas fa-cart-plus"></i> Add to Cart
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <CartModal
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cartItems={cart}
                onRemove={removeFromCart}
                onCheckout={checkout}
            />

            <AdminModal
                isOpen={isAdminOpen}
                onClose={() => setIsAdminOpen(false)}
                onAddItem={addNewItem}
            />
        </div>
    );
};

export default StorePage;
