import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './App.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

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

  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    if (name === 'newPassword') {
      setNewPassword(value);
    } else if (name === 'confirmPassword') {
      setConfirmPassword(value);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword }),
      });

      const data = await res.json();
      if (data.status === 'success') {
        setMsg('Password reset successful!');
        navigate('/login');
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

        {token && (
          <form onSubmit={handleResetSubmit}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New Password"
              name="newPassword"
              value={newPassword}
              onChange={handlePasswordChange}
              required
              style={{ width: '100%', paddingRight: '40px' }}
            />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm New Password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handlePasswordChange}
              required
              style={{ width: '100%', paddingRight: '40px' }}
            />
            <button type="submit">Reset Password</button>
          </form>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;
