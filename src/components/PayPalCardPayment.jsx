import React, { useEffect, useState } from 'react';
import { PayPalScriptProvider, PayPalHostedFieldsProvider, PayPalHostedField, usePayPalHostedFields } from '@paypal/react-paypal-js';
import { paypalOptions, createPayPalOrder, capturePayPalPayment } from '../config/paypalConfig';

// Submit Button Component
const SubmitPayment = ({ customStyle, amount, currency, onSuccess, onError, customerData }) => {
  const [paying, setPaying] = useState(false);
  const hostedFields = usePayPalHostedFields();

  const handleClick = async () => {
    if (!hostedFields?.cardFields) {
      onError(new Error('Card fields are not ready'));
      return;
    }

    setPaying(true);

    try {
      // Step 1: Create PayPal Order
      const orderId = await createPayPalOrder(amount, currency);

      // Step 2: Submit card fields
      const { value: cardFieldsValue } = await hostedFields.cardFields.submit({
        cardholderName: customerData.fullName,
      });

      // Step 3: Capture the payment
      const captureResult = await capturePayPalPayment(orderId);

      // Step 4: Handle success
      if (captureResult.status === 'COMPLETED') {
        onSuccess({
          orderId,
          captureResult,
          paymentId: captureResult.id,
          status: captureResult.status,
        });
      } else {
        throw new Error('Payment not completed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      onError(err);
    } finally {
      setPaying(false);
    }
  };

  return (
    <button
      type="button"
      className={customStyle.submitButton}
      onClick={handleClick}
      disabled={paying}
    >
      {paying ? 'Processing...' : `Pay ${currency} ${amount.toLocaleString()}`}
    </button>
  );
};

// Main Payment Component
const PayPalCardPayment = ({ amount, currency = 'USD', onSuccess, onError, customerData }) => {
  const customStyle = {
    container: {
      backgroundColor: '#1a1a2e',
      padding: '20px',
      borderRadius: '8px',
      marginTop: '20px',
    },
    fieldContainer: {
      marginBottom: '15px',
    },
    label: {
      color: '#fff',
      marginBottom: '5px',
      display: 'block',
      fontSize: '14px',
    },
    hostedField: {
      height: '45px',
      padding: '10px',
      border: '1px solid #333',
      borderRadius: '4px',
      backgroundColor: '#16213e',
      color: '#fff',
      fontSize: '16px',
    },
    submitButton: {
      width: '100%',
      padding: '15px',
      backgroundColor: '#0070ba',
      color: '#fff',
      border: 'none',
      borderRadius: '4px',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      marginTop: '20px',
      transition: 'background-color 0.3s',
    },
  };

  return (
    <PayPalScriptProvider options={paypalOptions}>
      <div style={customStyle.container}>
        <h3 style={{ color: '#fff', marginBottom: '20px' }}>Enter Card Details</h3>

        <PayPalHostedFieldsProvider
          createOrder={async () => {
            try {
              return await createPayPalOrder(amount, currency);
            } catch (err) {
              onError(err);
              throw err;
            }
          }}
          styles={{
            'input': {
              'font-size': '16px',
              'color': '#fff',
            },
            ':focus': {
              'color': '#fff',
            },
            '.invalid': {
              'color': '#ff6b6b',
            },
          }}
        >
          <div style={customStyle.fieldContainer}>
            <label style={customStyle.label}>Card Number</label>
            <PayPalHostedField
              id="card-number"
              hostedFieldType="number"
              options={{
                selector: '#card-number',
                placeholder: '4111 1111 1111 1111',
              }}
              style={customStyle.hostedField}
            />
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ ...customStyle.fieldContainer, flex: 1 }}>
              <label style={customStyle.label}>Expiry Date</label>
              <PayPalHostedField
                id="expiration-date"
                hostedFieldType="expirationDate"
                options={{
                  selector: '#expiration-date',
                  placeholder: 'MM/YY',
                }}
                style={customStyle.hostedField}
              />
            </div>

            <div style={{ ...customStyle.fieldContainer, flex: 1 }}>
              <label style={customStyle.label}>CVV</label>
              <PayPalHostedField
                id="cvv"
                hostedFieldType="cvv"
                options={{
                  selector: '#cvv',
                  placeholder: '123',
                }}
                style={customStyle.hostedField}
              />
            </div>
          </div>

          <SubmitPayment
            customStyle={customStyle}
            amount={amount}
            currency={currency}
            onSuccess={onSuccess}
            onError={onError}
            customerData={customerData}
          />
        </PayPalHostedFieldsProvider>

        <div style={{
          marginTop: '15px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#888'
        }}>
          <i className="fab fa-paypal" style={{ fontSize: '24px', marginRight: '8px', color: '#0070ba' }}></i>
          Secured by PayPal
        </div>
      </div>
    </PayPalScriptProvider>
  );
};

export default PayPalCardPayment;
