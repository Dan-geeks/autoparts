# PayPal Card Payment Implementation

## Overview
The checkout now uses **real PayPal payments** with Advanced Credit and Debit Card Payments (ACDC).

## Configuration

### Environment Variables (.env)
```
VITE_PAYPAL_CLIENT_ID=AfBmRWrLg7PZ_XhNzsnRWz5Ogr4f48lcITlr6p6J9EXlBgr2jMcPr406MNWK_llFdzz9r1H49P1R4cEN
VITE_PAYPAL_SECRET=EAP8ZjZiICWOF9p2UA7gTfVmt7iYL7fo6GqKeOUaoW3SIuO75UxHOYdqEpAh0xn9oDDT02Xo4gpI96NY
```

## How It Works

### Payment Flow
1. **Customer fills shipping info** → Proceed to Payment
2. **PayPal Hosted Fields load** → Secure card input (PCI compliant)
3. **Customer enters card details** → Card number, expiry, CVV
4. **Payment processing:**
   - Creates PayPal order with total amount
   - Submits card data securely to PayPal
   - Captures payment immediately
5. **Order saved to Firestore** → With payment details

### Key Features
- **Secure**: Card data never touches your server (handled by PayPal)
- **PCI Compliant**: Uses PayPal's hosted fields
- **Real-time**: Payment captured immediately
- **Commission tracking**: Works with marketer referral codes

## Testing

### Test Card Numbers (Sandbox)
If using PayPal Sandbox (for testing), use these cards:

**Visa**: `4032038811519061`
**Mastercard**: `5425233430109903`
**Amex**: `378282246310005`

- **Expiry**: Any future date (e.g., 12/25)
- **CVV**: Any 3-4 digits (e.g., 123)

### Production Mode
Currently configured for **PRODUCTION** mode:
- API Base: `https://api-m.paypal.com`
- Real money will be charged!

To switch to **SANDBOX** (testing):
1. Open `src/config/paypalConfig.js`
2. Change line 6 to: `export const PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com';`
3. Get sandbox credentials from PayPal Developer Dashboard

## Important Notes

### PayPal Account Requirements
Your PayPal Business account needs:
- ✅ Advanced Credit and Debit Card Payments enabled
- ✅ API credentials (Client ID & Secret)
- ✅ Production/Live mode active

### If Payment Fails
Common issues:
1. **"Invalid credentials"** → Check .env file has correct keys
2. **"Card fields not loading"** → Check internet connection, PayPal SDK loaded
3. **"Payment not completed"** → Card declined, or ACDC not enabled on account
4. **CORS errors** → PayPal API must be called from allowed domain

### Security
- ✅ `.env` file in `.gitignore` (credentials protected)
- ✅ Card data handled by PayPal (PCI compliant)
- ✅ Payment captured before order created
- ⚠️ **NEVER commit .env file to Git!**

## Files Modified
- `src/pages/CheckoutPage.jsx` - Integrated PayPal payment component
- `src/components/PayPalCardPayment.jsx` - Hosted fields implementation
- `src/config/paypalConfig.js` - PayPal API functions
- `.env` - PayPal credentials
- `.gitignore` - Protect .env file

## Testing Checklist
- [ ] Customer can fill shipping information
- [ ] Payment view loads with card fields
- [ ] Card number accepts 13-16 digits
- [ ] Expiry date validates MM/YY format
- [ ] CVV accepts 3-4 digits
- [ ] "Pay" button processes real payment
- [ ] Order saves to Firestore with payment ID
- [ ] Success screen shows after payment
- [ ] Marketer commission calculated if referral code used

## Next Steps
1. Test with real card in production
2. Monitor PayPal dashboard for transactions
3. Set up webhooks for payment notifications (optional)
4. Add refund functionality (if needed)
