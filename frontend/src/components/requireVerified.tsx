import { useLocation, Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { selectCurrentAccessToken } from "@/store/auth/authSlice";

function RequireVerified() {
  const accessToken = useSelector(selectCurrentAccessToken);
  const location = useLocation();

  // Check the jwt token for the verified field
  const decoded = jwtDecode(accessToken) as Record<string, any>;
  if (!decoded.is_verified) {
    return <Navigate to="/totp" state={{ from: location }} replace />;
  }

  // Otherwise, we have a valid token, so allow the child routes to render
  return <Outlet />;
}

export default RequireVerified;