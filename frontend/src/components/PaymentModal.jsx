import { useState } from 'react';
import { processPayment } from '../services/payment';
import { useNotification } from '../context/NotificationContext';
import '../styles/PaymentModal.css';

export default function PaymentModal({ challenge, onClose, onSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addNotification } = useNotification();

  const handlePayment = async () => {
    setError('');
    setLoading(true);

    try {
      const result = await processPayment({
        amount: challenge.challenge_amount,
        currency: 'ZAR',
        description: `Pool Challenge Wager - ${challenge.challenger_name} vs ${challenge.challenged_name}`,
        customerId: challenge.challenger_id,
        paymentMethod,
      });

      addNotification({
        type: 'success',
        title: 'Payment Processed',
        message: `Successfully charged R${challenge.challenge_amount.toFixed(2)}`,
        duration: 3000,
      });

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Payment processing failed';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Payment Failed',
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-modal-header">
          <h2>💳 Secure Payment</h2>
          <button
            className="payment-modal-close"
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="payment-details">
          <div className="detail-row">
            <span className="detail-label">Opponent:</span>
            <span className="detail-value">{challenge.challenged_name}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Wager Amount:</span>
            <span className="detail-value amount">R{challenge.challenge_amount.toFixed(2)}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Description:</span>
            <span className="detail-value">Pool Challenge Match</span>
          </div>
        </div>

        <div className="payment-methods">
          <h3>Payment Method</h3>
          <div className="method-options">
            <label className={`method-option ${paymentMethod === 'card' ? 'active' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={loading}
              />
              <span className="method-icon">💳</span>
              <span className="method-name">Credit/Debit Card</span>
            </label>
            <label className={`method-option ${paymentMethod === 'bank' ? 'active' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="bank"
                checked={paymentMethod === 'bank'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={loading}
              />
              <span className="method-icon">🏦</span>
              <span className="method-name">Bank Transfer</span>
            </label>
            <label className={`method-option ${paymentMethod === 'wallet' ? 'active' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="wallet"
                checked={paymentMethod === 'wallet'}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={loading}
              />
              <span className="method-icon">👛</span>
              <span className="method-name">Wallet Balance</span>
            </label>
          </div>
        </div>

        {paymentMethod === 'card' && (
          <div className="payment-info-box">
            <p className="info-title">💳 Card Payment</p>
            <p className="info-text">
              Your payment will be processed securely through our payment processor.
              You will be asked to enter your card details in a secure form.
            </p>
          </div>
        )}

        {paymentMethod === 'bank' && (
          <div className="payment-info-box">
            <p className="info-title">🏦 Bank Transfer</p>
            <p className="info-text">
              Transfer R{challenge.challenge_amount.toFixed(2)} to our account.
              Your challenge will be confirmed once payment is received.
            </p>
          </div>
        )}

        {paymentMethod === 'wallet' && (
          <div className="payment-info-box">
            <p className="info-title">👛 Wallet Payment</p>
            <p className="info-text">
              Deduct R{challenge.challenge_amount.toFixed(2)} from your wallet balance.
              Your wallet will be updated after confirmation.
            </p>
          </div>
        )}

        {error && (
          <div className="payment-error">
            {error}
          </div>
        )}

        <div className="payment-actions">
          <button
            className="btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="btn-pay"
            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? 'Processing...' : `Pay R${challenge.challenge_amount.toFixed(2)}`}
          </button>
        </div>

        <p className="payment-disclaimer">
          🔒 Your payment information is secure and encrypted. By proceeding, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
