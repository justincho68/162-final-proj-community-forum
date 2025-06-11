import { canEditEvent } from './eventService';

jest.mock('../firebase.js', () => ({
  auth: { currentUser: { uid: '123' } }
}));

test('returns true when current user is creator', () => {
  const event = { creatorId: '123' };
  expect(canEditEvent(event)).toBe(true);
});

test('returns false when current user is not creator', () => {
  const event = { creatorId: '456' };
  expect(canEditEvent(event)).toBe(false);
});