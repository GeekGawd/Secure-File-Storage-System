import React from 'react';
import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginPage from '@pages/Login/LoginPage';
import HomePage from '@pages/Home/HomePage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/home',
    element: <HomePage />,
  },
]);

function App() {
  return (
    <RouterProvider router={router} />
  );
}

export default App;
