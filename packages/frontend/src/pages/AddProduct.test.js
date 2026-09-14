import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { createProduct } from '../services/api';
import AddProduct from './AddProduct';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

jest.mock('../services/api');

const renderAddProduct = () =>
  render(
    <MemoryRouter>
      <AddProduct />
    </MemoryRouter>
  );

const fillForm = async (user, { name = 'Keyboard', price = '49.9', stock = '7' } = {}) => {
  if (name) await user.type(screen.getByPlaceholderText('Product Name'), name);
  if (price) await user.type(screen.getByPlaceholderText('Price'), price);
  if (stock) await user.type(screen.getByPlaceholderText('Stock'), stock);
};

describe('AddProduct page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the three product fields', () => {
    renderAddProduct();

    expect(screen.getByRole('heading', { name: 'Add New Product' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Product Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Price')).toHaveAttribute('type', 'number');
    expect(screen.getByPlaceholderText('Stock')).toHaveAttribute('type', 'number');
  });

  it('blocks submission and warns when a field is empty', async () => {
    const user = userEvent.setup();
    renderAddProduct();

    await user.click(screen.getByRole('button', { name: 'Add Product' }));

    expect(await screen.findByText('All fields are required!')).toBeInTheDocument();
    expect(createProduct).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('blocks submission when only the stock is missing', async () => {
    const user = userEvent.setup();
    renderAddProduct();

    await fillForm(user, { stock: '' });
    await user.click(screen.getByRole('button', { name: 'Add Product' }));

    expect(await screen.findByText('All fields are required!')).toBeInTheDocument();
    expect(createProduct).not.toHaveBeenCalled();
  });

  it('creates the product and redirects to the catalogue', async () => {
    const user = userEvent.setup();
    createProduct.mockResolvedValue({ id: 9 });
    renderAddProduct();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Add Product' }));

    // The form submits the raw input strings, not coerced numbers.
    expect(createProduct).toHaveBeenCalledWith({ name: 'Keyboard', price: '49.9', stock: '7' });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/products'));
  });

  it('surfaces the server error and stays on the page', async () => {
    const user = userEvent.setup();
    createProduct.mockRejectedValue({ response: { data: { error: 'Price must be positive' } } });
    renderAddProduct();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Add Product' }));

    expect(await screen.findByText('Price must be positive')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a network failure', async () => {
    const user = userEvent.setup();
    createProduct.mockRejectedValue(new Error('Network Error'));
    renderAddProduct();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Add Product' }));

    expect(await screen.findByText('Failed to create product')).toBeInTheDocument();
  });

  it('leaves the form without saving when cancelling', async () => {
    const user = userEvent.setup();
    renderAddProduct();

    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(createProduct).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/products');
  });
});
