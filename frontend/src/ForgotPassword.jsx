import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleForgot = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');
  
    try {
      const res = await fetch('http://localhost:5000/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
  
      const data = await res.json();
      if (data.status === 'success') {
        navigate('/reset-password', { state: { email, token: data.reset_token } });
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Something went wrong. Try again.');
    }
  };


  return (
    <div className="login-wrapper">
      <header className="reg-header">Forgot Password</header>
      <div className="login-container">
        <h2>Forgot Password</h2>

        {msg && <p className="success-message">{msg}</p>}
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={handleForgot}>
          <input
            type="email"
            placeholder="Enter registered email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Get Reset Token</button>
        </form>

        {token && (
          <button
            className="switch-link"
            onClick={() => navigate('/reset-password', { state: { email, token } })}
          >
            Go to Reset Page
          </button>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
