import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Home from './HomePage';
import Login from './login';
import Register from './registration';
import UserDashboard from './UserDashboard';
import ExploreItems from './ExploreItems';
import PostItems from './PostItems';
import ItemDetail from './ItemDetail';
import EditItem from './EditItem';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/explore" element={<ExploreItems />} />
        <Route path="/post-item" element={<PostItems />} />
        <Route path="/item/:id" element={<ItemDetail />} />
        <Route path="/edit-item/:id" element={<EditItem />} />

      </Routes>
    </Router>
  );
}

export default App;
