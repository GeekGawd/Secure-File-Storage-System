import { store } from '@/store';
import './App.css';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import LoginPage from '@pages/Login/LoginPage';
import HomePage from '@pages/Home/HomePage';
import RequireAuth from '@/components/requireAuth';
import Layout from './components/Layout';
import { Provider } from 'react-redux';
import RegistrationPage from './pages/Login/RegisterPage';
import TotpPage from './pages/Login/TotpPage';
import IsVerified from '@/components/isVerified';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
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
            element: <LoginPage />,
          },
          {
            path: '/register',
            element: <RegistrationPage />,
          },
          {
            path: '/totp',
            element: <TotpPage />,
          },
        ],
      },
      {
        element: <RequireAuth />,
        children: [
          {
            path: '/home',
            element: <HomePage />,
          },
        ],
      },
    ],
  },
]);

function App() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
}

export default App;
