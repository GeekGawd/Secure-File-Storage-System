import { useLocation, Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode"; // Corrected import for jwt-decode
import { selectCurrentAccessToken, setCredentials } from "@/store/auth/authSlice";
import { useRefreshTokenMutation } from "@/api/routes/auth";
import { useState, useEffect } from "react";
import Loader from "./Loader";

function IsVerified() {
  // This components check the accessToken payload to see if the user is verified
  // If the user is not verified, it will redirect to the login page
  // If the user is verified, it will redirect to the home page

  // ----------------------- Access Token -----------------------
  const accessToken = useSelector(selectCurrentAccessToken);
  const dispatch = useDispatch();
  const [refreshToken, { isLoading, isError }] = useRefreshTokenMutation();
  const navigate = useNavigate();
  const location = useLocation(); // Retrieve the current location

  // Local loading state to wait for the refresh attempt to complete
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const attemptRefresh = async () => {
      // If there's no accessToken, try to refresh it once
      if (!accessToken) {
        try {
          const refreshedData = await refreshToken().unwrap();
          dispatch(setCredentials({ accessToken: refreshedData?.data?.access }));
        } catch (error) {
          // Handle the error as needed
          // navigate("/login", { replace: true, state: { from: location } });
        }
      }
      // Stop loading after attempting refresh
      setLoading(false);
    };

    attemptRefresh();
  }, [accessToken, refreshToken, dispatch]);

  useEffect(() => {
    // Once loading is complete and there's an accessToken, check verification
    if (!loading && !isLoading && accessToken) {
      try {
        const decoded = jwtDecode<Record<string, any>>(accessToken);
        if (decoded.is_verified) {
          // Navigate to home if verified
          navigate("/home", { replace: true, state: { from: location } });
        }
      } catch (error) {
        // Handle token decoding errors
        console.error("Failed to decode token:", error);
      }
    }
  }, [loading, isLoading, accessToken, navigate, location]);

  // While waiting for the refresh to complete, show a loading indicator
  if (loading || isLoading) {
    return <Loader />;
  }

  // Render child routes if not navigating to home
  return <Outlet />;
}

export default IsVerified;