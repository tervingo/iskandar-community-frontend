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
        console.log('FileLinkRenderer - File data:', fileData); // Debug log
        console.log('FileLinkRenderer - File type:', fileData.file_type); // Debug log
        console.log('FileLinkRenderer - Source type:', fileData.source_type); // Debug log
        console.log('FileLinkRenderer - Video ID:', fileData.video_id); // Debug log
        console.log('FileLinkRenderer - Embed URL:', fileData.embed_url); // Debug log
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
    if (file.file_type === 'video/youtube') return '▶️';
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

  // Render YouTube videos inline
  if (file.file_type === 'video/youtube' && file.embed_url) {
    console.log('Rendering YouTube video with embed URL:', file.embed_url); // Debug log

    // Determine display title - prefer children over original_name, and clean up generic titles
    let displayTitle = children || file.original_name;
    if (typeof displayTitle === 'string' && (
      displayTitle.includes('YouTube Video') && displayTitle.length < 20
    )) {
      displayTitle = 'YouTube Video';
    }

    // Check if this is a YouTube Shorts URL for different aspect ratio
    const isShorts = file.original_url?.includes('/shorts/');
    const aspectRatio = isShorts ? '56.25%' : '56.25%'; // Keep 16:9 for consistency, Shorts will fit

    return (
      <div className="embedded-youtube" style={{ margin: '10px 0' }}>
        <div style={{
          position: 'relative',
          paddingBottom: aspectRatio,
          height: 0,
          overflow: 'hidden',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          backgroundColor: '#000' // Background for loading state
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
        <div style={{
          fontSize: '13px',
          color: '#555',
          marginTop: '8px',
          padding: '8px 12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #e9ecef',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
            minWidth: 0 // Allow text to truncate
          }}>
            <span style={{ fontSize: '16px' }}>{isShorts ? '📱' : '▶️'}</span>
            <span style={{
              fontWeight: '500',
              color: '#333',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}>
              {isShorts ? `${displayTitle} (Short)` : displayTitle}
            </span>
          </div>
          <a
            href={file.original_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#3498db',
              textDecoration: 'none',
              fontSize: '12px',
              fontWeight: '500',
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #3498db',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#3498db';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#3498db';
            }}
          >
            Watch on YouTube
          </a>
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