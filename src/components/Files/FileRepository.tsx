import React, { useEffect, useState } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useAuthStore } from '../../stores/authStore';
import { FileItem } from '../../types';

const FileRepository: React.FC = () => {
  const { files, loading, error, fetchFiles, uploadFile, deleteFile } = useFileStore();
  const { user } = useAuthStore();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    uploadedBy: user?.name || '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

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

    await uploadFile(selectedFile, user.name, uploadForm.description);
    
    if (!error) {
      setSelectedFile(null);
      setUploadForm({ uploadedBy: user.name, description: '' });
      setShowUploadForm(false);
      // Reset file input
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
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

  const handleViewPDF = async (file: FileItem) => {
    try {
      // Try to fetch and create a blob URL for better filename handling
      const response = await fetch(file.cloudinary_url, {
        method: 'GET',
        mode: 'cors',
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Open in new window with custom title and blob URL
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.title = file.original_name;
          newWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>${file.original_name}</title>
                <meta charset="UTF-8">
                <style>
                  body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                  .header { 
                    background: #f5f5f5; 
                    padding: 10px 20px; 
                    border-bottom: 1px solid #ddd;
                    font-size: 16px;
                    font-weight: bold;
                  }
                  .pdf-container { 
                    height: calc(100vh - 60px); 
                    width: 100%; 
                  }
                  iframe { 
                    width: 100%; 
                    height: 100%; 
                    border: none; 
                  }
                  .fallback {
                    padding: 20px;
                    text-align: center;
                  }
                </style>
              </head>
              <body>
                <div class="header">${file.original_name}</div>
                <div class="pdf-container">
                  <iframe src="${blobUrl}" type="application/pdf">
                    <div class="fallback">
                      <p>Your browser doesn't support PDF viewing.</p>
                      <a href="${blobUrl}" download="${file.original_name}" style="
                        display: inline-block;
                        padding: 10px 20px;
                        background: #007bff;
                        color: white;
                        text-decoration: none;
                        border-radius: 4px;
                      ">Download ${file.original_name}</a>
                    </div>
                  </iframe>
                </div>
              </body>
            </html>
          `);
          newWindow.document.close();
          
          // Clean up blob URL when window is closed (if possible)
          newWindow.addEventListener('beforeunload', () => {
            window.URL.revokeObjectURL(blobUrl);
          });
        } else {
          // Fallback if popup is blocked
          window.URL.revokeObjectURL(blobUrl);
          throw new Error('Popup blocked');
        }
      } else {
        throw new Error('Fetch failed');
      }
    } catch (error) {
      console.warn('PDF blob creation failed, using direct URL:', error);
      
      // Fallback to direct URL method
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.title = file.original_name;
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${file.original_name}</title>
              <meta charset="UTF-8">
              <style>
                body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
                .header { 
                  background: #f5f5f5; 
                  padding: 10px 20px; 
                  border-bottom: 1px solid #ddd;
                  font-size: 16px;
                  font-weight: bold;
                }
                .pdf-container { 
                  height: calc(100vh - 60px); 
                  width: 100%; 
                }
                iframe { 
                  width: 100%; 
                  height: 100%; 
                  border: none; 
                }
              </style>
            </head>
            <body>
              <div class="header">${file.original_name}</div>
              <div class="pdf-container">
                <iframe src="${file.cloudinary_url}" type="application/pdf">
                  <p>Your browser doesn't support PDF viewing. 
                    <a href="${file.cloudinary_url}" target="_blank">Open in new tab</a>
                  </p>
                </iframe>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        // Final fallback - direct URL in new tab
        window.open(file.cloudinary_url, '_blank');
      }
    }
  };

  const canDeleteFile = (file: FileItem): boolean => {
    if (!user) return false;
    // Admin users can delete any file, or user can delete their own files
    return user.role === 'admin' || file.uploaded_by === user.name;
  };

  return (
    <div className="file-repository">
      <div className="header">
        <h1>File Repository</h1>
        <button 
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="btn btn-primary"
        >
          {showUploadForm ? 'Cancel' : 'Upload File'}
        </button>
      </div>

      {showUploadForm && (
        <form onSubmit={handleUpload} className="upload-form">
          {error && <div className="error">Error: {error}</div>}
          
          <div className="form-group">
            <label htmlFor="uploadedBy">Uploader</label>
            <input
              type="text"
              id="uploadedBy"
              value={user?.name || ''}
              placeholder="Uploader name"
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="fileInput">Select File</label>
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
            <label htmlFor="description">Description (optional)</label>
            <input
              type="text"
              id="description"
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              placeholder="Brief description of the file"
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
              {loading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      )}

      <div className="files">
        {loading && <div className="loading">Loading files...</div>}
        
        {files.length === 0 ? (
          <div className="no-files">
            <p>No files uploaded yet. Be the first to share a file!</p>
          </div>
        ) : (
          <div className="file-grid">
            {files.map((file) => (
              <div key={file.id} className="file-card">
                <div className="file-icon">
                  {file.file_type.startsWith('image/') ? '🖼️' : 
                   file.file_type.startsWith('video/') ? '🎥' : 
                   file.file_type.includes('pdf') ? '📄' : 
                   '📎'}
                </div>
                <div className="file-info">
                  <h3 className="file-name">{file.original_name}</h3>
                  <p className="file-size">{formatFileSize(file.file_size)}</p>
                  {file.description && (
                    <p className="file-description">{file.description}</p>
                  )}
                  <div className="file-meta">
                    <span>Uploaded by {file.uploaded_by}</span>
                    <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="file-actions">
                  <button 
                    onClick={() => handleDownload(file)}
                    className="btn btn-primary btn-sm"
                    style={{ marginRight: '0.5rem' }}
                  >
                    Download
                  </button>
                  {file.file_type === 'application/pdf' && (
                    <button 
                      onClick={() => handleViewPDF(file)}
                      className="btn btn-secondary btn-sm"
                      style={{ marginRight: '0.5rem' }}
                      disabled={loading}
                    >
                      View PDF
                    </button>
                  )}
                  {file.file_type.startsWith('image/') && (
                    <a 
                      href={file.cloudinary_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ marginRight: '0.5rem' }}
                    >
                      View Image
                    </a>
                  )}
                  {canDeleteFile(file) && (
                    <button 
                      onClick={() => handleDelete(file)}
                      className="btn btn-danger btn-sm"
                      disabled={loading}
                      style={{ marginLeft: '0.5rem' }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileRepository;