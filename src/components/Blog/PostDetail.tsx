import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useBlogStore } from '../../stores/blogStore';
import { useAuthStore } from '../../stores/authStore';
import CommentSection from './CommentSection';
import FileLink from './FileLinkRenderer';

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

  // Check if current user can edit this post
  const canEdit = user && currentPost && (
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
        
        <div className="post-actions">
          {canEdit && (
            <Link
              to={`/blog/${id}/edit`}
              className="btn btn-primary"
              style={{ marginLeft: '10px' }}
            >
              Edit Post
            </Link>
          )}
          
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
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Handle paragraphs and other text-containing elements
              p: ({ children, ...props }) => {
                const processChildren = (children: React.ReactNode): React.ReactNode => {
                  if (typeof children === 'string') {
                    // Split by file links but keep the text flow
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
              // Handle other elements that might contain text
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
              // Handle regular links
              a: ({ href, children, ...props }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                  {children}
                </a>
              )
            }}
          >
            {currentPost.content}
          </ReactMarkdown>
        </div>
      </article>

      <CommentSection postId={id!} />
    </div>
  );
};

export default PostDetail;