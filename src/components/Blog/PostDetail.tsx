import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useBlogStore } from '../../stores/blogStore';
import { useAuthStore } from '../../stores/authStore';
import CommentSection from './CommentSection';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentPost, loading, error, fetchPost, deletePost } = useBlogStore();
  const { user, isAdmin } = useAuthStore();
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost(id);
    }
  }, [id]);

  const handleDelete = async () => {
    if (!id || !currentPost) return;
    
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      setDeleting(true);
      try {
        await deletePost(id);
        navigate('/blog');
      } catch (error) {
        setDeleting(false);
      }
    }
  };

  // Check if current user can delete this post
  const canDelete = user && currentPost && (
    isAdmin || currentPost.author_name === user.name
  );

  if (loading) return <div className="loading">Loading post...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!currentPost) return <div className="error">Post not found</div>;

  return (
    <div className="post-detail">
      <div className="header">
        <Link to="/blog" className="btn btn-secondary">
          ← Back to Blog
        </Link>
        
        {canDelete && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn btn-danger"
            style={{ marginLeft: '10px' }}
          >
            {deleting ? 'Deleting...' : 'Delete Post'}
          </button>
        )}
      </div>

      <article className="post">
        <header className="post-header">
          <h1>{currentPost.title}</h1>
          <div className="post-meta">
            <span>By {currentPost.author_name}</span>
            <span>•</span>
            <span>{new Date(currentPost.created_at).toLocaleDateString()}</span>
            {currentPost.updated_at !== currentPost.created_at && (
              <>
                <span>•</span>
                <span>Updated {new Date(currentPost.updated_at).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </header>

        <div className="post-content">
          {currentPost.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>

      <CommentSection postId={id!} />
    </div>
  );
};

export default PostDetail;