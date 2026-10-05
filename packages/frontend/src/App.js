import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Navigation from './components/Navigation';
import ThemeToggle from './components/ThemeToggle';
import AddProduct from './pages/AddProduct';
import Login from './pages/Login';
import ProductList from './pages/ProductList';
import Register from './pages/Register';
import UserList from './pages/UserList';

function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!localStorage.getItem('token'));

  React.useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(!!localStorage.getItem('token'));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const refreshAuth = React.useCallback(() => {
    setIsAuthenticated(!!localStorage.getItem('token'));
  }, []);

  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col bg-surface text-content">
        {isAuthenticated ? (
          <Navigation onLogout={refreshAuth} />
        ) : (
          <div className="flex justify-end p-4 sm:px-6 lg:px-8">
            <ThemeToggle />
          </div>
        )}

        <main className="page-shell flex-1">
          <Routes>
            <Route path="/login" element={<Login onLogin={refreshAuth} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route
              path="/"
              element={isAuthenticated ? <Navigate to="/products" replace /> : <Navigate to="/login" replace />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
