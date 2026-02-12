import React, { useState, useEffect, useMemo } from "react";
import Footer from "../components/Footer";
import { db, storage } from "../firebaseConfig";
import {
    collection, query, where, getDocs, addDoc,
    onSnapshot, updateDoc, doc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { subscribeToVehicleMakes } from "../services/vehicleService";
import "../styles/Admin.css";
import "../styles/Store.css";

const MarketerPage = () => {
    const [marketer, setMarketer] = useState(null);
    const [activeTab, setActiveTab] = useState("login");

    // Login State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    // Dashboard State
    const [mySales, setMySales] = useState([]);
    const [myProducts, setMyProducts] = useState([]);
    const [carMakes, setCarMakes] = useState([]);
    const [vehicleMakes, setVehicleMakes] = useState([]); // New structure: { make, models: [] }

    // Upload State - Default values cleared for input
    const [productForm, setProductForm] = useState({
        name: "",
        price: "",
        currency: "EUR",
        brand: "",
        model: "",
        customBrand: "",
        customModel: "",
        year: "",
        compatibleYears: [],
        mainImage: "",
        additionalImages: [],
        // NEW: Discount fields
        discountCode: "",
        discountType: "percentage", // 'percentage' or 'fixed'
        discountValue: ""
    });
    const [uploading, setUploading] = useState(false);
    const [saveStatus, setSaveStatus] = useState("idle");
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // --- LOGIN ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const q = query(collection(db, "marketers"), where("email", "==", email), where("password", "==", password));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setError("Invalid credentials.");
                return;
            }

            const userData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
            setMarketer(userData);
            setActiveTab("dashboard");
        } catch (err) {
            setError("Login error: " + err.message);
        }
    };

    // --- DISCOUNT CODE GENERATOR ---
    const generateDiscountCode = () => {
        const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
        const discountVal = productForm.discountValue || 10;
        const suffix = productForm.discountType === 'percentage' ? `SAVE${discountVal}` : `OFF${discountVal}`;
        const code = `${randomPart}_${suffix}`;
        setProductForm(prev => ({ ...prev, discountCode: code }));
    };

    // --- DASHBOARD DATA LISTENER ---
    useEffect(() => {
        if (!marketer) return;
        const salesRef = collection(db, "marketers", marketer.id, "sales");
        const unsubSales = onSnapshot(salesRef, (snap) => {
            setMySales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const productsRef = collection(db, "spareParts");
        const unsubProducts = onSnapshot(productsRef, (snap) => {
            setMyProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unsubCarMakes = onSnapshot(collection(db, "carMakes"), (snap) => {
            setCarMakes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        // NEW: Subscribe to vehicleMakes collection with new structure
        const unsubVehicleMakes = subscribeToVehicleMakes((makes) => {
            setVehicleMakes(makes);
        });
        return () => {
            unsubSales();
            unsubProducts();
            unsubCarMakes();
            unsubVehicleMakes();
        };
    }, [marketer]);

    // --- COMPUTE DROPDOWN OPTIONS FROM vehicleMakes COLLECTION ---
    const brandOptions = useMemo(() => {
        // Get brands from new vehicleMakes collection
        const brandsFromVehicleMakes = vehicleMakes.map(v => v.make).filter(Boolean).sort();

        // Fallback: if no brands in new collection, use old carMakes or defaults
        if (brandsFromVehicleMakes.length > 0) {
            return brandsFromVehicleMakes;
        }

        // Fallback to old carMakes collection
        const brandsFromCarMakes = [...new Set(carMakes.map(c => c.brand).filter(Boolean))].sort();
        if (brandsFromCarMakes.length > 0) {
            return brandsFromCarMakes;
        }

        // Default brands if none exist
        return [
            "Audi", "BMW", "Chevrolet", "Ford", "Honda", "Hyundai", "Isuzu",
            "Jeep", "Kia", "Land Rover", "Lexus", "Mazda", "Mercedes",
            "Mitsubishi", "Nissan", "Porsche", "Subaru", "Toyota", "Volkswagen", "Volvo"
        ];
    }, [vehicleMakes, carMakes]);

    const modelOptions = useMemo(() => {
        // Get models for the selected brand from vehicleMakes
        if (productForm.brand && vehicleMakes.length > 0) {
            const selectedMake = vehicleMakes.find(v => v.make === productForm.brand);
            if (selectedMake && selectedMake.models) {
                return selectedMake.models.sort();
            }
        }

        // Fallback to old carMakes collection
        const modelsFromCarMakes = [...new Set(carMakes.map(c => c.model).filter(Boolean))];
        return modelsFromCarMakes.sort();
    }, [vehicleMakes, carMakes, productForm.brand]);

    // --- ACTIONS ---
    // --- NEW HANDLER ---
    const approveMySalePayment = async (sale) => {
        try {
            // 1. Update the sale in marketers/{id}/sales
            await updateDoc(doc(db, "marketers", marketer.id, "sales", sale.id), { status: "Approved" });

            // 2. Ideally, also update the linked Admin Request to 'Completed' so admin doesn't do it twice.
            // This requires finding the request, which is complex without ID. 
            // For now, updating the sale is enough to trigger the Client UI.

            alert("Payment Approved! Client has been notified.");
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    const requestSaleApproval = async (sale) => {
        if (sale.status === 'Approved') return;
        try {
            await addDoc(collection(db, "adminRequests"), {
                type: "Sale Approval",
                marketerId: marketer.id,
                marketerName: marketer.name,
                saleId: sale.id,
                amount: sale.total,
                description: `Approval for sale of ${sale.currency || 'EUR'} ${sale.total} (Code: ${marketer.code})`,
                status: "Pending",
                date: new Date()
            });
            await updateDoc(doc(db, "marketers", marketer.id, "sales", sale.id), { status: "Pending Approval" });
            alert("Request sent to Admin.");
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    const requestDeleteProduct = async (prod) => {
        const reason = prompt("Reason for deletion?");
        if (!reason) return;
        await addDoc(collection(db, "adminRequests"), {
            type: "Delete Product",
            marketerId: marketer.id,
            productId: prod.id,
            description: `Request to delete ${prod.name}. Reason: ${reason}`,
            status: "Pending",
            date: new Date()
        });
        alert("Delete request sent to Admin.");
    };

    const handleProductUpload = async (e) => {
        e.preventDefault();
        setSaveStatus("saving");
        try {
            // Use custom brand/model if "Other" was selected
            const finalBrand = productForm.brand === 'Other' ? productForm.customBrand : productForm.brand;
            const finalModel = productForm.model === 'Other' ? productForm.customModel : productForm.model;

            const productData = {
                name: productForm.name,
                price: Number(productForm.price),
                currency: productForm.currency,
                brand: finalBrand,
                model: finalModel || "",
                year: productForm.year,
                compatibleYears: productForm.compatibleYears || [],
                mainImage: productForm.mainImage,
                additionalImages: productForm.additionalImages,
                uploadedBy: marketer.email,
                createdAt: new Date(),
                // NEW: Discount data
                discount: productForm.discountCode ? {
                    code: productForm.discountCode,
                    type: productForm.discountType,
                    value: Number(productForm.discountValue) || 0,
                    createdBy: marketer.email,
                    marketerId: marketer.id
                } : null
            };

            await addDoc(collection(db, "spareParts"), productData);
            setSaveStatus("success");
            setTimeout(() => {
                setSaveStatus("idle");
                setProductForm({
                    name: "",
                    price: "",
                    currency: "EUR",
                    brand: "",
                    model: "",
                    customBrand: "",
                    customModel: "",
                    year: "",
                    compatibleYears: [],
                    mainImage: "",
                    additionalImages: [],
                    discountCode: "",
                    discountType: "percentage",
                    discountValue: ""
                });
                setActiveTab("dashboard");
            }, 1500);
        } catch (err) {
            alert("Error: " + err.message);
            setSaveStatus("idle");
        }
    };

    const handleMainImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const storageRef = ref(storage, `parts/${Date.now()}_${file.name}`);
        setUploading(true);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on('state_changed', null,
            (error) => {
                console.error(error);
                setUploading(false);
                alert("Upload failed: " + error.message);
            },
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                setProductForm(p => ({ ...p, mainImage: url }));
                setUploading(false);
            }
        );
    };

    const handleAdditionalImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check if we already have 5 images (mainImage + 4 additional)
        if (productForm.additionalImages.length >= 4) {
            alert("Maximum 5 images allowed (1 main + 4 additional)");
            return;
        }

        const storageRef = ref(storage, `parts/${Date.now()}_${file.name}`);
        setUploading(true);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on('state_changed', null,
            (error) => {
                console.error(error);
                setUploading(false);
                alert("Upload failed: " + error.message);
            },
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                setProductForm(p => ({
                    ...p,
                    additionalImages: [...p.additionalImages, url]
                }));
                setUploading(false);
                // Reset file input
                e.target.value = '';
            }
        );
    };

    const removeAdditionalImage = (index) => {
        setProductForm(p => ({
            ...p,
            additionalImages: p.additionalImages.filter((_, i) => i !== index)
        }));
    };


    if (!marketer) {
        return (
            <div className="login-page-bg">
                <div className="login-container">
                    <h2>Marketer Login</h2>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <form onSubmit={handleLogin} style={{ marginTop: '20px' }}>
                        <input className="input-field" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom: '10px' }} />
                        <div style={{ position: 'relative', marginBottom: '10px' }}>
                            <input
                                className="input-field"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                style={{ paddingRight: '40px' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#888',
                                    fontSize: '18px',
                                    padding: '0',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                            </button>
                        </div>
                        <button className="submit-btn">Login</button>
                        <div style={{ textAlign: 'center', marginTop: '15px' }}>
                            <a href="/contact-us" style={{ color: '#888', fontSize: '14px', textDecoration: 'none' }}>
                                Trouble signing in? <span style={{ color: '#e50914' }}>Contact us</span>
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <div className="admin-header">
                <h1>Welcome, {marketer.name}</h1>
                <div className="admin-tabs">
                    <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>Sales & Products</button>
                    <button className={activeTab === 'upload' ? 'active' : ''} onClick={() => setActiveTab('upload')}>Upload Product</button>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <button
                            className="logout-btn"
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <i className="fas fa-user-circle"></i>
                            Profile
                        </button>
                        {showProfileMenu && (
                            <div style={{
                                position: 'absolute',
                                top: '45px',
                                right: '0',
                                background: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                minWidth: '200px',
                                zIndex: 1000,
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                            }}>
                                <div style={{ padding: '15px', borderBottom: '1px solid #333' }}>
                                    <div style={{ fontSize: '0.9rem', color: '#888' }}>Logged in as:</div>
                                    <div style={{ fontSize: '1rem', color: '#fff', marginTop: '5px', fontWeight: 'bold' }}>{marketer.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '2px' }}>{marketer.email}</div>
                                </div>
                                <div style={{ padding: '10px' }}>
                                    <div style={{ padding: '10px', color: '#ccc' }}>
                                        <div style={{ fontSize: '0.85rem', marginBottom: '5px' }}>
                                            <i className="fas fa-code" style={{ marginRight: '8px', color: '#e50914' }}></i>
                                            Code: <strong>{marketer.code}</strong>
                                        </div>
                                        <div style={{ fontSize: '0.85rem' }}>
                                            <i className="fas fa-percent" style={{ marginRight: '8px', color: '#2ecc71' }}></i>
                                            Commission: <strong>{marketer.commission || 0}%</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <button className="logout-btn" onClick={() => setMarketer(null)}>
                        <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>

            {activeTab === 'dashboard' && (
                <div className="admin-grid">
                    <div className="admin-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3>My Sales (Code: {marketer.code})</h3>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.8rem', color: '#888' }}>Commission Rate</div>
                                <div style={{ fontSize: '1.2rem', color: '#2ecc71', fontWeight: 'bold' }}>{marketer.commission || 0}%</div>
                            </div>
                        </div>

                        {/* Commission Summary */}
                        {mySales.length > 0 && (
                            <div style={{
                                background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                                padding: '20px',
                                borderRadius: '8px',
                                marginBottom: '20px',
                                color: '#fff'
                            }}>
                                <div style={{ fontSize: '0.9rem', marginBottom: '5px' }}>Total Earnings</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>
                                    EUR {mySales.reduce((total, sale) => {
                                        const saleAmount = Number(sale.total) || 0;
                                        const commission = (saleAmount * (marketer.commission || 0)) / 100;
                                        return total + commission;
                                    }, 0).toFixed(2)}
                                </div>
                                <div style={{ fontSize: '0.75rem', marginTop: '5px', opacity: 0.9 }}>
                                    From {mySales.length} sale{mySales.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        )}

                        {mySales.length === 0 ? <p>No sales recorded yet.</p> : (
                            <div className="inventory-list">
                                {mySales.map(sale => {
                                    const saleAmount = Number(sale.total) || 0;
                                    const commissionAmount = (saleAmount * (marketer.commission || 0)) / 100;

                                    return (
                                    <div key={sale.id} className="inventory-item" style={{ display: 'block' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <strong>{sale.currency || 'EUR'} {saleAmount.toLocaleString()}</strong>
                                                <div style={{ fontSize: '0.75rem', color: '#2ecc71', marginTop: '2px' }}>
                                                    Your Commission: {sale.currency || 'EUR'} {commissionAmount.toFixed(2)}
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem',
                                                background: sale.status === 'Approved' ? 'green' : (sale.status === 'Pending Payment' ? 'orange' : '#333')
                                            }}>
                                                {sale.status || 'New'}
                                            </span>
                                        </div>

                                        <p style={{ fontSize: '0.8rem', color: '#ccc', margin: '5px 0' }}>
                                            {sale.customer?.name} ({sale.customer?.phone})
                                        </p>

                                        {/* ACTION: Approve Payment */}
                                        {sale.status === 'Pending Payment' && (
                                            <button
                                                onClick={() => approveMySalePayment(sale)}
                                                className="admin-btn success-btn"
                                                style={{ marginTop: '10px', fontSize: '0.8rem', width: '100%' }}
                                            >
                                                Confirm Payment Received
                                            </button>
                                        )}
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="admin-panel">
                        <h3>All Store Products</h3>
                        <div className="inventory-list">
                            {myProducts.map(p => (
                                <div key={p.id} className="inventory-item">
                                    <img src={p.mainImage || p.image} alt={p.name} />
                                    <div style={{ flex: 1 }}>
                                        <h4>{p.name}</h4>
                                        <p>{p.currency || 'EUR'} {p.price}</p>
                                        {p.description && (
                                            <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>
                                                {p.description.substring(0, 80)}{p.description.length > 80 ? '...' : ''}
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button
                                            onClick={() => {
                                                // Download product info as text file
                                                const productInfo = `
Product Name: ${p.name}
Brand: ${p.brand || 'N/A'}
Model: ${p.model || 'N/A'}
Year(s): ${p.compatibleYears?.join(', ') || p.year || 'N/A'}
Category: ${p.category || 'N/A'}
Sub-Category: ${p.subCategory || 'N/A'}
Condition: ${p.condition || 'N/A'}
Price: ${p.currency || 'EUR'} ${p.price}
Quantity: ${p.quantity || 'N/A'}
${p.discountCode ? `Discount Code: ${p.discountCode} - ${p.discountPercent}% OFF` : ''}
${p.discount ? `
Discount: ${p.discount.type === 'percentage' ? `${p.discount.value}%` : `${p.currency || 'EUR'} ${p.discount.value}`} OFF${p.discount.expiryDate ? ` (Expires: ${p.discount.expiryDate})` : ''}` : ''}

Description:
${p.description || 'No description available'}

Main Image URL:
${p.mainImage || p.image || 'No image'}

${p.additionalImages && p.additionalImages.length > 0 ? `
Additional Images (${p.additionalImages.length}):
${p.additionalImages.join('\n')}
` : ''}

Uploaded by: ${p.uploadedBy || 'N/A'}
Created: ${p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
`;
                                                const blob = new Blob([productInfo], { type: 'text/plain' });
                                                const url = URL.createObjectURL(blob);
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.download = `${p.name.replace(/[^a-z0-9]/gi, '_')}_info.txt`;
                                                link.click();
                                                URL.revokeObjectURL(url);
                                            }}
                                            className="icon-btn"
                                            title="Download Product Info"
                                            style={{ background: '#3498db' }}
                                        >
                                            <i className="fas fa-download"></i>
                                        </button>
                                        <button
                                            onClick={() => {
                                                // Download images
                                                const images = [p.mainImage || p.image, ...(p.additionalImages || [])].filter(Boolean);
                                                if (images.length === 0) {
                                                    alert('No images available for download');
                                                    return;
                                                }

                                                // Download each image
                                                images.forEach((imgUrl, idx) => {
                                                    fetch(imgUrl)
                                                        .then(response => response.blob())
                                                        .then(blob => {
                                                            const url = URL.createObjectURL(blob);
                                                            const link = document.createElement('a');
                                                            link.href = url;
                                                            link.download = `${p.name.replace(/[^a-z0-9]/gi, '_')}_image_${idx + 1}.jpg`;
                                                            link.click();
                                                            URL.revokeObjectURL(url);
                                                        })
                                                        .catch(() => {
                                                            // If fetch fails, try opening in new tab
                                                            window.open(imgUrl, '_blank');
                                                        });
                                                });
                                                alert(`Downloading ${images.length} image(s)...`);
                                            }}
                                            className="icon-btn"
                                            title="Download Images"
                                            style={{ background: '#2ecc71' }}
                                        >
                                            <i className="fas fa-images"></i>
                                        </button>
                                        <button onClick={() => requestDeleteProduct(p)} className="icon-btn delete" title="Request Delete"><i className="fas fa-trash"></i></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'upload' && (
                <div className="admin-panel form-panel" style={{ maxWidth: '700px', margin: '0 auto' }}>
                    <h3>Add New Product</h3>
                    <form onSubmit={handleProductUpload}>
                        {/* SECTION 1: VEHICLE FITMENT - FIRST */}
                        <div style={{ marginBottom: '20px', background: 'rgba(229, 9, 20, 0.05)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(229, 9, 20, 0.2)' }}>
                            <h4 style={{ color: 'var(--primary)', fontSize: '1rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-car"></i>
                                Vehicle Fitment
                            </h4>
                            
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '0.9rem' }}>Select Brand *</label>
                                <select
                                    className="admin-input"
                                    value={productForm.brand}
                                    onChange={e => setProductForm({ ...productForm, brand: e.target.value, model: '' })}
                                    required
                                >
                                    <option value="">Choose Brand</option>
                                    {brandOptions.map(brand => (
                                        <option key={brand} value={brand}>{brand}</option>
                                    ))}
                                    <option value="Other">Other (Custom)</option>
                                </select>
                                {productForm.brand === 'Other' && (
                                    <input
                                        className="admin-input"
                                        type="text"
                                        placeholder="Enter custom brand name"
                                        value={productForm.customBrand || ''}
                                        onChange={e => setProductForm({ ...productForm, customBrand: e.target.value })}
                                        style={{ marginTop: '8px' }}
                                        required
                                    />
                                )}
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '0.9rem' }}>Select Model (Optional)</label>
                                <select
                                    className="admin-input"
                                    value={productForm.model || ''}
                                    onChange={e => setProductForm({ ...productForm, model: e.target.value, customModel: '' })}
                                    disabled={!productForm.brand || productForm.brand === 'Other'}
                                >
                                    <option value="">Choose Model or Leave Empty</option>
                                    {modelOptions.map(model => (
                                        <option key={model} value={model}>{model}</option>
                                    ))}
                                    <option value="Other">Other (Custom)</option>
                                </select>
                                {productForm.model === 'Other' && (
                                    <input
                                        className="admin-input"
                                        type="text"
                                        placeholder="Enter custom model name"
                                        value={productForm.customModel || ''}
                                        onChange={e => setProductForm({ ...productForm, customModel: e.target.value })}
                                        style={{ marginTop: '8px' }}
                                    />
                                )}
                                <small style={{ color: '#888', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                                    Leave empty for universal/multi-model parts
                                </small>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '0.9rem' }}>Year (Multiple Selection) *</label>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                    {Array.from({ length: 10 }, (_, i) => (new Date().getFullYear() - i).toString()).map(year => (
                                        <button
                                            key={year}
                                            type="button"
                                            onClick={() => {
                                                const currentYears = productForm.compatibleYears || [];
                                                const yearExists = currentYears.includes(year);
                                                const newYears = yearExists
                                                    ? currentYears.filter(y => y !== year)
                                                    : [...currentYears, year].sort((a, b) => b - a);
                                                setProductForm({
                                                    ...productForm,
                                                    compatibleYears: newYears,
                                                    year: newYears[0] || new Date().getFullYear().toString()
                                                });
                                            }}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                background: (productForm.compatibleYears || []).includes(year) ? '#e50914' : '#333',
                                                color: '#fff',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {year}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    className="admin-input"
                                    type="text"
                                    placeholder="Or enter years manually: 2020, 2021, 2022 (comma-separated)"
                                    value={productForm.compatibleYears?.join(', ') || ''}
                                    onChange={e => {
                                        const yearsArray = e.target.value
                                            .split(',')
                                            .map(y => y.trim())
                                            .filter(y => y !== '');
                                        setProductForm({
                                            ...productForm,
                                            compatibleYears: yearsArray,
                                            year: yearsArray[0] || new Date().getFullYear().toString()
                                        });
                                    }}
                                    required
                                />
                                <small style={{ color: '#888', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                                    Selected years: {productForm.compatibleYears?.join(', ') || 'None'}
                                </small>
                            </div>
                        </div>

                        {/* SECTION 2: PART DETAILS - AFTER VEHICLE */}
                        <div style={{ marginBottom: '20px', background: 'rgba(255, 255, 255, 0.03)', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
                            <h4 style={{ color: '#ccc', fontSize: '1rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-cog"></i>
                                Part Details
                            </h4>
                            
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>Part Name *</label>
                                <input
                                    className="admin-input"
                                    placeholder="e.g. M-Sport Grille, LED Headlight, Brake Pads"
                                    value={productForm.name}
                                    onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '0.9rem' }}>Price *</label>
                                    <input
                                        className="admin-input"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={productForm.price}
                                        onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                                        required
                                    />
                                </div>
                                <div style={{ width: '120px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '0.9rem' }}>Currency</label>
                                    <select
                                        className="admin-input"
                                        value={productForm.currency}
                                        onChange={e => setProductForm({ ...productForm, currency: e.target.value })}
                                    >
                                        <option value="EUR">EUR (€)</option>
                                        <option value="USD">USD ($)</option>
                                        <option value="GBP">GBP (£)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: DISCOUNT CODE (NEW) */}
                        <div style={{ marginBottom: '20px', background: 'rgba(46, 204, 113, 0.05)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(46, 204, 113, 0.2)' }}>
                            <h4 style={{ color: '#2ecc71', fontSize: '1rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-tag"></i>
                                Discount Code (Optional)
                            </h4>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '0.9rem' }}>Discount Type</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        type="button"
                                        onClick={() => setProductForm({ ...productForm, discountType: 'percentage', discountCode: '' })}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: 'bold',
                                            background: productForm.discountType === 'percentage' ? '#2ecc71' : '#333',
                                            color: '#fff',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <i className="fas fa-percent" style={{ marginRight: '8px' }}></i>
                                        Percentage Off
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setProductForm({ ...productForm, discountType: 'fixed', discountCode: '' })}
                                        style={{
                                            flex: 1,
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: 'bold',
                                            background: productForm.discountType === 'fixed' ? '#2ecc71' : '#333',
                                            color: '#fff',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <i className="fas fa-coins" style={{ marginRight: '8px' }}></i>
                                        Fixed Amount Off
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '0.9rem' }}>
                                    {productForm.discountType === 'percentage' ? 'Discount Percentage (%)' : `Discount Amount (${productForm.currency})`}
                                </label>
                                <input
                                    className="admin-input"
                                    type="number"
                                    min="1"
                                    max={productForm.discountType === 'percentage' ? 100 : undefined}
                                    placeholder={productForm.discountType === 'percentage' ? 'e.g. 20 for 20% off' : 'e.g. 100 for 100 EUR off'}
                                    value={productForm.discountValue}
                                    onChange={e => setProductForm({ ...productForm, discountValue: e.target.value, discountCode: '' })}
                                />
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', color: '#ccc', fontSize: '0.9rem' }}>Generated Code</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        className="admin-input"
                                        type="text"
                                        placeholder="Click Generate to create code"
                                        value={productForm.discountCode}
                                        readOnly
                                        style={{ flex: 1, background: '#1a1a1a', fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '1px' }}
                                    />
                                    <button
                                        type="button"
                                        onClick={generateDiscountCode}
                                        disabled={!productForm.discountValue}
                                        style={{
                                            padding: '12px 20px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            cursor: productForm.discountValue ? 'pointer' : 'not-allowed',
                                            fontSize: '0.9rem',
                                            fontWeight: 'bold',
                                            background: productForm.discountValue ? '#2ecc71' : '#555',
                                            color: '#fff',
                                            transition: 'all 0.2s',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <i className="fas fa-magic" style={{ marginRight: '8px' }}></i>
                                        Generate
                                    </button>
                                </div>
                                <small style={{ color: '#888', fontSize: '0.75rem', display: 'block', marginTop: '8px' }}>
                                    {productForm.discountCode ? (
                                        <span style={{ color: '#2ecc71' }}>
                                            <i className="fas fa-check-circle" style={{ marginRight: '5px' }}></i>
                                            Code ready! Customers using this code get {productForm.discountType === 'percentage' ? `${productForm.discountValue}% off` : `${productForm.currency} ${productForm.discountValue} off`}
                                        </span>
                                    ) : (
                                        'Enter a discount value and click Generate to create a unique code'
                                    )}
                                </small>
                            </div>

                            {productForm.discountCode && (
                                <div style={{
                                    background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.8rem', marginBottom: '5px', opacity: 0.9 }}>DISCOUNT CODE</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '2px' }}>
                                        {productForm.discountCode}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', marginTop: '8px', opacity: 0.9 }}>
                                        {productForm.discountType === 'percentage' ? `${productForm.discountValue}% OFF` : `${productForm.currency} ${productForm.discountValue} OFF`}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SECTION 4: PRODUCT IMAGES */}
                        <div style={{ marginBottom: '20px', background: 'rgba(52, 152, 219, 0.05)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(52, 152, 219, 0.2)' }}>
                            <h4 style={{ color: '#3498db', fontSize: '1rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <i className="fas fa-images"></i>
                                Product Images
                            </h4>

                            {/* Main Image */}
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '0.9rem' }}>
                                    Main Image *
                                </label>
                                <input
                                    type="file"
                                    onChange={handleMainImageUpload}
                                    accept="image/*"
                                    className="file-input"
                                />
                                {productForm.mainImage && (
                                    <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
                                        <img
                                            src={productForm.mainImage}
                                            alt="Main preview"
                                            style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '2px solid #e50914' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setProductForm({ ...productForm, mainImage: '' })}
                                            style={{
                                                position: 'absolute',
                                                top: '-5px',
                                                right: '-5px',
                                                background: '#e74c3c',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            Ã—
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Additional Images */}
                            <div className="form-group" style={{ marginTop: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '0.9rem' }}>
                                    Additional Images (Optional - Up to 4 more)
                                </label>
                                <small style={{ display: 'block', color: '#888', fontSize: '0.75rem', marginBottom: '8px' }}>
                                    {productForm.additionalImages.length}/4 additional images uploaded
                                </small>
                                {productForm.additionalImages.length < 4 && (
                                    <input
                                        type="file"
                                        onChange={handleAdditionalImageUpload}
                                        accept="image/*"
                                        className="file-input"
                                    />
                                )}
                                {productForm.additionalImages.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                                        {productForm.additionalImages.map((img, idx) => (
                                            <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                                                <img
                                                    src={img}
                                                    alt={`Additional ${idx + 1}`}
                                                    style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #333' }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeAdditionalImage(idx)}
                                                    style={{
                                                        position: 'absolute',
                                                        top: '-5px',
                                                        right: '-5px',
                                                        background: '#e74c3c',
                                                        color: '#fff',
                                                        border: 'none',
                                                        borderRadius: '50%',
                                                        width: '22px',
                                                        height: '22px',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    Ã—
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`admin-btn ${saveStatus === 'success' ? 'success-btn' : ''}`}
                            disabled={uploading || saveStatus === 'saving'}
                            style={{ marginTop: '20px', width: '100%' }}
                        >
                            {uploading ? 'Uploading Images...' : saveStatus === 'saving' ? 'Saving Product...' : saveStatus === 'success' ? 'âœ” Upload Successful' : 'Upload Product to Store'}
                        </button>
                    </form>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default MarketerPage;