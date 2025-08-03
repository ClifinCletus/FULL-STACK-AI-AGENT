import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function CheckAuth({ children, protectedRoute }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = window.localStorage.getItem("token"); // safer direct access

      if (protectedRoute) {
        if (!token) {
          navigate("/login");
        } else {
          setLoading(false);
        }
      } else {
        if (token) {
          navigate("/");
        } else {
          setLoading(false);
        }
      }
    };

    // First run
    checkAuth();

    // Re-check after 300ms in case of race condition
    const timeoutId = setTimeout(() => {
      checkAuth();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [navigate, protectedRoute]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return children;
}

export default CheckAuth;
