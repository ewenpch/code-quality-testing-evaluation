import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import { getProducts } from '../services/api';
import ProductList from './ProductList';

jest.mock('../services/api');

const products = [
  { id: 1, name: 'Cheap', price: 10, stock: 20 },
  { id: 2, name: 'Mid', price: 75, stock: 5 },
  { id: 3, name: 'Dear', price: 500, stock: 0 }
];

const renderList = () =>
  render(
    <MemoryRouter>
      <ProductList />
    </MemoryRouter>
  );

const visibleProductNames = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('ProductList page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    getProducts.mockResolvedValue(products);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads and lists the catalogue', async () => {
    renderList();

    expect(await screen.findByText('Cheap')).toBeInTheDocument();
    expect(visibleProductNames()).toEqual(['Cheap', 'Mid', 'Dear']);
    expect(getProducts).toHaveBeenCalledTimes(1);
  });

  it('shows the price and stock of each product', async () => {
    renderList();

    expect(await screen.findByText('Price: $10')).toBeInTheDocument();
    expect(screen.getByText('Stock: 20')).toBeInTheDocument();
  });

  it('links to the product creation page', async () => {
    renderList();
    await screen.findByText('Cheap');

    expect(screen.getByRole('link', { name: 'Add Product' })).toHaveAttribute('href', '/add-product');
  });

  it('shows an error banner when loading fails', async () => {
    getProducts.mockRejectedValue(new Error('Network Error'));

    renderList();

    expect(await screen.findByText('Failed to load products')).toBeInTheDocument();
  });

  it('filters the list from the search box', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Cheap');

    await user.type(screen.getByPlaceholderText('Search products...'), 'Cheap');

    await waitFor(() => expect(visibleProductNames()).toEqual(['Cheap']));
  });

  it('shows the empty state when the search matches nothing', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Cheap');

    await user.type(screen.getByPlaceholderText('Search products...'), 'zzzzzzzz');

    expect(await screen.findByText('No products found matching your criteria')).toBeInTheDocument();
  });

  it.each([
    ['low', ['Cheap']],
    ['medium', ['Mid']],
    ['high', ['Dear']]
  ])('filters on the %s price bracket', async (bracket, expected) => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Cheap');

    await user.selectOptions(screen.getAllByRole('combobox')[0], bracket);

    await waitFor(() => expect(visibleProductNames()).toEqual(expected));
  });

  it.each([
    ['out', ['Dear']],
    ['low', ['Mid']],
    ['available', ['Cheap']]
  ])('filters on the %s stock status', async (status, expected) => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Cheap');

    await user.selectOptions(screen.getAllByRole('combobox')[1], status);

    await waitFor(() => expect(visibleProductNames()).toEqual(expected));
  });

  it('combines the price and stock filters', async () => {
    const user = userEvent.setup();
    renderList();
    await screen.findByText('Cheap');

    await user.selectOptions(screen.getAllByRole('combobox')[0], 'low');
    await user.selectOptions(screen.getAllByRole('combobox')[1], 'out');

    expect(await screen.findByText('No products found matching your criteria')).toBeInTheDocument();
  });
});
