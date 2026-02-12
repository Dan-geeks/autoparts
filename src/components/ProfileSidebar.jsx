import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig';

const ProfileSidebar = ({ isOpen, onClose, userEmail }) => {
    const navigate = useNavigate();
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    const handleLogout = () => {
        if (auth.currentUser) {
            auth.signOut();
        }
        localStorage.removeItem('cart');
        onClose();
        navigate('/');
    };

    const handleNavigation = (path) => {
        navigate(path);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 999,
                    animation: 'fadeIn 0.3s ease'
                }}
            />

            {/* Sidebar */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '80%',
                    maxWidth: '400px',
                    background: 'var(--bg-primary, #0f0f0f)',
                    boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideInRight 0.3s ease',
                    overflowY: 'auto'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid var(--border-color, #333)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, color: 'var(--text-primary, #fff)', fontSize: '1.3rem' }}>Profile</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary, #888)',
                            fontSize: '28px',
                            cursor: 'pointer',
                            padding: '0',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'var(--hover-bg, #333)'}
                        onMouseLeave={(e) => e.target.style.background = 'none'}
                    >
                        ×
                    </button>
                </div>

                {/* User Info */}
                {userEmail && (
                    <div style={{
                        padding: '20px',
                        borderBottom: '1px solid var(--border-color, #333)',
                        background: 'var(--bg-secondary, #1a1a1a)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #e50914 0%, #b20710 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                color: '#fff',
                                fontWeight: 'bold'
                            }}>
                                {userEmail.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #888)' }}>Signed in as</div>
                                <div style={{ fontSize: '0.95rem', color: 'var(--text-primary, #fff)', marginTop: '4px', fontWeight: '500' }}>
                                    {userEmail}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation Links */}
                <div style={{ flex: 1, padding: '10px 0' }}>
                    <NavLink
                        icon="fas fa-user-tie"
                        text="Become a Marketer"
                        onClick={() => handleNavigation('/marketer-registration')}
                    />
                    <NavLink
                        icon="fas fa-headset"
                        text="Customer Service"
                        onClick={() => handleNavigation('/contact-us')}
                    />
                    <NavLink
                        icon="fas fa-shipping-fast"
                        text="Shipping Policy"
                        onClick={() => handleNavigation('/shipping-policy')}
                    />
                    <NavLink
                        icon="fas fa-envelope"
                        text="Contact Us"
                        onClick={() => handleNavigation('/contact-us')}
                    />

                    {/* Theme Toggle */}
                    <div style={{
                        padding: '15px 20px',
                        borderBottom: '1px solid var(--border-color, #333)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg, #1a1a1a)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <i className={theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun'} style={{ fontSize: '1.1rem', color: 'var(--primary, #e50914)', width: '20px' }}></i>
                            <span style={{ color: 'var(--text-primary, #fff)', fontSize: '0.95rem' }}>
                                {theme === 'dark' ? 'Dark' : 'Light'} Mode
                            </span>
                        </div>
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleTheme();
                            }}
                            style={{
                                width: '50px',
                                height: '26px',
                                background: theme === 'dark' ? '#333' : '#e50914',
                                borderRadius: '13px',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{
                                width: '20px',
                                height: '20px',
                                background: '#fff',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: '3px',
                                left: theme === 'dark' ? '3px' : '27px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}></div>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <div
                        onClick={handleLogout}
                        style={{
                            padding: '15px 20px',
                            borderBottom: '1px solid var(--border-color, #333)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            color: '#e74c3c'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(231, 76, 60, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        <i className="fas fa-sign-out-alt" style={{ fontSize: '1.1rem', width: '20px' }}></i>
                        <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Logout</span>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '20px',
                    borderTop: '1px solid var(--border-color, #333)',
                    background: 'var(--bg-secondary, #1a1a1a)'
                }}>
                    <div style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #888)', marginBottom: '4px' }}>
                            <i className="fas fa-map-marker-alt" style={{ marginRight: '8px' }}></i>
                            Location
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary, #fff)', paddingLeft: '20px' }}>
                            Europe
                        </div>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #888)', marginBottom: '4px' }}>
                            <i className="fas fa-envelope" style={{ marginRight: '8px' }}></i>
                            Email
                        </div>
                        <a
                            href="mailto:evoautopartslimited@gmail.com"
                            style={{
                                fontSize: '0.85rem',
                                color: 'var(--primary, #e50914)',
                                textDecoration: 'none',
                                paddingLeft: '20px',
                                display: 'block'
                            }}
                        >
                            evoautopartslimited@gmail.com
                        </a>
                    </div>
                    <a
                        href="https://wa.me/1234567890"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            padding: '12px',
                            background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '0.95rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            textDecoration: 'none',
                            transition: 'all 0.3s',
                            boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 211, 102, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 211, 102, 0.3)';
                        }}
                    >
                        <i className="fab fa-whatsapp" style={{ fontSize: '1.2rem' }}></i>
                        Chat on WhatsApp
                    </a>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }

                @media (min-width: 768px) {
                    .profile-sidebar {
                        width: 40% !important;
                    }
                }
            `}</style>
        </>
    );
};

// NavLink Component
const NavLink = ({ icon, text, onClick }) => {
    return (
        <div
            onClick={onClick}
            style={{
                padding: '15px 20px',
                borderBottom: '1px solid var(--border-color, #333)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--hover-bg, #1a1a1a)';
                e.currentTarget.style.paddingLeft = '25px';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.paddingLeft = '20px';
            }}
        >
            <i className={icon} style={{ fontSize: '1.1rem', color: 'var(--primary, #e50914)', width: '20px' }}></i>
            <span style={{ color: 'var(--text-primary, #fff)', fontSize: '0.95rem' }}>{text}</span>
        </div>
    );
};

export default ProfileSidebar;
