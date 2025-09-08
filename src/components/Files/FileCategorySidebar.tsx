import React, { useEffect } from 'react';
import { useCategoryStore } from '../../stores/categoryStore';
import { FileItem } from '../../types';

interface FileCategorySidebarProps {
  files: FileItem[];
  selectedCategoryId?: string | null;
  onCategorySelect: (categoryId: string | null) => void;
}

const FileCategorySidebar: React.FC<FileCategorySidebarProps> = ({ 
  files, 
  selectedCategoryId, 
  onCategorySelect 
}) => {
  const { categories, loading, error, fetchCategories } = useCategoryStore();

  useEffect(() => {
    fetchCategories();
  }, []);

  // Group files by category
  const filesByCategory = React.useMemo(() => {
    const grouped: Record<string, FileItem[]> = {};
    
    // Add uncategorized files
    const uncategorizedFiles = files.filter(file => !file.category_id);
    if (uncategorizedFiles.length > 0) {
      grouped['uncategorized'] = uncategorizedFiles;
    }
    
    // Group by category
    files.forEach(file => {
      if (file.category_id) {
        if (!grouped[file.category_id]) {
          grouped[file.category_id] = [];
        }
        grouped[file.category_id].push(file);
      }
    });
    
    return grouped;
  }, [files]);

  if (loading) return <div className="category-sidebar loading">Cargando categorías...</div>;
  if (error) return <div className="category-sidebar error">Error: {error}</div>;

  return (
    <div className="category-sidebar">
      <div className="sidebar-header">
        <h3>Categorías</h3>
      </div>
      
      <div className="categories-list">
        {/* All Files option */}
        <div 
          className={`category-item ${!selectedCategoryId ? 'active' : ''}`}
          onClick={() => onCategorySelect(null)}
        >
          <div className="category-header">
            <span className="category-name">Todos los Archivos</span>
            <span className="post-count">({files.length})</span>
          </div>
        </div>

        {/* Uncategorized files */}
        {filesByCategory['uncategorized'] && (
          <div 
            className={`category-item ${selectedCategoryId === 'uncategorized' ? 'active' : ''}`}
            onClick={() => onCategorySelect('uncategorized')}
          >
            <div className="category-header">
              <span className="category-name">Sin Categoría</span>
              <span className="post-count">({filesByCategory['uncategorized'].length})</span>
            </div>
          </div>
        )}

        {/* Regular categories with files */}
        {categories.map(category => {
          const categoryFiles = filesByCategory[category.id] || [];
          
          if (categoryFiles.length === 0) return null;
          
          return (
            <div 
              key={category.id} 
              className={`category-item ${selectedCategoryId === category.id ? 'active' : ''}`}
              onClick={() => onCategorySelect(category.id)}
            >
              <div className="category-header">
                <span className="category-name">
                  {category.name}
                </span>
                <span className="post-count">({categoryFiles.length})</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileCategorySidebar;