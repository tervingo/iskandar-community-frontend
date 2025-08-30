import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBlogStore } from '../../stores/blogStore';
import { useAuthStore } from '../../stores/authStore';

const CreatePost: React.FC = () => {
  const navigate = useNavigate();
  const { createPost, loading, error } = useBlogStore();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author_name: user?.username || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !user?.username) {
      return;
    }

    await createPost({
      ...formData,
      author_name: user.username
    });
    
    if (!error) {
      navigate('/blog');
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
            value={user?.username || ''}
            placeholder="Author name"
            disabled
          />
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
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Write your post content..."
            rows={12}
            required
          />
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
    </div>
  );
};

export default CreatePost;