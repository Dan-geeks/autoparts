# PayPal Card Payment Integration Setup

## Overview
This implementation allows customers to enter their card details directly on your checkout page. PayPal processes the payment securely using Hosted Fields.

## Features
✅ Direct card payment (no PayPal account required for customers)
✅ Secure PCI-compliant card handling via PayPal Hosted Fields
✅ Real-time payment processing
✅ Automatic order creation in Firebase on successful payment
✅ Support for marketer referral codes

## Important Security Notes

### 🔴 CRITICAL: Your API credentials were exposed in the chat
You shared your PayPal API secret key publicly. For security:

1. **Immediately revoke these credentials:**
   - Go to https://developer.paypal.com/dashboard
   - Navigate to Apps & Credentials
   - Delete or regenerate your app credentials

2. **Generate new credentials:**
   - Create a new app or regenerate keys for existing app
   - Update the `.env` file with new credentials

3. **Never share API secrets:**
   - Don't paste them in chat, emails, or public forums
   - Don't commit them to git (already protected in `.gitignore`)

## Setup Instructions

### 1. Environment Configuration

The `.env` file has been created with your credentials. Update it with fresh credentials:

```env
VITE_PAYPAL_CLIENT_ID=your_new_client_id_here
VITE_PAYPAL_SECRET=your_new_secret_key_here
```

### 2. PayPal Account Setup

1. Log in to PayPal Developer Dashboard: https://developer.paypal.com/dashboard
2. Go to **Apps & Credentials**
3. Choose **Live** mode (or Sandbox for testing)
4. Create or select your app
5. Copy the **Client ID** and **Secret**
6. Update `.env` file

### 3. Currency Configuration

Currently set to **USD**. To change currency:

**File: `src/config/paypalConfig.js`**
```javascript
export const paypalOptions = {
  clientId: PAYPAL_CLIENT_ID,
  currency: 'USD', // Change to KES, EUR, GBP, etc.
  intent: 'capture',
  components: 'hosted-fields,buttons',
};
```

**Supported currencies:** USD, EUR, GBP, AUD, CAD, JPY, KES, and more
**Note:** Ensure your PayPal account supports the currency you choose.

### 4. Sandbox vs Production

**For testing (Sandbox):**
- Use sandbox credentials from PayPal Developer Dashboard
- Change API base URL in `src/config/paypalConfig.js`:
```javascript
export const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com';
```
- Test cards: https://developer.paypal.com/tools/sandbox/card-testing/

**For production (Live):**
- Use live credentials
- API base URL should be:
```javascript
export const PAYPAL_API_BASE = 'https://api-m.paypal.com';
```

### 5. Testing

**Test Card Numbers (Sandbox only):**
- Visa: `4032039933642348`
- Mastercard: `5404242064447820`
- CVV: Any 3 digits
- Expiry: Any future date

### 6. Start Development Server

```bash
npm run dev
```

## How It Works

### Flow:
1. Customer fills shipping information on checkout page
2. Clicks "Proceed to Payment"
3. Enters card details in secure PayPal Hosted Fields
4. Clicks "Pay" button
5. PayPal creates order and captures payment
6. On success, order is saved to Firebase with "Paid" status
7. Customer sees success confirmation

### Files Modified/Created:

1. **`.env`** - Stores PayPal credentials
2. **`src/config/paypalConfig.js`** - PayPal configuration and API functions
3. **`src/components/PayPalCardPayment.jsx`** - Card payment UI component
4. **`src/pages/CheckoutPage.jsx`** - Updated checkout flow
5. **`.gitignore`** - Updated to exclude `.env` files

## Troubleshooting

### Error: "Failed to get PayPal access token"
- Check your Client ID and Secret are correct
- Ensure you're using the right credentials (sandbox vs live)
- Verify API base URL matches your environment

### Error: "Failed to create PayPal order"
- Check currency is supported by your PayPal account
- Ensure amount is valid (greater than 0)
- Verify PayPal account is active

### Payment fails with "Invalid card"
- In sandbox, use test card numbers only
- In live, ensure customer enters valid card details
- Check card expiry date is in future

### CORS errors
- These shouldn't occur as API calls are made server-side via PayPal SDK
- If you see CORS errors, check you're not making direct API calls from browser

## Production Checklist

Before going live:

- [ ] Revoke exposed credentials and generate new ones
- [ ] Update `.env` with live credentials
- [ ] Change API base URL to production
- [ ] Test with real payment (small amount)
- [ ] Verify Firebase orders are created correctly
- [ ] Ensure `.env` is in `.gitignore`
- [ ] Set up proper error logging
- [ ] Add customer email notifications (optional)
- [ ] Review PayPal transaction fees in your account

## Support

- PayPal Developer Docs: https://developer.paypal.com/docs/
- PayPal Support: https://www.paypal.com/support
- Firebase Docs: https://firebase.google.com/docs

## Cost Considerations

PayPal charges transaction fees:
- **Standard rate:** 2.9% + $0.30 per transaction (US)
- **International:** Additional 1.5% for international cards
- Rates vary by country and volume

Check your PayPal account for exact rates.
