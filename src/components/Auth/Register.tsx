import React from 'react';

interface RegisterProps {
  onRegisterSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  return (
    <div className="auth-form">
      <h2>Account Registration</h2>
      
      <div className="info-message" style={{ 
        backgroundColor: '#e3f2fd', 
        border: '1px solid #2196f3', 
        borderRadius: '4px', 
        padding: '16px', 
        marginBottom: '20px',
        color: '#1976d2'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Registration is Admin-Only</h3>
        <p style={{ marginBottom: '12px' }}>
          This is a private community. New accounts can only be created by administrators.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>If you need an account:</strong> Please contact an administrator to create your account.
        </p>
      </div>

      <div style={{ 
        backgroundColor: '#f5f5f5', 
        border: '1px solid #ddd', 
        borderRadius: '4px', 
        padding: '16px',
        marginBottom: '20px'
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '8px' }}>Admin Login Details:</h4>
        <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '14px' }}>
          Email: admin@iskandar.com<br />
          Password: admin123
        </p>
      </div>

      {onSwitchToLogin && (
        <p className="switch-auth">
          Already have an account?{' '}
          <button 
            type="button" 
            className="link-button"
            onClick={onSwitchToLogin}
          >
            Login here
          </button>
        </p>
      )}
    </div>
  );
};

export default Register;