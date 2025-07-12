import { useEffect } from 'react';
import { Navigate, useNavigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Home from './HomePage';
import Login from './login';
import Register from './registration';
import UserDashboard from './UserDashboard';
import AdminDashboard from './AdminDashboard';
import ExploreItems from './ExploreItems';
import PostItems from './PostItems';
import ItemDetail from './ItemDetail';
import EditItem from './EditItem';
import ReviewedList from './ReviewedList';
import { About, Contact, Help } from './Layout';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';

function PrivateRoute({ children }) {
  const user = localStorage.getItem('user');
  const isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
  return user && isLoggedIn ? children : <Navigate to="/" replace />;
}

function RedirectIfLoggedIn({ children }) {
  const user = localStorage.getItem('user');
  const isLoggedIn = sessionStorage.getItem('loggedIn') === 'true';
  const navigate = useNavigate();
  useEffect(() => {
    if (user && isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [user, isLoggedIn, navigate]);
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<RedirectIfLoggedIn><Login /></RedirectIfLoggedIn>} />
        <Route path="/register" element={<RedirectIfLoggedIn><Register /></RedirectIfLoggedIn>} />
        <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
        <Route path="/AdminDashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
        <Route path="/reviewed/:type" element={<PrivateRoute><ReviewedList /></PrivateRoute>} />        
        <Route path="/explore" element={<PrivateRoute><ExploreItems /></PrivateRoute>} />
        <Route path="/post-item" element={<PrivateRoute><PostItems /></PrivateRoute>} />
        <Route path="/item/:id" element={<PrivateRoute><ItemDetail /></PrivateRoute>} />
        <Route path="/edit-item/:id" element={<PrivateRoute><EditItem /></PrivateRoute>} />        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/help" element={<Help />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
