import React, { useEffect, useState } from 'react';
import { useFileStore } from '../../stores/fileStore';

const FileRepository: React.FC = () => {
  const { files, loading, error, fetchFiles, uploadFile } = useFileStore();
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    uploadedBy: '',
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
    
    if (!selectedFile || !uploadForm.uploadedBy.trim()) {
      return;
    }

    await uploadFile(selectedFile, uploadForm.uploadedBy, uploadForm.description);
    
    if (!error) {
      setSelectedFile(null);
      setUploadForm({ uploadedBy: '', description: '' });
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
            <label htmlFor="uploadedBy">Your Name</label>
            <input
              type="text"
              id="uploadedBy"
              value={uploadForm.uploadedBy}
              onChange={(e) => setUploadForm({ ...uploadForm, uploadedBy: e.target.value })}
              placeholder="Enter your name"
              required
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
                  <a 
                    href={file.cloudinary_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-primary btn-sm"
                  >
                    Download
                  </a>
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