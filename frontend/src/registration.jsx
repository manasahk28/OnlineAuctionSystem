import { useState } from 'react';
import { FaEye, FaEyeSlash, FaGavel } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './App.css';

const Registration = () => {
  const navigate = useNavigate();

  const [emailPrefix, setEmailPrefix] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [formData, setFormData] = useState({
    UserName: '',
    collegeId: '',
    collegeName: '',
    password: '',
    confirmPassword: '',
  });

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return 'Password must be at least 8 characters long';
    }
    if (!hasUpperCase) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!hasLowerCase) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!hasNumbers) {
      return 'Password must contain at least one number';
    }
    if (!hasSpecialChar) {
      return 'Password must contain at least one special character';
    }
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === 'password') {
      const error = validatePassword(value);
      setPasswordError(error);
    }
  };

  const handleEmailPrefixChange = (e) => {
    const value = e.target.value;
    if (value.includes('@')) return;
    setEmailPrefix(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = `${emailPrefix}@uni.edu.in`;

    const { UserName, collegeName, password, confirmPassword } = formData;
    if (!UserName || !emailPrefix || !collegeName || !password || !confirmPassword) {
      alert('Please fill out all required fields!');
      return;
    }

    if (passwordError) {
      alert('Please fix the password requirements!');
      return;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    const finalFormData = {
      ...formData,
      email,
    };

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalFormData),
      });

      const result = await response.json();
      alert(result.message);

      if (response.ok) {
        navigate('/login');
      }
    } catch (err) {
      console.error('Registration error:', err);
      alert('Something went wrong. Try again later!');
    }
  };



  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <>
      <header className="reg-header">Auction System</header>
      <div className="registration-container">
        <h2>
          Sign Up for Auction Bid <FaGavel style={{ color: '#f57c1f', marginLeft: '8px' }} />
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="UserName"
            aria-label="User Name"
            placeholder="Username"
            value={formData.UserName}
            onChange={handleChange}
            required
          />

          <div className="email-wrapper">
            <input
              type="text"
              name="emailPrefix"
              className="email-input"
              value={emailPrefix}
              onChange={handleEmailPrefixChange}
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(emailPrefix !== '')}
              placeholder="Student College Email ID"
              aria-label="Student College Email ID"
              autoComplete="off"
              required
            />
            {isEmailFocused && (
              <span className="email-suffix-fixed">@uni.edu.in</span>
            )}
          </div>

          <input
            type="text"
            name="collegeId"
            aria-label="Student ID"
            placeholder="Student ID"
            value={formData.collegeId}
            onChange={handleChange}
          />

          <input
            type="text"
            name="collegeName"
            aria-label="College Name"
            placeholder="College Name"
            value={formData.collegeName}
            onChange={handleChange}
            required
          />

          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              aria-label="Password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <span
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {passwordError && <p className="error-message">{passwordError}</p>}

          <div className="password-wrapper">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              aria-label="Confirm Password"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <span
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button type="submit">Create Account 🔐</button>
        </form>

        <p className="login-link">
          Already have an account? <span onClick={goToLogin}>Login</span>
        </p>
      </div>
    </>
  );
};

export default Registration;
