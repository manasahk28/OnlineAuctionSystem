import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Payments.css';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));
  const backend = process.env.REACT_APP_BACKEND_URL;

  // ✅ Load Razorpay checkout.js once
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Optional cleanup (in case component unmounts)
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // ✅ Fetch payments on load
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await axios.get(`${backend}/api/payments/${user.email}`);
        setPayments(res.data.payments || []);
      } catch (error) {
        console.error('Error fetching payments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) fetchPayments();
  }, [user?.email]);

  const totalDue = payments
    .filter(p => p.status === 'Pending')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // ✅ Razorpay payment handler
  const handlePayment = async (amount, itemId) => {
    try {
      const { data } = await axios.post(`${backend}/api/create-order`, {
        amount,
        itemId,
        email: user.email
      });

      const options = {
        key: data.razorpay_key,
        amount: data.amount.toString(),
        currency: 'INR',
        name: 'Student Auction',
        description: 'Payment for item',
        order_id: data.order_id,
        handler: async (response) => {
          const verifyRes = await axios.post(`${backend}/api/verify-payment`, {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            email: user.email,
            itemId,
            amount
          });

          alert(verifyRes.data.message);

          // Refresh updated payment status
          const refreshed = await axios.get(`${backend}/api/payments/${user.email}`);
          setPayments(refreshed.data.payments || []);
        },
        theme: { color: '#3399cc' }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Payment failed:', err);
      alert('Payment initiation failed. Please try again.');
    }
  };

  if (loading) {
    return <div className="charts-section">Loading payments...</div>;
  }

  return (
    <div className="charts-section">
      <div className="profile-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          💵 Payments
        </h2>
      </div>

      <div style={{ fontSize: '1.2rem', margin: '16px 0 24px 0' }}>
        <b>Total due amount:</b> ₹{totalDue.toLocaleString()}
      </div>

      <div className="payments-list">
        {payments.length === 0 ? (
          <p>No payments available yet.</p>
        ) : (
          payments.map(payment => (
            <div key={payment._id} className={`payment-card ${payment.status.toLowerCase()}`}>
              <div className="payment-item"><b>Item:</b> {payment.item_title}</div>
              <div className="payment-amount"><b>Amount:</b> ₹{Number(payment.amount).toLocaleString()}</div>
              <div className="payment-seller"><b>Seller:</b> {payment.seller_email}</div>
              <div className="payment-status">
                <b>Status:</b> {payment.status === 'Paid' ? '✅ Paid' : '⏳ Pending'}
              </div>
              {payment.status === 'Pending' && (
                <button onClick={() => handlePayment(payment.amount, payment.item_id)}>
                  Pay ₹{Number(payment.amount).toLocaleString()}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Payments;
