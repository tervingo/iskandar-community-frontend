import React, { useEffect, useState } from 'react';
import { useCategoryStore } from '../../stores/categoryStore';
import { useAuthStore } from '../../stores/authStore';
import { Category, CategoryCreate, CategoryUpdate } from '../../types';

const CategoryManagement: React.FC = () => {
  const { isAdmin } = useAuthStore();
  const { 
    allCategories, 
    loading, 
    error, 
    fetchAllCategories, 
    createCategory, 
    updateCategory, 
    deleteCategory,
    initializeDefaults,
    setError 
  } = useCategoryStore();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<CategoryCreate>({
    name: '',
    description: ''
  });
  const [editCategoryData, setEditCategoryData] = useState<CategoryUpdate>({
    name: '',
    description: '',
    is_active: true
  });

  useEffect(() => {
    if (isAdmin) {
      fetchAllCategories();
    }
  }, [isAdmin]);

  const handleInitializeDefaults = async () => {
    if (window.confirm('Initialize default categories? This will create the 7 default categories if they don\'t exist.')) {
      try {
        await initializeDefaults();
        setError(null);
        alert('¡Categorías predeterminadas inicializadas exitosamente!');
      } catch (error: any) {
        console.error('Failed to initialize categories:', error);
      }
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCategory(newCategory);
      setNewCategory({ name: '', description: '' });
      setShowCreateForm(false);
    } catch (error: any) {
      console.error('Failed to create category:', error);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditCategoryData({
      name: category.name,
      description: category.description || '',
      is_active: category.is_active
    });
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    
    try {
      await updateCategory(editingCategory.id, editCategoryData);
      setEditingCategory(null);
    } catch (error: any) {
      console.error('Failed to update category:', error);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (window.confirm(`Are you sure you want to delete "${category.name}"? This will fail if any posts are using this category.`)) {
      try {
        await deleteCategory(category.id);
      } catch (error: any) {
        console.error('Failed to delete category:', error);
      }
    }
  };

  if (!isAdmin) {
    return <div className="access-denied">Admin access required.</div>;
  }

  return (
    <div className="category-management">
      <div className="admin-section-header">
        <h2>Gestión de Categorías</h2>
        <div className="header-actions">
          <button 
            onClick={handleInitializeDefaults}
            className="btn btn-secondary"
            disabled={loading}
          >
            Initialize Defaults
          </button>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
          >
            Crear Categoría
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Create Category Modal */}
      {showCreateForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Crear Nueva Categoría</h3>
            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  value={newCategory.description || ''}
                  onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Crear</button>
                <button 
                  type="button" 
                  onClick={() => setShowCreateForm(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Editar Categoría: {editingCategory.name}</h3>
            <form onSubmit={handleUpdateCategory}>
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={editCategoryData.name || ''}
                  onChange={(e) => setEditCategoryData({...editCategoryData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción:</label>
                <textarea
                  value={editCategoryData.description || ''}
                  onChange={(e) => setEditCategoryData({...editCategoryData, description: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={editCategoryData.is_active}
                    onChange={(e) => setEditCategoryData({...editCategoryData, is_active: e.target.checked})}
                  />
                  Activo
                </label>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">Actualizar</button>
                <button 
                  type="button" 
                  onClick={() => setEditingCategory(null)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Table */}
      <div className="categories-table">
        <h2>Categorías</h2>
        {loading ? (
          <div className="loading">Cargando categorías...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {allCategories.map(category => (
                <tr key={category.id}>
                  <td>{category.name}</td>
                  <td>{category.description || '-'}</td>
                  <td>
                    <span className={`status-badge ${category.is_active ? 'active' : 'inactive'}`}>
                      {category.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>{new Date(category.created_at).toLocaleDateString()}</td>
                  <td className="actions">
                    <button 
                      onClick={() => handleEditCategory(category)}
                      className="btn btn-small"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(category)}
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

export default CategoryManagement;