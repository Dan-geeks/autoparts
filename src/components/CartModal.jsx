import React from 'react';

const CartModal = ({ isOpen, onClose, cartItems, onRemove, onCheckout }) => {
    if (!isOpen) return null;

    const total = cartItems.reduce((sum, item) => sum + item.price, 0);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
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
                <h3>Checkout</h3>
                <button className="filter-btn" style={{ width: '100%', marginBottom: '10px' }} onClick={() => onCheckout('Card')}>
                    Pay with Card <i className="fas fa-credit-card"></i>
                </button>
                <button className="filter-btn" style={{ width: '100%', background: '#4caf50' }} onClick={() => onCheckout('M-Pesa/Bank')}>
                    Pay with M-Pesa / Bank <i className="fas fa-mobile-alt"></i>
                </button>
            </div>
        </div>
    );
};

export default CartModal;
