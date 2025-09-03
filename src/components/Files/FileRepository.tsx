import React, { useEffect, useState, useMemo } from 'react';
import { useFileStore } from '../../stores/fileStore';
import { useAuthStore } from '../../stores/authStore';
import { FileItem } from '../../types';
import ImageViewer from './ImageViewer';
import AudioPlayer from './AudioPlayer';

const FileRepository: React.FC = () => {
  const { files, loading, error, fetchFiles, uploadFile, deleteFile } = useFileStore();
  const { user } = useAuthStore();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    uploadedBy: user?.name || '',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [audioPlayerOpen, setAudioPlayerOpen] = useState(false);
  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);

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
                   file.file_type.startsWith('audio/') ? '🎵' : 
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
                  {isImageFile(file) && (
                    <button 
                      onClick={() => handleViewImage(file)}
                      className="btn btn-secondary btn-sm"
                      style={{ marginRight: '0.5rem' }}
                      disabled={loading}
                    >
                      View Image
                    </button>
                  )}
                  {isAudioFile(file) && (
                    <button 
                      onClick={() => handlePlayAudio(file)}
                      className="btn btn-secondary btn-sm"
                      style={{ marginRight: '0.5rem' }}
                      disabled={loading}
                    >
                      Play Audio
                    </button>
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
  );
};

export default FileRepository;