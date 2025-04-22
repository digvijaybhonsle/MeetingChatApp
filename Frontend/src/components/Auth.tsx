import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import "./css/auth.css"; 
import { useNavigate } from "react-router-dom";

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || (!isLogin && !name)) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setError(""); 

    try {
      const url = isLogin
        ? "http://localhost:5000/api/auth/signin"  
        : "http://localhost:5000/api/auth/signup"; 

      // Prepare the payload
      const payload = {
        email,
        password,
        ...(isLogin ? {} : { username: name }) 
      };

      const response = await axios.post(url, payload);

      const { token, user } = response.data;

      // Save the token in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("userId", user._id);
      localStorage.setItem("username", user.username || user.name);

      console.log("Authenticated:", user);
      alert(`${isLogin ? "Logged in" : "Signed up"} successfully!`);

      // Redirect based on login/signup
      if (isLogin) {
        navigate("/joinroom");  // Redirect to join room after login
      } else {
        // After successful signup, switch to the login form
        setIsLogin(true);
        alert("Account created successfully. Please log in.");
      }

    } catch (err: unknown) {
      const error = err as AxiosError<{ message: string }>;
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>{isLogin ? "Login to your account" : "Create a new account"}</h2>

        {/* Switch between Login and Signup */}
        <div className="tab-buttons">
          <button
            onClick={() => setIsLogin(true)}
            className={isLogin ? "active" : ""}
          >
            Login
          </button>
          <button
            onClick={() => {
              setIsLogin(false);
            }}
            className={!isLogin ? "active" : ""}
          >
            Sign Up
          </button>
        </div>

        {/* Error message display */}
        {error && <div className="error-message">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="form">
          {/* Show name field only for signup */}
          {!isLogin && (
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "Loading..." : isLogin ? "Login" : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;
