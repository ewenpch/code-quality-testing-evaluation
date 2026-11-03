import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { registerUser } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    firstname: '',
    lastname: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerUser(formData);
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="card">
      <h2 className="mb-6 text-center text-2xl font-bold tracking-tight text-content">Register</h2>

      {error && (
        <div className="alert-error mb-4" role="alert">
          {error}
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="firstname">
          First Name
        </label>
        <input
          autoComplete="given-name"
          className="input"
          id="firstname"
          name="firstname"
          onChange={handleChange}
          placeholder="First Name"
          type="text"
          value={formData.firstname}
        />

        <label className="sr-only" htmlFor="lastname">
          Last Name
        </label>
        <input
          autoComplete="family-name"
          className="input"
          id="lastname"
          name="lastname"
          onChange={handleChange}
          placeholder="Last Name"
          type="text"
          value={formData.lastname}
        />

        <label className="sr-only" htmlFor="username">
          Username
        </label>
        <input
          autoComplete="username"
          className="input"
          id="username"
          name="username"
          onChange={handleChange}
          placeholder="Username"
          type="text"
          value={formData.username}
        />

        <label className="sr-only" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="new-password"
          className="input"
          id="password"
          name="password"
          onChange={handleChange}
          placeholder="Password"
          type="password"
          value={formData.password}
        />

        <button className="btn-primary w-full" type="submit">
          Register
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-content-muted">
        Already have an account?{' '}
        <Link className="link" to="/login">
          Login
        </Link>
      </p>
    </div>
  );
};

export default Register;
