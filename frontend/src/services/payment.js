import axios from 'axios';

const PAYMENT_API_BASE = 'http://localhost:8000';

const paymentClient = axios.create({
  baseURL: PAYMENT_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock payment processing for development
// In production, replace with real Stripe/Paystack integration

export const processPayment = async (paymentDetails) => {
  const {
    amount,
    currency = 'ZAR',
    description = 'Challenge Wager Payment',
    customerId,
    paymentMethod = 'card', // 'card', 'bank', 'wallet'
  } = paymentDetails;

  try {
    // In production, this would call the backend payment endpoint
    // which would integrate with Stripe, Paystack, or your chosen provider
    
    // Mock successful payment for development
    // Remove this once real payment integration is in place
    console.log('Processing payment:', {
      amount,
      currency,
      description,
      customerId,
      paymentMethod,
    });

    return {
      success: true,
      transactionId: `TXN_${Date.now()}`,
      amount,
      currency,
      status: 'completed',
      timestamp: new Date(),
      message: 'Payment processed successfully',
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
};

export const verifyPayment = async (transactionId) => {
  try {
    // Verify payment with backend
    const response = await paymentClient.get(`/payments/${transactionId}/verify`);
    return response.data;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
};

export const getPaymentMethods = async () => {
  try {
    // Get available payment methods for the user
    const response = await paymentClient.get('/payment-methods');
    return response.data;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
};

export const savePaymentMethod = async (paymentMethodData) => {
  try {
    // Save a new payment method (card, bank account, etc.)
    const response = await paymentClient.post('/payment-methods', paymentMethodData);
    return response.data;
  } catch (error) {
    console.error('Error saving payment method:', error);
    throw error;
  }
};

export const getPaymentHistory = async (userId) => {
  try {
    // Get payment history for a user
    const response = await paymentClient.get(`/users/${userId}/payments`);
    return response.data;
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
};

// Subscription/Wallet functions
export const addFundsToWallet = async (userId, amount) => {
  try {
    const response = await paymentClient.post(`/users/${userId}/wallet/add-funds`, {
      amount,
      currency: 'ZAR',
    });
    return response.data;
  } catch (error) {
    console.error('Error adding funds to wallet:', error);
    throw error;
  }
};

export const getWalletBalance = async (userId) => {
  try {
    const response = await paymentClient.get(`/users/${userId}/wallet`);
    return response.data;
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    throw error;
  }
};

export const refundPayment = async (transactionId, reason = '') => {
  try {
    const response = await paymentClient.post(`/payments/${transactionId}/refund`, {
      reason,
    });
    return response.data;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
};

export default paymentClient;
