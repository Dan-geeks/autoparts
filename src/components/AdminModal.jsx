import React, { useState } from 'react';

const AdminModal = ({ isOpen, onClose, onAddItem }) => {
    if (!isOpen) return null;

    const [formData, setFormData] = useState({
        brand: '',
        year: '',
        name: '',
        image: '',
        price: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = () => {
        const { brand, year, name, image, price } = formData;
        if (!brand || !name || !price) {
            alert("Please fill in Brand, Name and Price");
            return;
        }

        // Convert price to number
        onAddItem({
            ...formData,
            price: parseInt(price),
            image: image || '' // Handle empty image
        });

        // Reset form
        setFormData({ brand: '', year: '', name: '', image: '', price: '' });
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <span className="close" onClick={onClose}>&times;</span>
                <h2>Admin: Add New Part</h2>
                <input
                    type="text" id="brand" className="admin-input" placeholder="Brand (e.g. BMW)"
                    value={formData.brand} onChange={handleChange}
                />
                <input
                    type="text" id="year" className="admin-input" placeholder="Year (e.g. 2023)"
                    value={formData.year} onChange={handleChange}
                />
                <input
                    type="text" id="name" className="admin-input" placeholder="Part Name (e.g. Headlight)"
                    value={formData.name} onChange={handleChange}
                />
                <input
                    type="text" id="image" className="admin-input" placeholder="Image URL (Paste Link Here)"
                    value={formData.image} onChange={handleChange}
                />
                <input
                    type="number" id="price" className="admin-input" placeholder="Price (KES)"
                    value={formData.price} onChange={handleChange}
                />
                <button className="filter-btn" style={{ width: '100%' }} onClick={handleSubmit}>Add Item</button>
            </div>
        </div>
    );
};

export default AdminModal;
