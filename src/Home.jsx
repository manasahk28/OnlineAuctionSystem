import { useNavigate } from 'react-router-dom';
import './App.css';

const Home = () => {
  const navigate = useNavigate();

  const goToRegister = () => {
    navigate('/register');
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="home-container">
      <h1 className="fade-in">Welcome to the Online Auction 🎯</h1>
      <div className="button-group fade-in-delay-more">
        <button onClick={goToRegister} className="btn">Register</button>
        <button onClick={goToLogin} className="btn">Login</button>
      </div>
    </div>
  );
};

export default Home;
