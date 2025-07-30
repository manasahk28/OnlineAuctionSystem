import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './App.css';

const ResetPassword = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(state?.email || '');
  const [token, setToken] = useState(state?.token || '');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const backend = process.env.REACT_APP_BACKEND_URL;

  // Reused password validation logic
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) return 'Must be at least 8 characters';
    if (!hasUpperCase) return 'Must include an uppercase letter';
    if (!hasLowerCase) return 'Must include a lowercase letter';
    if (!hasNumbers) return 'Must include a number';
    if (!hasSpecialChar) return 'Must include a special character';
    return '';
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');

    const validationMsg = validatePassword(newPassword);
    if (validationMsg) {
      setPasswordError(validationMsg);
      return;
    }

    try {
      const res = await fetch(`${backend}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reset_token: token, new_password: newPassword }),
      });

      const data = await res.json();
      if (data.status === 'success') {
        setMessage('✅ Password reset successful! Redirecting...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      setMessage('❌ Something went wrong. Please try again.');
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setNewPassword(value);
    setPasswordError(validatePassword(value));
  };

  return (
    <div className="login-wrapper">
      <header className="reg-header">Reset Password</header>
      <div className="login-container">
        <h2>Set New Password</h2>

        {message && <p className="info-message">{message}</p>}

        <form onSubmit={handleReset}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Reset Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={handlePasswordChange}
            required
          />
          {passwordError && <p className="error-message">{passwordError}</p>}
          <button type="submit" disabled={!!passwordError}>Reset Password</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
