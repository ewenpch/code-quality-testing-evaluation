import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createProduct } from '../services/api';

const AddProduct = () => {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !price || !stock) {
      setError('All fields are required!');
      return;
    }

    try {
      await createProduct({
        name,
        price: price,
        stock: stock
      });
      navigate('/products');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create product');
      console.error('Error creating product:', err);
    }
  };

  return (
    <div className="card">
      <h2 className="mb-6 text-center text-2xl font-bold tracking-tight text-content">Add New Product</h2>

      {error && (
        <div className="alert-error mb-4" role="alert">
          {error}
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="name">
          Product Name
        </label>
        <input
          className="input"
          id="name"
          name="name"
          onChange={(e) => setName(e.target.value)}
          placeholder="Product Name"
          type="text"
          value={name}
        />

        <label className="sr-only" htmlFor="price">
          Price
        </label>
        <input
          className="input"
          id="price"
          min="0"
          name="price"
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price"
          step="0.01"
          type="number"
          value={price}
        />

        <label className="sr-only" htmlFor="stock">
          Stock
        </label>
        <input
          className="input"
          id="stock"
          min="0"
          name="stock"
          onChange={(e) => setStock(e.target.value)}
          placeholder="Stock"
          step="1"
          type="number"
          value={stock}
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="btn-danger w-full" onClick={() => navigate('/products')} type="button">
            Cancel
          </button>

          <button className="btn-primary w-full" type="submit">
            Add Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
