import React, { useEffect, useState } from 'react';
import './Payments.css';
import axios from 'axios';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/payments/${user.email}`);
        setPayments(res.data.payments || []);
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchPayments();
    }
  }, [user?.email]);

  const totalDue = payments
    .filter(p => p.status === 'Pending')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  if (loading) return <div className="charts-section">Loading payments...</div>;

  return (
    <div className="charts-section">
      <div className="profile-header">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span role="img" aria-label="money bag">💵</span>Payments
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
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Payments;
