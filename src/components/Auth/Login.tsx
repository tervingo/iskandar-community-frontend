import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { LoginRequest } from '../../types';

interface LoginProps {
  onLoginSuccess?: () => void;
  shouldReset?: boolean;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, shouldReset }) => {
  const { login, loading, error, clearError } = useAuthStore();
  const [credentials, setCredentials] = useState<LoginRequest>({
    name: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldKey] = useState(() => Math.random().toString(36).substring(7));

  // Reset form when shouldReset prop changes
  useEffect(() => {
    if (shouldReset) {
      setCredentials({ name: '', password: '' });
      setShowPassword(false);
    }
  }, [shouldReset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    const success = await login(credentials);
    if (success) {
      // Clear form after successful login
      setCredentials({ name: '', password: '' });
      setShowPassword(false);
      
      if (onLoginSuccess) {
        onLoginSuccess();
      }
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

      <form onSubmit={handleSubmit} autoComplete="off">
        <div className="form-group">
          <label htmlFor={`name-${fieldKey}`}>Name:</label>
          <input
            type="text"
            id={`name-${fieldKey}`}
            name="name"
            value={credentials.name}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Enter your name"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>

        <div className="form-group">
          <label htmlFor={`password-${fieldKey}`}>Password:</label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              id={`password-${fieldKey}`}
              name="password"
              value={credentials.password}
              onChange={handleChange}
              required
              disabled={loading}
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
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