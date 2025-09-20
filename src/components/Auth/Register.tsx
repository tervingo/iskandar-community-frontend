import React from 'react';

interface RegisterProps {
  onRegisterSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
  return (
    <div className="auth-form">
      <h2>Registro de Cuenta</h2>
      
      <div className="info-message" style={{ 
        backgroundColor: '#e3f2fd', 
        border: '1px solid #2196f3', 
        borderRadius: '4px', 
        padding: '16px', 
        marginBottom: '20px',
        color: '#1976d2'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '12px' }}>El registro es solo para administradores</h3>
        <p style={{ marginBottom: '12px' }}>
          Esta es una comunidad privada. Las nuevas cuentas solo pueden ser creadas por administradores.
        </p>
        <p style={{ marginBottom: 0 }}>
          <strong>Si necesitas una cuenta:</strong> Por favor contacta a un administrador para crear tu cuenta.
        </p>
      </div>

      <div style={{ 
        backgroundColor: '#f5f5f5', 
        border: '1px solid #ddd', 
        borderRadius: '4px', 
        padding: '16px',
        marginBottom: '20px'
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '8px' }}>Detalles de acceso de administrador:</h4>
        <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '14px' }}>
          Email: admin@iskandar.com<br />
          Password: admin123
        </p>
      </div>

      {onSwitchToLogin && (
        <p className="switch-auth">
          ¿Ya tienes una cuenta?{' '}
          <button 
            type="button" 
            className="link-button"
            onClick={onSwitchToLogin}
          >
            Iniciar sesión aquí
          </button>
        </p>
      )}
    </div>
  );
};

export default Register;