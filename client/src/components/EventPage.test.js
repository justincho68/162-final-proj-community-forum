import { render, screen } from '@testing-library/react';
import React from 'react';

jest.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useLocation: () => ({
    state: { event: { title: 'Test Event', image: '', paid: true, date: '2022-01-01', description: 'Test description' } }
  }),
  useParams: () => ({})
}), { virtual: true });

import EventPage from './EventPage';

test('displays event information from location state', () => {
  render(<EventPage />);
  expect(screen.getByText('Test Event')).toBeInTheDocument();
  expect(screen.getByText('Paid')).toBeInTheDocument();
  expect(screen.getByText(/Date: 2022-01-01/i)).toBeInTheDocument();
  expect(screen.getByText(/Test description/i)).toBeInTheDocument();
});