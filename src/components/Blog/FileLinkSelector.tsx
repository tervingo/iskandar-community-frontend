import React, { useState, useEffect } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { FileItem } from '../../types';

interface FileLinkSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (file: FileItem, linkText: string) => void;
}

const FileLinkSelector: React.FC<FileLinkSelectorProps> = ({
  isOpen,
  onClose,
  onSelectFile
}) => {
  const { files, loading, fetchFiles } = useFileStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [linkText, setLinkText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchFiles(selectedCategoryId || undefined);
      fetchCategories();
    }
  }, [isOpen, selectedCategoryId]);

  const filteredFiles = files.filter(file =>
    file.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectFile = (file: FileItem) => {
    const text = linkText.trim() || file.original_name;
    onSelectFile(file, text);
    setLinkText('');
    setSearchTerm('');
    onClose();
  };

  const getFileIcon = (file: FileItem) => {
    if (file.source_type === 'url') return '🔗';
    if (file.file_type.startsWith('image/')) return '🖼️';
    if (file.file_type.startsWith('video/')) return '🎥';
    if (file.file_type.startsWith('audio/')) return '🎵';
    if (file.file_type.includes('pdf')) return '📄';
    return '📎';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="file-link-selector-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="file-link-selector-modal" style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '80%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div className="modal-header" style={{
          padding: '20px',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0 }}>Select File to Link</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        <div className="modal-filters" style={{
          padding: '15px 20px',
          borderBottom: '1px solid #eee',
          display: 'flex',
          gap: '15px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="linkText" style={{ fontSize: '14px', color: '#666' }}>
              Link Text:
            </label>
            <input
              id="linkText"
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="e.g., este fichero"
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                width: '200px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="categoryFilter" style={{ fontSize: '14px', color: '#666' }}>
              Category:
            </label>
            <select
              id="categoryFilter"
              value={selectedCategoryId || ''}
              onChange={(e) => setSelectedCategoryId(e.target.value || null)}
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="searchFiles" style={{ fontSize: '14px', color: '#666' }}>
              Search:
            </label>
            <input
              id="searchFiles"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar archivos..."
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                width: '150px'
              }}
            />
          </div>
        </div>

        <div className="modal-body" style={{
          padding: '20px',
          overflowY: 'auto',
          flex: 1
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              Loading files...
            </div>
          ) : filteredFiles.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              No files found
            </div>
          ) : (
            <div className="file-list" style={{
              display: 'grid',
              gap: '12px'
            }}>
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="file-item"
                  onClick={() => handleSelectFile(file)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: '#fafafa'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                    e.currentTarget.style.borderColor = '#3498db';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fafafa';
                    e.currentTarget.style.borderColor = '#ddd';
                  }}
                >
                  <div style={{
                    fontSize: '20px',
                    marginRight: '12px',
                    flexShrink: 0
                  }}>
                    {getFileIcon(file)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '14px',
                      marginBottom: '4px',
                      color: '#333'
                    }}>
                      {file.original_name}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#666',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center'
                    }}>
                      <span>{formatFileSize(file.file_size)}</span>
                      <span>•</span>
                      <span>{file.file_type}</span>
                      {file.category_name && (
                        <>
                          <span>•</span>
                          <span>{file.category_name}</span>
                        </>
                      )}
                    </div>
                    {file.description && (
                      <div style={{
                        fontSize: '12px',
                        color: '#888',
                        marginTop: '4px'
                      }}>
                        {file.description}
                      </div>
                    )}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#999',
                    textAlign: 'right',
                    marginLeft: '12px'
                  }}>
                    by {file.uploaded_by}<br />
                    {new Date(file.uploaded_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{
          padding: '15px 20px',
          borderTop: '1px solid #ddd',
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}>
          <small style={{ color: '#666' }}>
            Click on a file to insert a link. Use the "Link Text" field to customize how the link appears in your post.
          </small>
        </div>
      </div>
    </div>
  );
};

export default FileLinkSelector;