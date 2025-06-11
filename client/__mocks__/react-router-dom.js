// client/__mocks__/react-router-dom.js

import React from 'react';
export const Link = ({ to, children }) => <a href={to}>{children}</a>;
export const useNavigate = () => () => {};
export const useLocation = () => ({ pathname: '/' });
// mock out whatever else you use…

