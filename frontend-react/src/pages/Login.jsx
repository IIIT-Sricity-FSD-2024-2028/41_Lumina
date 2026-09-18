import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { authService } from "../services/auth.service";
import toast from "react-hot-toast";
import styles from "./Login.module.css";

export default function Login() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      // Call the backend via authService
      const sessionData = await authService.login(userId, password);

      // Save user to global AuthContext (and localStorage)
      login(sessionData);

      toast.success(
        `Welcome back, ${sessionData.Full_Name || sessionData.User_ID}!`,
      );

      // Determine where to send the user based on their role
      const targetRoute = authService.getDashboardRoute(sessionData.Role);
      navigate(targetRoute);
    } catch (err) {
      console.error("Login error:", err);
      if (!err.response) {
        setErrorMessage(
          "Server Response Error",
        );
      } else {
        setErrorMessage(
          err.response.data?.message || "Invalid Username or Password.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Back Button to return to public landing page */}
        <Link to="/" className={styles.backBtn} title="Go back">
          <img src="/assets/icons/back_arrow.svg" alt="Back" width="16" />
        </Link>

        {/* Header with Logo */}
        <div className={styles.header}>
          <div className={styles.logoBox}>
            <img src="/assets/icons/logo_white.svg" alt="Lumina" />
          </div>
          <h1>Lumina</h1>
          <p>Academic Planning & Course Enrollment</p>
        </div>

        {/* Error Alert Banner (only shows if errorMessage has text) */}
        {errorMessage && (
          <div className={styles.errorAlert} role="alert">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          {/* Username / Institute ID */}
          <div className={styles.formGroup}>
            <label htmlFor="userId">Username / Institute ID</label>
            <div className={styles.inputWrapper}>
              <img
                src="/assets/icons/user_id.svg"
                alt=""
                className={styles.inputIcon}
              />
              <input
                id="userId"
                type="text"
                className={styles.input}
                placeholder="Enter Institute ID"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  if (errorMessage) setErrorMessage(""); // clear error when typing
                }}
                required
                autoComplete="username"
              />
            </div>
          </div>

          {/* Password */}
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.inputWrapper}>
              <img
                src="/assets/icons/password.svg"
                alt=""
                className={styles.inputIcon}
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className={styles.input}
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                <img
                  src={
                    showPassword
                      ? "/assets/icons/show_password.svg"
                      : "/assets/icons/hide_password.svg"
                  }
                  alt=""
                />
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className={`btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Log In"}
            <img
              src="/assets/icons/sign_in.svg"
              alt=""
              style={{ width: "16px", filter: "brightness(0) invert(1)" }}
            />
          </button>
        </form>
      </div>
    </div>
  );
}
