import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    // Clear any previous errors when user starts typing
    setError("");
    // the previous form value and the value being changed
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    console.log("Form data:", form); // Debug log
    console.log("Server URL:", import.meta.env.VITE_SERVER_URL); // Debug log
    
    try {
      const res = await fetch(
        //the url where the server would be running
        `${import.meta.env.VITE_SERVER_URL}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      console.log("Response status:", res.status); // Debug log
      const data = await res.json();
      console.log("Response data:", data); // Debug log

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user)); // the user got from server as response
        
        // Force a page reload to ensure CheckAuth re-runs
        window.location.href = "/";
        
        // Alternative: Use navigate with replace and force refresh
        // navigate("/", { replace: true });
        // window.location.reload();

      } else {
        // Handle different error message formats from backend
        const errorMessage = data.message || data.error || "Signup failed";
        setError(errorMessage);
        console.error("Signup failed:", errorMessage);
      }
    } catch (err) {
      console.error("Fetch error:", err); // More detailed error log
      setError("Network error: Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-sm shadow-xl bg-base-100">
        <form onSubmit={handleSignup} className="card-body">
          <h2 className="card-title justify-center">Sign Up</h2>

          {/* Error display */}
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="input input-bordered"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="input input-bordered"
            value={form.password}
            onChange={handleChange}
            required
            minLength="6"
          />

          <div className="form-control mt-4">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </div>

          <div className="text-center mt-4">
            <span className="text-sm">Already have an account? </span>
            <button
              type="button"
              className="link link-primary text-sm"
              onClick={() => navigate("/login")}
            >
              Login Here
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}