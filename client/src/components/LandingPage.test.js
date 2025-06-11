import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import LandingPage from './LandingPage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' })
}), { virtual: true });

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signOut: jest.fn()
}));

import { onAuthStateChanged } from 'firebase/auth';

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] }))
}));

jest.mock('../services/eventService', () => ({
  deleteEvent: jest.fn()
}));

jest.mock('./EventCreationPopup', () => () => <div>Popup</div>);

jest.mock('../firebase', () => ({
  auth: {},
  db: {}
}));

beforeEach(() => {
  mockNavigate.mockReset();
  onAuthStateChanged.mockImplementation((auth, cb) => { cb(null); return () => {}; });
});

test('redirects to login when Login link clicked while logged out', () => {
  render(<LandingPage />);
  fireEvent.click(screen.getByText('Login'));
  expect(mockNavigate).toHaveBeenCalledWith('/login');
});

test('redirects to login when Create Event clicked while logged out', () => {
  render(<LandingPage />);
  fireEvent.click(screen.getByText('Create Event'));
  expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { redirectTo: '/' } });
});