import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { loginUser } from '../services/api';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginUser(username, password);
      onLogin();
      navigate('/products');
    } catch (err) {
      setError(err.error || 'An error occurred');
    }
  };

  return (
    <div className="card">
      <h2 className="mb-6 text-center text-2xl font-bold tracking-tight text-content">Login</h2>

      {error && (
        <div className="alert-error mb-4" role="alert">
          {error}
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="username">
          Username
        </label>
        <input
          autoComplete="username"
          className="input"
          id="username"
          name="username"
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          type="text"
          value={username}
        />

        <label className="sr-only" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="input"
          id="password"
          name="password"
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          value={password}
        />

        <button className="btn-primary w-full" type="submit">
          Login
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-content-muted">
        Don't have an account?{' '}
        <Link className="link" to="/register">
          Register
        </Link>
      </p>
    </div>
  );
};

export default Login;
