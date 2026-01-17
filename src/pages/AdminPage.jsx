import React, { useState, useEffect } from "react";
import Footer from "../components/Footer";
import { auth, db, storage } from "../firebaseConfig";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, getDoc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import "../styles/Admin.css";
import "../styles/Login.css";

// 🔒 SECURITY: List your exact Admin emails here
const ALLOWED_ADMINS = [
  "collinskosgei32@gmail.com",
  "admin@evoparts.com"
];

// Admin credentials: admin@evoparts.com / Admin@500p

const emptyPart = {
  name: "",
  brand: "",
  year: new Date().getFullYear().toString(),
  compatibleYears: [], // NEW: Array of compatible years
  price: 0,
  currency: "USD",
  condition: "New",
  image: "",
};

const AdminPage = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState("");

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");

  // Dashboard Data State
  const [activeTab, setActiveTab] = useState("inventory");
  const [parts, setParts] = useState([]);
  const [marketers, setMarketers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [carMakes, setCarMakes] = useState([]);

  // Forms & Editing State
  const [formData, setFormData] = useState(emptyPart);
  const [marketerForm, setMarketerForm] = useState({ email: "", password: "", name: "", commission: 10 });
  const [carMakeForm, setCarMakeForm] = useState({ brand: "", year: new Date().getFullYear().toString(), model: "" });
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle");

  // 1. LISTEN TO AUTH STATE & ENFORCE SECURITY
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setAuthLoading(false);
      if (currentUser) {
        const isAdminEmail =
          ALLOWED_ADMINS.includes(currentUser.email) ||
          currentUser.email.startsWith("labcoatsxd1@gmail.com");

        if (isAdminEmail) {
          setUser(currentUser);
        } else {
          signOut(auth);
          setUser(null);
          setLoginError("Access Denied: You are not an Admin.");
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. LISTEN TO DATA (Only if verified Admin)
  useEffect(() => {
    if (!user) return;

    const unsubParts = onSnapshot(query(collection(db, "spareParts"), orderBy("name")), (snap) => {
      setParts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubMarketers = onSnapshot(collection(db, "marketers"), (snap) => {
      setMarketers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubRequests = onSnapshot(collection(db, "adminRequests"), (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubCarMakes = onSnapshot(collection(db, "carMakes"), (snap) => {
      setCarMakes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubParts();
      unsubMarketers();
      unsubRequests();
      unsubCarMakes();
    };
  }, [user]);

  // --- HANDLERS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPass);
    } catch (err) {
      setLoginError("Invalid Email or Password");
    }
  };

  const handleCreateMarketer = async (e) => {
    e.preventDefault();
    const uniqueCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      await addDoc(collection(db, "marketers"), {
        name: marketerForm.name,
        email: marketerForm.email,
        password: marketerForm.password,
        code: uniqueCode,
        commission: Number(marketerForm.commission) || 10,
        createdAt: new Date(),
        salesCount: 0
      });
      alert(`Marketer Created! Code: ${uniqueCode}`);
      setMarketerForm({ email: "", password: "", name: "", commission: 10 });
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePartSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      if (editingId) {
        await updateDoc(doc(db, "spareParts", editingId), formData);
      } else {
        await addDoc(collection(db, "spareParts"), { ...formData, uploadedBy: "Admin" });
      }
      setSaveStatus("success");
      setTimeout(() => {
        setSaveStatus("idle");
        setFormData(emptyPart);
        setEditingId(null);
      }, 2000);
    } catch (err) {
      alert(err.message);
      setSaveStatus("idle");
    }
  };

  // --- NEW HANDLER: Delete Part ---
  const handleDeletePart = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product? This cannot be undone.")) return;
    try {
        await deleteDoc(doc(db, "spareParts", id));
    } catch (err) {
        alert("Error deleting product: " + err.message);
    }
  };

  const handleAddCarMake = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "carMakes"), {
        brand: carMakeForm.brand,
        year: carMakeForm.year,
        model: carMakeForm.model || "",
        createdAt: new Date(),
        createdBy: user.email
      });
      alert("Car make added successfully!");
      setCarMakeForm({ brand: "", year: new Date().getFullYear().toString(), model: "" });
    } catch (err) {
      alert("Error adding car make: " + err.message);
    }
  };

  const handleDeleteCarMake = async (id) => {
    if (!window.confirm("Delete this car make?")) return;
    try {
      await deleteDoc(doc(db, "carMakes", id));
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const storageRef = ref(storage, `parts/${Date.now()}_${file.name}`);
    setUploading(true);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on('state_changed',
      (snapshot) => { },
      (error) => { console.error(error); setUploading(false); },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData(prev => ({ ...prev, image: downloadURL }));
        setUploading(false);
      }
    );
  };

  const handleApprovePayment = async (req) => {
    try {
      if (!req.collectionPath || !req.orderId) {
        alert("Error: Request missing order path data.");
        return;
      }
      await updateDoc(doc(db, "adminRequests", req.id), { status: "Completed" });
      await updateDoc(doc(db, req.collectionPath, req.orderId), { status: "Approved" });
      alert("Payment Approved! Client UI will update automatically.");
    } catch (err) {
      alert("Error approving: " + err.message);
    }
  };

  const handleApproveSale = async (req) => {
    try {
      await updateDoc(doc(db, "adminRequests", req.id), { status: "Approved" });
      if (req.marketerId && req.saleId) {
        await updateDoc(doc(db, "marketers", req.marketerId, "sales", req.saleId), { status: "Approved" });
      }
      alert("Sale Approved!");
    } catch (err) { alert(err.message); }
  };

  const handleDeleteProductRequest = async (req) => {
    if (!window.confirm("Confirm delete?")) return;
    try {
      await deleteDoc(doc(db, "spareParts", req.productId));
      await updateDoc(doc(db, "adminRequests", req.id), { status: "Completed" });
    } catch (err) { alert(err.message); }
  };

  if (authLoading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  if (!user) {
    return (
      <div className="login-page-bg">
        <div className="login-container">
          <div className="login-logo">Admin<span>Portal</span></div>
          {loginError && <div style={{ color: '#ff4444', marginBottom: '15px' }}>{loginError}</div>}
          <form onSubmit={handleLogin} className="form-section active">
            <div className="input-group">
              <label>Admin Email</label>
              <input type="email" className="input-field" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input type="password" className="input-field" value={loginPass} onChange={(e) => setLoginPass(e.target.value)} required />
            </div>
            <button type="submit" className="submit-btn">Login to Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Control Panel</h1>
        <div className="admin-tabs">
          <button className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>Inventory</button>
          <button className={activeTab === 'marketers' ? 'active' : ''} onClick={() => setActiveTab('marketers')}>Marketers</button>
          <button className={activeTab === 'carMakes' ? 'active' : ''} onClick={() => setActiveTab('carMakes')}>Car Makes</button>
          <button className={activeTab === 'requests' ? 'active' : ''} onClick={() => setActiveTab('requests')}>Requests</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ color: '#888', fontSize: '0.9rem' }}>{user.email}</span>
          <button onClick={() => signOut(auth)} className="logout-btn">Logout</button>
        </div>
      </div>

      {activeTab === 'inventory' && (
        <div className="admin-grid">
          <div className="admin-panel form-panel">
            <h3>{editingId ? "Edit Part" : "Add New Part"}</h3>
            <form onSubmit={handlePartSubmit}>
              <div className="form-group"><label>Name</label><input className="admin-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>

              <div className="form-group">
                <label>Car Brand</label>
                <input
                  className="admin-input"
                  placeholder="e.g. BMW, Toyota"
                  value={formData.brand}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Model Year *</label>
                <input
                  className="admin-input"
                  type="number"
                  placeholder="e.g. 2024 (primary year)"
                  value={formData.year}
                  onChange={e => setFormData({ ...formData, year: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Compatible Years (Optional)</label>
                <input
                  className="admin-input"
                  type="text"
                  placeholder="e.g. 2013, 2014, 2015 (comma-separated)"
                  value={formData.compatibleYears?.join(', ') || ''}
                  onChange={e => {
                    const yearsArray = e.target.value
                      .split(',')
                      .map(y => y.trim())
                      .filter(y => y !== '');
                    setFormData({ ...formData, compatibleYears: yearsArray });
                  }}
                />
                <small style={{ color: '#888', fontSize: '0.75rem' }}>
                  Add multiple compatible years separated by commas
                </small>
              </div>

              <div className="form-group">
                <label>Price</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input className="admin-input" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} style={{ flex: 1 }} required />
                  <select className="admin-input" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} style={{ width: '100px' }}>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Condition</label>
                <select className="admin-input" value={formData.condition || 'New'} onChange={e => setFormData({ ...formData, condition: e.target.value })} required>
                  <option value="New">New</option>
                  <option value="Like New">Like New</option>
                  <option value="Used">Used</option>
                </select>
              </div>

              <div className="form-group"><label>Product Image</label><input type="file" onChange={handleImageUpload} className="file-input" /></div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className={`admin-btn ${saveStatus === 'success' ? 'success-btn' : ''}`} disabled={uploading || saveStatus === 'saving'}>
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? '✔ Saved' : 'Save Part'}
                </button>
                {editingId && <button type="button" className="cancel-btn" onClick={() => { setEditingId(null); setFormData(emptyPart) }}>Cancel</button>}
              </div>
            </form>
          </div>
          <div className="admin-panel list-panel">
            <h3>Inventory</h3>
            <div className="inventory-list">
              {parts.map(p => (
                <div key={p.id} className="inventory-item">
                  <img src={p.image || "https://via.placeholder.com/50"} alt="" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>
                      {p.brand} | {p.year}
                      {p.compatibleYears && p.compatibleYears.length > 0 && (
                        <span style={{ color: '#3498db', marginLeft: '5px' }}>
                          (+{p.compatibleYears.join(', ')})
                        </span>
                      )}
                      {p.condition && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          background: p.condition === 'New' ? '#2ecc71' : p.condition === 'Like New' ? '#3498db' : '#95a5a6',
                          color: '#fff'
                        }}>
                          {p.condition}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex' }}>
                    <button onClick={() => { setEditingId(p.id); setFormData(p); }} className="icon-btn edit">✎</button>
                    {/* NEW DELETE BUTTON */}
                    <button onClick={() => handleDeletePart(p.id)} className="icon-btn delete" style={{ marginLeft: '10px' }}>
                        <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'marketers' && (
        <div className="admin-grid">
          <div className="admin-panel form-panel">
            <h3>Create Marketer</h3>
            <form onSubmit={handleCreateMarketer}>
              <input className="admin-input" placeholder="Name" value={marketerForm.name} onChange={e => setMarketerForm({ ...marketerForm, name: e.target.value })} required style={{ marginBottom: '10px' }} />
              <input className="admin-input" placeholder="Email" value={marketerForm.email} onChange={e => setMarketerForm({ ...marketerForm, email: e.target.value })} required style={{ marginBottom: '10px' }} />
              <input className="admin-input" placeholder="Password" value={marketerForm.password} onChange={e => setMarketerForm({ ...marketerForm, password: e.target.value })} required style={{ marginBottom: '10px' }} />

              <div className="form-group" style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#ccc', fontSize: '0.9rem' }}>Commission Rate (%)</label>
                <input
                  className="admin-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="e.g. 10"
                  value={marketerForm.commission}
                  onChange={e => setMarketerForm({ ...marketerForm, commission: e.target.value })}
                  required
                />
                <small style={{ color: '#888', fontSize: '0.75rem' }}>Marketer will earn this % on each sale</small>
              </div>

              <button type="submit" className="admin-btn">Generate Code</button>
            </form>
          </div>
          <div className="admin-panel list-panel">
            <h3>Marketers List</h3>
            <div className="inventory-list">
              {marketers.map(m => (
                <div key={m.id} className="inventory-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{m.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>Code: {m.code}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
                      Email: <span style={{ color: '#3498db' }}>{m.email}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>
                      Password: <span style={{ color: '#e74c3c', fontFamily: 'monospace' }}>{m.password}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>
                      Commission: <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>{m.commission || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'carMakes' && (
        <div className="admin-grid">
          <div className="admin-panel form-panel">
            <h3>Add Car Make/Model</h3>
            <form onSubmit={handleAddCarMake}>
              <div className="form-group">
                <label>Brand *</label>
                <input
                  className="admin-input"
                  placeholder="e.g. BMW, Toyota, Mercedes"
                  value={carMakeForm.brand}
                  onChange={e => setCarMakeForm({ ...carMakeForm, brand: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Year *</label>
                <input
                  className="admin-input"
                  type="number"
                  placeholder="e.g. 2024"
                  value={carMakeForm.year}
                  onChange={e => setCarMakeForm({ ...carMakeForm, year: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Model (Optional)</label>
                <input
                  className="admin-input"
                  placeholder="e.g. X5, Corolla, C-Class"
                  value={carMakeForm.model}
                  onChange={e => setCarMakeForm({ ...carMakeForm, model: e.target.value })}
                />
              </div>

              <button type="submit" className="admin-btn">Add Car Make</button>
            </form>
          </div>

          <div className="admin-panel list-panel">
            <h3>Car Makes Database</h3>
            <div className="inventory-list">
              {carMakes.length === 0 ? (
                <p style={{ color: '#888' }}>No car makes added yet</p>
              ) : (
                carMakes.map(make => (
                  <div key={make.id} className="inventory-item">
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold' }}>{make.brand} {make.model && `- ${make.model}`}</div>
                      <div style={{ fontSize: '0.8rem', color: '#888' }}>Year: {make.year}</div>
                    </div>
                    <button onClick={() => handleDeleteCarMake(make.id)} className="icon-btn delete">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="admin-panel">
          <h3>Request Log</h3>
          {requests.length === 0 ? <p>No pending requests.</p> : requests.map(req => (
            <div key={req.id} style={{ background: '#111', padding: '15px', margin: '10px 0', border: '1px solid #333', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: 'var(--primary)', display: 'block' }}>{req.type}</strong>
                <span style={{ color: '#ccc' }}>{req.description}</span>
                <div style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(req.date?.seconds * 1000).toLocaleString()}</div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {req.status === 'Pending' && req.type === 'Payment Approval' && (
                  <button onClick={() => handleApprovePayment(req)} className="admin-btn success-btn" style={{ width: 'auto', padding: '8px 15px', fontSize: '0.9rem' }}>
                    Approve Payment
                  </button>
                )}
                {req.status === 'Pending' && req.type === 'Sale Approval' && (
                  <button onClick={() => handleApproveSale(req)} className="admin-btn" style={{ width: 'auto', padding: '8px 15px' }}>Approve</button>
                )}
                {req.status === 'Pending' && req.type === 'Delete Product' && (
                  <button onClick={() => handleDeleteProductRequest(req)} className="admin-btn" style={{ width: 'auto', padding: '8px 15px', background: '#d32f2f' }}>Delete</button>
                )}
                {req.status !== 'Pending' && <span style={{ padding: '5px 10px', background: '#333', borderRadius: '5px', fontSize: '0.8rem' }}>{req.status}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminPage;