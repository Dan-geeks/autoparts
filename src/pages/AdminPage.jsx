import React, { useState, useEffect, useMemo } from "react";
import Footer from "../components/Footer";
import VehicleManagement from "../components/VehicleManagement";
import { auth, db, storage, googleProvider } from "../firebaseConfig";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithPopup } from "firebase/auth";
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { subscribeToVehicleMakes } from "../services/vehicleService";
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
  model: "",
  year: new Date().getFullYear().toString(),
  compatibleYears: [],
  category: "",
  subCategory: "",
  description: "",
  quantity: 1,
  price: 0,
  currency: "EUR",
  condition: "New",
  discountCode: "",
  discountPercent: 0,
  mainImage: "",
  additionalImages: [],
};

const AdminPage = () => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState("");

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Dashboard Data State
  const [activeTab, setActiveTab] = useState("inventory");
  const [parts, setParts] = useState([]);
  const [marketers, setMarketers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [carMakes, setCarMakes] = useState([]);
  const [vehicleMakes, setVehicleMakes] = useState([]); // New structure: { make, models: [] }
  const [users, setUsers] = useState([]);

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

    // NEW: Subscribe to vehicleMakes collection with new structure
    const unsubVehicleMakes = subscribeToVehicleMakes((makes) => {
      setVehicleMakes(makes);
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubParts();
      unsubMarketers();
      unsubRequests();
      unsubCarMakes();
      unsubVehicleMakes();
      unsubUsers();
    };
  }, [user]);

  // 3. COMPUTE DROPDOWN OPTIONS FROM vehicleMakes COLLECTION
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
    if (formData.brand && vehicleMakes.length > 0) {
      const selectedMake = vehicleMakes.find(v => v.make === formData.brand);
      if (selectedMake && selectedMake.models) {
        return selectedMake.models.sort();
      }
    }

    // Fallback to old carMakes collection
    const modelsFromCarMakes = [...new Set(carMakes.map(c => c.model).filter(Boolean))];
    return modelsFromCarMakes.sort();
  }, [vehicleMakes, carMakes, formData.brand]);

  const yearOptions = useMemo(() => {
    // Generate years from 2000 to current year
    const currentYear = new Date().getFullYear();
    const defaultYears = Array.from({ length: currentYear - 1999 }, (_, i) => (2000 + i).toString()).reverse();

    // Also include years from old carMakes if they exist
    const yearsFromCarMakes = [...new Set(carMakes.map(c => c.year).filter(Boolean))];
    const allYears = [...new Set([...defaultYears, ...yearsFromCarMakes])].sort((a, b) => b - a);

    return allYears;
  }, [carMakes]);

  // --- HANDLERS ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPass);
    } catch {
      setLoginError("Invalid Email or Password");
    }
  };

  const handleGoogleLogin = async () => {
    setLoginError("");
    try {
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });

      const result = await signInWithPopup(auth, googleProvider);

      // Only allow collinskosgei32@gmail.com
      if (result.user.email !== "collinskosgei32@gmail.com") {
        await signOut(auth);
        setLoginError("Access Denied: Only collinskosgei32@gmail.com can access admin via Google.");
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setLoginError("Google sign-in failed: " + err.message);
      }
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
    } catch (error) {
      alert(error.message);
    }
  };

  const handlePartSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      if (editingId) {
        await updateDoc(doc(db, "spareParts", editingId), formData);
      } else {
        await addDoc(collection(db, "spareParts"), { ...formData, uploadedBy: "Admin", createdAt: new Date() });
      }
      setSaveStatus("success");
      // Clear form immediately
      setFormData(emptyPart);
      setEditingId(null);
      // Reset status after showing success
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
    } catch (error) {
      alert(error.message);
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
      () => { },
      (error) => { console.error(error); setUploading(false); },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData(prev => ({ ...prev, mainImage: downloadURL }));
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


  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        disabled: !currentStatus
      });
      alert(`User ${!currentStatus ? 'disabled' : 'enabled'} successfully!`);
    } catch (err) {
      alert("Error updating user status: " + err.message);
    }
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

          <button className="google-btn" onClick={handleGoogleLogin} style={{ marginBottom: '20px' }}>
            <i className="fab fa-google"></i> Continue with Google
          </button>

          <div className="divider"><span>OR CONTINUE WITH EMAIL</span></div>

          <form onSubmit={handleLogin} className="form-section active">
            <div className="input-group">
              <label>Admin Email</label>
              <input type="email" className="input-field" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
            </div>
            <div className="input-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="input-field"
                  value={loginPass}
                  onChange={(e) => setLoginPass(e.target.value)}
                  required
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
            </div>
            <button type="submit" className="submit-btn">Login to Dashboard</button>
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
        <h1>Admin Control Panel</h1>
        <div className="admin-tabs">
          <button className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>Inventory</button>
          <button className={activeTab === 'vehicles' ? 'active' : ''} onClick={() => setActiveTab('vehicles')}>Vehicles</button>
          <button className={activeTab === 'marketers' ? 'active' : ''} onClick={() => setActiveTab('marketers')}>Marketers</button>
          <button className={activeTab === 'carMakes' ? 'active' : ''} onClick={() => setActiveTab('carMakes')}>Car Makes (Old)</button>
          <button className={activeTab === 'requests' ? 'active' : ''} onClick={() => setActiveTab('requests')}>Requests</button>
          <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Users</button>
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
              {/* VEHICLE FITMENT SECTION */}
              <div style={{ borderTop: '1px solid #333', paddingTop: '15px', marginTop: '15px' }}>
                <h4 style={{ color: '#888', fontSize: '0.9rem', marginBottom: '10px' }}>Vehicle Fitment</h4>
              </div>

              <div className="form-group">
                <label>Select Brand *</label>
                <select
                  className="admin-input"
                  value={formData.brand}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  required
                >
                  <option value="">Choose Brand</option>
                  {brandOptions.map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
                <small style={{ color: '#888', fontSize: '0.75rem' }}>
                  Don't see your brand? Add it in the "Car Makes" tab first
                </small>
              </div>

              <div className="form-group">
                <label>Select Model (Optional)</label>
                <select
                  className="admin-input"
                  value={formData.model || ''}
                  onChange={e => setFormData({ ...formData, model: e.target.value })}
                >
                  <option value="">Choose Model or Leave Empty</option>
                  {modelOptions.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
                <small style={{ color: '#888', fontSize: '0.75rem' }}>
                  Or enter custom model: <input
                    type="text"
                    className="admin-input"
                    placeholder="e.g. X5, Corolla"
                    value={formData.model || ''}
                    onChange={e => setFormData({ ...formData, model: e.target.value })}
                    style={{ marginTop: '5px' }}
                  />
                </small>
              </div>

              <div className="form-group">
                <label>Year (Multiple Selection) *</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  {yearOptions.slice(0, 10).map(year => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => {
                        const currentYears = formData.compatibleYears || [];
                        const yearExists = currentYears.includes(year);
                        const newYears = yearExists
                          ? currentYears.filter(y => y !== year)
                          : [...currentYears, year].sort((a, b) => b - a);
                        setFormData({
                          ...formData,
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
                        background: (formData.compatibleYears || []).includes(year) ? '#e50914' : '#333',
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
                  value={formData.compatibleYears?.join(', ') || ''}
                  onChange={e => {
                    const yearsArray = e.target.value
                      .split(',')
                      .map(y => y.trim())
                      .filter(y => y !== '');
                    setFormData({
                      ...formData,
                      compatibleYears: yearsArray,
                      year: yearsArray[0] || new Date().getFullYear().toString()
                    });
                  }}
                  required
                />
                <small style={{ color: '#888', fontSize: '0.75rem' }}>
                  Selected years: {formData.compatibleYears?.join(', ') || 'None'}
                </small>
              </div>

              {/* PART SELECTION SECTION */}
              <div style={{ borderTop: '1px solid #333', paddingTop: '15px', marginTop: '15px' }}>
                <h4 style={{ color: '#888', fontSize: '0.9rem', marginBottom: '10px' }}>Part Selection</h4>
              </div>

              <div className="form-group">
                <label>Select Category *</label>
                <select
                  className="admin-input"
                  value={formData.category || ''}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Choose Category</option>
                  <option value="Engine Parts">Engine Parts</option>
                  <option value="Transmission">Transmission</option>
                  <option value="Suspension">Suspension</option>
                  <option value="Brakes">Brakes</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Body Parts">Body Parts</option>
                  <option value="Interior">Interior</option>
                  <option value="Exhaust">Exhaust</option>
                  <option value="Cooling System">Cooling System</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Select Sub-Category</label>
                <input
                  className="admin-input"
                  placeholder="e.g. Oil Filter, Brake Pads, Headlight"
                  value={formData.subCategory || ''}
                  onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                />
              </div>

              {/* PART NAME - MOVED TO BOTTOM */}
              <div className="form-group">
                <label>Part Name *</label>
                <input
                  className="admin-input"
                  placeholder="e.g. M-Sport Grille, LED Headlight"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* PRODUCT DETAILS SECTION */}
              <div style={{ borderTop: '1px solid #333', paddingTop: '15px', marginTop: '15px' }}>
                <h4 style={{ color: '#888', fontSize: '0.9rem', marginBottom: '10px' }}>Product Details</h4>
              </div>

              <div className="form-group">
                <label>Condition</label>
                <select className="admin-input" value={formData.condition || 'New'} onChange={e => setFormData({ ...formData, condition: e.target.value })} required>
                  <option value="New">New</option>
                  <option value="Used - Like New">Used - Like New</option>
                  <option value="Used">Used</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="admin-input"
                  placeholder="Enter product description..."
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows="4"
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div className="form-group">
                <label>Price</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input className="admin-input" type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} style={{ flex: 1 }} required />
                  <select className="admin-input" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })} style={{ width: '100px' }}>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Quantity Available</label>
                <input
                  className="admin-input"
                  type="number"
                  min="1"
                  value={formData.quantity || 1}
                  onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Discount Code (Optional)</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    className="admin-input"
                    type="text"
                    placeholder="e.g. SUMMER-SAVE50, FLASH-SAVE20"
                    value={formData.discountCode || ''}
                    onChange={e => setFormData({ ...formData, discountCode: e.target.value.toUpperCase() })}
                    style={{ flex: 1 }}
                  />
                  <input
                    className="admin-input"
                    type="number"
                    placeholder="% OFF"
                    min="0"
                    max="100"
                    value={formData.discountPercent || ''}
                    onChange={e => setFormData({ ...formData, discountPercent: Number(e.target.value) })}
                    style={{ width: '100px' }}
                  />
                </div>
                <small style={{ color: '#888', fontSize: '0.75rem' }}>
                  Enter code in format: XXXX-SAVE## (e.g., SUMMER-SAVE50 with 50% discount)
                </small>
              </div>

              {/* PRODUCT IMAGES SECTION */}
              <div style={{ borderTop: '1px solid #333', paddingTop: '15px', marginTop: '15px' }}>
                <h4 style={{ color: '#888', fontSize: '0.9rem', marginBottom: '10px' }}>Product Images</h4>
              </div>

              <div className="form-group">
                <label>Main Product Image</label>
                <input type="file" onChange={handleImageUpload} className="file-input" accept="image/*" />
                {formData.mainImage && (
                  <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
                    <img src={formData.mainImage} alt="Main" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }} />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, mainImage: '' })}
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: '#e74c3c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >×</button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Additional Images</label>
                <input
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const storageRef = ref(storage, `parts/${Date.now()}_${file.name}`);
                    setUploading(true);
                    const uploadTask = uploadBytesResumable(storageRef, file);
                    uploadTask.on('state_changed', null,
                      (error) => { console.error(error); setUploading(false); },
                      async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        setFormData(prev => ({
                          ...prev,
                          additionalImages: [...(prev.additionalImages || []), downloadURL]
                        }));
                        setUploading(false);
                        e.target.value = '';
                      }
                    );
                  }}
                  className="file-input"
                  accept="image/*"
                />
                {formData.additionalImages && formData.additionalImages.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                    {formData.additionalImages.map((img, idx) => (
                      <div key={idx} style={{ position: 'relative', display: 'inline-block' }}>
                        <img src={img} alt={`Additional ${idx + 1}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '5px' }} />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = formData.additionalImages.filter((_, i) => i !== idx);
                            setFormData({ ...formData, additionalImages: newImages });
                          }}
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            background: '#e74c3c',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className={`admin-btn ${saveStatus === 'success' ? 'success-btn' : ''}`} disabled={uploading || saveStatus === 'saving'}>
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? '✔ Saved' : editingId ? 'Update Product' : 'Upload to Store'}
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
                  <img src={p.mainImage || p.image || "https://via.placeholder.com/50"} alt="" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
                      {p.brand} {p.model && `- ${p.model}`}
                      {p.compatibleYears && p.compatibleYears.length > 0 ? (
                        <span style={{ color: '#3498db', marginLeft: '5px' }}>
                          | Years: {p.compatibleYears.join(', ')}
                        </span>
                      ) : p.year && (
                        <span> | Year: {p.year}</span>
                      )}
                    </div>
                    {p.category && (
                      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
                        {p.category}{p.subCategory && ` > ${p.subCategory}`}
                      </div>
                    )}
                    <div style={{ fontSize: '0.8rem', marginTop: '6px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {p.condition && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          background: p.condition === 'New' ? '#2ecc71' : p.condition.includes('Like New') ? '#3498db' : '#95a5a6',
                          color: '#fff'
                        }}>
                          {p.condition}
                        </span>
                      )}
                      {p.quantity && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          background: '#f39c12',
                          color: '#fff'
                        }}>
                          {p.quantity} available
                        </span>
                      )}
                      {p.price && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          background: '#3498db',
                          color: '#fff'
                        }}>
                          {p.currency || 'EUR'} {p.price}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button onClick={() => { setEditingId(p.id); setFormData(p); }} className="icon-btn edit" title="Edit">✎</button>
                    <button onClick={() => handleDeletePart(p.id)} className="icon-btn delete" title="Delete">
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

      {activeTab === 'vehicles' && <VehicleManagement />}

      {activeTab === 'carMakes' && (
        <div className="admin-grid">
          <div className="admin-panel form-panel">
            <h3>Add Car Make/Model (Legacy)</h3>
            <div style={{
              background: '#1a1a1a',
              border: '1px solid #f39c12',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '15px',
              fontSize: '0.85rem',
              color: '#f39c12'
            }}>
              <strong>Note:</strong> This is the old system. Please use the new "Vehicles" tab for better organization.
            </div>
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
            <h3>Car Makes Database (Legacy)</h3>
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


      {activeTab === 'users' && (
        <div className="admin-panel">
          <h3>Registered Users</h3>
          <div className="inventory-list">
            {users.length === 0 ? (
              <p style={{ color: '#888' }}>No registered users yet</p>
            ) : (
              users.map(user => (
                <div key={user.id} style={{ background: '#111', padding: '15px', margin: '10px 0', border: '1px solid #333', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{user.email}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
                      Status: <span style={{ 
                        color: user.disabled ? '#e74c3c' : '#2ecc71',
                        fontWeight: 'bold'
                      }}>
                        {user.disabled ? 'DISABLED' : 'ACTIVE'}
                      </span>
                    </div>
                    {user.createdAt && (
                      <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '2px' }}>
                        Joined: {new Date(user.createdAt.seconds * 1000).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleUserStatus(user.id, user.disabled)}
                    className="admin-btn"
                    style={{ 
                      width: 'auto', 
                      padding: '8px 15px',
                      background: user.disabled ? '#2ecc71' : '#e74c3c'
                    }}
                  >
                    {user.disabled ? 'Enable User' : 'Disable User'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminPage;