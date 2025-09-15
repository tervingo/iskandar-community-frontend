import React, { useEffect, useState, useMemo } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useAuthStore } from '../../stores/authStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { FileItem } from '../../types';
import ImageViewer from './ImageViewer';
import AudioPlayer from './AudioPlayer';
import FileCategorySidebar from './FileCategorySidebar';

const FileRepository: React.FC = () => {
  const { files, loading, error, fetchFiles, uploadFile, addUrl, deleteFile } = useFileStore();
  const { user } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    uploadedBy: user?.name || '',
    description: '',
    categoryId: '',
  });
  const [urlForm, setUrlForm] = useState({
    url: '',
    description: '',
    categoryId: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [audioPlayerOpen, setAudioPlayerOpen] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);

  useEffect(() => {
    fetchFiles(selectedCategoryId || undefined);
    fetchCategories();
  }, [selectedCategoryId, fetchFiles]);

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategoryId(categoryId);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !user?.name) {
      return;
    }

    await uploadFile(selectedFile, user.name, uploadForm.description, uploadForm.categoryId || undefined);
    
    if (!error) {
      setSelectedFile(null);
      setUploadForm({ uploadedBy: user.name, description: '', categoryId: '' });
      setShowUploadForm(false);
      // Reset file input
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!urlForm.url.trim() || !user?.name) {
      return;
    }

    await addUrl(urlForm.url, user.name, urlForm.description, urlForm.categoryId || undefined);
    
    if (!error) {
      setUrlForm({ url: '', description: '', categoryId: '' });
      setShowUrlForm(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = async (file: any) => {
    try {
      console.log('Downloading file:', file.original_name, 'from:', file.cloudinary_url);
      
      // Try fetching the file first to handle CORS issues
      const response = await fetch(file.cloudinary_url + '?fl_attachment', {
        method: 'GET',
        mode: 'cors',
      });
      
      if (response.ok) {
        // Create blob from response
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Create download link with original filename
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = file.original_name;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL
        window.URL.revokeObjectURL(blobUrl);
      } else {
        throw new Error('Fetch failed');
      }
    } catch (error) {
      console.warn('Fetch download failed, trying direct link method:', error);
      
      try {
        // Fallback to direct link method
        let downloadUrl = file.cloudinary_url;
        
        // Add attachment parameter to force download
        if (downloadUrl.includes('?')) {
          downloadUrl += '&fl_attachment';
        } else {
          downloadUrl += '?fl_attachment';
        }
        
        // Create temporary link and click it
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.original_name;
        link.target = '_blank';
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
      } catch (fallbackError) {
        console.error('All download methods failed:', fallbackError);
        
        // Final fallback - open in new tab with attachment parameter
        let fallbackUrl = file.cloudinary_url;
        if (fallbackUrl.includes('?')) {
          fallbackUrl += '&fl_attachment';
        } else {
          fallbackUrl += '?fl_attachment';
        }
        window.open(fallbackUrl, '_blank');
        
        alert(`Download started in new tab. Please check your downloads folder for: ${file.original_name}`);
      }
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!user) return;
    
    const confirmMessage = `Are you sure you want to delete "${file.original_name}"? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await deleteFile(file.id);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleViewPDF = (file: FileItem) => {
    // Use Google's PDF viewer for better compatibility and to avoid download issues
    const pdfUrl = encodeURIComponent(file.cloudinary_url);
    const googlePdfViewer = `https://docs.google.com/gview?url=${pdfUrl}&embedded=true`;
    
    // Open in new window with custom title and header
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.title = file.original_name;
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${file.original_name}</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { 
                margin: 0; 
                padding: 0; 
                font-family: Arial, sans-serif; 
                background: #f5f5f5;
              }
              .header { 
                background: #2c3e50; 
                color: white;
                padding: 15px 20px; 
                border-bottom: 2px solid #34495e;
                font-size: 16px;
                font-weight: 600;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .header .actions {
                display: flex;
                gap: 10px;
              }
              .header a {
                color: #3498db;
                text-decoration: none;
                font-size: 14px;
                padding: 5px 10px;
                border: 1px solid #3498db;
                border-radius: 4px;
                transition: all 0.3s;
              }
              .header a:hover {
                background: #3498db;
                color: white;
              }
              .pdf-container { 
                height: calc(100vh - 70px); 
                width: 100%; 
                background: white;
              }
              iframe { 
                width: 100%; 
                height: 100%; 
                border: none; 
              }
              .loading {
                display: flex;
                justify-content: center;
                align-items: center;
                height: 200px;
                font-size: 16px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <span>📄 ${file.original_name}</span>
              <div class="actions">
                <a href="${file.cloudinary_url}" target="_blank">Direct View</a>
                <a href="${file.cloudinary_url}" download="${file.original_name}">Download</a>
              </div>
            </div>
            <div class="pdf-container">
              <div class="loading">Loading PDF viewer...</div>
              <iframe src="${googlePdfViewer}" onload="this.previousElementSibling.style.display='none'">
                <p>Unable to load PDF viewer. <a href="${file.cloudinary_url}" target="_blank">Click here to view directly</a></p>
              </iframe>
            </div>
          </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      // Fallback if popup is blocked - try direct PDF URL first
      const directUrl = file.cloudinary_url + '#view=FitH';
      window.open(directUrl, '_blank');
    }
  };

  const canDeleteFile = (file: FileItem): boolean => {
    if (!user) return false;
    // Admin users can delete any file, or user can delete their own files
    return user.role === 'admin' || file.uploaded_by === user.name;
  };

  // Filter image files for the image viewer
  const imageFiles = useMemo(() => 
    files.filter(file => file.file_type.startsWith('image/')),
    [files]
  );

  // Filter audio files for the audio player
  const audioFiles = useMemo(() => 
    files.filter(file => file.file_type.startsWith('audio/')),
    [files]
  );

  // Group files by category
  const groupedFiles = useMemo(() => {
    const grouped = new Map<string, FileItem[]>();
    
    files.forEach(file => {
      const categoryKey = file.category_id || 'no-category';
      
      if (!grouped.has(categoryKey)) {
        grouped.set(categoryKey, []);
      }
      grouped.get(categoryKey)!.push(file);
    });
    
    // Convert to array and sort categories
    const sortedGroups = Array.from(grouped.entries()).map(([categoryId, files]) => ({
      categoryId,
      categoryName: files[0]?.category_name || 'Sin Categoría',
      files: files.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
    }));
    
    // Sort categories: named categories first, then "Sin Categoría"
    return sortedGroups.sort((a, b) => {
      if (a.categoryId === 'no-category') return 1;
      if (b.categoryId === 'no-category') return -1;
      return a.categoryName.localeCompare(b.categoryName);
    });
  }, [files]);

  const getFileTypeDisplay = (file: FileItem): string => {
    if (file.source_type === 'url') return 'URL';
    
    const type = file.file_type.toLowerCase();
    if (type.includes('pdf')) return 'PDF';
    if (type.startsWith('image/')) return 'IMAGEN';
    if (type.startsWith('video/')) return 'VIDEO';
    if (type.startsWith('audio/')) return 'AUDIO';
    if (type.includes('word') || type.includes('document')) return 'DOCUMENTO';
    if (type.includes('excel') || type.includes('spreadsheet')) return 'HOJA DE CÁLCULO';
    if (type.includes('powerpoint') || type.includes('presentation')) return 'PRESENTACIÓN';
    if (type.includes('text')) return 'TEXTO';
    if (type.includes('zip') || type.includes('rar') || type.includes('compressed')) return 'ARCHIVO';
    return 'ARCHIVO';
  };

  const getFileIcon = (file: FileItem): string => {
    if (file.file_type === 'video/youtube') {
      return file.original_url?.includes('/shorts/') ? '📱' : '▶️';
    }
    if (file.source_type === 'url') return '🔗';

    const type = file.file_type.toLowerCase();
    if (type.includes('pdf')) return '📄';
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📋';
    if (type.includes('zip') || type.includes('rar')) return '🗜️';
    return '📎';
  };

  const isImageFile = (file: FileItem): boolean => {
    return file.file_type.startsWith('image/');
  };

  const isAudioFile = (file: FileItem): boolean => {
    return file.file_type.startsWith('audio/');
  };

  const handleViewImage = (file: FileItem) => {
    const imageIndex = imageFiles.findIndex(img => img.id === file.id);
    if (imageIndex !== -1) {
      setCurrentImageIndex(imageIndex);
      setImageViewerOpen(true);
    }
  };

  const handleImageNavigation = (index: number) => {
    setCurrentImageIndex(index);
  };

  const handlePlayAudio = (file: FileItem) => {
    const audioIndex = audioFiles.findIndex(audio => audio.id === file.id);
    if (audioIndex !== -1) {
      setCurrentAudioIndex(audioIndex);
      setAudioPlayerOpen(true);
    }
  };

  const handleAudioNavigation = (index: number) => {
    setCurrentAudioIndex(index);
  };

  return (
    <div className="file-repository">
      <div className="file-repository-layout">
        <FileCategorySidebar
          files={files}
          selectedCategoryId={selectedCategoryId}
          onCategorySelect={handleCategorySelect}
        />
        
        <div className="file-repository-main">
          <div className="header">
            <h1>Almacén de Archivos</h1>
            <div className="header-actions">
              <button 
                onClick={() => {
                  setShowUploadForm(!showUploadForm);
                  setShowUrlForm(false);
                }}
                className="btn btn-primary"
              >
                {showUploadForm ? 'Cancelar' : 'Subir Archivo'}
              </button>
              <button 
                onClick={() => {
                  setShowUrlForm(!showUrlForm);
                  setShowUploadForm(false);
                }}
                className="btn btn-secondary"
                style={{ marginLeft: '0.5rem' }}
              >
                {showUrlForm ? 'Cancelar' : 'Agregar URL'}
              </button>
            </div>
          </div>

      {showUploadForm && (
        <form onSubmit={handleUpload} className="upload-form">
          {error && <div className="error">Error: {error}</div>}
          
          <div className="form-group">
            <label htmlFor="uploadedBy">Subido por</label>
            <input
              type="text"
              id="uploadedBy"
              value={user?.name || ''}
              placeholder="Uploader name"
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="fileInput">Seleccionar Archivo</label>
            <input
              type="file"
              id="fileInput"
              onChange={handleFileSelect}
              required
            />
            {selectedFile && (
              <div className="file-info">
                Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="categoryId">Categoría (Opcional)</label>
            <select
              id="categoryId"
              value={uploadForm.categoryId}
              onChange={(e) => setUploadForm({ ...uploadForm, categoryId: e.target.value })}
            >
              <option value="">-- Sin Categoría --</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción (Opcional)</label>
            <input
              type="text"
              id="description"
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              placeholder="Breve descripción del archivo"
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => setShowUploadForm(false)}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !selectedFile || !uploadForm.uploadedBy.trim()}
            >
              {loading ? 'Subiendo...' : 'Subir Archivo'}
            </button>
          </div>
        </form>
      )}

      {showUrlForm && (
        <form onSubmit={handleAddUrl} className="upload-form">
          {error && <div className="error">Error: {error}</div>}
          
          <div className="form-group">
            <label htmlFor="uploaderUrl">Subido por</label>
            <input
              type="text"
              id="uploaderUrl"
              value={user?.name || ''}
              placeholder="Subido por"
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="urlInput">URL</label>
            <input
              type="url"
              id="urlInput"
              value={urlForm.url}
              onChange={(e) => setUrlForm({ ...urlForm, url: e.target.value })}
              placeholder="https://example.com/resource"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="urlCategoryId">Categoría (Opcional)</label>
            <select
              id="urlCategoryId"
              value={urlForm.categoryId}
              onChange={(e) => setUrlForm({ ...urlForm, categoryId: e.target.value })}
            >
              <option value="">-- Sin Categoría --</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="urlDescription">Descripción (Opcional)</label>
            <input
              type="text"
              id="urlDescription"
              value={urlForm.description}
              onChange={(e) => setUrlForm({ ...urlForm, description: e.target.value })}
              placeholder="Breve descripción de la URL"
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => setShowUrlForm(false)}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading || !urlForm.url.trim()}
            >
              {loading ? 'Agregando URL...' : 'Agregar URL'}
            </button>
          </div>
        </form>
      )}

      <div className="files">
        {loading && <div className="loading">Cargando archivos...</div>}
        
        {files.length === 0 ? (
          <div className="no-files">
            <p>No hay archivos subidos todavía. Sé el primero en compartir un archivo!</p>
          </div>
        ) : (
          <div className="files-by-category">
            {groupedFiles.map((group) => (
              <div key={group.categoryId} className="category-section">
                <h2 className="category-header">
                  <span className="category-icon">📁</span>
                  <span className="category-name">{group.categoryName}</span>
                  <span className="category-count">({group.files.length})</span>
                </h2>
                
                <div className="file-grid-compact">
                  {group.files.map((file) => (
                    <div key={file.id} className={`file-card-compact ${file.file_type === 'video/youtube' ? 'youtube-video-card' : ''}`} title={file.description || file.original_name}>
                      {/* YouTube Video Embed */}
                      {file.file_type === 'video/youtube' && file.embed_url ? (
                        <div className="youtube-embed-container">
                          <div className="youtube-video-wrapper" style={{
                            position: 'relative',
                            paddingBottom: '56.25%', // 16:9 aspect ratio
                            height: 0,
                            overflow: 'hidden',
                            borderRadius: '8px',
                            marginBottom: '12px',
                            backgroundColor: '#000',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }}>
                            <iframe
                              src={file.embed_url}
                              title={file.original_name}
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                borderRadius: '8px'
                              }}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                              allowFullScreen
                              loading="lazy"
                            />
                          </div>

                          <div className="file-card-header">
                            <span className="file-icon-compact">{file.original_url?.includes('/shorts/') ? '📱' : '▶️'}</span>
                            <div className="file-title-section">
                              <h3 className="file-name-compact" title={file.original_name}>
                                {file.original_name}{file.original_url?.includes('/shorts/') ? ' (Short)' : ''}
                              </h3>
                              <div className="file-type-size">
                                <span className="file-type-badge">{getFileTypeDisplay(file)}</span>
                                <span className="file-size-compact">{formatFileSize(file.file_size)}</span>
                              </div>
                            </div>
                          </div>

                          {file.description && (
                            <p className="file-description-compact" title={file.description}>
                              {file.description}
                            </p>
                          )}

                          <div className="file-meta-compact">
                            <span>por {file.uploaded_by}</span>
                            <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
                          </div>

                          <div className="file-actions-compact">
                            <button
                              onClick={() => window.open(file.original_url || file.cloudinary_url, '_blank')}
                              className="btn btn-secondary btn-xs"
                              title="Ver en YouTube"
                            >
                              Ver en YouTube
                            </button>

                            {canDeleteFile(file) && (
                              <button
                                onClick={() => handleDelete(file)}
                                className="btn btn-danger btn-xs"
                                disabled={loading}
                                title="Eliminar archivo"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="file-card-header">
                            <span className="file-icon-compact">{getFileIcon(file)}</span>
                            <div className="file-title-section">
                              <h3 className="file-name-compact" title={file.original_name}>
                                {file.original_name}
                              </h3>
                              <div className="file-type-size">
                                <span className="file-type-badge">{getFileTypeDisplay(file)}</span>
                                <span className="file-size-compact">{formatFileSize(file.file_size)}</span>
                              </div>
                            </div>
                          </div>

                          {file.description && (
                            <p className="file-description-compact" title={file.description}>
                              {file.description}
                            </p>
                          )}

                          <div className="file-meta-compact">
                            <span>por {file.uploaded_by}</span>
                            <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
                          </div>

                          <div className="file-actions-compact">
                            {file.source_type === 'url' ? (
                              <button
                                onClick={() => window.open(file.original_url || file.cloudinary_url, '_blank')}
                                className="btn btn-primary btn-xs"
                                title="Abrir URL"
                              >
                                Abrir
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDownload(file)}
                                className="btn btn-primary btn-xs"
                                title="Descargar archivo"
                              >
                                Descargar
                              </button>
                            )}

                            {file.file_type === 'application/pdf' && file.source_type !== 'url' && (
                              <button
                                onClick={() => handleViewPDF(file)}
                                className="btn btn-secondary btn-xs"
                                disabled={loading}
                                title="Ver PDF"
                              >
                                Ver PDF
                              </button>
                            )}

                            {isImageFile(file) && file.source_type !== 'url' && (
                              <button
                                onClick={() => handleViewImage(file)}
                                className="btn btn-secondary btn-xs"
                                disabled={loading}
                                title="Ver imagen"
                              >
                                Ver
                              </button>
                            )}

                            {isAudioFile(file) && file.source_type !== 'url' && (
                              <button
                                onClick={() => handlePlayAudio(file)}
                                className="btn btn-secondary btn-xs"
                                disabled={loading}
                                title="Reproducir audio"
                              >
                                Play
                              </button>
                            )}

                            {canDeleteFile(file) && (
                              <button
                                onClick={() => handleDelete(file)}
                                className="btn btn-danger btn-xs"
                                disabled={loading}
                                title="Eliminar archivo"
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      <ImageViewer
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        images={imageFiles}
        currentIndex={currentImageIndex}
        onNavigate={handleImageNavigation}
      />

          {/* Audio Player Modal */}
          <AudioPlayer
            isOpen={audioPlayerOpen}
            onClose={() => setAudioPlayerOpen(false)}
            audioFiles={audioFiles}
            currentIndex={currentAudioIndex}
            onNavigate={handleAudioNavigation}
          />
        </div>
      </div>
    </div>
  );
};

export default FileRepository;