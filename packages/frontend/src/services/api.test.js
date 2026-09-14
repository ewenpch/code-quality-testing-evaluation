import axios from 'axios';

import { createProduct, getProducts, getUsers, loginUser, logout, registerUser } from './api';

jest.mock('axios');

const API_URL = 'http://localhost:3001/api';

describe('services/api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('loginUser', () => {
    it('posts the credentials and persists the session', async () => {
      const user = { id: 1, username: 'jane' };
      axios.post.mockResolvedValue({ data: { auth: true, token: 'tok-123', user } });

      const result = await loginUser('jane', 'secret');

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/auth/login`, { username: 'jane', password: 'secret' });
      expect(localStorage.getItem('token')).toBe('tok-123');
      expect(JSON.parse(localStorage.getItem('user'))).toEqual(user);
      expect(result.auth).toBe(true);
    });

    it('rethrows the server payload on a rejected login', async () => {
      axios.post.mockRejectedValue({ response: { data: { error: 'Bad credentials' } } });

      await expect(loginUser('jane', 'wrong')).rejects.toEqual({ error: 'Bad credentials' });
      expect(localStorage.getItem('token')).toBeNull();
    });

    // Pins down behaviour that looks unintended; see the notes handed over
    // with this test suite.
    it('currently throws a TypeError when the request never reached the server', async () => {
      axios.post.mockRejectedValue(new Error('Network Error'));

      await expect(loginUser('jane', 'secret')).rejects.toThrow(TypeError);
    });
  });

  describe('registerUser', () => {
    it('posts the form payload and stores the returned token', async () => {
      const userData = { username: 'jane', password: 'secret', firstname: 'Jane', lastname: 'Doe' };
      axios.post.mockResolvedValue({ data: { auth: true, token: 'tok-456' } });

      const result = await registerUser(userData);

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/auth/register`, userData);
      expect(localStorage.getItem('token')).toBe('tok-456');
      expect(result.token).toBe('tok-456');
    });

    it('propagates the axios error untouched', async () => {
      axios.post.mockRejectedValue(new Error('Request failed'));

      await expect(registerUser({})).rejects.toThrow('Request failed');
    });
  });

  describe('getUsers', () => {
    it('sends the stored token as a Bearer header', async () => {
      localStorage.setItem('token', 'tok-789');
      axios.get.mockResolvedValue({ data: [{ id: 1, username: 'jane' }] });

      const users = await getUsers();

      expect(axios.get).toHaveBeenCalledWith(`${API_URL}/auth/users`, {
        headers: { Authorization: 'Bearer tok-789' }
      });
      expect(users).toEqual([{ id: 1, username: 'jane' }]);
    });
  });

  describe('getProducts', () => {
    it('flags the cheapest product and counts pricier ones', async () => {
      axios.get.mockResolvedValue({
        data: {
          data: [
            { id: 1, name: 'Cheap', price: 10 },
            { id: 2, name: 'Mid', price: 20 },
            { id: 3, name: 'Dear', price: 30 }
          ]
        }
      });

      const products = await getProducts();

      expect(products.map((p) => p.isCheapest)).toEqual([true, false, false]);
      expect(products.map((p) => p.moreExpensiveCount)).toEqual([2, 1, 0]);
    });

    it('marks every product cheapest when prices are equal', async () => {
      axios.get.mockResolvedValue({
        data: {
          data: [
            { id: 1, price: 10 },
            { id: 2, price: 10 }
          ]
        }
      });

      const products = await getProducts();

      expect(products.map((p) => p.isCheapest)).toEqual([true, true]);
      expect(products.map((p) => p.moreExpensiveCount)).toEqual([0, 0]);
    });

    it('swallows the failure and returns an empty list', async () => {
      axios.get.mockRejectedValue(new Error('Network Error'));

      await expect(getProducts()).resolves.toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('createProduct', () => {
    it('posts the product with the Bearer header', async () => {
      localStorage.setItem('token', 'tok-abc');
      const productData = { name: 'Keyboard', price: 49.9, stock: 7 };
      axios.post.mockResolvedValue({ data: { id: 9, ...productData } });

      const created = await createProduct(productData);

      expect(axios.post).toHaveBeenCalledWith(`${API_URL}/products`, productData, {
        headers: { Authorization: 'Bearer tok-abc' }
      });
      expect(created.id).toBe(9);
    });
  });

  describe('logout', () => {
    it('clears the stored session', () => {
      localStorage.setItem('token', 'tok-123');
      localStorage.setItem('user', '{"id":1}');

      logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });
});
