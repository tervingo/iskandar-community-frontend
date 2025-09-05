import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useBlogStore } from '../../stores/blogStore';
import { useAuthStore } from '../../stores/authStore';
import { useCategoryStore } from '../../stores/categoryStore';
import FileLink from './FileLinkRenderer';
import FileLinkSelector from './FileLinkSelector';
import { FileItem } from '../../types';

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { createPost, loading, error } = useBlogStore();
  const { user } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    fetchCategories();
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author_name: user?.name || '',
    category_id: '',
  });

  const [showPreview, setShowPreview] = useState(false);
  const [showFileLinkSelector, setShowFileLinkSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !user?.name) {
      return;
    }

    const postData = {
      title: formData.title,
      content: formData.content,
      author_name: user.name,
      category_id: formData.category_id || undefined
    };
    
    await createPost(postData);
    
    if (!error) {
      navigate('/blog');
    }
  };

  const handleInsertFileLink = (file: FileItem, linkText: string) => {
    const fileLink = `{{file:${file.id}|${linkText}}}`;
    const textarea = textareaRef.current;
    
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = formData.content;
      
      const newContent = 
        currentContent.substring(0, start) +
        fileLink +
        currentContent.substring(end);
      
      setFormData({
        ...formData,
        content: newContent
      });
      
      // Set cursor position after the inserted link
      setTimeout(() => {
        textarea.focus();
        const newPosition = start + fileLink.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };

  return (
    <div className="create-post">
      <div className="header">
        <h1>Create New Post</h1>
        <button 
          type="button" 
          onClick={() => navigate('/blog')}
          className="btn btn-secondary"
        >
          ← Back to Blog
        </button>
      </div>

      {error && <div className="error">Error: {error}</div>}

      <form onSubmit={handleSubmit} className="post-form">
        <div className="form-group">
          <label htmlFor="author_name">Author</label>
          <input
            type="text"
            id="author_name"
            name="author_name"
            value={user?.name || ''}
            placeholder="Author name"
            disabled
          />
        </div>

        <div className="form-group">
          <label htmlFor="category_id">Category (Optional)</label>
          <select
            id="category_id"
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
          >
            <option value="">-- No Category --</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="title">Post Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter post title"
            required
          />
        </div>

        <div className="form-group">
          <div className="content-header">
            <label htmlFor="content">Content</label>
            <div className="content-tabs">
              <button
                type="button"
                className={`tab-btn ${!showPreview ? 'active' : ''}`}
                onClick={() => setShowPreview(false)}
              >
                Write
              </button>
              <button
                type="button"
                className={`tab-btn ${showPreview ? 'active' : ''}`}
                onClick={() => setShowPreview(true)}
              >
                Preview
              </button>
              <button
                type="button"
                className="tab-btn file-link-btn"
                onClick={() => setShowFileLinkSelector(true)}
                style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: '1px solid #3498db'
                }}
              >
                📎 Link File
              </button>
            </div>
          </div>
          
          {!showPreview ? (
            <>
              <textarea
                ref={textareaRef}
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Write your post content using Markdown formatting..."
                rows={12}
                required
              />
              <div className="markdown-help">
                <small>
                  <strong>Markdown supported:</strong> **bold**, *italic*, `code`, 
                  # Headers, - Lists, [links](url), ```code blocks```<br/>
                  <strong>File links:</strong> Use "📎 Link File" button to insert file links
                </small>
              </div>
            </>
          ) : (
            <div className="preview-content">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  // Handle paragraphs and other text-containing elements
                  p: ({ children, ...props }) => {
                    const processChildren = (children: React.ReactNode): React.ReactNode => {
                      if (typeof children === 'string') {
                        const parts = children.split(/({{file:[^}]+}})/g);
                        return parts.map((part, index) => {
                          const fileMatch = part.match(/^{{file:([^|]+)\|([^}]+)}}$/);
                          if (fileMatch) {
                            const [, fileId, linkText] = fileMatch;
                            return <FileLink key={index} fileId={fileId}>{linkText}</FileLink>;
                          }
                          return part;
                        });
                      }
                      
                      if (Array.isArray(children)) {
                        return children.map((child, index) => (
                          <React.Fragment key={index}>
                            {processChildren(child)}
                          </React.Fragment>
                        ));
                      }
                      
                      return children;
                    };
                    
                    return <p {...props}>{processChildren(children)}</p>;
                  },
                  span: ({ children, ...props }) => {
                    const processChildren = (children: React.ReactNode): React.ReactNode => {
                      if (typeof children === 'string') {
                        const parts = children.split(/({{file:[^}]+}})/g);
                        return parts.map((part, index) => {
                          const fileMatch = part.match(/^{{file:([^|]+)\|([^}]+)}}$/);
                          if (fileMatch) {
                            const [, fileId, linkText] = fileMatch;
                            return <FileLink key={index} fileId={fileId}>{linkText}</FileLink>;
                          }
                          return part;
                        });
                      }
                      return children;
                    };
                    
                    return <span {...props}>{processChildren(children)}</span>;
                  },
                  a: ({ href, children, ...props }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                      {children}
                    </a>
                  )
                }}
              >
                {formData.content || '*No content to preview*'}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={() => navigate('/blog')}
            className="btn btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !formData.title.trim() || !formData.content.trim()}
          >
            {loading ? 'Creating...' : 'Create Post'}
          </button>
        </div>
      </form>

      {/* File Link Selector Modal */}
      <FileLinkSelector
        isOpen={showFileLinkSelector}
        onClose={() => setShowFileLinkSelector(false)}
        onSelectFile={handleInsertFileLink}
      />
    </div>
  );
};

export default CreatePost;