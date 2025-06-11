import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import Login from './Login';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: { redirectTo: '/dashboard' } })
}), { virtual: true });

jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

jest.mock('../firebase', () => ({
  auth: {}
}));

beforeEach(() => {
  mockNavigate.mockReset();
  signInWithEmailAndPassword.mockReset();
  onAuthStateChanged.mockImplementation((auth, cb) => { cb(null); return () => {}; });
});

test('denies login on wrong credentials', async () => {
  signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Invalid credentials'));
  render(<Login />);
  fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'user@test.com' } });
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'badpassword' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  expect(mockNavigate).not.toHaveBeenCalled();
});

test('navigates after successful login', async () => {
  signInWithEmailAndPassword.mockResolvedValueOnce({});
  render(<Login />);
  fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'user@test.com' } });
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
});