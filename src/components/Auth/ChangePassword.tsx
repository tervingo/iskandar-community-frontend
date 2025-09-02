import React, { useState } from 'react';
import { authApi } from '../../services/api';
import { PasswordChangeRequest } from '../../types';

interface ChangePasswordProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ onClose, onSuccess }) => {
  const [passwordData, setPasswordData] = useState<PasswordChangeRequest>({
    current_password: '',
    new_password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passwordData.new_password !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (passwordData.current_password === passwordData.new_password) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      await authApi.changePassword(passwordData);
      setSuccess(true);
      
      // Clear form
      setPasswordData({ current_password: '', new_password: '' });
      setConfirmPassword('');
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Auto close after 2 seconds
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);
      
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setPasswordData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (success) {
    return (
      <div className="auth-form">
        <h2>Password Changed</h2>
        <div style={{ 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb', 
          borderRadius: '4px', 
          padding: '16px', 
          marginBottom: '20px',
          color: '#155724'
        }}>
          <strong>Success!</strong> Your password has been changed successfully.
        </div>
        {onClose && (
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h2>Change Password</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="current_password">Current Password:</label>
          <div className="password-input-container">
            <input
              type={showCurrentPassword ? "text" : "password"}
              id="current_password"
              name="current_password"
              value={passwordData.current_password}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              disabled={loading}
            >
              {showCurrentPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="new_password">New Password:</label>
          <div className="password-input-container">
            <input
              type={showNewPassword ? "text" : "password"}
              id="new_password"
              name="new_password"
              value={passwordData.new_password}
              onChange={handleChange}
              required
              disabled={loading}
              minLength={6}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowNewPassword(!showNewPassword)}
              disabled={loading}
            >
              {showNewPassword ? "🙈" : "👁️"}
            </button>
          </div>
          <small style={{ color: '#666', fontSize: '0.9rem' }}>
            Minimum 6 characters
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password:</label>
          <div className="password-input-container">
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading}
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        <div className="form-actions">
          {onClose && (
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;