import React, { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { LoginRequest } from '../../types';

interface LoginProps {
  onLoginSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { login, loading, error, clearError } = useAuthStore();
  const [credentials, setCredentials] = useState<LoginRequest>({
    name: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const success = await login(credentials);
    if (success && onLoginSuccess) {
      onLoginSuccess();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="auth-form">
      <h2>Login</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={credentials.name}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Enter your name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

    </div>
  );
};

export default Login;