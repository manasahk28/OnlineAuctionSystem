import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Home from './HomePage';
import Login from './login';
import Register from './registration';
import UserDashboard from './UserDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<UserDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
