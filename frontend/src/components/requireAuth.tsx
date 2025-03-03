import React, { useEffect, useState } from "react";
import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentAccessToken } from "@/store/auth/authSlice";
import { useRefreshTokenMutation, useLogoutMutation } from "@/api/routes/auth";
import { setCredentials } from "@/store/auth/authSlice";
import Loader from "@/components/Loader";
import { jwtDecode } from "jwt-decode";

function RequireAuth() {
  const accessToken = useSelector(selectCurrentAccessToken);
  const location = useLocation();
  const dispatch = useDispatch();
  const [refreshToken, { isLoading, isError }] = useRefreshTokenMutation();
  const [logout, { isLoading: isLogoutLoading, isError: isLogoutError }] = useLogoutMutation();


  // Local loading state so we can wait for the refresh attempt
  // to complete before deciding how to render.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const attemptRefresh = async () => {
      // If there's no accessToken, try to refresh it once
      if (!accessToken) {
        try {
          const refreshedData = await refreshToken().unwrap();
          const decoded = jwtDecode(refreshedData?.data?.access) as Record<string, any>;
          dispatch(setCredentials({accessToken: refreshedData?.data?.access, user: decoded.email})); 
        } catch (error) {
          // You can log or handle the error as needed
          console.error("Refresh token failed:", error);
        }
      }
      // Once we attempt the refresh (or if we already have a token), stop loading
      setLoading(false);
    };

    attemptRefresh();
  }, [accessToken, refreshToken]);

  // While we're waiting for the refresh to complete, just show a loading state
  if (loading || isLoading) {
    return <Loader />;
  }

  // If we still have no accessToken and either the refresh attempt errored out
  // or we never had a valid refresh token, redirect to login
  
  if (!accessToken || isError) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If the user is not verified, redirect to the login page
  const decoded = jwtDecode(accessToken) as Record<string, any>;
  if (!decoded.is_verified) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Otherwise, allow children to render
  return <Outlet />;
}

export default RequireAuth;