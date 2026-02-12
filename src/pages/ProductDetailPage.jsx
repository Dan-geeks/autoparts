import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { db } from '../firebaseConfig';
import { doc, getDoc } from "firebase/firestore";
import '../styles/ProductDetail.css';

const ProductDetailPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [cart, setCart] = useState(() => {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    });
    const [addedToCart, setAddedToCart] = useState(false);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const docRef = doc(db, "spareParts", productId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProduct({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.error("Product not found");
                }
            } catch (error) {
                console.error("Error fetching product:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    const handleAddToCart = () => {
        const existingIndex = cart.findIndex(item => item.id === product.id);

        if (existingIndex !== -1) {
            const newCart = [...cart];
            newCart[existingIndex].quantity = (newCart[existingIndex].quantity || 1) + quantity;
            setCart(newCart);
        } else {
            setCart([...cart, { ...product, quantity }]);
        }

        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    // Get all images - combine mainImage with additionalImages
    const getAllImages = () => {
        if (!product) return [];

        const images = [];

        // Add main image first (either the new mainImage field or legacy image field)
        if (product.mainImage) {
            images.push(product.mainImage);
        } else if (product.image) {
            images.push(product.image);
        }

        // Add additional images
        if (product.additionalImages && Array.isArray(product.additionalImages)) {
            images.push(...product.additionalImages);
        }

        return images.length > 0 ? images : ['https://via.placeholder.com/500?text=No+Image'];
    };

    if (loading) {
        return (
            <div className="product-detail-bg">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading product...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="product-detail-bg">
                <div className="not-found-container">
                    <i className="fas fa-exclamation-triangle"></i>
                    <h2>Product Not Found</h2>
                    <p>The product you're looking for doesn't exist or has been removed.</p>
                    <button onClick={() => navigate('/store')} className="back-btn">
                        <i className="fas fa-arrow-left"></i> Back to Store
                    </button>
                </div>
            </div>
        );
    }

    const images = getAllImages();

    return (
        <div className="product-detail-bg">
            <nav className="detail-nav">
                <div className="logo" onClick={() => navigate('/store')} style={{cursor:'pointer'}}>
                    Evo<span>Parts</span>
                </div>
                <div className="nav-icons">
                    <button className="back-to-store" onClick={() => navigate('/store')}>
                        <i className="fas fa-arrow-left"></i> Back to Store
                    </button>
                    <i className="fas fa-shopping-cart" onClick={() => navigate('/checkout', { state: { cart } })}>
                        <span className="cart-count">{cart.length}</span>
                    </i>
                </div>
            </nav>

            <div className="product-detail-container">
                {/* Image Gallery Section */}
                <div className="product-gallery">
                    <div className="main-image-container">
                        <img
                            src={images[selectedImage]}
                            alt={product.name}
                            className="main-product-image"
                            onError={(e) => { e.target.src = "https://via.placeholder.com/500?text=Image+Error"; }}
                        />
                    </div>

                    {images.length > 1 && (
                        <div className="thumbnail-container">
                            {images.map((img, index) => (
                                <div
                                    key={index}
                                    className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                                    onClick={() => setSelectedImage(index)}
                                >
                                    <img
                                        src={img}
                                        alt={`${product.name} view ${index + 1}`}
                                        onError={(e) => { e.target.src = "https://via.placeholder.com/100?text=Error"; }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Image Navigation Arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                className="gallery-nav prev"
                                onClick={() => setSelectedImage(prev => prev === 0 ? images.length - 1 : prev - 1)}
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>
                            <button
                                className="gallery-nav next"
                                onClick={() => setSelectedImage(prev => prev === images.length - 1 ? 0 : prev + 1)}
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </>
                    )}
                </div>

                {/* Product Info Section */}
                <div className="product-info">
                    <div className="product-breadcrumb">
                        <span onClick={() => navigate('/store')}>Store</span>
                        <i className="fas fa-chevron-right"></i>
                        <span>{product.category}</span>
                        {product.subCategory && (
                            <>
                                <i className="fas fa-chevron-right"></i>
                                <span>{product.subCategory}</span>
                            </>
                        )}
                    </div>

                    <h1 className="product-title">{product.name}</h1>

                    <div className="product-meta">
                        <span className="meta-item">
                            <i className="fas fa-car"></i> {product.brand} {product.model}
                        </span>
                        <span className="meta-item">
                            <i className="fas fa-calendar"></i>
                            {product.compatibleYears && product.compatibleYears.length > 0
                                ? product.compatibleYears.join(', ')
                                : product.year}
                        </span>
                        {product.category && (
                            <span className="meta-item">
                                <i className="fas fa-tag"></i> {product.category}
                                {product.subCategory && ` > ${product.subCategory}`}
                            </span>
                        )}
                        {product.condition && (
                            <span className="meta-item" style={{
                                background: product.condition === 'New' ? '#2ecc71' : product.condition.includes('Like New') ? '#3498db' : '#95a5a6',
                                color: '#fff',
                                padding: '4px 12px',
                                borderRadius: '12px'
                            }}>
                                {product.condition}
                            </span>
                        )}
                        {product.quantity && (
                            <span className="meta-item" style={{
                                background: '#f39c12',
                                color: '#fff',
                                padding: '4px 12px',
                                borderRadius: '12px'
                            }}>
                                <i className="fas fa-box"></i> {product.quantity} in stock
                            </span>
                        )}
                    </div>

                    {product.discountCode && (
                        <div style={{
                            padding: '12px 20px',
                            borderRadius: '10px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            marginBottom: '20px',
                            background: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)',
                            color: '#fff',
                            textAlign: 'center',
                            boxShadow: '0 4px 15px rgba(229, 9, 20, 0.3)'
                        }}>
                            <i className="fas fa-tag"></i> Use Code: {product.discountCode} - Save {product.discountPercent}%!
                        </div>
                    )}

                    <div className="product-price">
                        {product.currency || 'KES'} {Number(product.price).toLocaleString()}
                    </div>

                    {/* Description Section */}
                    <div className="product-description-section">
                        <h3>Description</h3>
                        <div className="description-content">
                            {product.description ? (
                                <p>{product.description}</p>
                            ) : (
                                <p className="no-description">
                                    High-quality {product.name} compatible with {product.brand} {product.model} ({product.year}).
                                    {product.subCategory && ` Part of our ${product.subCategory} collection in the ${product.category} category.`}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Specifications */}
                    {product.specifications && (
                        <div className="product-specs-section">
                            <h3>Specifications</h3>
                            <div className="specs-content">
                                <p>{product.specifications}</p>
                            </div>
                        </div>
                    )}

                    {/* Features List */}
                    {product.features && product.features.length > 0 && (
                        <div className="product-features-section">
                            <h3>Features</h3>
                            <ul className="features-list">
                                {product.features.map((feature, index) => (
                                    <li key={index}>
                                        <i className="fas fa-check"></i> {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Quantity and Add to Cart */}
                    <div className="purchase-section">
                        <div className="quantity-selector">
                            <label>Quantity:</label>
                            <div className="quantity-controls">
                                <button
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    disabled={quantity <= 1}
                                >
                                    <i className="fas fa-minus"></i>
                                </button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val) && val >= 1) {
                                            setQuantity(val);
                                        }
                                    }}
                                    min="1"
                                />
                                <button onClick={() => setQuantity(q => q + 1)}>
                                    <i className="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>

                        <button
                            className={`add-to-cart-btn ${addedToCart ? 'added' : ''}`}
                            onClick={handleAddToCart}
                        >
                            {addedToCart ? (
                                <>
                                    <i className="fas fa-check"></i> Added to Cart!
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-cart-plus"></i> Add to Cart
                                </>
                            )}
                        </button>

                        <button
                            className="buy-now-btn"
                            onClick={() => {
                                handleAddToCart();
                                navigate('/checkout', { state: { cart: [...cart, { ...product, quantity }] } });
                            }}
                        >
                            <i className="fas fa-bolt"></i> Buy Now
                        </button>
                    </div>

                    {/* Additional Info */}
                    <div className="additional-info">
                        <div className="info-item">
                            <i className="fas fa-truck"></i>
                            <span>Fast Shipping Available</span>
                        </div>
                        <div className="info-item">
                            <i className="fas fa-shield-alt"></i>
                            <span>Quality Guaranteed</span>
                        </div>
                        <div className="info-item">
                            <i className="fas fa-undo"></i>
                            <span>Easy Returns</span>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ProductDetailPage;
