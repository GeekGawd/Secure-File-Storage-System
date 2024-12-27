import { store } from '@/store';
import './App.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LoginPage from '@pages/Login/LoginPage';
import HomePage from '@pages/Home/HomePage';
import RequireAuth from '@/components/requireAuth';
import Layout from './components/Layout';
import { Provider } from 'react-redux';
import RegistrationPage from './pages/Login/RegisterPage';
import TotpPage from './pages/Login/TotpPage';
import RequireVerified from './components/requireVerified';


const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
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
        element: <RequireAuth />,
        children: [
          {
            element: <RequireVerified />,
            children: [
              {
                path: '/home',
                element: <HomePage />,
              }
            ]
          },
          {
            path: '/totp',
            element: <TotpPage />,
          }
        ]
      }
    ]
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
