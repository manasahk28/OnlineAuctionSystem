import React, { useState } from 'react';
import './Payments.css';

const Payments = () => {
  // Dummy payment data
  const [payments] = useState([
    { id: 1, item: 'DSA Book', amount: 1500, status: 'Paid' },
    { id: 2, item: 'Wireless Headphones', amount: 2500, status: 'Pending' },
    { id: 3, item: 'Hoodie', amount: 900, status: 'Paid' },
  ]);
  const totalDue = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="charts-section">
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span role="img" aria-label="money bag">💰</span> Payments Summary
      </h2>
      <div style={{ fontSize: '1.2rem', margin: '16px 0 24px 0' }}>
        <b>Total due amount:</b> ₹{totalDue} (dummy)
      </div>
      <div className="payments-list">
        {payments.map(payment => (
          <div key={payment.id} className={`payment-card ${payment.status.toLowerCase()}`}>
            <div className="payment-item">{payment.item}</div>
            <div className="payment-amount">₹{payment.amount}</div>
            <div className="payment-status">
              {payment.status === 'Paid' ? '✅ Paid' : '⏳ Pending'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Payments; 