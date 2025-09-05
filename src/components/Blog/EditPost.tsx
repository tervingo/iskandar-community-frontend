import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useBlogStore } from '../../stores/blogStore';
import { useAuthStore } from '../../stores/authStore';
import { useCategoryStore } from '../../stores/categoryStore';
import FileLink from './FileLinkRenderer';
import FileLinkSelector from './FileLinkSelector';
import { FileItem } from '../../types';

const EditPost: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { currentPost, loading, error, fetchPost, updatePost } = useBlogStore();
  const { user, isAdmin } = useAuthStore();
  const { categories, fetchCategories } = useCategoryStore();

  useEffect(() => {
    if (id) {
      fetchPost(id);
    }
    fetchCategories();
  }, [id]);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
  });

  const [updating, setUpdating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showFileLinkSelector, setShowFileLinkSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update form data when currentPost is loaded
  useEffect(() => {
    if (currentPost) {
      setFormData({
        title: currentPost.title,
        content: currentPost.content,
        category_id: currentPost.category_id || '',
      });
    }
  }, [currentPost]);

  // Check if current user can edit this post
  const canEdit = user && currentPost && (
    isAdmin || currentPost.author_name === user.name
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !id || !canEdit) {
      return;
    }

    setUpdating(true);
    
    try {
      const updateData = {
        title: formData.title,
        content: formData.content,
        category_id: formData.category_id || undefined
      };
      
      await updatePost(id, updateData);
      
      if (!error) {
        navigate(`/blog/${id}`);
      }
    } catch (err) {
      console.error('Failed to update post:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleInsertFileLink = (file: FileItem, linkText: string) => {
    const fileLink = `[${linkText}](file:${file.id})`;
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

  if (loading) return <div className="loading">Loading post...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!currentPost) return <div className="error">Post not found</div>;
  if (!canEdit) return <div className="error">You don't have permission to edit this post</div>;

  return (
    <div className="edit-post">
      <div className="header">
        <h1>Edit Post</h1>
        <Link 
          to={`/blog/${id}`}
          className="btn btn-secondary"
        >
          ← Back to Post
        </Link>
      </div>

      {error && <div className="error">Error: {error}</div>}

      <form onSubmit={handleSubmit} className="post-form">
        <div className="form-group">
          <label htmlFor="author_name">Author</label>
          <input
            type="text"
            id="author_name"
            value={currentPost.author_name}
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
                  a: ({ href, children, ...props }) => {
                    // Check if this is a file link
                    if (href && href.startsWith('file:')) {
                      const fileId = href.replace('file:', '');
                      return <FileLink fileId={fileId}>{children}</FileLink>;
                    }
                    // Regular link
                    return <a href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
                  }
                }}
              >
                {formData.content || '*No content to preview*'}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="form-actions">
          <Link
            to={`/blog/${id}`}
            className="btn btn-secondary"
          >
            Cancel
          </Link>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={updating || !formData.title.trim() || !formData.content.trim()}
          >
            {updating ? 'Updating...' : 'Update Post'}
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

export default EditPost;