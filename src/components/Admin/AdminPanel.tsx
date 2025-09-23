import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { authApi } from '../../services/api';
import { User, RegisterRequest } from '../../types';

const AdminPanel: React.FC = () => {
  const { isAdmin } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<RegisterRequest>({
    email: '',
    password: '',
    name: '',
    role: 'normal',
    avatar: '',
    phone: '',
  });
  const [editUserData, setEditUserData] = useState({
    name: '',
    email: '',
    role: 'normal' as 'admin' | 'normal',
    avatar: '',
    phone: '',
  });

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersData = await authApi.getUsers();
      setUsers(usersData);
    } catch (error: any) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.createUser(newUser);
      setNewUser({ email: '', password: '', name: '', role: 'normal', avatar: '', phone: '' });
      setShowCreateUser(false);
      fetchUsers();
    } catch (error: any) {
      setError('Failed to create user');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserData({
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '',
      phone: user.phone || '',
    });
    setShowEditUser(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      // Handle both id and _id fields for compatibility
      const userId = editingUser.id || (editingUser as any)._id;
      console.log('Updating user with ID:', userId, 'User object:', editingUser);
      
      if (!userId) {
        setError('User ID is missing');
        return;
      }
      
      await authApi.updateUser(userId, editUserData);
      setShowEditUser(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Update user error:', error);
      setError('Failed to update user');
    }
  };

  const handleToggleUserStatus = async (user: User) => {
    try {
      const userId = user.id || (user as any)._id;
      if (!userId) {
        setError('User ID is missing');
        return;
      }
      await authApi.toggleUserStatus(userId);
      fetchUsers();
    } catch (error: any) {
      setError('Failed to toggle user status');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        const userId = user.id || (user as any)._id;
        if (!userId) {
          setError('User ID is missing');
          return;
        }
        await authApi.deleteUser(userId);
        fetchUsers();
      } catch (error: any) {
        setError('Failed to delete user');
      }
    }
  };

  if (!isAdmin) {
    return <div className="access-denied">Se requiere acceso de administrador.</div>;
  }

  return (
    <div className="admin-panel">
      <div className="admin-section-header">
        <h2>Gestión de Usuarios</h2>
        <div className="header-actions">
          <button
            onClick={() => setShowCreateUser(true)}
            className="btn btn-primary"
          >
            Crear Usuario
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {showCreateUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Crear Nuevo Usuario</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Correo:</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Rol:</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'normal'})}
                >
                  <option value="normal">Normal</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="form-group">
                <label>URL del Avatar (opcional):</label>
                <input
                  type="url"
                  value={newUser.avatar || ''}
                  onChange={(e) => setNewUser({...newUser, avatar: e.target.value})}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <div className="form-group">
                <label>Teléfono (opcional):</label>
                <input
                  type="tel"
                  value={newUser.phone || ''}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="+1234567890"
                />
              </div>
              <div className="form-group">
                <label>Contraseña:</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Crear</button>
                <button 
                  type="button" 
                  onClick={() => setShowCreateUser(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditUser && editingUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Editar Usuario: {editingUser.name}</h3>
            <form onSubmit={handleUpdateUser}>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={editUserData.name}
                  onChange={(e) => setEditUserData({...editUserData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Correo:</label>
                <input
                  type="email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Rol:</label>
                <select
                  value={editUserData.role}
                  onChange={(e) => setEditUserData({...editUserData, role: e.target.value as 'admin' | 'normal'})}
                >
                  <option value="normal">Normal</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="form-group">
                <label>URL del Avatar (opcional):</label>
                <input
                  type="url"
                  value={editUserData.avatar}
                  onChange={(e) => setEditUserData({...editUserData, avatar: e.target.value})}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <div className="form-group">
                <label>Teléfono (opcional):</label>
                <input
                  type="tel"
                  value={editUserData.phone}
                  onChange={(e) => setEditUserData({...editUserData, phone: e.target.value})}
                  placeholder="+1234567890"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Actualizar</button>
                <button 
                  type="button" 
                  onClick={() => setShowEditUser(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="users-table">
        <h2>Usuarios</h2>
        {loading ? (
          <div className="loading">Cargando usuarios...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id || (user as any)._id}>
                  <td>
                    {user.avatar ? (
                      <img src={user.avatar} alt={`${user.name}'s avatar`} className="user-avatar-small" />
                    ) : (
                      <div className="user-avatar-placeholder">👤</div>
                    )}
                  </td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone || '-'}</td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="actions">
                    <button 
                      onClick={() => handleEditUser(user)}
                      className="btn btn-small"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleToggleUserStatus(user)}
                      className="btn btn-small"
                    >
                      {user.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user)}
                      className="btn btn-small btn-danger"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;