import React, { useState, useEffect } from "react";
import Footer from "../components/Footer";
import { db, storage } from "../firebaseConfig";
import {
    collection, query, where, getDocs, addDoc,
    onSnapshot, updateDoc, doc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import "../styles/Admin.css";
import "../styles/Store.css";

const MarketerPage = () => {
    const [marketer, setMarketer] = useState(null);
    const [activeTab, setActiveTab] = useState("login");

    // Login State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    // Dashboard State
    const [mySales, setMySales] = useState([]);
    const [myProducts, setMyProducts] = useState([]);
    const [carMakes, setCarMakes] = useState([]);

    // Upload State - Default values cleared for input
    const [productForm, setProductForm] = useState({ name: "", price: "", currency: "USD", brand: "", year: "", image: "" });
    const [carMakeForm, setCarMakeForm] = useState({ brand: "", year: new Date().getFullYear().toString(), model: "" });
    const [uploading, setUploading] = useState(false);
    const [saveStatus, setSaveStatus] = useState("idle");

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

    // --- DASHBOARD DATA LISTENER ---
    useEffect(() => {
        if (!marketer) return;
        const salesRef = collection(db, "marketers", marketer.id, "sales");
        const unsubSales = onSnapshot(salesRef, (snap) => {
            setMySales(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const productsRef = query(collection(db, "spareParts"), where("uploadedBy", "==", marketer.email));
        const unsubProducts = onSnapshot(productsRef, (snap) => {
            setMyProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unsubCarMakes = onSnapshot(collection(db, "carMakes"), (snap) => {
            setCarMakes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => {
            unsubSales();
            unsubProducts();
            unsubCarMakes();
        };
    }, [marketer]);

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
                description: `Approval for sale of KES ${sale.total} (Code: ${marketer.code})`,
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
            await addDoc(collection(db, "spareParts"), {
                ...productForm,
                price: Number(productForm.price),
                uploadedBy: marketer.email,
                createdAt: new Date()
            });
            setSaveStatus("success");
            setTimeout(() => {
                setSaveStatus("idle");
                setProductForm({ name: "", price: "", currency: "USD", brand: "", year: "", image: "" });
                setActiveTab("dashboard");
            }, 1500);
        } catch (err) {
            alert("Error: " + err.message);
            setSaveStatus("idle");
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const storageRef = ref(storage, `parts/${Date.now()}_${file.name}`);
        setUploading(true);
        const uploadTask = uploadBytesResumable(storageRef, file);
        uploadTask.on('state_changed', null, null, async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setProductForm(p => ({ ...p, image: url }));
            setUploading(false);
        });
    };

    const handleAddCarMake = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, "carMakes"), {
                brand: carMakeForm.brand,
                year: carMakeForm.year,
                model: carMakeForm.model || "",
                createdAt: new Date(),
                createdBy: marketer.email
            });
            alert("Car make added successfully!");
            setCarMakeForm({ brand: "", year: new Date().getFullYear().toString(), model: "" });
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    if (!marketer) {
        return (
            <div className="login-page-bg">
                <div className="login-container">
                    <h2>Marketer Login</h2>
                    {error && <p style={{ color: 'red' }}>{error}</p>}
                    <form onSubmit={handleLogin} style={{ marginTop: '20px' }}>
                        <input className="input-field" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ marginBottom: '10px' }} />
                        <input className="input-field" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={{ marginBottom: '10px' }} />
                        <button className="submit-btn">Login</button>
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
                    <button className={activeTab === 'carMakes' ? 'active' : ''} onClick={() => setActiveTab('carMakes')}>Add Car Make</button>
                </div>
                <button className="logout-btn" onClick={() => setMarketer(null)}>Logout</button>
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
                                    USD {mySales.reduce((total, sale) => {
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
                                                <strong>USD {saleAmount.toLocaleString()}</strong>
                                                <div style={{ fontSize: '0.75rem', color: '#2ecc71', marginTop: '2px' }}>
                                                    Your Commission: USD {commissionAmount.toFixed(2)}
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
                        <h3>My Uploaded Products</h3>
                        <div className="inventory-list">
                            {myProducts.map(p => (
                                <div key={p.id} className="inventory-item">
                                    <img src={p.image} alt={p.name} />
                                    <div style={{ flex: 1 }}>
                                        <h4>{p.name}</h4>
                                        <p>KES {p.price}</p>
                                    </div>
                                    <button onClick={() => requestDeleteProduct(p)} className="icon-btn delete" title="Request Delete"><i className="fas fa-trash"></i></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'upload' && (
                <div className="admin-panel form-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <h3>Add New Product</h3>
                    <form onSubmit={handleProductUpload}>
                        <input className="admin-input" placeholder="Part Name" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input className="admin-input" type="number" placeholder="Price" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required style={{ flex: 1 }} />
                            <select className="admin-input" value={productForm.currency} onChange={e => setProductForm({ ...productForm, currency: e.target.value })} style={{ width: '100px' }}>
                                <option value="USD">USD</option>
                                <option value="GBP">GBP</option>
                            </select>
                        </div>

                        {/* UPDATED: Manual Input for Brand and Year */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <input
                                className="admin-input"
                                placeholder="Car Brand (e.g. BMW)"
                                value={productForm.brand}
                                onChange={e => setProductForm({ ...productForm, brand: e.target.value })}
                                required
                            />
                            <input
                                className="admin-input"
                                type="number"
                                placeholder="Year (e.g. 2024)"
                                value={productForm.year}
                                onChange={e => setProductForm({ ...productForm, year: e.target.value })}
                                required
                            />
                        </div>

                        <input type="file" onChange={handleImageUpload} className="file-input" />
                        {productForm.image && <img src={productForm.image} alt="preview" style={{ width: '100px', borderRadius: '5px', marginTop: '10px' }} />}
                        <button className={`admin-btn ${saveStatus === 'success' ? 'success-btn' : ''}`} disabled={uploading || saveStatus === 'saving'}>
                            {saveStatus === 'saving' ? 'Uploading...' : saveStatus === 'success' ? '✔ Upload Successful' : 'Upload to Store'}
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'carMakes' && (
                <div className="admin-grid">
                    <div className="admin-panel form-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <h3>Add New Car Make/Model</h3>
                        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: '20px' }}>
                            Add car brands and years to help customers find the right parts
                        </p>
                        <form onSubmit={handleAddCarMake}>
                            <input
                                className="admin-input"
                                placeholder="Brand (e.g. BMW, Toyota)"
                                value={carMakeForm.brand}
                                onChange={e => setCarMakeForm({ ...carMakeForm, brand: e.target.value })}
                                required
                                style={{ marginBottom: '10px' }}
                            />

                            <input
                                className="admin-input"
                                type="number"
                                placeholder="Year (e.g. 2024)"
                                value={carMakeForm.year}
                                onChange={e => setCarMakeForm({ ...carMakeForm, year: e.target.value })}
                                required
                                style={{ marginBottom: '10px' }}
                            />

                            <input
                                className="admin-input"
                                placeholder="Model (Optional, e.g. X5, Corolla)"
                                value={carMakeForm.model}
                                onChange={e => setCarMakeForm({ ...carMakeForm, model: e.target.value })}
                                style={{ marginBottom: '10px' }}
                            />

                            <button className="admin-btn">Add to Database</button>
                        </form>

                        {/* Show recently added makes */}
                        {carMakes.length > 0 && (
                            <div style={{ marginTop: '30px' }}>
                                <h4 style={{ marginBottom: '10px', color: '#fff' }}>Recently Added</h4>
                                <div className="inventory-list">
                                    {carMakes.slice(0, 10).map(make => (
                                        <div key={make.id} className="inventory-item">
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 'bold' }}>{make.brand} {make.model && `- ${make.model}`}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#888' }}>Year: {make.year}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default MarketerPage;