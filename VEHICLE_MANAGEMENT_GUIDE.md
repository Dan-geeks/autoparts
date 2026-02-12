# Vehicle Management Feature Guide

## Overview

This feature allows admins to dynamically manage vehicle makes and models in Firebase, replacing the hardcoded vehicle data. Product addition forms in both AdminPage and MarketerPage now use this dynamic data.

## What's New

### 1. New "Vehicles" Tab in Admin Panel

A dedicated management interface for vehicle makes and models with:
- Add new vehicle makes
- Add multiple models to each make
- Delete individual models
- Delete entire makes with confirmation
- Real-time updates across all users

### 2. Dynamic Dropdowns in Product Forms

Both Admin and Marketer product addition forms now feature:
- **Brand dropdown**: Populated from Firebase vehicleMakes collection
- **Model dropdown**: Dynamically updates based on selected brand
- **"Other" option**: Allows custom brand/model input when needed
- Fallback to default brands if database is empty

### 3. Data Migration Script

One-click import of 20 popular vehicle makes with their models, including:
- Audi, BMW, Mercedes, Toyota, Honda, Ford, Chevrolet, Nissan, Volkswagen
- Hyundai, Kia, Mazda, Subaru, Lexus, Land Rover, Jeep, Porsche, Volvo
- Mitsubishi, Isuzu

## Firebase Collection Structure

### Collection: `vehicleMakes`

```javascript
{
  make: "Toyota",           // String: Vehicle manufacturer name
  models: [                 // Array: List of model names
    "Corolla",
    "Camry",
    "RAV4",
    // ...
  ],
  createdAt: Timestamp      // Timestamp: Creation date
}
```

## How to Use

### Initial Setup (First Time Only)

1. **Login to Admin Panel** at `/admin`
2. **Navigate to "Vehicles" tab** in the admin header
3. **Click "Import Initial Vehicle Data"** button (appears when database is empty)
4. Wait for import to complete - you'll see a report of what was added
5. Start managing vehicles!

### Adding a New Vehicle Make

1. Go to **Vehicles** tab
2. In the **"Add New Vehicle Make"** section:
   - Enter the make name (e.g., "Tesla")
   - Click **"Add Make"**
3. The new make appears immediately in the list

### Adding Models to a Make

1. In the **"Add Model to Existing Make"** section:
   - Select a make from the dropdown
   - Enter the model name (e.g., "Model 3")
   - Click **"Add Model"**
2. The model is added instantly and appears under the make

### Deleting Models

1. Find the vehicle make in the right panel
2. Locate the model you want to remove
3. Click the **×** button next to the model name
4. Confirm the deletion

### Deleting an Entire Make

1. Find the vehicle make in the right panel
2. Click the **trash icon** in the top-right of the make card
3. Confirm deletion (this removes the make AND all its models)

### Using Dynamic Data in Product Forms

**Admin Product Form** (Inventory tab):
1. Select a brand from the **"Select Brand"** dropdown
2. The **"Select Model"** dropdown updates with that brand's models
3. Choose a model or leave empty for universal parts
4. Select "Other" to enter custom brand/model names

**Marketer Product Form** (Upload Product tab):
1. Same flow as admin form
2. Brand dropdown shows all available makes
3. Model dropdown shows models for selected brand
4. Custom input available via "Other" option

## Technical Details

### New Files Created

1. **`src/services/vehicleService.js`**
   - Firebase CRUD operations for vehicles
   - Functions: `addVehicleMake`, `addModelToMake`, `removeModelFromMake`, `deleteVehicleMake`
   - Real-time subscription: `subscribeToVehicleMakes`

2. **`src/components/VehicleManagement.jsx`**
   - Main UI component for vehicle management
   - Handles all vehicle operations with real-time updates
   - Integrated migration tool

3. **`src/scripts/migrateVehicleData.js`**
   - Initial data seeding script
   - 20 pre-configured vehicle makes with models
   - Smart duplicate detection

### Modified Files

1. **`src/pages/AdminPage.jsx`**
   - Added "Vehicles" tab
   - Integrated VehicleManagement component
   - Updated product form to use dynamic vehicle data
   - Brand and model dropdowns now pull from Firebase

2. **`src/pages/MarketerPage.jsx`**
   - Updated product upload form
   - Dynamic brand/model dropdowns
   - Custom input support for "Other" selections

### Data Flow

```
Firebase vehicleMakes Collection
        ↓
subscribeToVehicleMakes()
        ↓
Component State (vehicleMakes)
        ↓
useMemo (brandOptions, modelOptions)
        ↓
Dropdown Selects in Forms
        ↓
Product Data Saved to spareParts Collection
```

## Benefits

✅ **No more hardcoded data** - Easy to update vehicle information
✅ **Real-time sync** - Changes appear instantly for all users
✅ **Better UX** - Organized makes with their specific models
✅ **Scalable** - Add new makes/models without code changes
✅ **Backward compatible** - Falls back to defaults if database is empty
✅ **Data integrity** - Duplicate prevention built-in

## Migration Notes

### Old System (Deprecated but Maintained)

- **carMakes** collection: Old flat structure (brand, year, model per document)
- Still accessible via "Car Makes (Old)" tab
- Product forms fall back to this if new system is empty
- Can be phased out once migration is complete

### New System

- **vehicleMakes** collection: New hierarchical structure (make with models array)
- More efficient and organized
- Better for dropdown population
- Recommended for all new data

## Troubleshooting

### Q: Dropdowns are empty in product forms?
**A:** Run the initial data migration from the Vehicles tab, or add makes manually.

### Q: Model dropdown is disabled?
**A:** You must select a brand first. Models are specific to each brand.

### Q: Can I add a custom brand not in the list?
**A:** Yes! Select "Other" from the brand dropdown and enter a custom name.

### Q: What happens to existing products?
**A:** Nothing changes. Existing products keep their current brand/model data. New products will use the dynamic system.

### Q: Can marketers manage vehicle data?
**A:** No, only admins can add/remove makes and models. Marketers can only use the data in product forms.

## Security Considerations

- Only authenticated admins can access vehicle management
- Admin authentication enforced via `ALLOWED_ADMINS` list
- Firestore security rules should restrict vehicleMakes collection writes to admins only

### Recommended Firestore Rules

```javascript
match /vehicleMakes/{makeId} {
  allow read: if true;  // Everyone can read
  allow write: if request.auth != null &&
               request.auth.token.email in ['admin@evoparts.com', 'collinskosgei32@gmail.com'];
}
```

## Future Enhancements

Potential improvements:
- Bulk import from CSV/Excel
- Edit existing make names
- Sort/filter vehicle list
- Search functionality
- Model years per make
- Vehicle categories (Sedan, SUV, Truck, etc.)
- Popular models badge
- Analytics on most-used makes/models

## Support

For issues or questions about this feature:
1. Check Firebase console for data
2. Verify admin authentication
3. Check browser console for errors
4. Contact admin at collinskosgei32@gmail.com
