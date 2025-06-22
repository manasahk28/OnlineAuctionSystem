import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './App.css';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(''); // ✅ new state

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        localStorage.setItem('user', JSON.stringify(data.user || { email }));
        sessionStorage.setItem('loggedIn', 'true'); // 👈✨ THIS is the line to add!
        setSuccess('Login successful!');
        setError('');
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } 
      else {
        setError(data.message || 'Login failed');
        setSuccess('');
      }
    } catch (err) {
      setError('Error connecting to server');
      setSuccess('');
    }
  };

  return (
    <div className="login-wrapper">
      <header className="reg-header">Auction System</header>
      <div className="login-container">
        <h2>Login</h2>
        <p className="tagline">Welcome back!</p>

        {/* ✅ Message boxes */}
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              className="show-password-icon"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit">Login</button>
        </form>

        <p className="switch-link">
          Don"t have an account?{' '}
          <button type="button" onClick={() => navigate('/register')}>
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
