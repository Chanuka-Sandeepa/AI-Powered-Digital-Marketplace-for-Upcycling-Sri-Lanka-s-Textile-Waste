import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SellerDashboard from './pages/SellerDashboard';
import UploadTextileWaste from './pages/UploadTextileWaste';
import MyListings from './pages/MyListings';
import SellerOrders from './pages/SellerOrders';
import AnalysisHistory from './pages/AnalysisHistory';
import SustainabilityHistory from './pages/SustainabilityHistory';
import SustainabilityAnalysis from './pages/SustainabilityAnalysis';
import SellerProfile from './pages/SellerProfile';
import MarketplaceAnalysisPage from './pages/MarketplaceAnalysis';
import PredictionHistory from './pages/PredictionHistory';
import Marketplace from './pages/Marketplace';
import MaterialDetail from './pages/MaterialDetail';
import MyInquiries from './pages/MyInquiries';
import BuyerProfile from './pages/BuyerProfile';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import { CartProvider } from './context/CartContext';
import AdminOverviewPage from './pages/AdminOverview';
import UserManagement from './pages/UserManagement';
import InquiryOversight from './pages/InquiryOversight';
import ListingManagement from './pages/ListingManagement';
import AdminProfile from './pages/AdminProfile';

import type { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const cachedUser = localStorage.getItem('user');

    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (error) {
        console.error(error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <CartProvider>
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            user={user}
            onLogout={handleLogout}
          />
        }
      />

      <Route
  path="/login"
  element={
    <LoginPage
      onAuthSuccess={(userData) => {
        setUser(userData);
      }}
    />
  }
/>

      <Route
  path="/register"
  element={
    <RegisterPage
      onAuthSuccess={(userData) => setUser(userData)}
    />
  }
/>

      <Route
        path="/seller-dashboard"
        element={
          user && user.role === 'seller' ? (
            <SellerDashboard user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/upload-textile-waste"
        element={
          user && user.role === 'seller' ? (
            <UploadTextileWaste user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/my-listings"
        element={
          user && user.role === 'seller' ? (
            <MyListings user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/seller-orders"
        element={
          user && user.role === 'seller' ? (
            <SellerOrders user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/analysis-history"
        element={
          user && user.role === 'seller' ? (
            <AnalysisHistory user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/sustainability-history"
        element={
          user && user.role === 'seller' ? (
            <SustainabilityHistory user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/sustainability-analysis"
        element={
          user && user.role === 'seller' ? (
            <SustainabilityAnalysis user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/seller-profile"
        element={
          user && user.role === 'seller' ? (
            <SellerProfile user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/price-prediction"
        element={
          user && user.role === 'seller' ? (
            <MarketplaceAnalysisPage user={user} onLogout={handleLogout} focus="price" />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/buyer-recommendation"
        element={
          user && user.role === 'seller' ? (
            <MarketplaceAnalysisPage user={user} onLogout={handleLogout} focus="buyers" />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/demand-prediction"
        element={
          user && user.role === 'seller' ? (
            <MarketplaceAnalysisPage user={user} onLogout={handleLogout} focus="demand" />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/marketplace-analysis"
        element={
          user && user.role === 'seller' ? (
            <MarketplaceAnalysisPage user={user} onLogout={handleLogout} focus="all" />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/prediction-history"
        element={
          user && user.role === 'seller' ? (
            <PredictionHistory user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/buyer-dashboard"
        element={
          user && user.role === 'buyer' ? (
            <Marketplace user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/marketplace"
        element={
          user && user.role === 'buyer' ? (
            <Marketplace user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/marketplace/:id"
        element={
          user && user.role === 'buyer' ? (
            <MaterialDetail user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/my-inquiries"
        element={
          user && user.role === 'buyer' ? (
            <MyInquiries user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/buyer-profile"
        element={
          user && user.role === 'buyer' ? (
            <BuyerProfile user={user} onLogout={handleLogout} onProfileUpdated={setUser} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/cart"
        element={
          user && user.role === 'buyer' ? (
            <Cart user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/checkout"
        element={
          user && user.role === 'buyer' ? (
            <Checkout user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/my-orders"
        element={
          user && user.role === 'buyer' ? (
            <MyOrders user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/admin-dashboard"
        element={
          user && ['admin', 'super_admin'].includes(user.role) ? (
            <AdminOverviewPage user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/admin-dashboard/users"
        element={
          user && ['admin', 'super_admin'].includes(user.role) ? (
            <UserManagement user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/admin-dashboard/inquiries"
        element={
          user && ['admin', 'super_admin'].includes(user.role) ? (
            <InquiryOversight user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/super-admin-dashboard"
        element={
          user && user.role === 'super_admin' ? (
            <AdminOverviewPage user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/super-admin-dashboard/users"
        element={
          user && user.role === 'super_admin' ? (
            <UserManagement user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/super-admin-dashboard/inquiries"
        element={
          user && user.role === 'super_admin' ? (
            <InquiryOversight user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
      <Route
        path="/super-admin-dashboard/listings"
        element={
          user && user.role === 'super_admin' ? (
            <ListingManagement user={user} onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="/admin-profile"
        element={
          user && ['admin', 'super_admin'].includes(user.role) ? (
            <AdminProfile user={user} onLogout={handleLogout} onProfileUpdated={setUser} />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      <Route
        path="*"
        element={<Navigate to="/" />}
      />
    </Routes>
    </CartProvider>
  );
}

export default App;