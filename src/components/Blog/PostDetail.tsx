import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBlogStore } from '../../stores/blogStore';
import CommentSection from './CommentSection';

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentPost, loading, error, fetchPost, clearCurrentPost } = useBlogStore();

  useEffect(() => {
    if (id) {
      fetchPost(id);
    }
    
    return () => {
      clearCurrentPost();
    };
  }, [id]);

  if (loading) return <div className="loading">Loading post...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!currentPost) return <div className="error">Post not found</div>;

  return (
    <div className="post-detail">
      <div className="header">
        <Link to="/blog" className="btn btn-secondary">
          ← Back to Blog
        </Link>
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

      <CommentSection postId={currentPost.id} />
    </div>
  );
};

export default PostDetail;