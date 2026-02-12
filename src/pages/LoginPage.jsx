import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig'; // Ensure this path is correct
import '../styles/Login.css';

const LoginPage = () => {
    const [activeTab, setActiveTab] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [isCheckingUser, setIsCheckingUser] = useState(false);
    const navigate = useNavigate();

    // Reset errors when switching tabs
    const switchTab = (tab) => {
        setError('');
        setActiveTab(tab);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        console.log("Attempting Email Login...");
        setError('');
        setIsCheckingUser(false);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log("Login Success:", userCredential.user);
            
            // Check if user is disabled
            setIsCheckingUser(true);
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
            
            if (userDoc.exists() && userDoc.data().disabled) {
                // Show loading animation for disabled users
                await auth.signOut();
                setIsCheckingUser(false);
                setError("Your account has been disabled. Please contact support for assistance.");
                return;
            }
            
            setIsCheckingUser(false);
            navigate('/store');
        } catch (err) {
            console.error("Login Error:", err);
            setIsCheckingUser(false);
            setError("Login failed: " + err.message);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        console.log("Attempting Signup...");
        setError('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log("Signup Success:", userCredential.user);
            
            // Create user document in Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                email: userCredential.user.email,
                fullName: fullName,
                disabled: false,
                createdAt: new Date()
            });
            
            navigate('/store');
        } catch (err) {
            console.error("Signup Error:", err);
            setError("Signup failed: " + err.message);
        }
    };

    // --- LOGGING ADDED HERE ---
    const handleGoogleLogin = async () => {
        console.log("1. Google Button Clicked");
        setError('');

        try {
            // FORCE Google to show the account selection screen every time
            googleProvider.setCustomParameters({
                prompt: 'select_account'
            });

            console.log("2. Opening Google Popup...");
            const result = await signInWithPopup(auth, googleProvider);

            console.log("3. Google Popup Finished. User:", result.user);
            console.log("4. Navigating to Store...");
            navigate('/store');

        } catch (err) {
            console.error("ERROR during Google Login:", err);
            if (err.code === 'auth/popup-closed-by-user') {
                console.log("User closed the popup intentionally.");
            } else {
                setError("Google sign-in failed: " + err.message);
            }
        }
    };

    return (
        <div className="login-page-bg">
            <div className="login-container">
                <div className="login-logo">Evo<span>Parts</span></div>

                <button className="google-btn" onClick={handleGoogleLogin}>
                    <i className="fab fa-google"></i> Continue with Google
                </button>

                <div className="divider"><span>OR CONTINUE WITH EMAIL</span></div>

                {error && <div style={{ color: '#ff4444', marginBottom: '15px', fontWeight: 'bold' }}>{error}</div>}

                <div className="toggle-box">
                    <div
                        className="toggled-bg"
                        style={{ left: activeTab === 'login' ? '0' : '50%' }}
                    ></div>
                    <button
                        className={`toggle-btn ${activeTab === 'login' ? 'active' : ''}`}
                        onClick={() => switchTab('login')}
                    >
                        Log In
                    </button>
                    <button
                        className={`toggle-btn ${activeTab === 'signup' ? 'active' : ''}`}
                        onClick={() => switchTab('signup')}
                    >
                        Sign Up
                    </button>
                </div>

                {activeTab === 'login' && (
                    <form className="form-section active" onSubmit={handleLogin}>
                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="john@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="submit-btn">Log In</button>
                    </form>
                )}

                {activeTab === 'signup' && (
                    <form className="form-section active" onSubmit={handleSignup}>
                        <div className="input-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="john@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Create Password</label>
                            <input
                                type="password"
                                className="input-field"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button type="submit" className="submit-btn">Create Account</button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default LoginPage;