import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
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


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/AdminDashboard" element={<AdminDashboard />} />
        <Route path="/reviewed/:type" element={<ReviewedList />} />        
        <Route path="/explore" element={<ExploreItems />} />
        <Route path="/post-item" element={<PostItems />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/edit-item/:id" element={<EditItem />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/help" element={<Help />} />
      </Routes>
    </Router>
  );
}

export default App;
