import React, { useState, useEffect } from 'react';
import { FileItem } from '../../types';
import { filesApi } from '../../services/api';

interface FileLinkProps {
  fileId: string;
  children: React.ReactNode;
}

const FileLink: React.FC<FileLinkProps> = ({ fileId, children }) => {
  const [file, setFile] = useState<FileItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        setLoading(true);
        const fileData = await filesApi.getById(fileId);
        setFile(fileData);
        setError(null);
      } catch (err) {
        console.error('Error fetching file:', err);
        setError('File not found');
        setFile(null);
      } finally {
        setLoading(false);
      }
    };

    if (fileId) {
      fetchFile();
    }
  }, [fileId]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!file) return;

    if (file.source_type === 'url') {
      // For URLs, open the original URL
      window.open(file.original_url || file.cloudinary_url, '_blank');
    } else if (file.file_type === 'application/pdf') {
      // For PDFs, use the same viewer logic as FileRepository
      const pdfUrl = encodeURIComponent(file.cloudinary_url);
      const googlePdfViewer = `https://docs.google.com/gview?url=${pdfUrl}&embedded=true`;
      
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
      }
    } else if (file.file_type.startsWith('image/')) {
      // For images, open in new tab
      window.open(file.cloudinary_url, '_blank');
    } else {
      // For other files, trigger download
      const link = document.createElement('a');
      link.href = file.cloudinary_url + '?fl_attachment';
      link.download = file.original_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <span className="file-link loading" style={{ 
        color: '#666', 
        fontStyle: 'italic',
        cursor: 'default'
      }}>
        {children} (loading...)
      </span>
    );
  }

  if (error || !file) {
    return (
      <span className="file-link error" style={{ 
        color: '#e74c3c', 
        textDecoration: 'line-through',
        cursor: 'default'
      }}>
        {children} (file not found)
      </span>
    );
  }

  const getFileIcon = (file: FileItem) => {
    if (file.source_type === 'url') return '🔗';
    if (file.file_type.startsWith('image/')) return '🖼️';
    if (file.file_type.startsWith('video/')) return '🎥';
    if (file.file_type.startsWith('audio/')) return '🎵';
    if (file.file_type.includes('pdf')) return '📄';
    return '📎';
  };

  // Render images inline
  if (file.file_type.startsWith('image/')) {
    return (
      <div className="embedded-image" style={{ margin: '10px 0' }}>
        {imageError ? (
          // Show fallback link if image fails to load
          <div
            onClick={handleClick}
            style={{
              padding: '10px',
              border: '2px dashed #ccc',
              borderRadius: '4px',
              textAlign: 'center',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            🖼️ {children || file.original_name}
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              (Click to view image)
            </div>
          </div>
        ) : (
          <>
            {imageLoading && (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#666',
                fontSize: '14px'
              }}>
                Loading image...
              </div>
            )}
            <img
              src={file.cloudinary_url}
              alt={file.original_name}
              title={`${file.original_name} (${file.file_type}) - Click to view full size`}
              style={{
                maxWidth: '100%',
                maxHeight: '500px',
                height: 'auto',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                display: imageLoading ? 'none' : 'block',
                objectFit: 'contain'
              }}
              onClick={handleClick}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          </>
        )}
        <div style={{
          fontSize: '12px',
          color: '#666',
          marginTop: '4px',
          textAlign: 'center'
        }}>
          📷 {children || file.original_name}
        </div>
      </div>
    );
  }

  // Render other file types as links
  return (
    <span
      onClick={handleClick}
      className="file-link"
      title={`${file.original_name} (${file.file_type})`}
      style={{
        color: '#3498db',
        borderBottom: '1px dotted #3498db',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}
    >
      <span style={{ fontSize: '0.9em' }}>{getFileIcon(file)}</span>
      {children}
    </span>
  );
};

export default FileLink;