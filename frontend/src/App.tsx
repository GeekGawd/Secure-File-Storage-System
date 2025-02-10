// App.jsx
import React, { Suspense, lazy } from 'react';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { store } from '@/store';
import './App.css';
import Loader from "@/components/Loader";

// Import non-lazy components
import Layout from './components/Layout';
import RequireAuth from '@/components/requireAuth';
import IsVerified from '@/components/isVerified';

// Lazy-loaded components
const LoginPage = lazy(() => import('@pages/Login/LoginPage'));
const HomePage = lazy(() => import('@pages/Home/HomePage'));
const RegistrationPage = lazy(() => import('./pages/Login/RegisterPage'));
const TotpPage = lazy(() => import('./pages/Login/TotpPage'));
const DecryptFile = lazy(() => import('./pages/Home/DecryptFile'));
// Fallback component for loading state
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader />
  </div>
);

// Define the router with lazy-loaded components
const router = createBrowserRouter([
  {
    path: '/',
    element: (
        <Layout />
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        element: <IsVerified />,
        children: [
          {
            path: '/login',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <LoginPage />
              </Suspense>
            ),
          },
          {
            path: '/register',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <RegistrationPage />
              </Suspense>
            ),
          },
          {
            path: '/totp',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <TotpPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            path: '/home',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <HomePage />
              </Suspense>
            ),
          },
          {
            path: '/decrypt-file',
            element: (
              <Suspense fallback={<LoadingFallback />}>
                <DecryptFile />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
]);
function App() {
  return (
    <Provider store={store}>
      <Toaster />
      <Suspense fallback={<LoadingFallback />}>
        <RouterProvider router={router} />
      </Suspense>
    </Provider>
  );
}

export default App;
